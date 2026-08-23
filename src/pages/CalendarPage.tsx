import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarDays, CheckCircle2, Clock3, Flame } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import type { WorkspaceOutletContext } from '../components/AppShell'
import { ContributionGrid } from '../components/ContributionGrid'
import { DifficultyBadge, EmptyState, PageHeader } from '../components/ui'
import { useTracker } from '../context/useTracker'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { getDailyActivity, getStreaks } from '../lib/analytics'
import { dateKey, formatDuration } from '../lib/utils'

export function CalendarPage() {
  const { state } = useTracker()
  const { openProblem } = useOutletContext<WorkspaceOutletContext>()
  const activity = getDailyActivity(state)
  const streaks = getStreaks(state)
  const [selectedDate, setSelectedDate] = useState(dateKey())
  const selected = activity.find((day) => day.date === selectedDate)
  const attempts = state.attempts.filter((attempt) => dateKey(attempt.completedAt) === selectedDate)
  const revisions = state.revisions.filter((revision) => dateKey(revision.completedAt) === selectedDate)
  const totalSeconds = activity.reduce((total, day) => total + day.studySeconds, 0)

  return (
    <div className="page-content">
      <PageHeader title="Calendar" description="Daily practice and study time" />
      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[{ label: 'Active days', value: activity.length, icon: CalendarDays }, { label: 'Current streak', value: streaks.current, icon: Flame }, { label: 'Longest streak', value: streaks.longest, icon: CheckCircle2 }, { label: 'Total study', value: formatDuration(totalSeconds), icon: Clock3 }].map(({ label, value, icon: Icon }) => <div key={label} className="panel flex items-center gap-3 p-4"><div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[var(--surface-muted)] text-[var(--text-muted)]"><Icon size={17} /></div><div><p className="metric-number text-xl font-extrabold">{value}</p><p className="text-[10px] font-bold uppercase text-[var(--text-faint)]">{label}</p></div></div>)}
      </section>
      <section className="panel mb-4 p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-sm font-bold">Past year</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Select a day for its activity</p></div><span className="text-[10px] text-[var(--text-faint)]">Less&nbsp; ■ ■ ■ ■ &nbsp;More</span></div><ContributionGrid activity={activity} days={365} selectedDate={selectedDate} onSelect={setSelectedDate} /></section>
      <section className="panel overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4"><div><h2 className="text-sm font-bold">{format(parseISO(selectedDate), 'EEEE, MMMM d')}</h2><p className="mt-1 text-xs text-[var(--text-muted)]">{selected?.solvedProblemIds.length ?? 0} solved · {formatDuration(selected?.studySeconds ?? 0)}</p></div></header>
        {!attempts.length && !revisions.length ? <EmptyState icon={CalendarDays} title="No activity this day" description="Attempts and revisions will appear here." /> : <div className="divide-y divide-[var(--border)]">{attempts.map((attempt) => {
          const problem = ROADMAP_PROBLEMS.find((item) => item.id === attempt.problemId)
          if (!problem) return null
          return <button key={attempt.id} type="button" onClick={() => openProblem(problem.id)} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[var(--surface-raised)]"><CheckCircle2 size={17} className={attempt.outcome === 'unable' ? 'text-[var(--red)]' : 'text-[var(--accent)]'} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{problem.title}</p><p className="mt-1 text-[10px] text-[var(--text-faint)]">{attempt.outcome.replace('-', ' ')} · {attempt.confidence}/5 confidence · {formatDuration(attempt.durationSeconds)}</p></div><DifficultyBadge difficulty={problem.difficulty} /></button>
        })}{revisions.map((revision) => {
          const problem = ROADMAP_PROBLEMS.find((item) => item.id === revision.problemId)
          if (!problem) return null
          return <button key={revision.id} type="button" onClick={() => openProblem(problem.id)} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[var(--surface-raised)]"><Clock3 size={17} className={revision.result === 'recalled' ? 'text-[var(--blue)]' : 'text-[var(--amber)]'} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{problem.title}</p><p className="mt-1 text-[10px] text-[var(--text-faint)]">Revision {revision.result} · Stage {revision.stageBefore} → {revision.stageAfter}</p></div><span className="text-[10px] font-bold text-[var(--text-faint)]">REVISION</span></button>
        })}</div>}
      </section>
    </div>
  )
}