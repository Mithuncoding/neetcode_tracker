import { useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BookOpenCheck,
  Code2,
  ExternalLink,
  Flame,
  Focus,
  Gauge,
  Play,
  RotateCcw,
  ScanSearch,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ContributionGrid } from '../components/ContributionGrid'
import { LeetCodeProfilePanel } from '../components/LeetCodeProfilePanel'
import { Button, DifficultyBadge } from '../components/ui'
import { useTracker } from '../context/useTracker'
import { PYTHON_LESSONS } from '../data/python-course'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { getDailyActivity, getRecommendations, getStats } from '../lib/analytics'
import { getDailyMentorMission, getMentorReadiness, getPatternMastery } from '../lib/mentor'
import { cn, formatDuration } from '../lib/utils'

const LANE_STYLES = {
  blue: { icon: 'bg-[var(--blue-soft)] text-[var(--blue)]', bar: 'bg-[var(--blue)]' },
  violet: { icon: 'bg-[var(--violet-soft)] text-[var(--violet)]', bar: 'bg-[var(--violet)]' },
  green: { icon: 'bg-[var(--green-soft)] text-[var(--green-strong)]', bar: 'bg-[var(--green)]' },
  amber: { icon: 'bg-[var(--amber-soft)] text-[var(--amber)]', bar: 'bg-[var(--amber)]' },
} as const

function TrainingLane({ icon: Icon, eyebrow, title, detail, value, progress, tone, onClick }: {
  icon: LucideIcon
  eyebrow: string
  title: string
  detail: string
  value: string
  progress: number
  tone: keyof typeof LANE_STYLES
  onClick: () => void
}) {
  const style = LANE_STYLES[tone]
  return (
    <button type="button" onClick={onClick} className="panel panel-interactive group flex min-h-44 flex-col p-4 text-left">
      <div className="flex items-start justify-between gap-3"><span className={cn('flex h-9 w-9 items-center justify-center rounded-[6px]', style.icon)}><Icon size={18} /></span><span className="metric-number text-lg font-extrabold">{value}</span></div>
      <div className="mt-5"><p className="text-[9px] font-extrabold uppercase text-[var(--text-faint)]">{eyebrow}</p><h2 className="mt-1 text-sm font-bold">{title}</h2><p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">{detail}</p></div>
      <div className="mt-auto pt-4"><div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]"><div className={cn('h-full rounded-full transition-[width] duration-500', style.bar)} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div><p className="mt-2 flex items-center justify-between text-[9px] font-bold text-[var(--text-faint)]"><span>Continue training</span><ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" /></p></div>
    </button>
  )
}

function EvidenceMetric({ label, value, detail }: { label: string; value: string | number; detail: ReactNode }) {
  return <div className="border-l-2 border-[var(--border-strong)] pl-3"><p className="metric-number text-xl font-extrabold">{value}</p><p className="mt-0.5 text-[9px] font-extrabold uppercase text-[var(--text-faint)]">{label}</p><div className="mt-1 text-[10px] text-[var(--text-muted)]">{detail}</div></div>
}

export function DashboardPage() {
  const { state, startSession, startTimer } = useTracker()
  const navigate = useNavigate()
  const [currentTime] = useState(() => Date.now())
  const recommendations = getRecommendations(state, ROADMAP_PROBLEMS, Math.max(6, state.settings.dailyGoal))
  const activeSession = state.sessions.find((session) => !session.endedAt) ?? null
  const activeTimerProblem = state.activeTimer ? ROADMAP_PROBLEMS.find((problem) => problem.id === state.activeTimer?.problemId) ?? null : null
  const launchProblem = activeTimerProblem ?? recommendations[0]?.problem ?? null
  const stats = getStats(state, ROADMAP_PROBLEMS)
  const readiness = getMentorReadiness(state, ROADMAP_PROBLEMS)
  const mastery = [...getPatternMastery(state, ROADMAP_PROBLEMS)].sort((left, right) => left.mastery - right.mastery)
  const mission = getDailyMentorMission(state, ROADMAP_PROBLEMS)
  const activity = getDailyActivity(state)
  const dueCount = Object.values(state.progress).filter((progress) => progress.nextRevisionAt && Date.parse(progress.nextRevisionAt) <= currentTime).length
  const completedPython = PYTHON_LESSONS.filter((lesson) => state.mentor.pythonCourse[lesson.id]?.completedAt).length
  const nextPython = PYTHON_LESSONS.find((lesson) => !state.mentor.pythonCourse[lesson.id]?.completedAt)
  const recentRecognition = state.mentor.recognitionAttempts.slice(-10)
  const recognitionRate = recentRecognition.length ? Math.round(recentRecognition.filter((attempt) => attempt.correct).length / recentRecognition.length * 100) : 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const beginLeetCodeSession = () => {
    if (activeSession) {
      navigate('/focus')
      return
    }
    if (!launchProblem) return
    window.open(launchProblem.leetcodeUrl, '_blank', 'noopener,noreferrer')
    startSession(1)
    startTimer(launchProblem.id)
    navigate('/focus')
  }

  return (
    <div className="page-content">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-[10px] font-extrabold uppercase text-[var(--accent)]">{greeting}, {state.mentor.displayName}</p><h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">Build the instinct before the answer.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Start the clock here, solve on LeetCode, then return to classify the pattern, log the attempt, and schedule recall.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => navigate('/mentor/recognition')}><ScanSearch size={16} /> Pattern sprint</Button><Button variant="secondary" onClick={() => navigate(nextPython ? `/mentor/python?lesson=${nextPython.id}` : '/mentor/python')}><Code2 size={16} /> Python</Button></div>
      </header>

      <section className="mb-4 overflow-hidden rounded-[8px] border border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] shadow-[var(--shadow)]">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-[4px] bg-[var(--accent)] px-2 py-1 text-[10px] font-extrabold uppercase text-[var(--accent-contrast)]">Next external solve</span>{launchProblem && <><span className="font-mono text-[10px] text-[var(--sidebar-muted)]">#{launchProblem.leetcodeNumber}</span><DifficultyBadge difficulty={launchProblem.difficulty} /></>}</div>
            <h2 className="mt-5 max-w-3xl text-2xl font-extrabold text-[var(--sidebar-text)] sm:text-3xl">{activeSession ? 'Your training clock is already running.' : launchProblem?.title ?? 'Your adaptive queue is clear.'}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--sidebar-muted)]">{activeSession ? 'Resume the focused workspace and finish the current evidence loop.' : 'The pattern stays hidden. Read the constraints, name the brute force, and commit to a first structure before asking for help.'}</p>
            <div className="mt-6 flex flex-wrap gap-2"><Button size="lg" onClick={beginLeetCodeSession} disabled={!launchProblem && !activeSession}>{activeSession ? <Play size={17} /> : <ExternalLink size={17} />} {activeSession ? 'Resume active session' : 'Start timer + open LeetCode'}</Button>{launchProblem && !activeSession && <a href={launchProblem.leetcodeUrl} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-2 rounded-[6px] border border-[var(--sidebar-border)] bg-[var(--sidebar-raised)] px-5 text-sm font-semibold text-[var(--sidebar-text)] hover:border-[var(--sidebar-muted)]">Open without timer <ExternalLink size={14} /></a>}</div>
          </div>
          <aside className="hidden border-t border-[var(--sidebar-border)] bg-[var(--sidebar-raised)] p-5 lg:block lg:border-l lg:border-t-0 sm:p-6">
            <div className="flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase text-[var(--sidebar-muted)]">Solve protocol</p><Focus size={17} className="text-[var(--sidebar-active-text)]" /></div>
            <ol className="mt-4 space-y-3">{[
              ['00–05', 'Understand', 'Restate inputs, output, constraints.'],
              ['05–15', 'Derive', 'Write brute force and bottleneck.'],
              ['15–40', 'Implement', 'Code and test on LeetCode.'],
              ['40–45', 'Reflect', 'Classify pattern and failure.'],
            ].map(([time, title, detail]) => <li key={time} className="grid grid-cols-[46px_1fr] gap-3"><span className="font-mono text-[9px] font-bold text-[var(--sidebar-active-text)]">{time}</span><div><p className="text-xs font-bold text-[var(--sidebar-text)]">{title}</p><p className="mt-0.5 text-[10px] leading-4 text-[var(--sidebar-muted)]">{detail}</p></div></li>)}</ol>
          </aside>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TrainingLane icon={ScanSearch} eyebrow="Recognition" title="Classify before coding" detail={`${recentRecognition.length} recent classifications · ${recognitionRate}% correct`} value={`${readiness.patternRecognition}%`} progress={readiness.patternRecognition} tone="blue" onClick={() => navigate('/mentor/recognition')} />
        <TrainingLane icon={Code2} eyebrow="Python fluency" title={nextPython?.title ?? 'Course mastered'} detail={nextPython ? `Lesson ${nextPython.order} of 48 · executable practice` : 'All language foundations are complete.'} value={`${completedPython}/48`} progress={completedPython / 48 * 100} tone="violet" onClick={() => navigate(nextPython ? `/mentor/python?lesson=${nextPython.id}` : '/mentor/python')} />
        <TrainingLane icon={RotateCcw} eyebrow="Recall" title={dueCount ? `${dueCount} blind re-solve${dueCount === 1 ? '' : 's'} due` : 'Recall queue is clear'} detail="Spaced repetition turns a first solve into retrieval strength." value={String(dueCount)} progress={Math.min(100, dueCount * 20)} tone="green" onClick={() => navigate('/revision')} />
        <TrainingLane icon={Gauge} eyebrow="Interview readiness" title="Evidence, not optimism" detail={readiness.diagnosis} value={`${readiness.score}%`} progress={readiness.score} tone="amber" onClick={() => navigate('/analytics')} />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <article className="panel overflow-hidden">
          <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Today&apos;s protocol</p><h2 className="mt-1 text-base font-bold">Small loop. Complete evidence.</h2></div><Target size={18} className="text-[var(--accent)]" /></header>
          <div className="divide-y divide-[var(--border)]">{mission.slice(0, 5).map((task, index) => <button key={task.id} type="button" onClick={() => navigate(task.route)} className="group flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[var(--surface-raised)]"><span className="metric-number flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] font-mono text-[9px] font-bold text-[var(--text-faint)]">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{task.label}</p><p className="mt-1 truncate text-[10px] text-[var(--text-faint)]">{task.detail}</p></div><ArrowRight size={14} className="text-[var(--text-faint)] transition-transform group-hover:translate-x-0.5" /></button>)}</div>
        </article>
        <LeetCodeProfilePanel />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.7fr)]">
        <article className="panel p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Weakest pattern signals</p><h2 className="mt-1 text-base font-bold">Train recognition where evidence is thinnest.</h2></div><Button size="sm" variant="secondary" onClick={() => navigate('/mentor/curriculum')}><BookOpenCheck size={14} /> Pattern library</Button></div>
          <div className="mt-5 space-y-4">{mastery.slice(0, 5).map((skill) => <button key={skill.pattern} type="button" onClick={() => navigate('/mentor/curriculum')} className="block w-full text-left"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold">{skill.pattern}</p><p className="mt-0.5 text-[9px] text-[var(--text-faint)]">{skill.evidence} evidence event{skill.evidence === 1 ? '' : 's'}</p></div><span className="metric-number text-xs font-extrabold">{skill.mastery}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]"><div className="h-full rounded-full bg-[var(--blue)]" style={{ width: `${skill.mastery}%` }} /></div></button>)}</div>
        </article>

        <article className="panel overflow-hidden">
          <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Training evidence</p><h2 className="mt-1 text-base font-bold">Last 12 weeks</h2></div><Flame size={18} className="text-[var(--amber)]" /></header>
          <div className="overflow-x-auto p-5"><ContributionGrid activity={activity} days={84} /></div>
          <div className="grid grid-cols-2 gap-4 border-t border-[var(--border)] bg-[var(--surface-raised)] p-5"><EvidenceMetric label="Current streak" value={`${stats.currentStreak}d`} detail={`Best ${stats.longestStreak}d`} /><EvidenceMetric label="Independent" value={stats.independent} detail="Measured solves" /><EvidenceMetric label="Roadmap exposure" value={`${stats.completed}/250`} detail="Secondary metric" /><EvidenceMetric label="Average solve" value={formatDuration(stats.averageSeconds, true)} detail="Timed attempts" /></div>
        </article>
      </section>
    </div>
  )
}