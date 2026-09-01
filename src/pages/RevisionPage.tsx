import { AlertTriangle, CalendarClock, Clock3, EyeOff, Focus, RotateCcw } from 'lucide-react'
import { format, isToday } from 'date-fns'
import { useNavigate, useOutletContext } from 'react-router-dom'
import type { WorkspaceOutletContext } from '../components/AppShell'
import { Badge, Button, DifficultyBadge, EmptyState, PageHeader } from '../components/ui'
import { useTracker } from '../context/useTracker'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { getRevisionBuckets } from '../lib/analytics'
import { revisionModeLabel } from '../lib/spaced-repetition'

type RevisionItem = ReturnType<typeof getRevisionBuckets>['today'][number]

const RECALL_RATINGS = [
  { label: 'Forgot', result: 'weak' as const, confidence: 1 as const, className: 'text-[var(--red)] hover:bg-[var(--red-soft)]' },
  { label: 'Struggled', result: 'weak' as const, confidence: 2 as const, className: 'text-[var(--amber)] hover:bg-[var(--amber-soft)]' },
  { label: 'Partial', result: 'recalled' as const, confidence: 3 as const, className: 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)]' },
  { label: 'Strong', result: 'recalled' as const, confidence: 4 as const, className: 'text-[var(--accent-strong)] hover:bg-[var(--accent-soft)]' },
  { label: 'Mastered', result: 'recalled' as const, confidence: 5 as const, className: 'text-[var(--blue)] hover:bg-[var(--blue-soft)]' },
]

function RevisionGroup({ title, tone, items, openProblem }: { title: string; tone: 'red' | 'amber' | 'blue' | 'neutral'; items: RevisionItem[]; openProblem: (id: string, start?: boolean) => void }) {
  const { markRevision } = useTracker()
  const navigate = useNavigate()
  if (!items.length) return null
  return (
    <section className="panel overflow-hidden">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5"><div className="flex items-center gap-2"><h2 className="text-sm font-bold">{title}</h2><Badge tone={tone}>{items.length}</Badge></div></header>
      <div className="divide-y divide-[var(--border)]">
        {items.map(({ problem, progress }) => (
          <div key={problem.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
            <button type="button" onClick={() => openProblem(problem.id)} className="min-w-0 flex-1 text-left"><div className="flex items-center gap-2"><span className="font-mono text-[10px] text-[var(--text-faint)]">#{problem.leetcodeNumber}</span><DifficultyBadge difficulty={problem.difficulty} />{progress.revisionLapses > 0 && <Badge tone="red">{progress.revisionLapses} lapse{progress.revisionLapses === 1 ? '' : 's'}</Badge>}</div><p className="mt-1.5 truncate text-sm font-semibold">{problem.title}</p><p className="mt-1 text-[10px] text-[var(--text-faint)]">{problem.patterns[0]} · Stage {progress.revisionStage} · {progress.revisionIntervalDays}d interval · Ease {progress.revisionEase.toFixed(2)} · Due {isToday(new Date(progress.nextRevisionAt)) ? 'today' : format(new Date(progress.nextRevisionAt), 'MMM d')}</p></button>
            <div className="flex flex-col items-stretch gap-2 lg:items-end"><Button size="sm" onClick={() => navigate(`/mentor/problem/${problem.id}?mode=blind`)}><EyeOff size={14} /> Blind re-solve</Button><div className="flex flex-wrap justify-end gap-1" aria-label={`Recall rating for ${problem.title}`}>{RECALL_RATINGS.map((rating) => <button key={rating.label} type="button" onClick={() => markRevision({ problemId: problem.id, result: rating.result, confidence: rating.confidence })} className={`rounded-[4px] px-2 py-1 text-[9px] font-bold ${rating.className}`}>{rating.label}</button>)}</div></div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function RevisionPage() {
  const { state } = useTracker()
  const { openProblem } = useOutletContext<WorkspaceOutletContext>()
  const navigate = useNavigate()
  const buckets = getRevisionBuckets(state, ROADMAP_PROBLEMS)
  const totalDue = buckets.overdue.length + buckets.today.length
  const total = totalDue + buckets.thisWeek.length + buckets.upcoming.length

  return (
    <div className="page-content">
      <PageHeader title="Revision" description={`${totalDue} due now · ${total} scheduled · ${revisionModeLabel(state.settings.revisionMode)}`} actions={<Button onClick={() => navigate('/focus?mode=revision')} disabled={!totalDue}><Focus size={15} /> Start revision session</Button>} />
      <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[{ label: 'Overdue', value: buckets.overdue.length, icon: AlertTriangle, color: 'text-[var(--red)]' }, { label: 'Due today', value: buckets.today.length, icon: Clock3, color: 'text-[var(--amber)]' }, { label: 'This week', value: buckets.thisWeek.length, icon: CalendarClock, color: 'text-[var(--blue)]' }, { label: 'Upcoming', value: buckets.upcoming.length, icon: RotateCcw, color: 'text-[var(--accent)]' }].map(({ label, value, icon: Icon, color }) => <div key={label} className="panel flex items-center gap-3 p-4"><Icon size={18} className={color} /><div><p className="metric-number text-xl font-extrabold">{value}</p><p className="text-[10px] font-bold uppercase text-[var(--text-faint)]">{label}</p></div></div>)}
      </section>
      {!total ? <section className="panel"><EmptyState icon={RotateCcw} title="No revisions scheduled yet" description="Complete a problem and its first review will be scheduled automatically." /></section> : <div className="space-y-4"><RevisionGroup title="Overdue" tone="red" items={buckets.overdue} openProblem={openProblem} /><RevisionGroup title="Due today" tone="amber" items={buckets.today} openProblem={openProblem} /><RevisionGroup title="Due this week" tone="blue" items={buckets.thisWeek} openProblem={openProblem} /><RevisionGroup title="Upcoming" tone="neutral" items={buckets.upcoming} openProblem={openProblem} /></div>}
      <footer className="mt-4 space-y-2 text-[10px] text-[var(--text-faint)]"><div className="flex flex-wrap items-center gap-2"><span className="font-bold uppercase">Recall scale</span>{RECALL_RATINGS.map((rating) => <span key={rating.label} className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] px-2 py-1">{rating.label}</span>)}</div><div className="flex flex-wrap items-center gap-2"><span className="font-bold uppercase">{state.settings.revisionMode === 'adaptive' ? 'Baseline ladder' : 'Intervals'}</span>{state.settings.revisionIntervals.map((days, index) => <span key={`${days}-${index}`} className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] px-2 py-1">R{index + 1}: {days}d</span>)}</div></footer>
    </div>
  )
}