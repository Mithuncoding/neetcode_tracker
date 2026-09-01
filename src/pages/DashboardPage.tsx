import { useState } from 'react'
import { format } from 'date-fns'
import {
  ArrowRight,
  BrainCircuit,
  Check,
  Clock3,
  Flame,
  Focus,
  Gauge,
  RotateCcw,
  ScanSearch,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { ContributionGrid } from '../components/ContributionGrid'
import { Badge, Button, DifficultyBadge, ProgressBar } from '../components/ui'
import type { WorkspaceOutletContext } from '../components/AppShell'
import { useTracker } from '../context/useTracker'
import { ROADMAP_PROBLEMS } from '../data/problems'
import {
  getCompletionProjection,
  getDailyActivity,
  getProblemProgress,
  getRecommendations,
  getScores,
  getStats,
  getTopicStats,
} from '../lib/analytics'
import { getDailyMentorMission, getMentorReadiness } from '../lib/mentor'
import { getPlannerSummary } from '../lib/planner'
import { formatDuration } from '../lib/utils'

function ProgressRing({ value }: { value: number }) {
  const radius = 53
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-label={`${value}% complete`}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--surface-muted)" strokeWidth="8" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / 100)} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="metric-number text-3xl font-extrabold">{value}%</span><span className="text-[10px] font-bold uppercase text-[var(--text-faint)]">complete</span></div>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string | number }) {
  return (
    <div className="panel panel-interactive flex min-h-24 items-center gap-3 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-[var(--surface-muted)] text-[var(--text-muted)]"><Icon size={17} /></div>
      <div className="min-w-0"><p className="metric-number text-xl font-extrabold">{value}</p><p className="mt-0.5 truncate text-[10px] font-bold uppercase text-[var(--text-faint)]">{label}</p></div>
    </div>
  )
}

export function DashboardPage() {
  const { state } = useTracker()
  const [currentTime] = useState(() => Date.now())
  const { openProblem } = useOutletContext<WorkspaceOutletContext>()
  const navigate = useNavigate()
  const stats = getStats(state, ROADMAP_PROBLEMS)
  const recommendations = getRecommendations(state, ROADMAP_PROBLEMS, Math.max(4, state.settings.dailyGoal))
  const activity = getDailyActivity(state)
  const projection = getCompletionProjection(state, ROADMAP_PROBLEMS.length)
  const planner = getPlannerSummary(state, ROADMAP_PROBLEMS)
  const mentorReadiness = getMentorReadiness(state, ROADMAP_PROBLEMS)
  const mentorMission = getDailyMentorMission(state, ROADMAP_PROBLEMS)
  const scores = getScores(state, ROADMAP_PROBLEMS)
  const topicStats = getTopicStats(state, ROADMAP_PROBLEMS)
  const activeTopic = topicStats.find((topic) => topic.topic === state.settings.activeTopic)
  const plannedGoal = planner.plannedToday || state.settings.dailyGoal
  const remainingToday = Math.max(0, plannedGoal - stats.solvedToday)

  return (
    <div className="page-content">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-[28px] font-bold leading-tight">Today</h1><p className="mt-1 text-sm text-[var(--text-muted)]">{format(new Date(), 'EEEE, MMMM d')}</p></div>
        <div className="flex gap-2"><Button variant="secondary" onClick={() => navigate('/focus')}><Focus size={16} /> Focus</Button><Button onClick={() => navigate('/mentor')}><BrainCircuit size={16} /> Open Mentor</Button></div>
      </header>

      <section className="panel mb-4 overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4"><div><div className="flex items-center gap-2"><Badge tone="green">Today&apos;s mission</Badge><span className="text-[10px] font-bold uppercase text-[var(--text-faint)]">Skill before count</span></div><h2 className="mt-2 text-base font-bold">Train the weakest link, then remove support.</h2></div><Button size="sm" onClick={() => mentorMission[0] && navigate(mentorMission[0].route)}>Start first task <ArrowRight size={14} /></Button></header>
        <div className="grid gap-px bg-[var(--border)] sm:grid-cols-2 xl:grid-cols-3">{mentorMission.slice(0, 6).map((task, index) => <button key={task.id} type="button" onClick={() => navigate(task.route)} className="group flex min-h-20 items-center gap-3 bg-[var(--surface)] px-5 py-4 text-left hover:bg-[var(--surface-raised)]"><span className="metric-number flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] bg-[var(--surface-muted)] font-mono text-[10px] font-bold text-[var(--text-muted)]">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{task.label}</p><p className="mt-1 truncate text-[10px] text-[var(--text-faint)]">{task.detail}</p></div><ArrowRight size={13} className="shrink-0 text-[var(--text-faint)] transition-transform group-hover:translate-x-0.5" /></button>)}</div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_.8fr_.8fr]">
        <article className="panel flex min-h-56 flex-col justify-between gap-6 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="max-w-md">
            <div className="mb-3 flex items-center gap-2"><Badge tone="green">Roadmap progress</Badge><span className="text-xs text-[var(--text-faint)]">{stats.remaining} remaining</span></div>
            <p className="metric-number text-4xl font-extrabold">{stats.completed}<span className="text-xl font-semibold text-[var(--text-faint)]"> / 250</span></p>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {planner.target
                ? `${planner.requiredPerStudyDay} per study day keeps your ${format(planner.target, 'MMM d')} target in range.`
                : projection.date
                ? `At ${projection.pace} problems per day, you are on pace to finish around ${format(projection.date, 'MMM d, yyyy')}.`
                : `Your daily goal is set to ${state.settings.dailyGoal} problems.`}
            </p>
          </div>
          <ProgressRing value={stats.percentage} />
        </article>

        <article className="panel flex min-h-56 flex-col p-5">
          <div className="flex items-center justify-between"><div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[var(--blue-soft)] text-[var(--blue)]"><Target size={18} /></div><button type="button" onClick={() => navigate('/plan')} className="metric-number text-xs font-bold text-[var(--accent)]">{stats.solvedToday}/{plannedGoal} · Plan →</button></div>
          <div className="mt-auto"><p className="metric-number text-4xl font-extrabold">{remainingToday}</p><h2 className="mt-1 text-sm font-bold">Remaining today</h2><p className="mt-1 text-xs text-[var(--text-muted)]">{remainingToday ? planner.risk === 'high' ? 'Target pace needs a stronger session.' : 'Keep the session small and focused.' : 'Daily goal complete.'}</p><ProgressBar value={(stats.solvedToday / plannedGoal) * 100} className="mt-5" /></div>
        </article>

        <article className="panel flex min-h-56 flex-col p-5">
          <div className="flex items-center justify-between"><div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[var(--amber-soft)] text-[var(--amber)]"><Flame size={18} /></div><span className="text-xs font-bold text-[var(--text-faint)]">Best {stats.longestStreak} days</span></div>
          <div className="mt-auto"><p className="metric-number text-4xl font-extrabold">{stats.currentStreak}<span className="ml-1 text-base font-semibold text-[var(--text-muted)]">days</span></p><h2 className="mt-1 text-sm font-bold">Current streak</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Any attempt keeps the chain active.</p><div className="mt-5 flex gap-1">{Array.from({ length: 7 }, (_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index < Math.min(stats.currentStreak, 7) ? 'bg-[var(--amber)]' : 'bg-[var(--surface-muted)]'}`} />)}</div></div>
        </article>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_.7fr]">
        <article className="panel overflow-hidden">
          <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div><h2 className="text-sm font-bold">Adaptive queue</h2><p className="mt-0.5 text-xs text-[var(--text-muted)]">Urgency, weak patterns, target pace, and variety</p></div><button type="button" onClick={() => navigate('/plan')} className="text-xs font-bold text-[var(--accent)]">Open plan</button></header>
          <div className="divide-y divide-[var(--border)]">
            {recommendations.map(({ problem, reason }, index) => {
              const progress = getProblemProgress(state, problem.id)
              return (
                <button key={problem.id} type="button" onClick={() => openProblem(problem.id)} className="group flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-[var(--surface-raised)]">
                  <span className="metric-number flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] bg-[var(--surface-muted)] font-mono text-[10px] text-[var(--text-muted)]">{String(index + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold">{problem.title}</p>{progress.nextRevisionAt && Date.parse(progress.nextRevisionAt) <= currentTime && <RotateCcw size={13} className="shrink-0 text-[var(--red)]" />}</div><p className="mt-0.5 truncate text-[10px] text-[var(--text-faint)]">{problem.patterns[0]} · {reason}</p></div>
                  <DifficultyBadge difficulty={problem.difficulty} /><ArrowRight size={15} className="text-[var(--text-faint)] transition-transform group-hover:translate-x-0.5" />
                </button>
              )
            })}
          </div>
        </article>

        <article className="panel p-5">
          <div className="mb-5 flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase text-[var(--text-faint)]">Current topic</p><h2 className="mt-1 text-base font-bold">{state.settings.activeTopic}</h2></div><Gauge size={18} className="text-[var(--accent)]" /></div>
          <p className="metric-number text-3xl font-extrabold">{activeTopic?.percentage ?? 0}%</p><ProgressBar value={activeTopic?.percentage ?? 0} className="mt-3" />
          <div className="mt-5 grid grid-cols-2 gap-y-4 border-t border-[var(--border)] pt-4 text-xs"><div><p className="text-[var(--text-faint)]">Completed</p><p className="metric-number mt-1 font-bold">{activeTopic?.completed ?? 0}/{activeTopic?.total ?? 0}</p></div><div><p className="text-[var(--text-faint)]">Confidence</p><p className="metric-number mt-1 font-bold">{activeTopic?.averageConfidence || '-'}/5</p></div><div><p className="text-[var(--text-faint)]">Avg time</p><p className="metric-number mt-1 font-bold">{formatDuration(activeTopic?.averageSeconds ?? 0, true)}</p></div><div><p className="text-[var(--text-faint)]">Practiced</p><p className="metric-number mt-1 font-bold">{activeTopic?.practiced ?? 0}x</p></div></div>
        </article>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        <MiniStat icon={Check} label="Problems solved" value={stats.completed} />
        <MiniStat icon={Target} label="Independent" value={stats.independent} />
        <MiniStat icon={ScanSearch} label="Recognition" value={`${mentorReadiness.patternRecognition}%`} />
        <MiniStat icon={TrendingUp} label="Medium independence" value={`${mentorReadiness.mediumSolving}%`} />
        <MiniStat icon={RotateCcw} label="Revision retention" value={`${mentorReadiness.recall}%`} />
        <MiniStat icon={Clock3} label="Average time" value={formatDuration(stats.averageSeconds, true)} />
        <MiniStat icon={Flame} label="Longest streak" value={stats.longestStreak} />
        <MiniStat icon={Gauge} label="DSA readiness" value={`${mentorReadiness.score}%`} />
      </section>

      <section className="panel mt-4 p-5">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="text-sm font-bold">Activity</h2><p className="mt-0.5 text-xs text-[var(--text-muted)]">Last 12 weeks</p></div><span className="metric-number text-xs font-bold text-[var(--text-faint)]">Strength {scores.strength}%</span></div>
        <ContributionGrid activity={activity} days={84} />
      </section>
    </div>
  )
}