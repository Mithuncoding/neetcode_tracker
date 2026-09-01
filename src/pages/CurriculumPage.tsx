import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Braces,
  Check,
  Circle,
  Lightbulb,
  Route,
  ShieldAlert,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PatternVisualizer } from '../components/PatternVisualizer'
import { Badge, Button, PageHeader, ProgressBar } from '../components/ui'
import { useTracker } from '../context/useTracker'
import {
  CURRICULUM,
  PATTERN_LESSONS,
  type CorePattern,
  type CurriculumNode,
} from '../data/mentor-content'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { getCorePattern, getPatternMastery } from '../lib/mentor'
import { CONCEPT_LESSONS } from '../data/foundation-content'

const LAB_SCENE_BY_PATTERN: Partial<Record<CorePattern, string>> = {
  'Arrays & Hashing': 'hash-map-buckets',
  'Two Pointers': 'two-pointers',
  'Sliding Window': 'sliding-window',
  'Prefix Sum': 'prefix-sum',
  'Binary Search': 'binary-search',
  Stack: 'monotonic-stack',
  'Linked Lists': 'linked-list-reversal',
  Intervals: 'merge-intervals',
  Trees: 'tree-dfs-traversal',
  Heap: 'heap-priority-queue',
  Backtracking: 'backtracking-tree',
  'Graph DFS': 'graph-dfs',
  'Graph BFS': 'graph-bfs',
  'Topological Sort': 'topological-sort',
  'Union Find': 'union-find',
  Greedy: 'kruskal-mst',
  'Dynamic Programming': 'dp-1d-house-robber',
  'Bit Manipulation': 'bitwise-xor',
  Tries: 'trie-prefix-search',
}

const LEVEL_NAMES = [
  'Foundation',
  'Recognize',
  'Implement',
  'Medium bridge',
  'Medium mastery',
  'Combinations',
  'Advanced',
  'Interview',
] as const

function LessonList({ title, icon: Icon, items }: { title: string; icon: typeof Lightbulb; items: string[] }) {
  return <section><div className="mb-3 flex items-center gap-2"><Icon size={15} className="text-[var(--accent)]" /><h3 className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">{title}</h3></div><ul className="space-y-2 text-sm leading-6 text-[var(--text-muted)]">{items.map((item) => <li key={item} className="flex gap-2"><span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />{item}</li>)}</ul></section>
}

function NodeDetails({ node, pattern, onPattern, mastery }: { node: CurriculumNode; pattern: CorePattern | null; onPattern: (pattern: CorePattern) => void; mastery: ReturnType<typeof getPatternMastery> }) {
  const navigate = useNavigate()
  const lesson = pattern ? PATTERN_LESSONS[pattern] : null
  const skill = pattern ? mastery.find((item) => item.pattern === pattern) : null
  const practice = pattern ? ROADMAP_PROBLEMS.find((problem) => getCorePattern(problem) === pattern) : null
  const conceptLesson = CONCEPT_LESSONS[node.id]
  return (
    <div className="min-w-0 space-y-4">
      <section className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2"><Badge tone="blue">Level {node.level}</Badge>{node.level > 0 && <Badge tone="neutral">Prerequisites: {node.prerequisites.length}</Badge>}</div>
        <h2 className="mt-4 text-xl font-bold">{node.title}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{node.outcome}</p>
        <div className="mt-5 grid gap-5 border-t border-[var(--border)] pt-5 lg:grid-cols-2">
          <LessonList title="Promotion criteria" icon={Check} items={node.masteryCriteria} />
          <LessonList title="Prerequisites" icon={Route} items={node.prerequisites.length ? node.prerequisites.map((id) => CURRICULUM.find((item) => item.id === id)?.title ?? id) : ['No prerequisite. Start here.']} />
        </div>
      </section>

      {conceptLesson && <section className="panel overflow-hidden"><header className="border-b border-[var(--border)] px-5 py-4"><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Mental model</p><h2 className="mt-2 text-base font-bold leading-6">{conceptLesson.mentalModel}</h2></header><div className="divide-y divide-[var(--border)]">{conceptLesson.sections.map((section) => <article key={section.title} className="p-5"><h3 className="text-sm font-bold">{section.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{section.explanation}</p>{section.code && <pre className="mt-4 overflow-x-auto rounded-[6px] bg-[var(--surface-raised)] p-4 font-mono text-[10px] leading-5"><code>{section.code}</code></pre>}<div className="mt-4 flex flex-wrap gap-2">{section.checks.map((check) => <span key={check} className="rounded-[4px] border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-1 text-[9px] text-[var(--text-muted)]">{check}</span>)}</div></article>)}</div><footer className="border-t border-[var(--border)] bg-[var(--surface-raised)] p-5"><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Deliberate practice</p><ol className="mt-3 space-y-2">{conceptLesson.exercises.map((exercise, index) => <li key={exercise} className="flex gap-3 text-xs leading-5 text-[var(--text-muted)]"><span className="metric-number font-mono text-[9px] font-bold text-[var(--accent)]">{String(index + 1).padStart(2, '0')}</span>{exercise}</li>)}</ol></footer></section>}

      {node.patterns.length > 0 && <div className="flex gap-2 overflow-x-auto pb-1">{node.patterns.map((item) => <button key={item} type="button" onClick={() => onPattern(item)} className={`shrink-0 rounded-[6px] border px-3 py-2 text-xs font-bold ${pattern === item ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'}`}>{item}</button>)}</div>}

      {lesson && pattern && <>
        <section className="panel overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4"><div><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Thinking pattern</p><h2 className="mt-1 text-base font-bold">{pattern}</h2></div><div className="text-right"><p className="metric-number text-xl font-extrabold">{skill?.mastery ?? 0}%</p><p className="text-[9px] font-bold uppercase text-[var(--text-faint)]">Measured mastery</p></div></header>
          <div className="grid gap-px bg-[var(--border)] lg:grid-cols-2"><div className="bg-[var(--surface)] p-5"><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">What it is</p><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{lesson.what}</p></div><div className="bg-[var(--surface)] p-5"><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Why it works</p><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{lesson.why}</p></div></div>
          <div className="border-t border-[var(--border)] px-5 py-4"><ProgressBar value={skill?.mastery ?? 0} /><p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">{skill?.diagnosis}</p></div>
        </section>
        <PatternVisualizer pattern={pattern} />
        <section className="panel p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <LessonList title="How to recognize it" icon={Lightbulb} items={lesson.recognitionClues} />
            <LessonList title="Common wrong approaches" icon={ShieldAlert} items={lesson.commonWrongApproaches} />
            <LessonList title="How to derive it" icon={Route} items={lesson.derivation} />
            <LessonList title="Algorithm" icon={BookOpenCheck} items={lesson.algorithm} />
          </div>
        </section>
        <section className="panel overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4"><div className="flex items-center gap-2"><Braces size={16} className="text-[var(--blue)]" /><div><h2 className="text-sm font-bold">Python pattern template</h2><p className="mt-0.5 text-[10px] text-[var(--text-faint)]">Understand each state variable before adapting it.</p></div></div><Badge tone="blue">{lesson.complexity}</Badge></header>
          <pre className="overflow-x-auto bg-[var(--surface-raised)] p-5 font-mono text-xs leading-6"><code>{lesson.pythonTemplate}</code></pre>
          <div className="grid gap-px border-t border-[var(--border)] bg-[var(--border)] lg:grid-cols-2"><div className="bg-[var(--surface)] p-5"><LessonList title="Variations" icon={Route} items={lesson.variations} /></div><div className="bg-[var(--surface)] p-5"><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Recognition check</p><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{lesson.hints[0]}</p></div></div>
        </section>
        <div className="flex flex-wrap justify-end gap-2">{LAB_SCENE_BY_PATTERN[pattern] && <Button variant="secondary" onClick={() => navigate(`/mentor/lab?scene=${LAB_SCENE_BY_PATTERN[pattern]}`)}>Explore in 3D</Button>}{practice && <Button onClick={() => navigate(`/mentor/problem/${practice.id}`)}>Practice {practice.title} <ArrowRight size={15} /></Button>}</div>
      </>}
    </div>
  )
}

export function CurriculumPage() {
  const { state } = useTracker()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requested = CURRICULUM.find((node) => node.id === searchParams.get('node'))
  const [level, setLevel] = useState(requested?.level ?? state.mentor.currentLevel)
  const [selectedId, setSelectedId] = useState(requested?.id ?? CURRICULUM.find((node) => node.level === level)?.id ?? CURRICULUM[0].id)
  const selected = CURRICULUM.find((node) => node.id === selectedId) ?? CURRICULUM[0]
  const [selectedPattern, setSelectedPattern] = useState<CorePattern | null>(selected.patterns[0] ?? null)
  const mastery = getPatternMastery(state, ROADMAP_PROBLEMS)
  const nodes = CURRICULUM.filter((node) => node.level === level)

  const chooseLevel = (nextLevel: number) => {
    const next = CURRICULUM.find((node) => node.level === nextLevel)
    if (!next) return
    setLevel(next.level)
    setSelectedId(next.id)
    setSelectedPattern(next.patterns[0] ?? null)
  }

  const chooseNode = (node: CurriculumNode) => {
    setSelectedId(node.id)
    setSelectedPattern(node.patterns[0] ?? null)
  }

  return (
    <div className="page-content">
      <PageHeader title="DSA curriculum" description="Progress by reasoning capability, not by topic count." actions={<Button variant="secondary" onClick={() => navigate('/mentor')}><ArrowLeft size={15} /> Mentor</Button>} />
      <div className="mb-4 flex max-w-full overflow-x-auto rounded-[7px] border border-[var(--border)] bg-[var(--surface)] p-1">{LEVEL_NAMES.map((name, index) => <button key={name} type="button" onClick={() => chooseLevel(index)} className={`relative min-w-28 flex-1 rounded-[5px] px-3 py-2.5 text-xs font-bold ${level === index ? 'bg-[var(--text)] text-[var(--surface)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)]'}`}><span className="block font-mono text-[9px] opacity-60">L{index}</span>{name}{index === state.mentor.currentLevel && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />}</button>)}</div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-2 xl:sticky xl:top-4 xl:self-start">{nodes.map((node) => <button key={node.id} type="button" onClick={() => chooseNode(node)} className={`panel flex w-full items-start gap-3 p-4 text-left transition-colors ${selected.id === node.id ? 'border-[var(--accent)]' : 'hover:border-[var(--border-strong)]'}`}><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${selected.id === node.id ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'bg-[var(--surface-muted)] text-[var(--text-faint)]'}`}>{selected.id === node.id ? <Check size={12} /> : <Circle size={10} />}</span><div className="min-w-0"><p className="text-xs font-bold">{node.title}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[var(--text-faint)]">{node.outcome}</p></div></button>)}</aside>
        <NodeDetails node={selected} pattern={selectedPattern} onPattern={setSelectedPattern} mastery={mastery} />
      </div>
    </div>
  )
}