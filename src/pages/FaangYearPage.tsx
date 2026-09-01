import { addWeeks, differenceInCalendarWeeks, format } from 'date-fns'
import {
  ArrowLeft,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarRange,
  Check,
  Circle,
  Clock3,
  Target,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, PageHeader } from '../components/ui'
import { useTracker } from '../context/useTracker'
import {
  INTERVIEW_RULES,
  MONTH_PLANS,
  WEEKLY_RHYTHM,
  YEAR_PHASES,
  monthForWeek,
} from '../data/faang-plan'

export function FaangYearPage() {
  const { state, startYearPlan, togglePlanWeek } = useTracker()
  const navigate = useNavigate()
  const startedAt = state.mentor.yearPlanStartedAt ? new Date(state.mentor.yearPlanStartedAt) : null
  const currentWeek = startedAt
    ? Math.min(52, Math.max(1, differenceInCalendarWeeks(new Date(), startedAt) + 1))
    : 1
  const currentMonth = MONTH_PLANS[monthForWeek(currentWeek) - 1]
  const completed = new Set(state.mentor.completedPlanWeeks)
  const progress = Math.round((completed.size / 52) * 100)

  return (
    <div className="page-content">
      <PageHeader title="One-year FAANG plan" description="A demanding but sustainable path from pattern dependence to interview independence." actions={<Button variant="secondary" onClick={() => navigate('/mentor')}><ArrowLeft size={15} /> Mentor</Button>} />

      <section className="panel mb-4 overflow-hidden border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-white">
        <div className="grid gap-px bg-white/10 lg:grid-cols-[1.3fr_.7fr]">
          <div className="bg-[var(--sidebar-bg)] p-6"><Badge tone="green">52-week operating plan</Badge><h2 className="mt-4 max-w-2xl text-2xl font-bold text-white">FAANG-range readiness is a portfolio of evidence, not a solved-count target.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Plan for 12 to 15 focused hours per week. DSA remains central, but CS fundamentals, one deep project, communication, referrals, and real interviews run in parallel.</p>{!startedAt && <Button className="mt-5" onClick={startYearPlan}><CalendarRange size={16} /> Start my 52 weeks</Button>}</div>
          <div className="bg-[var(--sidebar-bg)] p-6"><p className="text-[10px] font-bold uppercase text-white/45">Current checkpoint</p><p className="metric-number mt-2 text-4xl font-extrabold text-white">Week {currentWeek}</p><p className="mt-1 text-sm font-bold text-white/80">{currentMonth.title}</p><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full bg-[var(--accent)]" style={{ width: `${progress}%` }} /></div><p className="metric-number mt-2 text-xs text-white/55">{completed.size}/52 weekly reviews complete</p>{startedAt && <p className="mt-3 text-[10px] text-white/40">Started {format(startedAt, 'MMM d, yyyy')} · target {format(addWeeks(startedAt, 52), 'MMM d, yyyy')}</p>}</div>
        </div>
      </section>

      <section className="mb-4 grid gap-3 xl:grid-cols-4">{YEAR_PHASES.map((phase) => {
        const active = currentWeek >= phase.weeks[0] && currentWeek <= phase.weeks[1]
        return <article key={phase.id} className={`panel p-5 ${active ? 'border-[var(--accent)]' : ''}`}><div className="flex items-center justify-between"><Badge tone={active ? 'green' : 'neutral'}>Weeks {phase.weeks[0]}-{phase.weeks[1]}</Badge>{active && <Target size={16} className="text-[var(--accent)]" />}</div><h2 className="mt-3 text-sm font-bold">{phase.title}</h2><p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{phase.goal}</p><p className="mt-4 text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Exit evidence</p><ul className="mt-2 space-y-1.5 text-[10px] leading-4 text-[var(--text-muted)]">{phase.exitGate.map((item) => <li key={item} className="flex gap-2"><Check size={11} className="mt-0.5 shrink-0 text-[var(--accent)]" />{item}</li>)}</ul></article>
      })}</section>

      <section className="panel mb-4 overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4"><div><h2 className="text-sm font-bold">Weekly accountability</h2><p className="mt-0.5 text-xs text-[var(--text-muted)]">Mark a week only after reviewing evidence and mistakes.</p></div><span className="metric-number text-xl font-extrabold">{progress}%</span></header>
        <div className="grid grid-cols-4 gap-px bg-[var(--border)] sm:grid-cols-8 lg:grid-cols-13">{Array.from({ length: 52 }, (_, index) => index + 1).map((week) => <button key={week} type="button" onClick={() => togglePlanWeek(week)} aria-pressed={completed.has(week)} className={`flex aspect-square min-h-12 flex-col items-center justify-center bg-[var(--surface)] text-[10px] font-bold transition-colors ${completed.has(week) ? 'text-[var(--accent-strong)]' : week === currentWeek ? 'text-[var(--blue)]' : 'text-[var(--text-faint)]'} hover:bg-[var(--surface-raised)]`}><span className={`mb-1 flex h-4 w-4 items-center justify-center rounded-full border ${completed.has(week) ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border-strong)]'}`}>{completed.has(week) ? <Check size={9} /> : <Circle size={7} />}</span>W{week}</button>)}</div>
      </section>

      <section className="mb-4"><div className="mb-3"><h2 className="text-sm font-bold">Monthly roadmap</h2><p className="mt-0.5 text-xs text-[var(--text-muted)]">Targets are evidence goals, not quotas to game.</p></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{MONTH_PLANS.map((month) => <article key={month.month} className={`panel p-5 ${month.month === currentMonth.month ? 'border-[var(--blue)]' : ''}`}><div className="flex items-center justify-between"><span className="metric-number font-mono text-[10px] font-bold text-[var(--text-faint)]">MONTH {String(month.month).padStart(2, '0')}</span>{month.month === currentMonth.month && <Badge tone="blue">Current</Badge>}</div><h3 className="mt-2 text-sm font-bold">{month.title}</h3><dl className="mt-4 space-y-3 text-xs"><div><dt className="font-bold text-[var(--text)]">DSA</dt><dd className="mt-1 leading-5 text-[var(--text-muted)]">{month.dsaFocus}</dd></div><div><dt className="font-bold text-[var(--text)]">Evidence target</dt><dd className="mt-1 leading-5 text-[var(--text-muted)]">{month.target}</dd></div><div><dt className="font-bold text-[var(--text)]">Parallel track</dt><dd className="mt-1 leading-5 text-[var(--text-muted)]">{month.parallelTrack}</dd></div></dl></article>)}</div></section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <article className="panel overflow-hidden"><header className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4"><Clock3 size={17} className="text-[var(--blue)]" /><h2 className="text-sm font-bold">Weekly rhythm</h2></header><div className="divide-y divide-[var(--border)]">{WEEKLY_RHYTHM.map((item) => <div key={item.day} className="grid gap-1 px-5 py-3 sm:grid-cols-[90px_1fr]"><p className="text-xs font-bold">{item.day}</p><p className="text-xs leading-5 text-[var(--text-muted)]">{item.work}</p></div>)}</div></article>
        <article className="panel p-5"><div className="flex items-center gap-2"><BriefcaseBusiness size={17} className="text-[var(--accent)]" /><h2 className="text-sm font-bold">Rules that matter</h2></div><ul className="mt-4 space-y-3 text-xs leading-5 text-[var(--text-muted)]">{INTERVIEW_RULES.map((rule) => <li key={rule} className="flex gap-2"><BookOpenCheck size={13} className="mt-0.5 shrink-0 text-[var(--accent)]" />{rule}</li>)}</ul><p className="mt-5 border-t border-[var(--border)] pt-4 text-[10px] leading-4 text-[var(--text-faint)]">This plan improves interview readiness; it cannot guarantee a particular company or offer.</p></article>
      </section>
    </div>
  )
}