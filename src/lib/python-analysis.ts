import { parser } from '@lezer/python'
import type { CorePattern } from '../data/mentor-content'

export interface CodeCheck {
  id: 'syntax' | 'structure' | 'pattern' | 'edge-cases' | 'complexity' | 'readability'
  label: string
  passed: boolean
  detail: string
  weight: number
}

export interface PythonAnalysis {
  score: number
  syntaxValid: boolean
  errorLines: number[]
  likelyNestedLoops: boolean
  checks: CodeCheck[]
  disclaimer: string
}

const PATTERN_SIGNALS: Record<CorePattern, { test: RegExp; detail: string }> = {
  'Arrays & Hashing': { test: /\b(dict|set|Counter|defaultdict)\b|\{\s*\}/, detail: 'Look for deliberate set, dict, Counter, or defaultdict state.' },
  'Two Pointers': { test: /\b(left|right|slow|fast|read|write)\b/, detail: 'Name the pointer roles so each movement can be justified.' },
  'Sliding Window': { test: /\b(left|window)\b[\s\S]*\b(right|enumerate)\b|\bwhile\b[\s\S]*\bleft\b/, detail: 'A window usually needs explicit expansion and left-side repair.' },
  'Prefix Sum': { test: /\b(prefix|running_sum|cumulative)\b/, detail: 'Name the cumulative state and seed the empty prefix when required.' },
  'Binary Search': { test: /\b(left|low)\b[\s\S]*\b(mid|middle)\b[\s\S]*\b(right|high)\b/, detail: 'A binary-search implementation should expose both bounds and the midpoint.' },
  Stack: { test: /\bstack\b[\s\S]*\.(append|pop)\(/, detail: 'Use explicit stack push/pop operations and define what an entry means.' },
  'Linked Lists': { test: /\.next\b|\b(next_node|previous|dummy)\b/, detail: 'Linked-list code should make saved and rewired references visible.' },
  Intervals: { test: /\.sort\(|sorted\(|\b(start|end|interval)\b/, detail: 'Expose the sort key and the active start/end boundary.' },
  Trees: { test: /\.(left|right)\b|\b(dfs|subtree|node)\b/, detail: 'Tree code should reveal the recursive or level-order node contract.' },
  Heap: { test: /\bheapq\b|\b(heappush|heappop|heapify)\b/, detail: 'Use heapq operations and state whether the heap is bounded or negated.' },
  Backtracking: { test: /\b(backtrack|search|path)\b[\s\S]*\.append\([\s\S]*\.pop\(/, detail: 'A backtracking path should show choose, recurse, and undo.' },
  'Graph DFS': { test: /\b(dfs|visited|recursive_stack)\b/, detail: 'DFS needs a visited rule and recursive or explicit-stack exploration.' },
  'Graph BFS': { test: /\bdeque\b[\s\S]*\.popleft\(/, detail: 'Use deque and mark states when they enter the BFS frontier.' },
  'Topological Sort': { test: /\b(indegree|in_degree)\b[\s\S]*\bdeque\b/, detail: 'Kahn topological sort should expose indegrees and the zero-indegree queue.' },
  'Union Find': { test: /\b(parent|rank|size)\b[\s\S]*\b(find|union)\b/, detail: 'Expose representative parents, find, and union operations.' },
  Greedy: { test: /\bsorted?\b|\.sort\(|\b(frontier|current_end|farthest)\b/, detail: 'Greedy code should reveal the proof-relevant order or dominant frontier.' },
  'Dynamic Programming': { test: /\b(dp|memo|cache|previous|state)\b|@cache|@lru_cache/, detail: 'Name the state or memo so the recurrence is inspectable.' },
  'Bit Manipulation': { test: /[&|^~]|<<|>>/, detail: 'A bit solution should visibly apply the stated mask, parity, or XOR invariant.' },
  Tries: { test: /\b(trie|children|setdefault|is_end)\b/, detail: 'Trie code should expose child edges and a terminal marker.' },
}

function syntaxErrors(code: string) {
  const tree = parser.parse(code)
  const cursor = tree.cursor()
  const lines = new Set<number>()
  do {
    if (cursor.type.isError) {
      lines.add(code.slice(0, cursor.from).split('\n').length)
    }
  } while (cursor.next())
  return [...lines].sort((left, right) => left - right)
}

function hasNestedLoops(code: string) {
  const activeIndents: number[] = []
  for (const line of code.split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    const indent = line.length - line.trimStart().length
    while (activeIndents.length && indent <= activeIndents.at(-1)!) activeIndents.pop()
    if (/^(for|while)\b/.test(line.trimStart())) {
      if (activeIndents.length) return true
      activeIndents.push(indent)
    }
  }
  return false
}

export function analyzePythonCode(code: string, pattern: CorePattern): PythonAnalysis {
  const trimmed = code.trim()
  if (!trimmed) {
    return {
      score: 0,
      syntaxValid: false,
      errorLines: [],
      likelyNestedLoops: false,
      checks: [],
      disclaimer: 'Static analysis does not execute code or prove correctness against hidden tests.',
    }
  }
  const errors = syntaxErrors(code)
  const syntaxValid = errors.length === 0
  const nestedLoops = hasNestedLoops(code)
  const signal = PATTERN_SIGNALS[pattern]
  const hasFunction = /\bdef\s+[A-Za-z_]\w*\s*\(/.test(code)
  const hasReturn = /\breturn\b/.test(code)
  const hasEdgeHandling = /\bif\b|\bNone\b|\bnot\s+\w+|len\([^)]*\)\s*==\s*0|\bempty\b/i.test(code)
  const hasDebugPrint = /\bprint\s*\(/.test(code)
  const vagueNames = (code.match(/\b(?:temp|data|stuff|thing|foo|bar)\b/gi) ?? []).length
  const checks: CodeCheck[] = [
    { id: 'syntax', label: 'Python syntax', passed: syntaxValid, detail: syntaxValid ? 'The parser found no syntax-error nodes.' : `Parser errors near line${errors.length === 1 ? '' : 's'} ${errors.join(', ')}.`, weight: 25 },
    { id: 'structure', label: 'Callable solution structure', passed: hasFunction && hasReturn, detail: hasFunction && hasReturn ? 'A function and explicit return are present.' : 'Use a named function and make its returned result explicit.', weight: 15 },
    { id: 'pattern', label: `${pattern} signal`, passed: signal.test.test(code), detail: signal.detail, weight: 25 },
    { id: 'edge-cases', label: 'Edge handling', passed: hasEdgeHandling, detail: hasEdgeHandling ? 'Conditional or empty/null handling is visible.' : 'Show how an empty, boundary, duplicate, or missing case is handled.', weight: 15 },
    { id: 'complexity', label: 'Complexity risk', passed: !nestedLoops, detail: nestedLoops ? 'Nested loops detected. This may be valid, but compare it with the input constraints.' : 'No obvious nested-loop risk was detected.', weight: 10 },
    { id: 'readability', label: 'Interview readability', passed: !hasDebugPrint && vagueNames === 0, detail: hasDebugPrint ? 'Remove debugging print calls before presenting the solution.' : vagueNames ? 'Replace vague temporary names with variables that state their role.' : 'No debug prints or vague placeholder names detected.', weight: 10 },
  ]
  const score = syntaxValid
    ? checks.reduce((total, check) => total + (check.passed ? check.weight : 0), 0)
    : 0
  return {
    score,
    syntaxValid,
    errorLines: errors,
    likelyNestedLoops: nestedLoops,
    checks,
    disclaimer: 'Static analysis does not execute code or prove correctness against hidden tests. Run examples and submit to LeetCode for semantic validation.',
  }
}

export interface PythonLineExplanation {
  lineNumber: number
  code: string
  explanation: string
}

export function explainPythonLines(code: string): PythonLineExplanation[] {
  return code.split('\n').flatMap((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) return []
    let explanation = 'Performs this step in the current algorithm state.'
    if (/^class\s+/.test(trimmed)) explanation = 'Defines the LeetCode solution container.'
    else if (/^def\s+/.test(trimmed)) explanation = 'Defines the function contract: inputs enter here and the stated result must be returned.'
    else if (/^(from|import)\s+/.test(trimmed)) explanation = 'Imports a standard-library tool used by the data structure or algorithm.'
    else if (/^if\s+.*:\s*$/.test(trimmed)) explanation = 'Checks a decision, guard, or base condition before taking this branch.'
    else if (/^elif\s+.*:\s*$/.test(trimmed)) explanation = 'Checks the next mutually exclusive decision when the earlier condition was false.'
    else if (/^else\s*:/.test(trimmed)) explanation = 'Handles the remaining case after earlier conditions were false.'
    else if (/^for\s+.*\s+in\s+.*:\s*$/.test(trimmed)) explanation = 'Iterates through the input or current candidate collection once per item.'
    else if (/^while\s+.*:\s*$/.test(trimmed)) explanation = 'Repeats while the algorithm invariant requires repair or more candidates remain.'
    else if (/^return\b/.test(trimmed)) explanation = 'Returns the answer promised by the function contract.'
    else if (/\.append\(/.test(trimmed)) explanation = 'Adds a new candidate or state to the end of the active collection.'
    else if (/\.popleft\(/.test(trimmed)) explanation = 'Removes the oldest queued state, preserving breadth-first order.'
    else if (/\.pop\(/.test(trimmed)) explanation = 'Removes the most recent or selected state after resolving or undoing it.'
    else if (/\b(?:heappush|heappop|heapify)\b/.test(trimmed)) explanation = 'Updates the priority queue while preserving heap order.'
    else if (/\b(?:left|right|low|high|mid)\b\s*[+-]?=/.test(trimmed)) explanation = 'Moves or initializes a search boundary while preserving the stated invariant.'
    else if (/\b(?:visited|seen|counts|frequency|memo|dp|parent)\b.*=/.test(trimmed)) explanation = 'Initializes or updates reusable state that prevents repeated work.'
    else if (/^[A-Za-z_]\w*(?:\[[^\]]+\])?\s*=/.test(trimmed)) explanation = 'Updates a named piece of algorithm state used by later decisions.'
    else if (/^[A-Za-z_]\w*\([^)]*\)$/.test(trimmed)) explanation = 'Invokes the next algorithm step or recursive subproblem.'
    return [{ lineNumber: index + 1, code: line, explanation }]
  })
}

export function getPythonSyntaxErrorLines(code: string) {
  return code.trim() ? syntaxErrors(code) : []
}