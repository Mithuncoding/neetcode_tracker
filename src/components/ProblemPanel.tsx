import { useEffect, useState } from 'react'
import { Check, ExternalLink, Pause, Play, RotateCcw, Square, X } from 'lucide-react'
import { useTracker } from '../context/useTracker'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { getProblemProgress } from '../lib/analytics'
import { formatTimer, getTimerSeconds } from '../lib/utils'
import { STATUS_LABELS } from '../lib/status'
import { useDialogFocus } from '../hooks/useDialogFocus'
import { PROBLEM_STATUSES, type ProblemStatus } from '../types'
import { SolveForm } from './SolveForm'
import { Button, DifficultyBadge, IconButton, StatusBadge } from './ui'

export function ProblemPanel({ problemId, onClose }: { problemId: string | null; onClose: () => void }) {
  const { state, quickSolve, setProblemStatus, setNotes, setRevisionDate, startTimer, pauseTimer, resumeTimer, cancelTimer, markRevision } = useTracker()
  const problem = ROADMAP_PROBLEMS.find((item) => item.id === problemId)
  const progress = problem ? getProblemProgress(state, problem.id) : null
  const [logging, setLogging] = useState(false)
  const [notes, setLocalNotes] = useState(progress?.notes ?? '')
  const [now, setNow] = useState(() => Date.now())
  const timer = problem && state.activeTimer?.problemId === problem.id ? state.activeTimer : null
  const dialogRef = useDialogFocus(Boolean(problem), onClose)

  useEffect(() => {
    if (!timer?.running) return
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [timer?.running])

  if (!problem || !progress) return null
  const timerSeconds = timer ? getTimerSeconds(timer, now) : 0
  const dueDate = progress.nextRevisionAt?.slice(0, 10) ?? ''

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`${problem.title} details`} className="drawer absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-[var(--text-faint)]">#{problem.leetcodeNumber}</span><DifficultyBadge difficulty={problem.difficulty} /><StatusBadge status={progress.status} /></div>
            <h2 className="text-xl font-bold leading-7 text-[var(--text)]">{problem.title}</h2>
            <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">{problem.topic}</p>
            <div className="mt-2 flex flex-wrap gap-1">{problem.patterns.map((pattern) => <span key={pattern} className="rounded-[4px] bg-[var(--violet-soft)] px-2 py-1 text-[9px] font-bold text-[var(--violet)]">{pattern}</span>)}</div>
          </div>
          <IconButton icon={X} label="Close problem details" onClick={onClose} />
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {logging ? (
            <div><button type="button" onClick={() => setLogging(false)} className="mb-5 text-xs font-bold text-[var(--accent)] hover:underline">Back to problem</button><SolveForm problem={problem} onSaved={onClose} /></div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-2">
                <a href={problem.leetcodeUrl} target="_blank" rel="noreferrer" className="flex h-10 items-center justify-center gap-2 rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface)] text-xs font-bold text-[var(--text)] hover:border-[var(--accent)]">LeetCode <ExternalLink size={14} /></a>
                <a href={problem.neetcodeUrl} target="_blank" rel="noreferrer" className="flex h-10 items-center justify-center gap-2 rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface)] text-xs font-bold text-[var(--text)] hover:border-[var(--accent)]">NeetCode <ExternalLink size={14} /></a>
              </div>
              <section className="panel-muted p-4">
                <div className="flex items-center justify-between gap-4">
                  <div><p className="text-[11px] font-bold uppercase text-[var(--text-faint)]">Solve timer</p><p className="metric-number mt-1 font-mono text-3xl font-semibold text-[var(--text)]">{formatTimer(timerSeconds)}</p></div>
                  <div className="flex items-center gap-2">
                    {!timer && <Button onClick={() => startTimer(problem.id)}><Play size={16} /> Start solving</Button>}
                    {timer?.running && <IconButton icon={Pause} label="Pause timer" onClick={pauseTimer} />}
                    {timer && !timer.running && <IconButton icon={Play} label="Resume timer" onClick={resumeTimer} />}
                    {timer && <IconButton icon={Square} label="Stop and clear timer" onClick={cancelTimer} />}
                  </div>
                </div>
                {timer && <Button className="mt-4 w-full" onClick={() => setLogging(true)}><Check size={16} /> Finish and log</Button>}
              </section>
              {!timer && !progress.solvedAt && <Button className="w-full" variant="secondary" onClick={() => { quickSolve(problem.id); onClose() }}><Check size={16} /> Mark solved in one click</Button>}
              <section>
                <label className="mb-2 block text-xs font-bold uppercase text-[var(--text-faint)]" htmlFor="problem-status">Status</label>
                <select id="problem-status" className="input px-3 text-sm" value={progress.status} onChange={(event) => setProblemStatus(problem.id, event.target.value as ProblemStatus)}>{PROBLEM_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select>
              </section>
              <section>
                <div className="mb-2 flex items-center justify-between"><label className="text-xs font-bold uppercase text-[var(--text-faint)]" htmlFor="problem-notes">Personal notes</label><span className="text-[10px] text-[var(--text-faint)]">{notes.length}/1000</span></div>
                <textarea id="problem-notes" className="input min-h-28 resize-y px-3 py-2 text-sm" value={notes} maxLength={1000} onChange={(event) => setLocalNotes(event.target.value)} onBlur={() => setNotes(problem.id, notes)} placeholder="Capture the pattern, mistake, or edge case." />
              </section>
              <section className="border-t border-[var(--border)] pt-5">
                <div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-bold">Revision</h3><p className="mt-0.5 text-xs text-[var(--text-muted)]">Stage {progress.revisionStage} · {progress.revisionIntervalDays}d interval · Ease {progress.revisionEase.toFixed(2)}</p></div><RotateCcw size={17} className="text-[var(--text-faint)]" /></div>
                <label className="block text-xs text-[var(--text-muted)]">Next revision<input type="date" className="input mt-1 px-3 text-sm" value={dueDate} onChange={(event) => setRevisionDate(problem.id, event.target.value ? new Date(`${event.target.value}T00:00:00`).toISOString() : null)} /></label>
                {progress.solvedAt && <div className="mt-3 grid grid-cols-2 gap-2"><Button variant="secondary" onClick={() => markRevision({ problemId: problem.id, result: 'weak', confidence: Math.min(3, progress.confidence ?? 2) as 1 | 2 | 3 })}>Still weak</Button><Button onClick={() => markRevision({ problemId: problem.id, result: 'recalled', confidence: Math.max(3, progress.confidence ?? 3) as 3 | 4 | 5 })}>Mark recalled</Button></div>}
              </section>
              <dl className="grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-5 text-center">
                <div><dt className="text-[10px] font-bold uppercase text-[var(--text-faint)]">Attempts</dt><dd className="metric-number mt-1 text-sm font-bold">{progress.attempts}</dd></div>
                <div><dt className="text-[10px] font-bold uppercase text-[var(--text-faint)]">Confidence</dt><dd className="metric-number mt-1 text-sm font-bold">{progress.confidence ? `${progress.confidence}/5` : '-'}</dd></div>
                <div><dt className="text-[10px] font-bold uppercase text-[var(--text-faint)]">Order</dt><dd className="metric-number mt-1 text-sm font-bold">{problem.recommendedOrder}/250</dd></div>
              </dl>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}