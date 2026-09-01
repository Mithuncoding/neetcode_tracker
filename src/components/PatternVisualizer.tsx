import { useState } from 'react'
import { ArrowRight, Box, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { CorePattern } from '../data/mentor-content'
import { cn } from '../lib/utils'
import { Button, IconButton } from './ui'

interface VisualStep {
  left?: number
  right?: number
  mid?: number
  active?: number[]
  markers?: Record<number, string>
  note: string
}

const VISUALS: Record<CorePattern, { values: string[]; label: string; steps: VisualStep[] }> = {
  'Arrays & Hashing': {
    values: ['2', '7', '11', '15'],
    label: 'Complement map, target = 9',
    steps: [
      { active: [0], markers: { 0: 'STORE' }, note: 'Store value 2 with its index. Its complement 7 has not appeared yet.' },
      { active: [0, 1], markers: { 0: 'FOUND', 1: 'NOW' }, note: 'At value 7, complement 2 is already in the map. One lookup replaces an inner scan.' },
    ],
  },
  'Two Pointers': {
    values: ['2', '7', '11', '15'],
    label: 'Target = 9',
    steps: [
      { left: 0, right: 3, note: '2 + 15 is too large, so the right pointer moves.' },
      { left: 0, right: 2, note: '2 + 11 is still too large. Moving right cannot hide a valid pair.' },
      { left: 0, right: 1, note: '2 + 7 equals 9. The invariant removed every skipped pair safely.' },
    ],
  },
  'Sliding Window': {
    values: ['a', 'b', 'c', 'a', 'b', 'b'],
    label: 'Longest unique substring',
    steps: [
      { left: 0, right: 0, note: 'Start with a valid one-character window.' },
      { left: 0, right: 1, note: 'Expand right. The window remains unique.' },
      { left: 0, right: 2, note: 'abc is valid, so the best length becomes 3.' },
      { left: 1, right: 3, note: 'The next a repeats. Remove from the left until the window is valid.' },
      { left: 2, right: 4, note: 'Expand again; bca is replaced by cab, still length 3.' },
      { left: 5, right: 5, note: 'Repeated b forces multiple left moves. This is why repair uses while, not if.' },
    ],
  },
  'Prefix Sum': {
    values: ['3', '-1', '2', '5'],
    label: 'Running prefixes',
    steps: [
      { active: [0], markers: { 0: 'P=3' }, note: 'The first prefix stores the sum through index 0.' },
      { active: [0, 1], markers: { 1: 'P=2' }, note: 'Add -1. A range sum can later be obtained by subtracting an earlier prefix.' },
      { active: [0, 1, 2], markers: { 2: 'P=4' }, note: 'If target is 1, look for prefix 3 because current prefix 4 minus 3 equals 1.' },
      { active: [0, 1, 2, 3], markers: { 3: 'P=9' }, note: 'Each range query now reuses cumulative work instead of summing again.' },
    ],
  },
  'Binary Search': {
    values: ['1', '3', '5', '7', '9', '11', '13'],
    label: 'Target = 11',
    steps: [
      { left: 0, right: 6, mid: 3, note: 'Mid is 7. The target is larger, so indices 0 through 3 are impossible.' },
      { left: 4, right: 6, mid: 5, note: 'Mid is 11. The target is found after one half was discarded.' },
    ],
  },
  Stack: {
    values: ['(', '[', ']', ')'],
    label: 'Delimiter stack',
    steps: [
      { active: [0], markers: { 0: 'PUSH' }, note: 'An opening delimiter is unresolved, so push it.' },
      { active: [0, 1], markers: { 1: 'TOP' }, note: 'The newest opening delimiter is now on top.' },
      { active: [0, 1, 2], markers: { 1: 'POP', 2: 'MATCH' }, note: 'The closing bracket resolves the most recent opening bracket first.' },
      { active: [0, 3], markers: { 0: 'POP', 3: 'MATCH' }, note: 'The final parenthesis resolves the remaining opening delimiter. The stack ends empty.' },
    ],
  },
  'Linked Lists': {
    values: ['1', '2', '3', 'null'],
    label: 'In-place reversal',
    steps: [
      { active: [0, 1], markers: { 0: 'CUR', 1: 'NEXT' }, note: 'Save node 2 before changing node 1.next. Otherwise the remaining chain is lost.' },
      { active: [0, 1], markers: { 0: 'PREV', 1: 'CUR' }, note: 'Reverse the first edge, then advance previous and current.' },
      { active: [1, 2], markers: { 1: 'PREV', 2: 'CUR' }, note: 'Repeat the same save, rewire, and advance invariant at node 3.' },
      { active: [2, 3], markers: { 2: 'HEAD', 3: 'DONE' }, note: 'Current reaches null. Previous is the new head.' },
    ],
  },
  Intervals: {
    values: ['[1,3]', '[2,6]', '[8,10]', '[9,12]'],
    label: 'Merge sorted intervals',
    steps: [
      { active: [0], markers: { 0: 'ACTIVE' }, note: 'After sorting by start, keep the first interval active.' },
      { active: [0, 1], markers: { 0: 'LAST', 1: 'OVERLAP' }, note: '2 is before the active end 3, so merge into [1,6].' },
      { active: [2], markers: { 2: 'NEW' }, note: '8 begins after 6, so [8,10] starts a new active interval.' },
      { active: [2, 3], markers: { 2: 'LAST', 3: 'OVERLAP' }, note: '9 overlaps the active interval, producing [8,12].' },
    ],
  },
  Trees: {
    values: ['4', '2', '7', '1', '3', '6', '9'],
    label: 'Subtree return values',
    steps: [
      { active: [3], markers: { 3: 'BASE' }, note: 'Leaf 1 returns depth 1 after its empty children return 0.' },
      { active: [3, 4, 1], markers: { 1: 'COMBINE' }, note: 'Node 2 combines child depths with 1 + max(left, right).' },
      { active: [5, 6, 2], markers: { 2: 'COMBINE' }, note: 'Node 7 solves the same smaller subtree problem.' },
      { active: [0, 1, 2], markers: { 0: 'ANSWER' }, note: 'Root 4 combines both returned depths. The function contract stays identical at every node.' },
    ],
  },
  Heap: {
    values: ['5', '3', '8', '1', '7'],
    label: 'Size-3 min-heap for Top K',
    steps: [
      { active: [0], markers: { 0: 'PUSH' }, note: 'Push the first candidate. A heap keeps the smallest retained item accessible.' },
      { active: [0, 1, 2], markers: { 1: 'MIN' }, note: 'After three values, the heap represents the current Top 3 candidates.' },
      { active: [0, 2, 3], markers: { 3: 'DROP' }, note: 'Push 1, then pop the heap minimum because only three candidates matter.' },
      { active: [0, 2, 4], markers: { 0: 'KTH' }, note: 'After processing all values, the heap root is the kth largest retained value.' },
    ],
  },
  Backtracking: {
    values: ['A', 'B', 'C', 'D'],
    label: 'Choose, recurse, undo',
    steps: [
      { active: [0], markers: { 0: 'CHOOSE' }, note: 'Choose A and enter its decision subtree.' },
      { active: [0, 1], markers: { 1: 'CHOOSE' }, note: 'Choose B. The current path is [A, B].' },
      { active: [0, 1], markers: { 1: 'UNDO' }, note: 'After exploring that branch, remove B so the next choice starts from a clean path.' },
      { active: [0, 2], markers: { 2: 'NEXT' }, note: 'Choose C next. Backtracking reuses the prefix A while enumerating another branch.' },
    ],
  },
  'Graph DFS': {
    values: ['A', 'B', 'C', 'D', 'E'],
    label: 'Depth-first traversal',
    steps: [
      { active: [0], markers: { 0: 'VISIT' }, note: 'Mark A before following an edge so a cycle cannot re-enter it.' },
      { active: [0, 1], markers: { 1: 'DEEPER' }, note: 'DFS follows one neighbor B before exploring alternatives from A.' },
      { active: [0, 1, 3], markers: { 3: 'DEEPER' }, note: 'Continue to D until this path has no unseen neighbor.' },
      { active: [0, 1, 2, 3, 4], markers: { 4: 'DONE' }, note: 'Backtrack to remaining branches. Each node is processed once.' },
    ],
  },
  'Graph BFS': {
    values: ['A', 'B', 'C', 'D', 'E'],
    label: 'Breadth-first layers',
    steps: [
      { active: [0], markers: { 0: 'D=0' }, note: 'Seed the queue with start A at distance 0.' },
      { active: [1, 2], markers: { 1: 'D=1', 2: 'D=1' }, note: 'All immediate neighbors are discovered before any distance-2 node.' },
      { active: [3, 4], markers: { 3: 'D=2', 4: 'D=2' }, note: 'The next queue layer has distance 2, making first discovery shortest in an unweighted graph.' },
    ],
  },
  'Topological Sort': {
    values: ['A', 'B', 'C', 'D'],
    label: 'Prerequisite removal',
    steps: [
      { active: [0], markers: { 0: 'IN=0' }, note: 'A has no unmet prerequisite, so it can enter the queue.' },
      { active: [0, 1, 2], markers: { 1: 'NOW 0', 2: 'NOW 0' }, note: 'Removing A decrements the indegree of B and C.' },
      { active: [1, 2, 3], markers: { 3: 'WAIT' }, note: 'D still waits until both incoming prerequisites are removed.' },
      { active: [0, 1, 2, 3], markers: { 3: 'IN=0' }, note: 'All four nodes are ordered. If fewer were processed, a directed cycle would remain.' },
    ],
  },
  'Union Find': {
    values: ['1', '2', '3', '4', '5'],
    label: 'Component representatives',
    steps: [
      { active: [0, 1], markers: { 0: 'ROOT', 1: 'JOIN' }, note: 'Union 1 and 2 by attaching one root to the other.' },
      { active: [0, 1, 2], markers: { 0: 'ROOT', 2: 'JOIN' }, note: 'Union 2 and 3 after finding the representative of 2.' },
      { active: [3, 4], markers: { 3: 'ROOT', 4: 'JOIN' }, note: 'Nodes 4 and 5 form a separate component.' },
      { active: [0, 1, 2, 3, 4], markers: { 0: 'ROOT' }, note: 'Union 3 and 5 merges both groups. Path compression shortens future finds.' },
    ],
  },
  Greedy: {
    values: ['[1,2]', '[1,4]', '[3,5]', '[5,7]'],
    label: 'Earliest-finish scheduling',
    steps: [
      { active: [0], markers: { 0: 'TAKE' }, note: 'Choose the interval ending earliest because it leaves the most room for the future.' },
      { active: [0, 1], markers: { 1: 'SKIP' }, note: '[1,4] conflicts and ends later, so replacing the chosen interval cannot help.' },
      { active: [0, 2], markers: { 2: 'TAKE' }, note: '[3,5] is compatible with the current end boundary.' },
      { active: [0, 2, 3], markers: { 3: 'TAKE' }, note: 'The exchange argument justifies each local commitment.' },
    ],
  },
  'Dynamic Programming': {
    values: ['2', '7', '9', '3', '1'],
    label: 'House Robber rolling states',
    steps: [
      { active: [0], markers: { 0: 'DP=2' }, note: 'Best prefix after the first value is 2.' },
      { active: [0, 1], markers: { 1: 'DP=7' }, note: 'At 7, choose max(skip=2, take=7).' },
      { active: [0, 1, 2], markers: { 2: 'DP=11' }, note: 'At 9, choose max(previous best 7, two-back 2 + 9).' },
      { active: [2, 3, 4], markers: { 4: 'DP=12' }, note: 'Only two prior states are needed; the full recursion tree has collapsed into linear work.' },
    ],
  },
  'Bit Manipulation': {
    values: ['4', '1', '2', '1', '2'],
    label: 'XOR cancellation',
    steps: [
      { active: [0], markers: { 0: 'XOR=4' }, note: 'Start accumulator at 0 and XOR value 4.' },
      { active: [0, 1], markers: { 1: 'XOR=5' }, note: 'XOR records per-bit parity without storing a frequency table.' },
      { active: [1, 3], markers: { 3: 'CANCEL' }, note: 'The second 1 cancels the first because x XOR x equals 0.' },
      { active: [2, 4, 0], markers: { 0: 'REMAINS' }, note: 'Both 2 values cancel as well, leaving the unique value 4.' },
    ],
  },
  Tries: {
    values: ['root', 'c', 'a', 't', 'r'],
    label: 'Shared prefix paths',
    steps: [
      { active: [0, 1], markers: { 1: 'c' }, note: 'Insert the first character as an edge from the root.' },
      { active: [0, 1, 2, 3], markers: { 3: 'END' }, note: 'The path root-c-a-t stores cat and marks t as a complete word.' },
      { active: [0, 1, 2, 4], markers: { 4: 'END' }, note: 'Car reuses the c-a prefix and branches only at the final character.' },
    ],
  },
}

export function PatternVisualizer({ pattern }: { pattern: CorePattern }) {
  const navigate = useNavigate()
  const visual = VISUALS[pattern]
  const [trace, setTrace] = useState<{ pattern: CorePattern; step: number }>({ pattern, step: 0 })
  const step = trace.pattern === pattern ? trace.step : 0
  const current = visual.steps[Math.min(step, visual.steps.length - 1)]
  const finished = step >= visual.steps.length - 1

  return (
    <section className="panel-muted overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <div><p className="text-xs font-bold">Interactive trace</p><p className="mt-0.5 text-[10px] text-[var(--text-faint)]">{visual.label}</p></div>
        <span className="metric-number font-mono text-[10px] text-[var(--text-faint)]">{step + 1}/{visual.steps.length}</span>
      </header>
      <div className="p-4">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${visual.values.length}, minmax(34px, 1fr))` }}>
          {visual.values.map((value, index) => {
            const inRange = current.active
              ? current.active.includes(index)
              : index >= (current.left ?? 0) && index <= (current.right ?? -1)
            const isBoundary = index === current.left || index === current.right
            const isMid = index === current.mid
            const marker = current.markers?.[index]
            return (
              <div key={`${value}-${index}`} className="min-w-0 text-center">
                <div className={cn(
                  'metric-number flex aspect-square min-h-9 items-center justify-center rounded-[5px] border font-mono text-sm font-bold transition-colors',
                  inRange ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-faint)]',
                  isMid && 'border-[var(--amber)] bg-[var(--amber-soft)] text-[var(--amber)]',
                )}>{value}</div>
                <div className="mt-1 h-4 text-[9px] font-bold text-[var(--text-faint)]">
                  {marker ?? (isMid ? 'MID' : isBoundary ? index === current.left ? 'L' : 'R' : '')}
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-3 min-h-10 text-xs leading-5 text-[var(--text-muted)]">{current.note}</p>
        <div className="mt-3 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => navigate('/mentor/lab')}><Box size={14} /> 3D lab</Button>
          <IconButton icon={RotateCcw} label="Reset visualization" onClick={() => setTrace({ pattern, step: 0 })} disabled={step === 0} />
          <Button size="sm" onClick={() => setTrace({ pattern, step: Math.min(visual.steps.length - 1, step + 1) })} disabled={finished}>Next step <ArrowRight size={14} /></Button>
        </div>
      </div>
    </section>
  )
}