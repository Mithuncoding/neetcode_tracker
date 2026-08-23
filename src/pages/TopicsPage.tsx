import { ArrowRight, Brain, Crosshair, Medal, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, PageHeader, ProgressBar } from '../components/ui'
import { useTracker } from '../context/useTracker'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { getTopicStats } from '../lib/analytics'
import { formatDuration } from '../lib/utils'

function Highlight({ icon: Icon, label, value }: { icon: typeof Brain; label: string; value: string }) {
  return <div className="panel flex min-h-24 items-center gap-3 p-4"><div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[var(--surface-muted)] text-[var(--text-muted)]"><Icon size={17} /></div><div className="min-w-0"><p className="truncate text-sm font-bold">{value}</p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--text-faint)]">{label}</p></div></div>
}

export function TopicsPage() {
  const { state } = useTracker()
  const navigate = useNavigate()
  const topics = getTopicStats(state, ROADMAP_PROBLEMS)
  const practiced = topics.filter((topic) => topic.practiced > 0 || topic.completed > 0)
  const score = (topic: (typeof topics)[number]) => topic.percentage * 0.55 + (topic.averageConfidence / 5) * 45
  const strongest = [...practiced].sort((a, b) => score(b) - score(a))[0]
  const weakest = [...practiced].sort((a, b) => score(a) - score(b))[0]
  const mostPracticed = [...topics].sort((a, b) => b.practiced - a.practiced)[0]

  return (
    <div className="page-content">
      <PageHeader title="Topics" description="Progress and confidence across all 18 roadmap patterns" />
      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Highlight icon={Medal} label="Strongest" value={strongest?.topic ?? 'Not enough data'} />
        <Highlight icon={Crosshair} label="Weakest" value={weakest?.topic ?? 'Not enough data'} />
        <Highlight icon={Brain} label="Most practiced" value={mostPracticed?.practiced ? mostPracticed.topic : 'Not enough data'} />
        <Highlight icon={Target} label="Current topic" value={state.settings.activeTopic} />
      </section>
      <section className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {topics.map((topic) => (
          <button key={topic.topic} type="button" onClick={() => navigate(`/problems?topic=${encodeURIComponent(topic.topic)}`)} className="panel group p-5 text-left transition-colors hover:border-[var(--accent)]">
            <div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-bold">{topic.topic}</h2>{topic.topic === state.settings.activeTopic && <Badge tone="green">Active</Badge>}</div><p className="mt-1 text-xs text-[var(--text-muted)]">{topic.completed} of {topic.total} completed</p></div><ArrowRight size={16} className="text-[var(--text-faint)] transition-transform group-hover:translate-x-0.5" /></div>
            <div className="mt-5 flex items-end justify-between"><span className="metric-number text-3xl font-extrabold">{topic.percentage}%</span><span className="text-[10px] font-semibold text-[var(--text-faint)]">E {topic.easy.completed}/{topic.easy.total} · M {topic.medium.completed}/{topic.medium.total} · H {topic.hard.completed}/{topic.hard.total}</span></div><ProgressBar value={topic.percentage} className="mt-3" />
            <div className="mt-4 grid grid-cols-3 border-t border-[var(--border)] pt-4 text-xs"><div><p className="text-[10px] text-[var(--text-faint)]">Confidence</p><p className="metric-number mt-1 font-bold">{topic.averageConfidence || '-'}/5</p></div><div><p className="text-[10px] text-[var(--text-faint)]">Avg time</p><p className="metric-number mt-1 font-bold">{formatDuration(topic.averageSeconds, true)}</p></div><div><p className="text-[10px] text-[var(--text-faint)]">Attempts</p><p className="metric-number mt-1 font-bold">{topic.practiced}</p></div></div>
          </button>
        ))}
      </section>
    </div>
  )
}