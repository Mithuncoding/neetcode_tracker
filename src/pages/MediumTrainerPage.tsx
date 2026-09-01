import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  Clock3,
  Code2,
  MessageSquareText,
  Route,
  ScanSearch,
  Target,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, DifficultyBadge, PageHeader } from '../components/ui'
import { useTracker } from '../context/useTracker'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { getMediumLadder, getPatternMastery } from '../lib/mentor'

const STAGE_LABELS = {
  'warm-up': 'Easy concept',
  reinforce: 'Easy implementation',
  bridge: 'Pattern variation',
  medium: 'Guided Medium',
  'unseen-medium': 'Unseen Medium',
} as const

function EvidencePill({ label, complete, icon: Icon }: { label: string; complete: boolean; icon: typeof Check }) {
  return <span className={`flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-[9px] font-bold ${complete ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'bg-[var(--surface-muted)] text-[var(--text-faint)]'}`}><Icon size={11} /> {label}</span>
}

export function MediumTrainerPage() {
  const { state } = useTracker()
  const navigate = useNavigate()
  const ladder = getMediumLadder(state, ROADMAP_PROBLEMS)
  const mastery = getPatternMastery(state, ROADMAP_PROBLEMS).find((item) => item.pattern === ladder.pattern)

  return (
    <div className="page-content">
      <PageHeader title="Medium problem trainer" description="Earn the Medium attempt through a controlled pattern progression." actions={<Button variant="secondary" onClick={() => navigate('/mentor')}><ArrowLeft size={15} /> Mentor</Button>} />

      <section className="mb-4 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <article className="panel border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-5 text-white sm:p-6">
          <Badge tone="amber">Current bridge pattern</Badge>
          <h2 className="mt-4 text-2xl font-bold text-white">{ladder.pattern}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">The Medium is not step one. First prove recognition, a simple implementation, and one variation. Then remove support.</p>
          <div className="mt-5 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15"><div className="h-full bg-[var(--accent)]" style={{ width: `${mastery?.mastery ?? 0}%` }} /></div><span className="metric-number font-mono text-xs font-bold text-white">{mastery?.mastery ?? 0}%</span></div>
        </article>
        <article className="panel p-5">
          <p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Promotion gate</p>
          <h2 className="mt-2 text-sm font-bold">Ready for mixed Mediums when:</h2>
          <div className="mt-4 space-y-2 text-xs text-[var(--text-muted)]"><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-[var(--accent)]" /> Recognition is at least 70% across unseen prompts.</p><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-[var(--accent)]" /> Two Mediums are implemented with no algorithm hint.</p><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-[var(--accent)]" /> One blind re-solve succeeds after 72 hours.</p></div>
        </article>
      </section>

      <section className="panel overflow-hidden">
        <header className="border-b border-[var(--border)] px-5 py-4"><h2 className="text-sm font-bold">Solve ladder</h2><p className="mt-0.5 text-xs text-[var(--text-muted)]">A green checkpoint means the app has evidence, not that the row was merely opened.</p></header>
        <div className="divide-y divide-[var(--border)]">{ladder.items.map((item, index) => {
          const sessions = state.mentor.guidedSessions.filter((session) => session.problemId === item.problem.id)
          const recognition = state.mentor.recognitionAttempts.some((attempt) => attempt.problemId === item.problem.id && attempt.correct)
          const thought = sessions.some((session) => session.bruteForceCaptured)
          const implemented = state.attempts.some((attempt) => attempt.problemId === item.problem.id && ['independent', 'hint'].includes(attempt.outcome))
          const independent = state.attempts.some((attempt) => attempt.problemId === item.problem.id && attempt.outcome === 'independent')
          const explained = sessions.some((session) => (session.explanationScore ?? 0) >= 3)
          const timed = state.attempts.some((attempt) => attempt.problemId === item.problem.id && attempt.durationSeconds > 0)
          return <article key={item.problem.id} className="px-5 py-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-start gap-4"><span className={`metric-number flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-bold ${item.complete ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border-strong)] text-[var(--text-faint)]'}`}>{item.complete ? <Check size={13} /> : index + 1}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge tone={index < 2 ? 'green' : index === 2 ? 'blue' : 'amber'}>{STAGE_LABELS[item.stage]}</Badge><DifficultyBadge difficulty={item.problem.difficulty} /></div><h3 className="mt-2 truncate text-sm font-bold">{item.problem.title}</h3><div className="mt-3 flex flex-wrap gap-1.5"><EvidencePill label="Recognize" complete={recognition} icon={ScanSearch} /><EvidencePill label="Brute force" complete={thought} icon={Route} /><EvidencePill label="Implement" complete={implemented} icon={Code2} /><EvidencePill label="Independent" complete={independent} icon={Target} /><EvidencePill label="Explain" complete={explained} icon={MessageSquareText} /><EvidencePill label="Timed" complete={timed} icon={Clock3} /></div></div></div><Button variant={index >= 3 ? 'primary' : 'secondary'} onClick={() => navigate(`/mentor/problem/${item.problem.id}?mode=${item.complete ? 'blind' : 'medium-trainer'}`)}>{item.complete ? 'Blind re-solve' : 'Start step'} <ArrowRight size={15} /></Button></div></article>
        })}</div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="panel p-4"><BrainCircuit size={17} className="text-[var(--violet)]" /><h3 className="mt-3 text-xs font-bold">Recognize</h3><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Name the likely pattern and the clues that support it.</p></div>
        <div className="panel p-4"><Code2 size={17} className="text-[var(--blue)]" /><h3 className="mt-3 text-xs font-bold">Derive</h3><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Build brute force, identify repeated work, and state an invariant.</p></div>
        <div className="panel p-4"><Target size={17} className="text-[var(--accent)]" /><h3 className="mt-3 text-xs font-bold">Remove support</h3><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Re-solve later without notes so recognition is not confused with recall.</p></div>
      </section>
    </div>
  )
}