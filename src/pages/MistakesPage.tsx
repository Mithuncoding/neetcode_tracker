import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, EmptyState, PageHeader } from '../components/ui'
import { useTracker } from '../context/useTracker'
import { ROADMAP_PROBLEMS } from '../data/problems'

const CATEGORY_LABELS: Record<string, string> = {
  'problem-understanding': 'Problem understanding',
  'pattern-recognition': 'Pattern recognition',
  'wrong-approach': 'Wrong approach',
  implementation: 'Python implementation',
  'edge-case': 'Edge cases',
  complexity: 'Complexity analysis',
  time: 'Time pressure',
}

export function MistakesPage() {
  const { state, setMistakeResolved } = useTracker()
  const navigate = useNavigate()
  const [view, setView] = useState<'open' | 'resolved' | 'all'>('open')
  const mistakes = [...state.mentor.mistakes]
    .filter((mistake) => view === 'all' || (view === 'resolved' ? mistake.resolvedAt : !mistake.resolvedAt))
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
  const open = state.mentor.mistakes.filter((mistake) => !mistake.resolvedAt)
  const counts = new Map<string, number>()
  open.forEach((mistake) => counts.set(mistake.category, (counts.get(mistake.category) ?? 0) + 1))
  const categories = [...counts.entries()].sort((left, right) => right[1] - left[1])

  return (
    <div className="page-content">
      <PageHeader title="Mistake memory" description="Turn repeated failure modes into explicit repair work." actions={<Button variant="secondary" onClick={() => navigate('/mentor')}><ArrowLeft size={15} /> Mentor</Button>} />
      <section className="mb-4 grid gap-3 sm:grid-cols-3"><div className="panel p-4"><p className="metric-number text-2xl font-extrabold">{open.length}</p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--text-faint)]">Open mistakes</p></div><div className="panel p-4"><p className="metric-number text-2xl font-extrabold">{state.mentor.mistakes.filter((item) => item.resolvedAt).length}</p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--text-faint)]">Resolved</p></div><div className="panel p-4"><p className="truncate text-sm font-extrabold">{categories[0] ? CATEGORY_LABELS[categories[0][0]] : 'No recurring issue'}</p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--text-faint)]">Top failure mode</p></div></section>
      <div className="mb-4 flex flex-wrap gap-2">{(['open', 'resolved', 'all'] as const).map((item) => <button key={item} type="button" onClick={() => setView(item)} className={`rounded-[6px] border px-3 py-2 text-xs font-bold capitalize ${view === item ? 'border-[var(--text)] bg-[var(--text)] text-[var(--surface)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'}`}>{item}</button>)}</div>
      {!mistakes.length ? <section className="panel"><EmptyState icon={ShieldAlert} title={view === 'open' ? 'No open mistakes' : 'No mistakes in this view'} description="Failed guided sessions and weak static-code evidence create repair items here." /></section> : <section className="panel overflow-hidden"><div className="divide-y divide-[var(--border)]">{mistakes.map((mistake) => {
        const problem = ROADMAP_PROBLEMS.find((item) => item.id === mistake.problemId)
        return <article key={mistake.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge tone={mistake.resolvedAt ? 'green' : 'amber'}>{mistake.resolvedAt ? 'Resolved' : 'Needs repair'}</Badge><Badge tone="neutral">{CATEGORY_LABELS[mistake.category] ?? mistake.category}</Badge></div><h2 className="mt-2 text-sm font-bold">{problem?.title ?? mistake.problemId}</h2><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{mistake.note || 'No reflection recorded.'}</p><p className="mt-2 font-mono text-[9px] text-[var(--text-faint)]">Recorded {new Date(mistake.createdAt).toLocaleDateString()}{mistake.resolvedAt ? ` · resolved ${new Date(mistake.resolvedAt).toLocaleDateString()}` : ''}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => setMistakeResolved(mistake.id, !mistake.resolvedAt)}>{mistake.resolvedAt ? <RotateCcw size={14} /> : <Check size={14} />}{mistake.resolvedAt ? 'Reopen' : 'Mark repaired'}</Button>{problem && <Button size="sm" onClick={() => navigate(`/mentor/problem/${problem.id}?mode=blind`)}>Practice repair <ArrowRight size={14} /></Button>}</div></div></article>
      })}</div></section>}
    </div>
  )
}