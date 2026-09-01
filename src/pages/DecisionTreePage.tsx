import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  HelpCircle,
  RotateCcw,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, PageHeader } from '../components/ui'
import { CURRICULUM, PATTERN_LESSONS, type CorePattern } from '../data/mentor-content'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { getCorePattern } from '../lib/mentor'

interface BranchOption {
  label: string
  pattern: CorePattern
  why: string
}

interface DecisionBranch {
  id: string
  label: string
  prompt: string
  description: string
  options: BranchOption[]
}

const BRANCHES: DecisionBranch[] = [
  { id: 'lookup', label: 'Fast lookup or counting', prompt: 'What repeated question does brute force ask?', description: 'Duplicates, frequencies, complements, and grouping usually need remembered facts.', options: [
    { label: 'Does this value or complement exist?', pattern: 'Arrays & Hashing', why: 'A set or dictionary replaces repeated scans with direct lookup.' },
    { label: 'Do many queries share string prefixes?', pattern: 'Tries', why: 'A trie shares repeated prefix work across all stored strings.' },
    { label: 'Does parity or a compact flag state matter?', pattern: 'Bit Manipulation', why: 'A bit invariant can represent parity or membership without a larger structure.' },
  ] },
  { id: 'contiguous', label: 'Contiguous range', prompt: 'How does the range property behave?', description: 'Subarray and substring questions are about adjacent elements, not arbitrary selections.', options: [
    { label: 'Validity changes as either endpoint moves', pattern: 'Sliding Window', why: 'Maintain one range, expand it, and repair violations from the left.' },
    { label: 'The answer is a sum/count between endpoints', pattern: 'Prefix Sum', why: 'A range aggregate can be rewritten as a difference of cumulative values.' },
    { label: 'Two ordered endpoints can eliminate pairs', pattern: 'Two Pointers', why: 'A pointer invariant can discard impossible endpoint combinations.' },
  ] },
  { id: 'ordered', label: 'Sorted or monotonic space', prompt: 'What does one comparison let you discard?', description: 'Ordering matters only when you can prove a safe elimination.', options: [
    { label: 'A midpoint eliminates half the candidates', pattern: 'Binary Search', why: 'A monotonic predicate or sorted order supports logarithmic elimination.' },
    { label: 'Moving one endpoint eliminates pair choices', pattern: 'Two Pointers', why: 'The comparison proves which side cannot participate in the answer.' },
    { label: 'The best local boundary dominates alternatives', pattern: 'Greedy', why: 'Use this only when an exchange or dominance proof makes the local choice safe.' },
  ] },
  { id: 'relationships', label: 'Relationships or a grid', prompt: 'What result do you need from the graph?', description: 'First name the nodes and edges. Then choose traversal from the objective.', options: [
    { label: 'Connectivity, components, or path existence', pattern: 'Graph DFS', why: 'Depth-first exploration marks one full reachable region.' },
    { label: 'Minimum steps when every edge costs the same', pattern: 'Graph BFS', why: 'Breadth-first layers visit states in increasing distance.' },
    { label: 'Prerequisites or dependency ordering', pattern: 'Topological Sort', why: 'Zero-indegree processing exposes tasks with no unmet prerequisites.' },
    { label: 'Groups merge and connectivity is queried repeatedly', pattern: 'Union Find', why: 'Component representatives make incremental unions efficient.' },
  ] },
  { id: 'choices', label: 'Choices or optimization', prompt: 'What does the decision space repeat?', description: 'Write the brute-force decision tree before choosing backtracking, DP, or greedy.', options: [
    { label: 'Return every valid construction', pattern: 'Backtracking', why: 'Explore each choice path and undo it to enumerate the search tree.' },
    { label: 'Optimize or count overlapping smaller states', pattern: 'Dynamic Programming', why: 'Cache each complete state so repeated subproblems are solved once.' },
    { label: 'One provably dominant choice can be committed', pattern: 'Greedy', why: 'A proof, not intuition alone, allows an irreversible local choice.' },
  ] },
  { id: 'frontier', label: 'Next best or unresolved item', prompt: 'Which item must be available immediately?', description: 'The required access order usually determines the data structure.', options: [
    { label: 'Most recent unresolved item or nearest greater/smaller', pattern: 'Stack', why: 'LIFO order resolves the newest waiting candidate first.' },
    { label: 'Current minimum/maximum or Top K candidates', pattern: 'Heap', why: 'A priority queue maintains the ordered frontier without full re-sorting.' },
    { label: 'Nodes by tree depth or graph distance', pattern: 'Graph BFS', why: 'A queue preserves first-in, first-out layer order.' },
  ] },
  { id: 'nodes', label: 'Nodes and references', prompt: 'What structural invariant must be preserved?', description: 'Draw pointer or subtree state before writing mutations or recursion.', options: [
    { label: 'Rewire next references or detect a cycle', pattern: 'Linked Lists', why: 'Save references before mutation and use dummy or fast/slow pointers when appropriate.' },
    { label: 'Combine answers returned by child subtrees', pattern: 'Trees', why: 'Define one recursive return contract and combine child results at the parent.' },
    { label: 'Merge or schedule start/end ranges', pattern: 'Intervals', why: 'Sorting by a proof-relevant endpoint makes conflicts local.' },
  ] },
]

export function DecisionTreePage() {
  const navigate = useNavigate()
  const [branch, setBranch] = useState<DecisionBranch | null>(null)
  const [result, setResult] = useState<BranchOption | null>(null)
  const lesson = result ? PATTERN_LESSONS[result.pattern] : null
  const node = result ? CURRICULUM.find((item) => item.patterns.includes(result.pattern)) : null
  const practice = result ? ROADMAP_PROBLEMS.find((problem) => getCorePattern(problem) === result.pattern) : null

  const reset = () => {
    setBranch(null)
    setResult(null)
  }

  return (
    <div className="page-content">
      <PageHeader title="What should I try next?" description="Classify the structure of the problem before searching for an algorithm." actions={<Button variant="secondary" onClick={() => navigate('/mentor')}><ArrowLeft size={15} /> Mentor</Button>} />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <section className="panel overflow-hidden">
          <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4"><div><Badge tone={result ? 'green' : branch ? 'blue' : 'neutral'}>{result ? 'Direction found' : branch ? 'Step 2 of 2' : 'Step 1 of 2'}</Badge><h2 className="mt-3 text-lg font-bold">{result ? result.pattern : branch ? branch.prompt : 'What shape does the problem have?'}</h2><p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{result ? result.why : branch ? branch.description : 'Choose the strongest structural clue. If two fit, start with the one required by the output.'}</p></div><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] bg-[var(--text)] text-[var(--surface)]">{result ? <CheckCircle2 size={19} /> : branch ? <HelpCircle size={19} /> : <Compass size={19} />}</div></header>
          <div className="p-5 sm:p-6">
            {!branch && <div className="grid gap-2 sm:grid-cols-2">{BRANCHES.map((item) => <button key={item.id} type="button" onClick={() => setBranch(item)} className="group flex min-h-20 items-center gap-3 rounded-[6px] border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-left hover:border-[var(--accent)]"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{item.label}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[var(--text-faint)]">{item.description}</p></div><ArrowRight size={14} className="shrink-0 text-[var(--text-faint)] transition-transform group-hover:translate-x-0.5" /></button>)}</div>}
            {branch && !result && <div className="space-y-2">{branch.options.map((option) => <button key={option.label} type="button" onClick={() => setResult(option)} className="group flex min-h-16 w-full items-center gap-3 rounded-[6px] border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-left hover:border-[var(--accent)]"><span className="flex-1 text-sm font-bold">{option.label}</span><ArrowRight size={14} className="text-[var(--text-faint)] transition-transform group-hover:translate-x-0.5" /></button>)}</div>}
            {result && lesson && <div><div className="grid gap-5 sm:grid-cols-2"><div><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Recognition clues</p><ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-muted)]">{lesson.recognitionClues.map((clue) => <li key={clue} className="flex gap-2"><span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />{clue}</li>)}</ul></div><div><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">First question to ask</p><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{lesson.hints[0]}</p><p className="mt-4 text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Typical complexity</p><p className="mt-2 text-sm text-[var(--text-muted)]">{lesson.complexity}</p></div></div><div className="mt-6 flex flex-wrap justify-end gap-2"><Button variant="secondary" onClick={reset}><RotateCcw size={14} /> Start over</Button>{node && <Button variant="secondary" onClick={() => navigate(`/mentor/curriculum?node=${node.id}`)}>Study pattern</Button>}{practice && <Button onClick={() => navigate(`/mentor/problem/${practice.id}`)}>Guided practice <ArrowRight size={14} /></Button>}</div></div>}
          </div>
        </section>
        <aside className="panel p-5">
          <p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Before any pattern</p>
          <h2 className="mt-2 text-sm font-bold">Write these four lines</h2>
          <ol className="mt-4 space-y-4 text-xs leading-5 text-[var(--text-muted)]"><li><strong className="mr-2 font-mono text-[var(--accent)]">01</strong> What exactly is the output?</li><li><strong className="mr-2 font-mono text-[var(--accent)]">02</strong> What is the simplest brute force?</li><li><strong className="mr-2 font-mono text-[var(--accent)]">03</strong> Which work repeats?</li><li><strong className="mr-2 font-mono text-[var(--accent)]">04</strong> What fact would let me skip that work?</li></ol>
          <p className="mt-5 border-t border-[var(--border)] pt-4 text-xs leading-5 text-[var(--text-muted)]">A decision tree suggests a first experiment. It does not replace proving the invariant or testing whether the constraints fit.</p>
        </aside>
      </div>
    </div>
  )
}