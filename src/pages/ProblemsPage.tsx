import { useDeferredValue, useState } from 'react'
import { Check, FilterX, RotateCcw, Search } from 'lucide-react'
import { format } from 'date-fns'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import type { WorkspaceOutletContext } from '../components/AppShell'
import { Button, DifficultyBadge, IconButton, PageHeader, StatusBadge } from '../components/ui'
import { useTracker } from '../context/useTracker'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { getProblemProgress } from '../lib/analytics'
import { formatDuration } from '../lib/utils'

const TOPICS = [...new Set(ROADMAP_PROBLEMS.map((problem) => problem.topic))]
const PATTERNS = [...new Set(ROADMAP_PROBLEMS.flatMap((problem) => problem.patterns))].sort()

export function ProblemsPage() {
  const { state, quickSolve } = useTracker()
  const { openProblem } = useOutletContext<WorkspaceOutletContext>()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [currentTime] = useState(() => Date.now())
  const deferredSearch = useDeferredValue(search.trim().toLowerCase())
  const topic = params.get('topic') ?? 'all'
  const pattern = params.get('pattern') ?? 'all'
  const difficulty = params.get('difficulty') ?? 'all'
  const status = params.get('status') ?? 'all'
  const confidence = params.get('confidence') ?? 'all'
  const revision = params.get('revision') ?? 'all'
  const sort = params.get('sort') ?? 'order'

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value === 'all' || (key === 'sort' && value === 'order')) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const filtered = ROADMAP_PROBLEMS.filter((problem) => {
    const progress = getProblemProgress(state, problem.id)
    const matchesSearch = !deferredSearch || `${problem.title} ${problem.leetcodeNumber} ${problem.topic} ${problem.patterns.join(' ')} ${progress.notes}`.toLowerCase().includes(deferredSearch)
    const matchesRevision = revision === 'all' ||
      (revision === 'due' && progress.nextRevisionAt && Date.parse(progress.nextRevisionAt) <= currentTime) ||
      (revision === 'scheduled' && progress.nextRevisionAt) ||
      (revision === 'none' && !progress.nextRevisionAt)
    return matchesSearch &&
      (topic === 'all' || problem.topic === topic) &&
      (pattern === 'all' || problem.patterns.includes(pattern)) &&
      (difficulty === 'all' || problem.difficulty === difficulty) &&
      (status === 'all' || progress.status === status) &&
      (confidence === 'all' || String(progress.confidence ?? 'none') === confidence) &&
      matchesRevision
  }).sort((left, right) => {
    const a = getProblemProgress(state, left.id)
    const b = getProblemProgress(state, right.id)
    if (sort === 'recent') return (b.solvedAt ? Date.parse(b.solvedAt) : 0) - (a.solvedAt ? Date.parse(a.solvedAt) : 0)
    if (sort === 'difficulty') return ['Easy', 'Medium', 'Hard'].indexOf(left.difficulty) - ['Easy', 'Medium', 'Hard'].indexOf(right.difficulty)
    if (sort === 'attempts') return b.attempts - a.attempts
    if (sort === 'confidence') return (a.confidence ?? 6) - (b.confidence ?? 6)
    if (sort === 'revision') return (a.nextRevisionAt ? Date.parse(a.nextRevisionAt) : Number.MAX_SAFE_INTEGER) - (b.nextRevisionAt ? Date.parse(b.nextRevisionAt) : Number.MAX_SAFE_INTEGER)
    return left.recommendedOrder - right.recommendedOrder
  })

  const clearFilters = () => {
    setSearch('')
    setParams({}, { replace: true })
  }

  return (
    <div className="page-content">
      <PageHeader title="Problems" description={`${filtered.length} of 250 problems`} actions={<Button variant="secondary" size="sm" onClick={clearFilters}><FilterX size={14} /> Clear</Button>} />
      <section className="panel mb-4 p-3">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.4fr)_repeat(6,minmax(120px,1fr))]">
          <label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" size={15} /><input className="input pl-9 pr-3 text-xs" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search problems or notes" /></label>
          <select aria-label="Topic" className="input px-2 text-xs" value={topic} onChange={(event) => setFilter('topic', event.target.value)}><option value="all">All topics</option>{TOPICS.map((value) => <option key={value}>{value}</option>)}</select>
          <select aria-label="Pattern" className="input px-2 text-xs" value={pattern} onChange={(event) => setFilter('pattern', event.target.value)}><option value="all">All patterns</option>{PATTERNS.map((value) => <option key={value}>{value}</option>)}</select>
          <select aria-label="Difficulty" className="input px-2 text-xs" value={difficulty} onChange={(event) => setFilter('difficulty', event.target.value)}><option value="all">All difficulties</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
          <select aria-label="Status" className="input px-2 text-xs" value={status} onChange={(event) => setFilter('status', event.target.value)}><option value="all">All statuses</option><option value="not-started">Not started</option><option value="attempting">Attempting</option><option value="solved">Solved</option><option value="solved-with-hint">Solved with hint</option><option value="solved-after-solution">Watched solution</option><option value="needs-revision">Needs revision</option><option value="mastered">Mastered</option></select>
          <select aria-label="Confidence" className="input px-2 text-xs" value={confidence} onChange={(event) => setFilter('confidence', event.target.value)}><option value="all">All confidence</option><option value="none">Not rated</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select>
          <select aria-label="Revision" className="input px-2 text-xs" value={revision} onChange={(event) => setFilter('revision', event.target.value)}><option value="all">All revisions</option><option value="due">Due now</option><option value="scheduled">Scheduled</option><option value="none">Not scheduled</option></select>
        </div>
        <div className="mt-2 flex items-center justify-end gap-2"><label className="text-[10px] font-bold uppercase text-[var(--text-faint)]" htmlFor="problem-sort">Sort by</label><select id="problem-sort" className="input !w-auto px-2 text-xs" value={sort} onChange={(event) => setFilter('sort', event.target.value)}><option value="order">NeetCode order</option><option value="recent">Recently solved</option><option value="difficulty">Difficulty</option><option value="attempts">Most attempts</option><option value="confidence">Lowest confidence</option><option value="revision">Revision due</option></select></div>
      </section>

      <section className="panel overflow-hidden">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-[var(--surface-raised)] text-[10px] font-bold uppercase text-[var(--text-faint)]"><tr><th className="w-12 px-4 py-3">Done</th><th className="px-3 py-3">Problem</th><th className="px-3 py-3">Difficulty</th><th className="px-3 py-3">Topic</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Time</th><th className="px-3 py-3">Attempts</th><th className="px-3 py-3">Confidence</th><th className="px-3 py-3">Revision</th></tr></thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((problem) => {
                const progress = getProblemProgress(state, problem.id)
                const due = progress.nextRevisionAt && Date.parse(progress.nextRevisionAt) <= currentTime
                return (
                  <tr key={problem.id} onClick={() => openProblem(problem.id)} className="cursor-pointer text-xs hover:bg-[var(--surface-raised)]">
                    <td className="px-4 py-3"><IconButton icon={Check} label={`Mark ${problem.title} solved`} disabled={Boolean(progress.solvedAt)} onClick={(event) => { event.stopPropagation(); quickSolve(problem.id) }} className={`h-7 w-7 ${progress.solvedAt ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : ''}`} /></td>
                    <td className="max-w-[330px] px-3 py-3"><p className="truncate font-semibold"><span className="mr-2 font-mono text-[10px] text-[var(--text-faint)]">#{problem.leetcodeNumber}</span>{problem.title}</p><p className="mt-1 truncate text-[10px] text-[var(--text-faint)]">{progress.notes || problem.patterns.join(' · ')}</p></td>
                    <td className="px-3 py-3"><DifficultyBadge difficulty={problem.difficulty} /></td><td className="max-w-[180px] px-3 py-3 text-[var(--text-muted)]"><span className="block truncate">{problem.topic}</span></td><td className="px-3 py-3"><StatusBadge status={progress.status} /></td><td className="metric-number px-3 py-3 text-[var(--text-muted)]">{formatDuration(progress.totalTimeSeconds, true)}</td><td className="metric-number px-3 py-3 text-[var(--text-muted)]">{progress.attempts || '-'}</td><td className="metric-number px-3 py-3 text-[var(--text-muted)]">{progress.confidence ? `${progress.confidence}/5` : '-'}</td><td className={`px-3 py-3 ${due ? 'font-bold text-[var(--red)]' : 'text-[var(--text-muted)]'}`}>{progress.nextRevisionAt ? <span className="flex items-center gap-1"><RotateCcw size={12} />{format(new Date(progress.nextRevisionAt), 'MMM d')}</span> : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-[var(--border)] md:hidden">
          {filtered.map((problem) => {
            const progress = getProblemProgress(state, problem.id)
            return <button key={problem.id} type="button" onClick={() => openProblem(problem.id)} className="w-full p-4 text-left hover:bg-[var(--surface-raised)]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-mono text-[var(--text-faint)]">#{problem.leetcodeNumber}</p><p className="mt-1 text-sm font-semibold">{problem.title}</p><p className="mt-1 truncate text-[10px] text-[var(--text-faint)]">{problem.patterns.join(' · ')}</p></div><DifficultyBadge difficulty={problem.difficulty} /></div><div className="mt-3 flex items-center justify-between"><StatusBadge status={progress.status} /><span className="metric-number text-[10px] text-[var(--text-faint)]">{progress.confidence ? `${progress.confidence}/5 confidence` : `${progress.attempts} attempts`}</span></div></button>
          })}
        </div>
        {!filtered.length && <div className="py-16 text-center"><p className="text-sm font-bold">No matching problems</p><button type="button" onClick={clearFilters} className="mt-2 text-xs font-bold text-[var(--accent)]">Reset filters</button></div>}
      </section>
    </div>
  )
}