import { useState } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Clock3,
  GitBranch,
  Network,
  Route,
  ShieldAlert,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PatternVisualizer } from '../components/PatternVisualizer'
import { Badge, Button, DifficultyBadge, PageHeader, ProgressBar } from '../components/ui'
import { useTracker } from '../context/useTracker'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { getProblemKnowledgeGraph } from '../lib/knowledge-graph'
import { getPatternMastery } from '../lib/mentor'

export function KnowledgeGraphPage() {
  const { state } = useTracker()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requested = searchParams.get('problem')
  const fallback = state.attempts.at(-1)?.problemId ?? ROADMAP_PROBLEMS[0].id
  const [problemId, setProblemId] = useState(requested && ROADMAP_PROBLEMS.some((item) => item.id === requested) ? requested : fallback)
  const problem = ROADMAP_PROBLEMS.find((item) => item.id === problemId) ?? ROADMAP_PROBLEMS[0]
  const graph = getProblemKnowledgeGraph(state, problem, ROADMAP_PROBLEMS)
  const mastery = getPatternMastery(state, ROADMAP_PROBLEMS).find((item) => item.pattern === graph.corePattern)

  return (
    <div className="page-content">
      <PageHeader title="DSA knowledge graph" description="Connect each problem to the reusable idea, prerequisites, related variations, mistakes, and recall history." actions={<Button variant="secondary" onClick={() => navigate('/mentor')}><ArrowLeft size={15} /> Mentor</Button>} />

      <section className="panel mb-4 p-4"><label className="grid gap-2 text-[10px] font-extrabold uppercase text-[var(--text-faint)] sm:grid-cols-[180px_1fr] sm:items-center"><span>Inspect a problem</span><select className="input px-3 text-sm normal-case" value={problem.id} onChange={(event) => setProblemId(event.target.value)}>{ROADMAP_PROBLEMS.map((item) => <option key={item.id} value={item.id}>#{item.leetcodeNumber} · {item.title}</option>)}</select></label></section>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,.65fr)]">
        <section className="min-w-0 space-y-3">
          <article className="panel bg-[#17231c] p-5 text-white"><div className="flex flex-wrap items-center gap-2"><DifficultyBadge difficulty={problem.difficulty} /><Badge tone={graph.guideSource === 'handcrafted' ? 'green' : 'neutral'}>{graph.guideSource === 'handcrafted' ? 'Handcrafted guide' : 'Pattern-derived guide'}</Badge></div><h2 className="mt-3 text-xl font-bold text-white">{problem.title}</h2><p className="mt-1 text-xs text-white/55">Problem node · {problem.topic}</p><Button className="mt-5" size="sm" onClick={() => navigate(`/mentor/problem/${problem.id}`)}><BrainCircuit size={14} /> Guided solve</Button></article>

          <div className="flex justify-center text-[var(--text-faint)]"><ArrowDown size={18} /></div>

          <div className="grid gap-3 md:grid-cols-2">
            <article className="panel p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Route size={16} className="text-[var(--accent)]" /><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Core pattern</p></div><span className="metric-number text-lg font-extrabold">{mastery?.mastery ?? 0}%</span></div><h2 className="mt-3 text-base font-bold">{graph.corePattern}</h2><ProgressBar value={mastery?.mastery ?? 0} className="mt-3" /><div className="mt-4 flex flex-wrap gap-1.5">{problem.patterns.map((pattern) => <Badge key={pattern} tone="violet">{pattern}</Badge>)}</div></article>
            <article className="panel p-5"><div className="flex items-center gap-2"><BookOpenCheck size={16} className="text-[var(--blue)]" /><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Curriculum concept</p></div><h2 className="mt-3 text-base font-bold">{graph.curriculum?.title ?? 'Pattern foundations'}</h2><p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{graph.curriculum?.outcome ?? 'Study the pattern lesson and recognition clues before attempting harder variations.'}</p>{graph.curriculum && <Button className="mt-4" size="sm" variant="secondary" onClick={() => navigate(`/mentor/curriculum?node=${graph.curriculum?.id}`)}>Open lesson</Button>}</article>
          </div>

          <PatternVisualizer pattern={graph.corePattern} />

          <div className="flex justify-center text-[var(--text-faint)]"><ArrowDown size={18} /></div>

          <article className="panel overflow-hidden"><header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div><h2 className="text-sm font-bold">Related-problem ladder</h2><p className="mt-0.5 text-xs text-[var(--text-muted)]">Ranked by shared taxonomy, core pattern, topic, and difficulty distance.</p></div><GitBranch size={18} className="text-[var(--accent)]" /></header><div className="divide-y divide-[var(--border)]">{graph.related.map(({ problem: item, sharedPatterns }, index) => <button key={item.id} type="button" onClick={() => setProblemId(item.id)} className="group flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-[var(--surface-raised)]"><span className="metric-number flex h-7 w-7 items-center justify-center rounded-[5px] bg-[var(--surface-muted)] font-mono text-[10px]">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-0.5 truncate text-[10px] text-[var(--text-faint)]">{sharedPatterns.join(' · ') || graph.corePattern}</p></div><DifficultyBadge difficulty={item.difficulty} /><ArrowRight size={14} className="text-[var(--text-faint)] transition-transform group-hover:translate-x-0.5" /></button>)}</div></article>
        </section>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:self-start">
          <article className="panel p-5"><div className="flex items-center gap-2"><Network size={17} className="text-[var(--violet)]" /><h2 className="text-sm font-bold">Graph summary</h2></div><dl className="mt-4 grid grid-cols-2 gap-4 text-xs"><div><dt className="text-[var(--text-faint)]">Nodes</dt><dd className="metric-number mt-1 text-lg font-extrabold">{graph.nodes.length}</dd></div><div><dt className="text-[var(--text-faint)]">Connections</dt><dd className="metric-number mt-1 text-lg font-extrabold">{graph.edges.length}</dd></div><div><dt className="text-[var(--text-faint)]">Related</dt><dd className="metric-number mt-1 text-lg font-extrabold">{graph.related.length}</dd></div><div><dt className="text-[var(--text-faint)]">Mistakes</dt><dd className="metric-number mt-1 text-lg font-extrabold">{graph.mistakes.length}</dd></div></dl></article>
          <article className="panel p-5"><div className="flex items-center gap-2"><ShieldAlert size={17} className="text-[var(--amber)]" /><h2 className="text-sm font-bold">Personal mistake links</h2></div>{graph.mistakes.length ? <div className="mt-4 space-y-3">{graph.mistakes.map((mistake) => <div key={mistake.id} className="border-l-2 border-[var(--amber)] pl-3"><p className="text-xs font-bold capitalize">{mistake.category.replaceAll('-', ' ')}</p><p className="mt-1 text-[10px] leading-4 text-[var(--text-muted)]">{mistake.note || 'No reflection recorded.'}</p></div>)}</div> : <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">No classified failures for this problem yet. A failed guided session will create this connection.</p>}</article>
          <article className="panel p-5"><div className="flex items-center gap-2"><Clock3 size={17} className="text-[var(--blue)]" /><h2 className="text-sm font-bold">Recall link</h2></div>{graph.progress.nextRevisionAt ? <><p className="mt-3 text-xs font-bold">Next review {new Date(graph.progress.nextRevisionAt).toLocaleDateString()}</p><p className="mt-1 text-[10px] text-[var(--text-muted)]">Stage {graph.progress.revisionStage} · {graph.progress.revisionLapses} lapses · {graph.progress.successfulRecalls} successful recalls</p><Button className="mt-4 w-full" size="sm" onClick={() => navigate(`/mentor/problem/${problem.id}?mode=blind`)}>Blind re-solve</Button></> : <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">No review scheduled. Completing a guided solve creates the recall edge.</p>}</article>
        </aside>
      </div>
    </div>
  )
}