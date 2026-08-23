import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Gauge,
  MessageSquareText,
  Pause,
  Play,
  Square,
  Target,
  Trophy,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, DifficultyBadge, IconButton, ProgressBar } from '../components/ui'
import { useTracker } from '../context/useTracker'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { getInterviewSessionScore, getReadinessScore } from '../lib/interview'
import { formatDuration, formatTimer, getTimerSeconds, percent } from '../lib/utils'
import type { Difficulty, SolveOutcome } from '../types'

const OUTCOMES: Array<{ value: Exclude<SolveOutcome, 'revision'>; label: string }> = [
  { value: 'independent', label: 'Independent' },
  { value: 'hint', label: 'Used hint' },
  { value: 'solution', label: 'Needed solution' },
  { value: 'unable', label: 'Incomplete' },
]

function ScoreSelector({ label, value, onChange }: { label: string; value: 1 | 2 | 3 | 4 | 5; onChange: (value: 1 | 2 | 3 | 4 | 5) => void }) {
  return <fieldset><legend className="mb-2 text-[10px] font-bold uppercase text-[var(--text-faint)]">{label}</legend><div className="flex gap-1">{([1, 2, 3, 4, 5] as const).map((score) => <button key={score} type="button" aria-label={`${label} ${score} of 5`} aria-pressed={value === score} onClick={() => onChange(score)} className={`h-9 flex-1 rounded-[5px] border text-xs font-bold ${value === score ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>{score}</button>)}</div></fieldset>
}

export function InterviewPage() {
  const { state, startInterview, recordInterviewResult, finishInterview, startTimer, pauseTimer, resumeTimer } = useTracker()
  const navigate = useNavigate()
  const [targetMinutes, setTargetMinutes] = useState(45)
  const [difficulty, setDifficulty] = useState<Difficulty | 'Mixed'>('Mixed')
  const [problemCount, setProblemCount] = useState(2)
  const [evaluating, setEvaluating] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [outcome, setOutcome] = useState<Exclude<SolveOutcome, 'revision'>>('independent')
  const [codingScore, setCodingScore] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [explanationScore, setExplanationScore] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [communicationScore, setCommunicationScore] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [notes, setNotes] = useState('')
  const active = state.interviewSessions.find((session) => session.status === 'active') ?? null
  const latest = state.interviewSessions.at(-1) ?? null
  const currentProblemId = active?.problemIds[active.results.length] ?? null
  const problem = ROADMAP_PROBLEMS.find((item) => item.id === currentProblemId) ?? null
  const timer = problem && state.activeTimer?.problemId === problem.id ? state.activeTimer : null
  const elapsed = timer ? getTimerSeconds(timer, now) : 0
  const totalElapsed = active ? Math.max(0, Math.floor((now - Date.parse(active.startedAt)) / 1000)) : 0
  const remaining = active ? Math.max(0, active.targetMinutes * 60 - totalElapsed) : 0
  const readiness = getReadinessScore(state.interviewSessions)

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (active && problem && state.settings.autoStartTimer && state.activeTimer?.problemId !== problem.id) {
      startTimer(problem.id)
    }
  }, [active, problem, startTimer, state.activeTimer?.problemId, state.settings.autoStartTimer])

  function submitResult(event: FormEvent) {
    event.preventDefault()
    if (!active || !problem) return
    recordInterviewResult({
      sessionId: active.id,
      problemId: problem.id,
      durationSeconds: elapsed,
      outcome,
      codingScore,
      explanationScore,
      communicationScore,
      notes,
    })
    setEvaluating(false)
    setOutcome('independent')
    setCodingScore(3)
    setExplanationScore(3)
    setCommunicationScore(3)
    setNotes('')
  }

  if (showSummary && latest && latest.status === 'completed') {
    const score = getInterviewSessionScore(latest)
    return <main className="min-h-screen bg-[var(--bg)] p-4 sm:p-8"><div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center"><section className="panel w-full p-6 sm:p-10"><div className="flex h-12 w-12 items-center justify-center rounded-[7px] bg-[var(--accent-soft)] text-[var(--accent)]"><Trophy size={23} /></div><div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-extrabold">Interview debrief</h1><p className="mt-2 text-sm text-[var(--text-muted)]">{latest.results.length} {latest.results.length === 1 ? 'problem' : 'problems'} · {latest.targetMinutes} minute target</p></div><p className="metric-number text-5xl font-extrabold">{score.overall}<span className="text-lg text-[var(--text-faint)]">/100</span></p></div><div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[7px] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-4">{[{ label: 'Coding', value: `${score.coding}/5` }, { label: 'Explanation', value: `${score.explanation}/5` }, { label: 'Communication', value: `${score.communication}/5` }, { label: 'Independent', value: `${score.independentRate}%` }].map((item) => <div key={item.label} className="bg-[var(--surface)] p-5"><p className="metric-number text-2xl font-extrabold">{item.value}</p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--text-faint)]">{item.label}</p></div>)}</div><div className="mt-6 divide-y divide-[var(--border)]">{latest.results.map((result) => { const item = ROADMAP_PROBLEMS.find((candidate) => candidate.id === result.problemId); return item ? <div key={result.problemId} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-bold">{item.title}</p><p className="mt-1 text-[10px] text-[var(--text-faint)]">{item.patterns.join(' · ')}</p></div><span className="metric-number text-xs font-bold">{formatDuration(result.durationSeconds)}</span></div> : null })}</div><div className="mt-8 flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowSummary(false)}>New mock</Button><Button onClick={() => navigate('/')}>Back to today</Button></div></section></div></main>
  }

  if (!active) {
    return <main className="min-h-screen bg-[var(--bg)] p-4 sm:p-8"><header className="mx-auto flex max-w-4xl items-center justify-between"><button type="button" onClick={() => navigate('/')} className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]"><ArrowLeft size={16} /> Back</button><div className="flex items-center gap-2 text-xs font-extrabold"><Gauge size={17} /> Interview readiness</div></header><div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-4xl items-center gap-4 py-10 lg:grid-cols-[1fr_280px]"><section className="panel p-6 sm:p-8"><div className="flex h-11 w-11 items-center justify-center rounded-[7px] bg-[var(--blue-soft)] text-[var(--blue)]"><Target size={20} /></div><h1 className="mt-5 text-2xl font-extrabold">Configure a mock interview</h1><div className="mt-6 space-y-5"><fieldset><legend className="mb-2 text-[10px] font-bold uppercase text-[var(--text-faint)]">Time limit</legend><div className="grid grid-cols-3 gap-2">{[35, 45, 60].map((minutes) => <button key={minutes} type="button" aria-pressed={targetMinutes === minutes} onClick={() => setTargetMinutes(minutes)} className={`h-10 rounded-[6px] border text-xs font-bold ${targetMinutes === minutes ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>{minutes} min</button>)}</div></fieldset><fieldset><legend className="mb-2 text-[10px] font-bold uppercase text-[var(--text-faint)]">Difficulty</legend><div className="grid grid-cols-4 gap-2">{(['Mixed', 'Easy', 'Medium', 'Hard'] as const).map((value) => <button key={value} type="button" aria-pressed={difficulty === value} onClick={() => setDifficulty(value)} className={`h-10 rounded-[6px] border text-xs font-bold ${difficulty === value ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>{value}</button>)}</div></fieldset><fieldset><legend className="mb-2 text-[10px] font-bold uppercase text-[var(--text-faint)]">Problems</legend><div className="grid grid-cols-3 gap-2">{[1, 2, 3].map((value) => <button key={value} type="button" aria-pressed={problemCount === value} onClick={() => setProblemCount(value)} className={`h-10 rounded-[6px] border text-xs font-bold ${problemCount === value ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>{value}</button>)}</div></fieldset></div><Button className="mt-7 w-full" size="lg" onClick={() => startInterview({ targetMinutes, difficulty, problemCount })}><Play size={17} /> Start mock</Button></section><aside className="panel p-6"><p className="text-[10px] font-bold uppercase text-[var(--text-faint)]">Readiness score</p><p className="metric-number mt-3 text-5xl font-extrabold">{readiness.score}<span className="text-base text-[var(--text-faint)]">/100</span></p><p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">Based on coding, explanation, communication, and independent outcomes.</p><div className="mt-5 border-t border-[var(--border)] pt-4 text-xs"><span className="text-[var(--text-faint)]">Completed mocks</span><strong className="metric-number float-right">{readiness.sessions}</strong></div></aside></div></main>
  }

  const complete = active.results.length >= active.problemIds.length
  if (complete || !problem) {
    return <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-4"><section className="panel max-w-md p-8 text-center"><Trophy className="mx-auto text-[var(--accent)]" size={27} /><h1 className="mt-4 text-xl font-extrabold">Mock complete</h1><p className="mt-2 text-sm text-[var(--text-muted)]">Review your interview signal while the attempt is fresh.</p><Button className="mt-6" onClick={() => { finishInterview(active.id); setShowSummary(true) }}>Open debrief</Button></section></main>
  }

  return <main className="min-h-screen bg-[var(--bg)]"><header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6"><button type="button" onClick={() => { finishInterview(active.id, true); navigate('/') }} className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]"><X size={16} /> Exit</button><div className="min-w-40 max-w-xs flex-1 px-4"><div className="mb-1 flex justify-between text-[9px] font-bold uppercase text-[var(--text-faint)]"><span>Problem {active.results.length + 1}/{active.problemIds.length}</span><span>{formatTimer(remaining)}</span></div><ProgressBar value={percent(active.results.length, active.problemIds.length)} /></div><Badge tone={remaining < 300 ? 'red' : 'blue'}>{remaining < 300 ? 'Closing' : 'In progress'}</Badge></header><div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1fr_400px] lg:px-8"><section><div className="flex items-center gap-2"><span className="font-mono text-xs text-[var(--text-faint)]">#{problem.leetcodeNumber}</span><DifficultyBadge difficulty={problem.difficulty} /><Badge tone="violet">Patterns hidden</Badge></div><h1 className="mt-4 max-w-3xl text-3xl font-extrabold sm:text-4xl">{problem.title}</h1><div className="mt-7 flex gap-2"><a href={problem.leetcodeUrl} target="_blank" rel="noreferrer" className="flex h-10 items-center gap-2 rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface)] px-4 text-xs font-bold">Open LeetCode <ExternalLink size={13} /></a></div><div className="mt-12"><p className="text-[10px] font-bold uppercase text-[var(--text-faint)]">Problem time</p><p className="metric-number mt-2 font-mono text-5xl font-semibold">{formatTimer(elapsed)}</p><div className="mt-5 flex gap-2">{!timer && <Button onClick={() => startTimer(problem.id)}><Play size={15} /> Start</Button>}{timer?.running ? <IconButton icon={Pause} label="Pause timer" onClick={pauseTimer} /> : timer ? <IconButton icon={Play} label="Resume timer" onClick={resumeTimer} /> : null}</div></div></section><aside className="panel p-5 sm:p-6">{evaluating ? <form onSubmit={submitResult} className="space-y-4"><h2 className="text-lg font-bold">Score the attempt</h2><fieldset><legend className="mb-2 text-[10px] font-bold uppercase text-[var(--text-faint)]">Outcome</legend><div className="grid grid-cols-2 gap-2">{OUTCOMES.map((item) => <button key={item.value} type="button" aria-pressed={outcome === item.value} onClick={() => setOutcome(item.value)} className={`h-10 rounded-[6px] border text-xs font-bold ${outcome === item.value ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>{item.label}</button>)}</div></fieldset><ScoreSelector label="Coding" value={codingScore} onChange={setCodingScore} /><ScoreSelector label="Explanation" value={explanationScore} onChange={setExplanationScore} /><ScoreSelector label="Communication" value={communicationScore} onChange={setCommunicationScore} /><label className="block text-[10px] font-bold uppercase text-[var(--text-faint)]">Debrief note<textarea className="input mt-2 min-h-20 px-3 py-2 text-sm normal-case" value={notes} onChange={(event) => setNotes(event.target.value)} /></label><Button type="submit" className="w-full"><Check size={15} /> Save evaluation</Button></form> : <div><div className="flex h-10 w-10 items-center justify-center rounded-[7px] bg-[var(--violet-soft)] text-[var(--violet)]"><MessageSquareText size={18} /></div><h2 className="mt-5 text-lg font-bold">Think aloud</h2><p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">State assumptions, compare approaches, test edge cases, and close with complexity.</p><Button className="mt-6 w-full" size="lg" onClick={() => setEvaluating(true)}><Square size={15} /> Evaluate attempt</Button></div>}</aside></div></main>
}