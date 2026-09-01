import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Flag,
  Focus,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  Square,
  Target,
  TimerReset,
  Trophy,
  X,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SolveForm } from '../components/SolveForm'
import { Badge, Button, DifficultyBadge, IconButton, ProgressBar } from '../components/ui'
import { useTracker } from '../context/useTracker'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { getProblemProgress, getRecommendations, getRevisionBuckets } from '../lib/analytics'
import { formatDuration, formatTimer, getTimerSeconds, percent } from '../lib/utils'
import type { SessionGoal } from '../types'

export function FocusPage() {
  const {
    state,
    startSession,
    endSession,
    startTimer,
    pauseTimer,
    resumeTimer,
    cancelTimer,
    markRevision,
  } = useTracker()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [goal, setGoal] = useState<SessionGoal>(params.get('mode') === 'revision' ? 'revision' : 1)
  const [customGoal, setCustomGoal] = useState(4)
  const [loggingProblemId, setLoggingProblemId] = useState<string | null>(null)
  const [summarySessionId, setSummarySessionId] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const activeSession = state.sessions.find((session) => !session.endedAt) ?? null
  const excluded = new Set(activeSession?.problemIds ?? [])
  const revisionBuckets = getRevisionBuckets(state, ROADMAP_PROBLEMS)
  const dueProblems = [...revisionBuckets.overdue, ...revisionBuckets.today]
    .map((item) => item.problem)
    .filter((problem) => !excluded.has(problem.id))
  const recommended = getRecommendations(state, ROADMAP_PROBLEMS, ROADMAP_PROBLEMS.length)
    .map((item) => item.problem)
    .filter((problem) => !excluded.has(problem.id))
  const target = activeSession
    ? activeSession.goal === 'revision'
      ? dueProblems[0] ?? null
      : recommended[0] ?? null
    : null
  const progress = target ? getProblemProgress(state, target.id) : null
  const isRevision = Boolean(
    target &&
      progress?.solvedAt &&
      progress.nextRevisionAt &&
      Date.parse(progress.nextRevisionAt) <= now,
  )
  const timer = target && state.activeTimer?.problemId === target.id ? state.activeTimer : null
  const timerSeconds = timer ? getTimerSeconds(timer, now) : 0
  const targetCount = activeSession && typeof activeSession.goal === 'number' ? activeSession.goal : null
  const sessionProgress = targetCount ? percent(activeSession?.problemIds.length ?? 0, targetCount) : 0
  const logging = loggingProblemId === target?.id
  const goalReached = Boolean(
    activeSession &&
      ((typeof activeSession.goal === 'number' && activeSession.problemIds.length >= activeSession.goal) ||
        (activeSession.goal === 'revision' && activeSession.problemIds.length > 0 && !target)),
  )

  useEffect(() => {
    if (!timer?.running) return
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [timer?.running])

  useEffect(() => {
    if (
      activeSession &&
      target &&
      state.settings.autoStartTimer &&
      state.activeTimer?.problemId !== target.id
    ) {
      startTimer(target.id)
    }
  }, [activeSession, startTimer, state.activeTimer?.problemId, state.settings.autoStartTimer, target])

  const summary = summarySessionId
    ? state.sessions.find((session) => session.id === summarySessionId) ?? null
    : null
  const summaryAttempts = summary
    ? state.attempts.filter((attempt) => attempt.sessionId === summary.id)
    : []
  const summaryRevisions = summary
    ? state.revisions.filter(
        (revision) =>
          summary.problemIds.includes(revision.problemId) &&
          Date.parse(revision.completedAt) >= Date.parse(summary.startedAt) &&
          (!summary.endedAt || Date.parse(revision.completedAt) <= Date.parse(summary.endedAt)),
      )
    : []
  const independent = summaryAttempts.filter((attempt) => attempt.outcome === 'independent').length
  const hints = summaryAttempts.filter((attempt) => attempt.outcome === 'hint').length
  const solved = summaryAttempts.filter((attempt) =>
    ['independent', 'hint', 'solution'].includes(attempt.outcome),
  ).length + summaryRevisions.filter((revision) => revision.result === 'recalled').length
  const studySeconds = summaryAttempts.reduce((total, attempt) => total + attempt.durationSeconds, 0) +
    summaryRevisions.reduce((total, revision) => total + revision.durationSeconds, 0)
  const confidenceValues = [
    ...summaryAttempts.map((attempt) => attempt.confidence),
    ...summaryRevisions.map((revision) => revision.confidence),
  ]
  const averageConfidence = confidenceValues.length
    ? confidenceValues.reduce((total, value) => total + value, 0) / confidenceValues.length
    : 0

  function beginSession() {
    const selectedGoal = goal === 'revision' ? 'revision' : goal === customGoal ? customGoal : goal
    setSummarySessionId(null)
    startSession(selectedGoal)
  }

  function finishSession() {
    if (!activeSession) return
    setSummarySessionId(activeSession.id)
    endSession(activeSession.id)
  }

  if (summary && !activeSession) {
    return (
      <main className="min-h-screen bg-[var(--bg)] px-4 py-8 sm:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <section className="panel w-full p-6 shadow-[var(--shadow)] sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-[7px] bg-[var(--accent-soft)] text-[var(--accent)]"><Trophy size={23} /></div>
            <h1 className="mt-5 text-2xl font-extrabold">Session complete</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Focused work, logged and safely stored.</p>
            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[7px] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
              {[{ label: 'Attempted', value: summary.problemIds.length }, { label: 'Solved', value: solved }, { label: 'Independent', value: independent }, { label: 'Hints used', value: hints }, { label: 'Study time', value: formatDuration(studySeconds) }, { label: 'Confidence', value: averageConfidence ? `${Math.round(averageConfidence * 10) / 10}/5` : '-' }].map((item) => <div key={item.label} className="bg-[var(--surface)] p-5"><p className="metric-number text-2xl font-extrabold">{item.value}</p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--text-faint)]">{item.label}</p></div>)}
            </div>
            <div className="mt-8 flex flex-wrap justify-end gap-2"><Button variant="secondary" onClick={() => { setSummarySessionId(null); setGoal(1) }}><RotateCcw size={15} /> New session</Button><Button onClick={() => navigate('/')}><Check size={15} /> Back to today</Button></div>
          </section>
        </div>
      </main>
    )
  }

  if (!activeSession) {
    return (
      <main className="min-h-screen bg-[var(--bg)] px-4 py-8 sm:px-8">
        <header className="mx-auto flex max-w-4xl items-center justify-between"><button type="button" onClick={() => navigate('/')} className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)]"><ArrowLeft size={16} /> Back</button><div className="flex items-center gap-2 text-xs font-extrabold"><Focus size={17} /> Focus session</div></header>
        <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-2xl items-center justify-center py-10">
          <section className="panel w-full p-6 shadow-[var(--shadow)] sm:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-[7px] bg-[var(--accent-soft)] text-[var(--accent)]"><Target size={20} /></div>
            <h1 className="mt-5 text-2xl font-extrabold">Choose your LeetCode block</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">One deliberate problem is the default. Add volume only when the full solve-and-reflect loop stays honest.</p>
            <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {([1, 2, 3, 5] as const).map((value) => <button key={value} type="button" aria-pressed={goal === value} onClick={() => setGoal(value)} className={`h-11 rounded-[6px] border text-sm font-bold ${goal === value ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'}`}>{value}</button>)}
              <button type="button" aria-pressed={goal === customGoal} onClick={() => setGoal(customGoal)} className={`h-11 rounded-[6px] border text-xs font-bold ${goal === customGoal ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'}`}>Custom</button>
              <button type="button" aria-pressed={goal === 'revision'} onClick={() => setGoal('revision')} className={`h-11 rounded-[6px] border text-xs font-bold ${goal === 'revision' ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'}`}>Revision</button>
            </div>
            {goal === customGoal && <label className="mt-4 block text-xs font-bold text-[var(--text-muted)]">Problems<input type="number" min={1} max={25} className="input mt-2 px-3" value={customGoal} onChange={(event) => { const value = Math.max(1, Math.min(25, Number(event.target.value) || 1)); setCustomGoal(value); setGoal(value) }} /></label>}
            {goal === 'revision' && <p className="mt-4 text-xs text-[var(--text-muted)]">{dueProblems.length} revisions are currently due.</p>}
            <Button className="mt-6 w-full" size="lg" onClick={beginSession} disabled={goal === 'revision' && !dueProblems.length}><Play size={17} /> Begin session</Button>
          </section>
        </div>
      </main>
    )
  }

  if (goalReached) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-4"><section className="panel max-w-md p-8 text-center"><Trophy className="mx-auto text-[var(--accent)]" size={26} /><h1 className="mt-4 text-xl font-extrabold">Goal complete</h1><p className="mt-2 text-sm text-[var(--text-muted)]">Your session target has been reached.</p><Button className="mt-6" onClick={finishSession}>View summary</Button></section></main>
    )
  }

  if (!target) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-4"><section className="panel max-w-md p-8 text-center"><Flag className="mx-auto text-[var(--accent)]" size={26} /><h1 className="mt-4 text-xl font-extrabold">Queue complete</h1><p className="mt-2 text-sm text-[var(--text-muted)]">There are no more matching problems in this session.</p><Button className="mt-6" onClick={finishSession}>View summary</Button></section></main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6">
        <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)]"><X size={17} /> Exit</button>
        <div className="min-w-36 max-w-xs flex-1 px-4"><div className="mb-1 flex justify-between text-[9px] font-bold uppercase text-[var(--text-faint)]"><span>{activeSession.goal === 'revision' ? 'Revision session' : `Problem ${activeSession.problemIds.length + 1} of ${targetCount}`}</span><span>{activeSession.problemIds.length} done</span></div><ProgressBar value={activeSession.goal === 'revision' ? Math.min(100, activeSession.problemIds.length * 12.5) : sessionProgress} /></div>
        <Button size="sm" variant="ghost" onClick={finishSession}><Square size={13} /> End</Button>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1fr_390px] lg:px-8">
        <section className="min-w-0 py-4">
          <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-[var(--text-faint)]">#{target.leetcodeNumber}</span><DifficultyBadge difficulty={target.difficulty} />{isRevision && <Badge tone="red">Revision due</Badge>}</div>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">{target.title}</h1>
          <p className="mt-3 text-sm font-semibold text-[var(--text-muted)]">{target.topic}</p>
          <div className="mt-7"><a href={target.leetcodeUrl} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-2 rounded-[6px] border border-[var(--accent)] bg-[var(--accent)] px-5 text-sm font-bold text-[var(--accent-contrast)] shadow-[var(--button-shadow)] hover:bg-[var(--accent-strong)]">Open problem on LeetCode <ExternalLink size={15} /></a><p className="mt-2 text-[10px] text-[var(--text-faint)]">The pattern stays hidden here until you log the attempt.</p></div>
          <div className="mt-12"><p className="text-[10px] font-bold uppercase text-[var(--text-faint)]">Session timer</p><p className="metric-number mt-2 font-mono text-5xl font-semibold sm:text-6xl">{formatTimer(timerSeconds)}</p><div className="mt-5 flex items-center gap-2">{!timer && <Button onClick={() => startTimer(target.id)}><Play size={16} /> Start timer</Button>}{timer?.running && <IconButton icon={Pause} label="Pause timer" onClick={pauseTimer} />}{timer && !timer.running && <IconButton icon={Play} label="Resume timer" onClick={resumeTimer} />}{timer && <IconButton icon={TimerReset} label="Clear timer" onClick={cancelTimer} />}</div></div>
        </section>

        <aside className="panel p-5 sm:p-6">
          {isRevision ? (
            <div><div className="mb-6 flex h-10 w-10 items-center justify-center rounded-[7px] bg-[var(--blue-soft)] text-[var(--blue)]"><RotateCcw size={18} /></div><h2 className="text-lg font-bold">How did recall feel?</h2><p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">Stage {progress?.revisionStage} of {state.settings.revisionIntervals.length}</p><div className="mt-6 space-y-2"><Button className="w-full" size="lg" onClick={() => markRevision({ problemId: target.id, result: 'recalled', confidence: Math.max(3, progress?.confidence ?? 3) as 3 | 4 | 5, durationSeconds: timerSeconds, sessionId: activeSession.id })}><Check size={16} /> Recalled clearly</Button><Button className="w-full" size="lg" variant="secondary" onClick={() => markRevision({ problemId: target.id, result: 'weak', confidence: Math.min(3, progress?.confidence ?? 2) as 1 | 2 | 3, durationSeconds: timerSeconds, sessionId: activeSession.id })}><Lightbulb size={16} /> Still weak</Button></div></div>
          ) : logging ? (
            <div><button type="button" onClick={() => setLoggingProblemId(null)} className="mb-5 flex items-center gap-1 text-xs font-bold text-[var(--accent)]"><ArrowLeft size={13} /> Back</button><SolveForm problem={target} sessionId={activeSession.id} onSaved={() => setLoggingProblemId(null)} /></div>
          ) : (
            <div><div className="mb-6 flex h-10 w-10 items-center justify-center rounded-[7px] bg-[var(--accent-soft)] text-[var(--accent)]"><Focus size={18} /></div><h2 className="text-lg font-bold">Solve there. Reflect here.</h2><p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">When LeetCode accepts, times out, or you need help, return and record exactly what happened.</p><div className="mt-5 rounded-[6px] bg-[var(--surface-raised)] p-3"><p className="text-[9px] font-extrabold uppercase text-[var(--text-faint)]">Before you finish</p><ul className="mt-2 space-y-1.5 text-[10px] leading-4 text-[var(--text-muted)]"><li>· Name the pattern you actually used.</li><li>· Capture the key invariant or missed clue.</li><li>· Mark recall if you could not reproduce it tomorrow.</li></ul></div><Button className="mt-6 w-full" size="lg" onClick={() => setLoggingProblemId(target.id)}><Check size={16} /> Finish and reflect</Button></div>
          )}
        </aside>
      </div>
    </main>
  )
}