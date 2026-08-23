import { format } from 'date-fns'
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Gauge,
  Target,
} from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import type { WorkspaceOutletContext } from '../components/AppShell'
import { Badge, Button, DifficultyBadge, PageHeader, ProgressBar } from '../components/ui'
import { useTracker } from '../context/useTracker'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { getAdaptiveRecommendations, getPatternStats, getPlannerSummary } from '../lib/planner'
import type { PlannerMode } from '../types'

const DAYS = [
  { value: 1, label: 'M' },
  { value: 2, label: 'T' },
  { value: 3, label: 'W' },
  { value: 4, label: 'T' },
  { value: 5, label: 'F' },
  { value: 6, label: 'S' },
  { value: 0, label: 'S' },
]

export function PlannerPage() {
  const { state, updateSettings } = useTracker()
  const { openProblem } = useOutletContext<WorkspaceOutletContext>()
  const navigate = useNavigate()
  const summary = getPlannerSummary(state, ROADMAP_PROBLEMS)
  const patterns = getPatternStats(state, ROADMAP_PROBLEMS)
  const recommendations = getAdaptiveRecommendations(
    state,
    ROADMAP_PROBLEMS,
    Math.max(5, summary.plannedToday),
  )

  const updatePlanner = (changes: Partial<typeof state.settings.planner>) =>
    updateSettings({ planner: { ...state.settings.planner, ...changes } })

  const toggleDay = (day: number) => {
    const selected = state.settings.planner.studyDays.includes(day)
      ? state.settings.planner.studyDays.filter((value) => value !== day)
      : [...state.settings.planner.studyDays, day]
    if (selected.length) updatePlanner({ studyDays: selected })
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Study plan"
        description="A target-aware queue shaped by your actual performance"
        actions={<Button onClick={() => navigate('/focus')}><Target size={15} /> Start plan</Button>}
      />
      <section className="mb-4 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <article className="panel p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge tone={summary.risk === 'on-track' ? 'green' : summary.risk === 'high' ? 'red' : 'amber'}>
                {summary.risk === 'unconfigured' ? 'Set a target' : summary.risk.replace('-', ' ')}
              </Badge>
              <h2 className="mt-4 text-xl font-extrabold">
                {summary.target ? `Finish by ${format(summary.target, 'MMM d, yyyy')}` : 'Build your completion runway'}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-muted)]">
                {summary.target
                  ? `${summary.remaining} problems across ${summary.studyDaysRemaining} available study days.`
                  : 'Choose a target date and weekly rhythm to calculate the required pace.'}
              </p>
            </div>
            <div className="text-right"><p className="metric-number text-4xl font-extrabold">{summary.requiredPerStudyDay}</p><p className="text-[10px] font-bold uppercase text-[var(--text-faint)]">per study day</p></div>
          </div>
          <ProgressBar value={summary.completionPercentage} className="mt-6" />
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-5 text-xs">
            <div><p className="text-[var(--text-faint)]">Days left</p><p className="metric-number mt-1 font-bold">{summary.daysUntilTarget ?? '-'}</p></div>
            <div><p className="text-[var(--text-faint)]">Today</p><p className="metric-number mt-1 font-bold">{summary.isStudyDay ? `${summary.plannedToday} planned` : 'Rest day'}</p></div>
            <div><p className="text-[var(--text-faint)]">Session</p><p className="metric-number mt-1 font-bold">{state.settings.planner.sessionMinutes} min</p></div>
          </div>
        </article>

        <article className="panel p-5">
          <h2 className="text-sm font-bold">Plan settings</h2>
          <div className="mt-5 space-y-4">
            <label className="block text-[10px] font-bold uppercase text-[var(--text-faint)]">Target date<input type="date" className="input mt-2 px-3 text-sm normal-case" value={state.settings.planner.targetDate ?? ''} min={new Date().toISOString().slice(0, 10)} onChange={(event) => updatePlanner({ targetDate: event.target.value || null })} /></label>
            <label className="block text-[10px] font-bold uppercase text-[var(--text-faint)]">Session minutes<input type="number" min={15} max={360} className="input mt-2 px-3 text-sm normal-case" value={state.settings.planner.sessionMinutes} onChange={(event) => updatePlanner({ sessionMinutes: Math.max(15, Math.min(360, Number(event.target.value) || 15)) })} /></label>
            <fieldset><legend className="mb-2 text-[10px] font-bold uppercase text-[var(--text-faint)]">Study days</legend><div className="grid grid-cols-7 gap-1">{DAYS.map((day, index) => <button key={`${day.value}-${index}`} type="button" aria-label={`Toggle study day ${index + 1}`} aria-pressed={state.settings.planner.studyDays.includes(day.value)} onClick={() => toggleDay(day.value)} className={`h-9 rounded-[5px] border text-[10px] font-bold ${state.settings.planner.studyDays.includes(day.value) ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border)] text-[var(--text-faint)]'}`}>{day.label}</button>)}</div></fieldset>
            <fieldset><legend className="mb-2 text-[10px] font-bold uppercase text-[var(--text-faint)]">Mode</legend><div className="grid grid-cols-3 gap-1">{(['foundation', 'balanced', 'interview'] as PlannerMode[]).map((mode) => <button key={mode} type="button" aria-pressed={state.settings.planner.mode === mode} onClick={() => updatePlanner({ mode })} className={`h-9 rounded-[5px] border text-[10px] font-bold capitalize ${state.settings.planner.mode === mode ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border)] text-[var(--text-faint)]'}`}>{mode}</button>)}</div></fieldset>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <article className="panel overflow-hidden">
          <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div><h2 className="text-sm font-bold">Adaptive queue</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Urgency, weak patterns, pace, mode, and variety</p></div><Brain size={18} className="text-[var(--accent)]" /></header>
          <div className="divide-y divide-[var(--border)]">{recommendations.map(({ problem, reason, score }, index) => <button key={problem.id} type="button" onClick={() => openProblem(problem.id)} className="group flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[var(--surface-raised)]"><span className="metric-number flex h-7 w-7 items-center justify-center rounded-[5px] bg-[var(--surface-muted)] font-mono text-[10px]">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{problem.title}</p><p className="mt-1 truncate text-[10px] text-[var(--text-faint)]">{problem.patterns.join(' · ')} · {reason}</p></div><span className="metric-number hidden text-[10px] font-bold text-[var(--text-faint)] sm:block">{score}</span><DifficultyBadge difficulty={problem.difficulty} /><ArrowRight size={14} className="text-[var(--text-faint)] transition-transform group-hover:translate-x-0.5" /></button>)}</div>
        </article>
        <article className="panel p-5">
          <div className="flex items-center justify-between"><div><h2 className="text-sm font-bold">Weak-pattern radar</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Highest-priority skill gaps</p></div><Gauge size={18} className="text-[var(--violet)]" /></div>
          <div className="mt-5 space-y-4">{patterns.slice(0, 8).map((pattern, index) => <div key={pattern.pattern}><div className="mb-2 flex items-center justify-between gap-3"><span className="truncate text-xs font-semibold">{pattern.pattern}</span><span className="metric-number text-[10px] font-bold text-[var(--text-faint)]">{pattern.weakness}% weak</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]"><div className={`h-full rounded-full ${index < 3 ? 'bg-[var(--red)]' : 'bg-[var(--violet)]'}`} style={{ width: `${pattern.weakness}%` }} /></div></div>)}</div>
          {patterns[0]?.practiced === 0 && <div className="mt-5 flex items-start gap-2 rounded-[6px] bg-[var(--amber-soft)] p-3 text-xs text-[var(--amber)]"><AlertTriangle size={14} className="mt-0.5 shrink-0" />Initial rankings become personalized as you log attempts.</div>}
        </article>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: CalendarRange, label: 'Available days', value: summary.studyDaysRemaining ?? '-' },
          { icon: Clock3, label: 'Session length', value: `${state.settings.planner.sessionMinutes}m` },
          { icon: CheckCircle2, label: 'Completed', value: `${summary.completionPercentage}%` },
          { icon: Brain, label: 'Weakest pattern', value: patterns[0]?.pattern ?? '-' },
        ].map(({ icon: Icon, label, value }) => <div key={label} className="panel flex items-center gap-3 p-4"><Icon size={17} className="shrink-0 text-[var(--text-faint)]" /><div className="min-w-0"><p className="metric-number truncate text-sm font-bold">{value}</p><p className="mt-1 text-[9px] font-bold uppercase text-[var(--text-faint)]">{label}</p></div></div>)}
      </section>
    </div>
  )
}