import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Box,
  CalendarRange,
  Check,
  ChevronRight,
  Crosshair,
  ExternalLink,
  Gauge,
  HelpCircle,
  Network,
  RefreshCw,
  Route,
  ScanSearch,
  Target,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, PageHeader, ProgressBar } from '../components/ui'
import { useTracker } from '../context/useTracker'
import {
  CURRICULUM,
  DIAGNOSTIC_QUESTIONS,
  type CorePattern,
} from '../data/mentor-content'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { fetchLeetCodeProfile } from '../lib/leetcode'
import {
  getDailyMentorMission,
  getMentorReadiness,
  getMistakeSummary,
  getPatternMastery,
  getRecommendedLevel,
  type PatternMastery,
} from '../lib/mentor'
import { getLevelProgression, LEVEL_NAMES } from '../lib/progression'

const FAILURE_LABELS: Record<string, string> = {
  'problem-understanding': 'Problem understanding',
  'pattern-recognition': 'Pattern recognition',
  'wrong-approach': 'Wrong approach',
  implementation: 'Python implementation',
  'edge-case': 'Edge cases',
  complexity: 'Complexity analysis',
  time: 'Time pressure',
}

function Diagnostic({ onComplete }: { onComplete: ReturnType<typeof useTracker>['completeDiagnostic'] }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<CorePattern | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState<Array<{ questionId: string; pattern: string; correct: boolean }>>([])
  const question = DIAGNOSTIC_QUESTIONS[index]
  const correct = selected === question.answer

  const checkAnswer = () => {
    if (!selected || revealed) return
    setResults((items) => [...items, { questionId: question.id, pattern: question.answer, correct }])
    setRevealed(true)
  }

  const next = () => {
    if (index === DIAGNOSTIC_QUESTIONS.length - 1) {
      const correctAnswers = results.filter((result) => result.correct).length
      onComplete({
        answers: results,
        recommendedLevel: getRecommendedLevel(correctAnswers, results.length),
      })
      return
    }
    setIndex((value) => value + 1)
    setSelected(null)
    setRevealed(false)
  }

  return (
    <div className="page-content">
      <header className="mb-6 max-w-3xl">
        <div className="mb-3 flex items-center gap-2"><Badge tone="green">Mentor diagnostic</Badge><span className="font-mono text-[10px] font-bold text-[var(--text-faint)]">NO CODE REQUIRED</span></div>
        <h1 className="text-[28px] font-bold leading-tight">Let&apos;s measure how you choose an approach.</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">This is not a LeetCode count test. It checks whether you can recognize the next useful idea from a blank prompt.</p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <section className="panel overflow-hidden">
          <header className="border-b border-[var(--border)] px-5 py-4">
            <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Question {index + 1} of {DIAGNOSTIC_QUESTIONS.length}</span><span className="metric-number font-mono text-xs font-bold">{Math.round(((index + (revealed ? 1 : 0)) / DIAGNOSTIC_QUESTIONS.length) * 100)}%</span></div>
            <ProgressBar value={((index + (revealed ? 1 : 0)) / DIAGNOSTIC_QUESTIONS.length) * 100} className="mt-3" />
          </header>
          <div className="p-5 sm:p-7">
            <p className="text-[10px] font-extrabold uppercase text-[var(--accent)]">What technique would you try first?</p>
            <h2 className="mt-3 max-w-2xl text-xl font-bold leading-8">{question.prompt}</h2>
            <div className="mt-4 flex flex-wrap gap-2">{question.clues.map((clue) => <Badge key={clue} tone="neutral">{clue}</Badge>)}</div>
            <div className="mt-7 grid gap-2 sm:grid-cols-2">
              {question.options.map((option) => {
                const isSelected = selected === option
                const isAnswer = revealed && option === question.answer
                const isWrong = revealed && isSelected && !correct
                return <button key={option} type="button" disabled={revealed} onClick={() => setSelected(option)} className={`flex min-h-14 items-center gap-3 rounded-[6px] border px-4 text-left text-sm font-bold transition-colors ${isAnswer ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : isWrong ? 'border-[var(--red)] bg-[var(--red-soft)] text-[var(--red)]' : isSelected ? 'border-[var(--blue)] bg-[var(--blue-soft)] text-[var(--blue)]' : 'border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--border-strong)]'}`}><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current">{(isAnswer || isSelected) && <span className="h-2 w-2 rounded-full bg-current" />}</span>{option}</button>
              })}
            </div>
            {revealed && <div className={`mt-5 rounded-[6px] border p-4 ${correct ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--amber)] bg-[var(--amber-soft)]'}`}><p className="text-xs font-extrabold">{correct ? 'Correct reasoning signal' : `Better first direction: ${question.answer}`}</p><p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{question.explanation}</p></div>}
            <div className="mt-6 flex justify-end">{revealed ? <Button onClick={next}>{index === DIAGNOSTIC_QUESTIONS.length - 1 ? 'Build my profile' : 'Next question'} <ArrowRight size={15} /></Button> : <Button onClick={checkAnswer} disabled={!selected}>Check reasoning <Check size={15} /></Button>}</div>
          </div>
        </section>

        <aside className="panel p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[var(--text)] text-[var(--surface)]"><BrainCircuit size={20} /></div>
          <h2 className="mt-5 text-sm font-extrabold">Starting honestly</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">You already know basic Python and can solve some Easy problems. The present bottleneck is choosing and deriving an approach when the pattern is not named.</p>
          <div className="mt-5 space-y-3 border-t border-[var(--border)] pt-5 text-xs">
            <div className="flex gap-3"><Target size={15} className="mt-0.5 shrink-0 text-[var(--accent)]" /><p><strong className="text-[var(--text)]">We will measure:</strong> recognition, implementation, recall, and independence separately.</p></div>
            <div className="flex gap-3"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-[var(--amber)]" /><p><strong className="text-[var(--text)]">We will not assume:</strong> one solve means mastery or a solution view means understanding.</p></div>
            <div className="flex gap-3"><Route size={15} className="mt-0.5 shrink-0 text-[var(--blue)]" /><p><strong className="text-[var(--text)]">We will start:</strong> below random Mediums and earn progression through evidence.</p></div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Dimension({ label, value }: { label: string; value: number | null }) {
  return <div><div className="mb-1.5 flex justify-between gap-3 text-[10px] font-bold"><span className="text-[var(--text-muted)]">{label}</span><span className="metric-number">{value === null ? 'Not measured' : `${value}%`}</span></div><ProgressBar value={value ?? 0} /></div>
}

function SkillCard({ skill }: { skill: PatternMastery }) {
  return (
    <article className="panel p-4">
      <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold">{skill.pattern}</h3><p className="mt-1 text-[10px] text-[var(--text-faint)]">{skill.evidence} evidence event{skill.evidence === 1 ? '' : 's'}</p></div><span className="metric-number text-2xl font-extrabold">{skill.mastery}%</span></div>
      <ProgressBar value={skill.mastery} className="mt-3" />
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3"><Dimension label="Recognition" value={skill.recognition} /><Dimension label="Implementation" value={skill.implementation} /><Dimension label="Recall" value={skill.recall} /><Dimension label="Independence" value={skill.independence} /></div>
      <p className="mt-4 border-t border-[var(--border)] pt-3 text-xs leading-5 text-[var(--text-muted)]">{skill.diagnosis}</p>
    </article>
  )
}

export function MentorPage() {
  const { state, completeDiagnostic, saveLeetCodeProfile } = useTracker()
  const navigate = useNavigate()
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  if (!state.mentor.onboardingComplete) return <Diagnostic onComplete={completeDiagnostic} />

  const mastery = getPatternMastery(state, ROADMAP_PROBLEMS)
  const practiced = mastery.filter((skill) => skill.evidence > 0)
  const displaySkills = [...(practiced.length ? practiced : mastery.slice(0, 4))]
    .sort((left, right) => left.mastery - right.mastery)
    .slice(0, 4)
  const readiness = getMentorReadiness(state, ROADMAP_PROBLEMS)
  const mission = getDailyMentorMission(state, ROADMAP_PROBLEMS)
  const mistakes = getMistakeSummary(state)
  const progression = getLevelProgression(state, ROADMAP_PROBLEMS)
  const level = progression.activeLevel
  const levelNodes = CURRICULUM.filter((node) => node.level === level)
  const profile = state.mentor.leetcodeProfile

  const syncProfile = async () => {
    setSyncing(true)
    setSyncError(null)
    try {
      const snapshot = await fetchLeetCodeProfile('Mithuncoding', ROADMAP_PROBLEMS)
      saveLeetCodeProfile(snapshot)
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'LeetCode sync failed.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="page-content">
      <PageHeader title="Mentor" description="Your personal DSA academy: derive first, reveal later." actions={<><Button variant="secondary" onClick={() => navigate('/mentor/recognition')}><ScanSearch size={16} /> Recognition drill</Button><Button onClick={() => mission[2] && navigate(mission[2].route)}><Crosshair size={16} /> Start mission</Button></>} />

      <section className="mb-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <article className="panel relative overflow-hidden bg-[#17231c] p-5 text-white sm:p-6">
          <div className="absolute right-5 top-5 font-mono text-[10px] font-bold opacity-45">MITHUN / LEVEL {level}</div>
          <Badge tone="green">Current training stage</Badge>
          <h2 className="mt-4 max-w-2xl text-2xl font-bold leading-8 text-white">{LEVEL_NAMES[level]}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Random problem volume is not the assignment. The assignment is to recognize a familiar structure, derive a defendable approach, and reproduce it later.</p>
          <div className="mt-4 flex flex-wrap gap-3 text-[10px] font-bold uppercase text-white/45"><span>Placement L{progression.placementLevel}</span><span>Evidence earned L{progression.earnedLevel}</span></div>
          <div className="mt-6 flex flex-wrap gap-2"><Button onClick={() => navigate('/mentor/lab')}><Box size={15} /> Open 3D lab</Button><Button variant="ghost" className="border-white/15 text-white hover:bg-white/10 hover:text-white" onClick={() => navigate('/mentor/curriculum')}>Curriculum <ArrowRight size={15} /></Button><Button variant="ghost" className="border-white/15 text-white hover:bg-white/10 hover:text-white" onClick={() => navigate('/mentor/medium')}>Medium trainer</Button><Button variant="ghost" className="border-white/15 text-white hover:bg-white/10 hover:text-white" onClick={() => navigate('/mentor/decide')}><HelpCircle size={15} /> What should I try?</Button><Button variant="ghost" className="border-white/15 text-white hover:bg-white/10 hover:text-white" onClick={() => navigate('/mentor/graph')}><Network size={15} /> Knowledge graph</Button><Button variant="ghost" className="border-white/15 text-white hover:bg-white/10 hover:text-white" onClick={() => navigate('/mentor/year')}><CalendarRange size={15} /> One-year plan</Button></div>
        </article>

        <article className="panel p-5">
          <div className="flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Interview readiness</p><p className="metric-number mt-2 text-4xl font-extrabold">{readiness.score}%</p></div><div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[var(--blue-soft)] text-[var(--blue)]"><Gauge size={20} /></div></div>
          <ProgressBar value={readiness.score} className="mt-4" />
          <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">{readiness.diagnosis}</p>
          <p className="mt-3 border-t border-[var(--border)] pt-3 text-[10px] text-[var(--text-faint)]">Internal training metric only. It is not a hiring or interview guarantee.</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
        <article className="panel overflow-hidden">
          <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div><h2 className="text-sm font-bold">Today&apos;s mission</h2><p className="mt-0.5 text-xs text-[var(--text-muted)]">Learning before volume</p></div><Target size={18} className="text-[var(--accent)]" /></header>
          <div className="divide-y divide-[var(--border)]">{mission.map((task, index) => <button key={task.id} type="button" onClick={() => navigate(task.route)} className="group flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[var(--surface-raised)]"><span className="metric-number flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] bg-[var(--surface-muted)] font-mono text-[10px] font-bold">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{task.label}</p><p className="mt-1 truncate text-[10px] text-[var(--text-faint)]">{task.detail}</p></div><ChevronRight size={15} className="shrink-0 text-[var(--text-faint)] transition-transform group-hover:translate-x-0.5" /></button>)}</div>
        </article>

        <article className="panel p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">LeetCode profile</p><h2 className="mt-1 text-sm font-bold">Mithuncoding</h2></div><Button size="sm" variant="secondary" onClick={syncProfile} disabled={syncing}><RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing' : 'Sync'}</Button></div>
          {profile ? <><div className="mt-5 grid grid-cols-2 gap-3"><div><p className="metric-number text-2xl font-extrabold">{profile.totalSolved}</p><p className="text-[10px] font-bold uppercase text-[var(--text-faint)]">Public solves</p></div><div><p className="metric-number text-2xl font-extrabold">{profile.mediumSolved}</p><p className="text-[10px] font-bold uppercase text-[var(--text-faint)]">Medium</p></div><div><p className="metric-number text-lg font-bold">{profile.primaryLanguage?.replace('3', '') ?? '-'}</p><p className="text-[10px] font-bold uppercase text-[var(--text-faint)]">Primary language</p></div><div><p className="metric-number text-lg font-bold">{profile.maxStreak ?? '-'}</p><p className="text-[10px] font-bold uppercase text-[var(--text-faint)]">Max streak</p></div></div><p className="mt-4 rounded-[6px] bg-[var(--amber-soft)] p-3 text-xs leading-5 text-[var(--amber)]">Imported solves prove exposure, not independent mastery. They do not raise your mentor score.</p><div className="mt-3 flex items-center justify-between text-[10px] text-[var(--text-faint)]"><span>Synced {formatDistanceToNow(new Date(profile.syncedAt), { addSuffix: true })}</span><a href={profile.source} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-bold text-[var(--accent)]">Open profile <ExternalLink size={11} /></a></div></> : <div className="mt-5 rounded-[6px] border border-dashed border-[var(--border-strong)] p-4 text-sm leading-6 text-[var(--text-muted)]">Sync the public profile snapshot to compare LeetCode exposure with measured in-app independence.</div>}
          <button type="button" onClick={() => navigate('/mentor/leetcode')} className="mt-3 text-xs font-bold text-[var(--accent)]">Reconcile complete solved history</button>
          {syncError && <p role="alert" className="mt-3 text-xs leading-5 text-[var(--red)]">{syncError}</p>}
        </article>
      </section>

      <section className="mt-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-sm font-bold">Skill profile</h2><p className="mt-0.5 text-xs text-[var(--text-muted)]">The weakest measured dimensions appear first.</p></div><button type="button" onClick={() => navigate('/mentor/curriculum')} className="text-xs font-bold text-[var(--accent)]">View all patterns</button></div>
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">{displaySkills.map((skill) => <SkillCard key={skill.pattern} skill={skill} />)}</div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="panel p-5">
          <div className="flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Your common mistakes</p><h2 className="mt-1 text-sm font-bold">Failure memory</h2></div><button type="button" onClick={() => navigate('/mentor/mistakes')} className="text-xs font-bold text-[var(--accent)]">Review all</button></div>
          {mistakes.length ? <div className="mt-4 space-y-3">{mistakes.slice(0, 5).map((mistake, index) => <div key={mistake.category} className="flex items-center gap-3"><span className="metric-number font-mono text-[10px] text-[var(--text-faint)]">{index + 1}</span><span className="flex-1 text-sm font-semibold">{FAILURE_LABELS[mistake.category] ?? mistake.category}</span><Badge tone={index === 0 ? 'red' : 'amber'}>{mistake.count}x</Badge></div>)}</div> : <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">No failure classifications yet. Guided sessions will ask why an attempt failed and use that evidence in future missions.</p>}
        </article>
        <article className="panel p-5">
          <div className="flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Current curriculum</p><h2 className="mt-1 text-sm font-bold">Level {level}: {LEVEL_NAMES[level]}</h2></div><BookOpenCheck size={18} className="text-[var(--blue)]" /></div>
          <div className="mt-4 space-y-2">{levelNodes.map((node) => <button key={node.id} type="button" onClick={() => navigate(`/mentor/curriculum?node=${node.id}`)} className="flex w-full items-center gap-3 rounded-[6px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-3 text-left hover:border-[var(--accent)]"><div className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-[var(--blue-soft)] text-[var(--blue)]"><BookOpenCheck size={14} /></div><div className="min-w-0 flex-1"><p className="text-xs font-bold">{node.title}</p><p className="mt-0.5 truncate text-[10px] text-[var(--text-faint)]">{node.outcome}</p></div><ArrowRight size={14} className="text-[var(--text-faint)]" /></button>)}</div>
          {progression.nextGate && <div className="mt-4 border-t border-[var(--border)] pt-4"><div className="flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Next gate: L{progression.nextGate.level}</p><span className="metric-number text-xs font-bold">{progression.nextGate.progress}%</span></div><ProgressBar value={progression.nextGate.progress} className="mt-2" /><div className="mt-3 space-y-1.5">{progression.nextGate.requirements.map((item) => <p key={item.label} className={`flex items-center justify-between gap-3 text-[10px] ${item.met ? 'text-[var(--accent-strong)]' : 'text-[var(--text-muted)]'}`}><span>{item.label}</span><span className="metric-number font-bold">{item.current}/{item.target}{item.suffix}</span></p>)}</div></div>}
        </article>
      </section>
    </div>
  )
}