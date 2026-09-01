import { useEffect, useState, type FormEvent } from 'react'
import { Check, Crosshair, Lightbulb, Minus, Plus, Video, X } from 'lucide-react'
import { useTracker } from '../context/useTracker'
import { type CorePattern } from '../data/mentor-content'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { getProblemProgress } from '../lib/analytics'
import { getCorePattern } from '../lib/mentor'
import { getProblemTeachingGuide, getRecognitionOptions } from '../lib/problem-guides'
import { getTimerSeconds } from '../lib/utils'
import type { RoadmapProblem, SolveOutcome } from '../types'
import { Button, IconButton } from './ui'

const OUTCOMES: Array<{ value: SolveOutcome; label: string; icon: typeof Check }> = [
  { value: 'independent', label: 'Solved myself', icon: Check },
  { value: 'hint', label: 'Used a hint', icon: Lightbulb },
  { value: 'solution', label: 'Watched solution', icon: Video },
  { value: 'unable', label: 'Could not solve', icon: X },
]

export function SolveForm({ problem, sessionId = null, onSaved }: { problem: RoadmapProblem; sessionId?: string | null; onSaved: () => void }) {
  const { state, logAttempt } = useTracker()
  const progress = getProblemProgress(state, problem.id)
  const [outcome, setOutcome] = useState<SolveOutcome>('independent')
  const [attempts, setAttempts] = useState(1)
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5>(progress.confidence ?? 3)
  const [notes, setNotes] = useState('')
  const [revisionNeeded, setRevisionNeeded] = useState(false)
  const [patternGuess, setPatternGuess] = useState<CorePattern | null>(null)
  const [patternLocked, setPatternLocked] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const timer = state.activeTimer?.problemId === problem.id ? state.activeTimer : null
  const expectedPattern = getCorePattern(problem)
  const patternCorrect = patternGuess === expectedPattern
  const patternOptions = getRecognitionOptions(problem, ROADMAP_PROBLEMS)
  const teachingGuide = getProblemTeachingGuide(problem).guide

  useEffect(() => {
    if (!timer?.running) return
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [timer?.running])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!patternGuess || !patternLocked) return
    logAttempt({
      problemId: problem.id,
      outcome,
      attempts,
      confidence,
      notes,
      revisionNeeded: revisionNeeded || outcome === 'unable' || !patternCorrect,
      durationSeconds: timer ? getTimerSeconds(timer, now) : 0,
      sessionId,
      patternGuess,
      patternCorrect,
    })
    onSaved()
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset>
        <div className="mb-3 flex items-start gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[var(--blue-soft)] text-[var(--blue)]"><Crosshair size={16} /></div><div><legend className="text-xs font-bold uppercase text-[var(--text-faint)]">Pattern reflection</legend><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">What reusable structure actually unlocked the solution?</p></div></div>
        <div className="grid gap-2 sm:grid-cols-2">{patternOptions.map((pattern) => <button key={pattern} type="button" disabled={patternLocked} onClick={() => setPatternGuess(pattern)} className={`min-h-10 rounded-[6px] border px-3 text-left text-xs font-semibold ${patternLocked && pattern === expectedPattern ? 'border-[var(--green)] bg-[var(--green-soft)] text-[var(--green-strong)]' : patternLocked && patternGuess === pattern ? 'border-[var(--red)] bg-[var(--red-soft)] text-[var(--red)]' : patternGuess === pattern ? 'border-[var(--blue)] bg-[var(--blue-soft)] text-[var(--blue)]' : 'border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'}`}>{pattern}</button>)}</div>
        {!patternLocked ? <Button type="button" size="sm" variant="secondary" className="mt-3" disabled={!patternGuess} onClick={() => setPatternLocked(true)}>Commit pattern</Button> : <div className={`mt-3 rounded-[6px] border p-3 ${patternCorrect ? 'border-[var(--green)] bg-[var(--green-soft)]' : 'border-[var(--amber)] bg-[var(--amber-soft)]'}`}><p className="text-xs font-extrabold">{patternCorrect ? 'Pattern recognized.' : `Better fit: ${expectedPattern}`}</p><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{teachingGuide.keyObservation}</p></div>}
      </fieldset>
      {patternLocked && <>
      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase text-[var(--text-faint)]">Outcome</legend>
        <div className="grid grid-cols-2 gap-2">
          {OUTCOMES.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" aria-pressed={outcome === value} onClick={() => setOutcome(value)} className={`flex min-h-11 items-center gap-2 rounded-[6px] border px-3 text-left text-xs font-semibold transition-colors ${outcome === value ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'}`}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="mb-2 block text-xs font-bold uppercase text-[var(--text-faint)]">Attempts</span>
          <div className="flex items-center gap-2">
            <IconButton icon={Minus} label="Decrease attempts" onClick={() => setAttempts((value) => Math.max(1, value - 1))} />
            <span className="metric-number w-8 text-center text-sm font-bold">{attempts}</span>
            <IconButton icon={Plus} label="Increase attempts" onClick={() => setAttempts((value) => Math.min(99, value + 1))} />
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 text-xs font-bold uppercase text-[var(--text-faint)]">Confidence</legend>
          <div className="flex gap-1">
            {([1, 2, 3, 4, 5] as const).map((value) => (
              <button key={value} type="button" aria-label={`Confidence ${value} of 5`} aria-pressed={confidence === value} onClick={() => setConfidence(value)} className={`h-9 min-w-8 flex-1 rounded-[5px] border text-xs font-bold ${confidence === value ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'}`}>{value}</button>
            ))}
          </div>
        </fieldset>
      </div>
      <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase text-[var(--text-faint)]">Quick note <span className="normal-case font-medium">(optional)</span></span>
        <textarea className="input min-h-20 resize-y px-3 py-2 text-sm" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Pattern missed, edge case, or key insight" maxLength={1000} />
      </label>
      <label className="flex cursor-pointer items-center gap-3 text-sm text-[var(--text-muted)]">
        <input type="checkbox" checked={revisionNeeded || outcome === 'unable'} disabled={outcome === 'unable'} onChange={(event) => setRevisionNeeded(event.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
        Add to recall queue{!patternCorrect ? ' · required after a pattern miss' : ''}
      </label>
      <Button type="submit" className="w-full"><Check size={17} /> Save reflection</Button>
      </>}
    </form>
  )
}