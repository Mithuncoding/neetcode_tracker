import { useState } from 'react'
import { subDays } from 'date-fns'
import {
  BarChart3,
  Clock3,
  Gauge,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState, PageHeader } from '../components/ui'
import { useTracker } from '../context/useTracker'
import { ROADMAP_PROBLEMS } from '../data/problems'
import {
  getHelpBreakdown,
  getProblemProgress,
  getProgressSeries,
  getStats,
  getTopicStats,
} from '../lib/analytics'
import { formatDuration, percent } from '../lib/utils'
import type { SolveAttempt } from '../types'

const CHART_COLORS = ['var(--accent)', 'var(--amber)', 'var(--blue)', 'var(--red)']
const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text)',
  fontSize: 11,
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Clock3; label: string; value: string; detail?: string }) {
  return <div className="panel p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase text-[var(--text-faint)]"><Icon size={14} />{label}</div><p className="metric-number mt-3 text-2xl font-extrabold">{value}</p>{detail && <p className="mt-1 text-[10px] text-[var(--text-faint)]">{detail}</p>}</div>
}

function metricsFor(attempts: SolveAttempt[]) {
  const solved = attempts.filter((attempt) => ['independent', 'hint', 'solution'].includes(attempt.outcome))
  return {
    confidence: solved.length ? solved.reduce((total, attempt) => total + attempt.confidence, 0) / solved.length : 0,
    time: solved.length ? solved.reduce((total, attempt) => total + attempt.durationSeconds, 0) / solved.length : 0,
    independent: percent(solved.filter((attempt) => attempt.outcome === 'independent').length, solved.length),
  }
}

function Trend({ label, current, previous, lowerIsBetter = false, suffix = '' }: { label: string; current: number; previous: number; lowerIsBetter?: boolean; suffix?: string }) {
  const delta = previous ? ((current - previous) / previous) * 100 : 0
  const positive = lowerIsBetter ? delta < 0 : delta > 0
  const negative = lowerIsBetter ? delta > 0 : delta < 0
  const Icon = positive ? TrendingUp : negative ? TrendingDown : Minus
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] py-3 last:border-0">
      <div><p className="text-xs font-semibold">{label}</p><p className="metric-number mt-1 text-[10px] text-[var(--text-faint)]">Previous {previous ? `${Math.round(previous * 10) / 10}${suffix}` : '-'}</p></div>
      <div className="text-right"><p className="metric-number text-sm font-bold">{Math.round(current * 10) / 10}{suffix}</p><span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-bold ${positive ? 'text-[var(--accent)]' : negative ? 'text-[var(--red)]' : 'text-[var(--text-faint)]'}`}><Icon size={12} />{previous ? `${Math.abs(Math.round(delta))}%` : 'No baseline'}</span></div>
    </div>
  )
}

export function AnalyticsPage() {
  const { state } = useTracker()
  const [now] = useState(() => Date.now())
  const stats = getStats(state, ROADMAP_PROBLEMS)
  const progress = getProgressSeries(state)
  const topics = getTopicStats(state, ROADMAP_PROBLEMS)
  const help = getHelpBreakdown(state)
  const recentBoundary = subDays(new Date(), 30).getTime()
  const olderBoundary = subDays(new Date(), 60).getTime()
  const recent = metricsFor(state.attempts.filter((attempt) => Date.parse(attempt.completedAt) >= recentBoundary && Date.parse(attempt.completedAt) <= now))
  const previous = metricsFor(state.attempts.filter((attempt) => Date.parse(attempt.completedAt) >= olderBoundary && Date.parse(attempt.completedAt) < recentBoundary))
  const difficultyData = (['Easy', 'Medium', 'Hard'] as const).map((difficulty) => {
    const matching = ROADMAP_PROBLEMS.filter((problem) => problem.difficulty === difficulty)
    return { difficulty, solved: matching.filter((problem) => getProblemProgress(state, problem.id).solvedAt).length, total: matching.length }
  })

  return (
    <div className="page-content">
      <PageHeader title="Analytics" description="Performance derived from your attempts and revisions" />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={Clock3} label="Average solve" value={formatDuration(stats.averageSeconds)} />
        <Metric icon={Gauge} label="Median solve" value={formatDuration(stats.medianSeconds)} />
        <Metric icon={TrendingUp} label="Fastest solve" value={formatDuration(stats.fastestSeconds)} />
        <Metric icon={Target} label="Slowest solve" value={formatDuration(stats.slowestSeconds)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_.8fr]">
        <article className="panel p-5"><header className="mb-5"><h2 className="text-sm font-bold">Progress over time</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Daily and cumulative completions</p></header>{progress.length ? <div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={progress} margin={{ left: -20, right: 8 }}><defs><linearGradient id="progress-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="date" tick={{ fill: 'var(--text-faint)', fontSize: 10 }} minTickGap={28} axisLine={false} tickLine={false} /><YAxis tick={{ fill: 'var(--text-faint)', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="var(--accent)" fill="url(#progress-fill)" strokeWidth={2} /><Area type="monotone" dataKey="solved" name="Solved" stroke="var(--blue)" fill="transparent" strokeWidth={1.5} /></AreaChart></ResponsiveContainer></div> : <EmptyState icon={BarChart3} title="No progress data yet" description="Your first completed problem will start this chart." />}</article>
        <article className="panel p-5"><header className="mb-4"><h2 className="text-sm font-bold">Last 30 days</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Compared with the previous 30 days</p></header>{recent.confidence || previous.confidence ? <div><Trend label="Average confidence" current={recent.confidence} previous={previous.confidence} suffix="/5" /><Trend label="Average solve time" current={recent.time / 60} previous={previous.time / 60} lowerIsBetter suffix="m" /><Trend label="Independent solve rate" current={recent.independent} previous={previous.independent} suffix="%" /></div> : <EmptyState icon={TrendingUp} title="No comparison yet" description="Two study periods are needed to calculate improvement." />}</article>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <article className="panel p-5"><header className="mb-5"><h2 className="text-sm font-bold">Topic performance</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Completion percentage and average confidence</p></header><div className="h-[420px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={topics} layout="vertical" margin={{ left: 48, right: 12 }}><CartesianGrid stroke="var(--border)" horizontal={false} /><XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-faint)', fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="topic" width={130} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="percentage" name="Completion %" fill="var(--accent)" radius={[0, 3, 3, 0]} /><Bar dataKey={(item) => item.averageConfidence * 20} name="Confidence %" fill="var(--blue)" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer></div></article>
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="panel p-5"><header className="mb-5"><h2 className="text-sm font-bold">Difficulty</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Solved by level</p></header><div className="space-y-5">{difficultyData.map((item, index) => <div key={item.difficulty}><div className="mb-2 flex items-center justify-between text-xs"><span className="font-bold">{item.difficulty}</span><span className="metric-number text-[var(--text-faint)]">{item.solved}/{item.total}</span></div><div className="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]"><div className="h-full rounded-full" style={{ width: `${percent(item.solved, item.total)}%`, background: CHART_COLORS[index] }} /></div></div>)}</div></article>
          <article className="panel p-5"><header><h2 className="text-sm font-bold">Help dependency</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Attempt outcomes</p></header>{state.attempts.length ? <><div className="mx-auto h-48 max-w-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={help} dataKey="count" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>{help.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer></div><div className="space-y-2">{help.map((item, index) => <div key={item.name} className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-2 text-[var(--text-muted)]"><i className="h-2 w-2 rounded-sm" style={{ background: CHART_COLORS[index] }} />{item.name}</span><strong className="metric-number">{item.value}%</strong></div>)}</div></> : <EmptyState icon={Target} title="No attempt data" description="Log an outcome to see your help distribution." />}</article>
          <article className="panel p-5 sm:col-span-2"><header className="mb-5"><h2 className="text-sm font-bold">Topic confidence</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Weakest rated topics appear first</p></header><div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{[...topics].sort((a, b) => (a.averageConfidence || 6) - (b.averageConfidence || 6)).slice(0, 8).map((topic) => <div key={topic.topic} className="flex items-center gap-3"><span className="w-32 truncate text-[10px] font-semibold text-[var(--text-muted)]">{topic.topic}</span><div className="h-1.5 flex-1 rounded-full bg-[var(--surface-muted)]"><div className="h-full rounded-full bg-[var(--violet)]" style={{ width: `${(topic.averageConfidence / 5) * 100}%` }} /></div><span className="metric-number w-7 text-right text-[10px] font-bold">{topic.averageConfidence || '-'}</span></div>)}</div></article>
        </div>
      </section>
    </div>
  )
}