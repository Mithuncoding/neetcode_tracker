import {
  PATTERN_LESSONS,
  PROBLEM_GUIDES,
  type CorePattern,
  type ProblemTeachingGuide,
} from '../data/mentor-content'
import type { RoadmapProblem } from '../types'
import { getCorePattern } from './mentor'

export type GuideSource = 'handcrafted' | 'pattern-derived'

export interface ResolvedProblemGuide {
  guide: ProblemTeachingGuide
  source: GuideSource
  corePattern: CorePattern
  taxonomy: string[]
}

interface ProblemVariant {
  match: RegExp
  question: string
  observation: string
  implementation: string
}

const PROBLEM_VARIANTS: ProblemVariant[] = [
  { match: /duplicate|anagram|frequency|majority/i, question: 'What frequency or membership fact would remove a repeated scan?', observation: 'The useful state is usually existence, count, or the first/last index for a value.', implementation: 'Decide deliberately between set, dict, Counter, and defaultdict.' },
  { match: /sum|product/i, question: 'If one value is fixed, what exact complement or remaining target is required?', observation: 'Rewriting the target around the current choice often exposes a lookup, pointer, or subproblem.', implementation: 'Be explicit about whether indices, values, counts, or ordering must be preserved.' },
  { match: /palindrome/i, question: 'Which mirrored positions must agree, and which characters may be skipped?', observation: 'A mismatch often proves failure immediately; a match safely moves both boundaries.', implementation: 'Keep normalization and pointer movement separate so skipped characters do not cause off-by-one errors.' },
  { match: /substring|subarray|window/i, question: 'What makes one current contiguous range valid?', observation: 'If validity can be updated when one item enters or leaves, restarting the range is wasted work.', implementation: 'Write the add, invalidity test, remove, and answer-update operations separately.' },
  { match: /rotated|minimum in rotated|search/i, question: 'What remains ordered or monotonic after inspecting a midpoint?', observation: 'Even when the whole input is not sorted normally, one side may still be provably ordered.', implementation: 'State whether boundaries are inclusive before writing any update.' },
  { match: /parentheses|bracket|expression|calculator/i, question: 'Which unresolved item must be matched or evaluated first?', observation: 'Nested structure naturally resolves in reverse opening order.', implementation: 'Define exactly what each stack entry stores: character, index, partial result, or operator.' },
  { match: /temperature|greater|smaller|histogram|rectangle/i, question: 'Which earlier positions are still waiting for a nearer greater or smaller value?', observation: 'A monotonic stack removes resolved candidates while preserving unresolved order.', implementation: 'Store indices whenever distance, width, or the original value is needed later.' },
  { match: /linked|list|node|lru/i, question: 'Which reference would become unreachable after the next pointer update?', observation: 'Correct mutation order matters more than syntax when links are rewired.', implementation: 'Draw before/after arrows and save next references before overwriting them.' },
  { match: /interval|meeting|schedule|calendar/i, question: 'Which sort order makes every new conflict local to the active interval?', observation: 'Start order helps merging; end order often supports maximum non-overlapping choices.', implementation: 'Write the overlap condition explicitly, including whether touching endpoints overlap.' },
  { match: /tree|bst|ancestor|diameter|depth|path sum/i, question: 'What exact value must one subtree return to its parent?', observation: 'A clear recursive return contract turns the tree into repeated smaller instances.', implementation: 'Separate values returned upward from global or nonlocal answers updated at a node.' },
  { match: /level order|right side|minimum depth/i, question: 'Does the output depend on depth layers rather than complete paths?', observation: 'A queue preserves level order and makes the first visit at a depth explicit.', implementation: 'Capture the current queue length before processing a level.' },
  { match: /top k|kth|median|merge k|priority|heap/i, question: 'Do you need complete sorting, or only the best candidate/frontier right now?', observation: 'A bounded heap avoids maintaining order among irrelevant candidates.', implementation: 'Remember that Python heapq is a min-heap; negate only when the invariant requires a max-heap.' },
  { match: /combination|permutation|subset|word search|n-queens|partition/i, question: 'What choices exist at one decision level, and how is each choice undone?', observation: 'The output is a search tree; pruning must reject only branches that cannot recover.', implementation: 'Copy mutable paths when saving results and pair every choose operation with an undo.' },
  { match: /island|province|component|clone graph|network|maze/i, question: 'What are the nodes, edges, and visited rule in this representation?', observation: 'One traversal answers one connected-region question when nodes are marked at discovery.', implementation: 'For grids, centralize boundary and visited checks to avoid four duplicated bugs.' },
  { match: /shortest|minimum step|rotting|word ladder/i, question: 'Do all moves have equal cost, and what are the starting states?', observation: 'Equal-cost shortest paths are discovered in BFS layer order, possibly from multiple sources.', implementation: 'Mark visited when enqueuing, not when dequeuing, to prevent duplicate frontier work.' },
  { match: /course|alien dictionary|prerequisite|topological/i, question: 'Which items have no unmet prerequisites right now?', observation: 'Removing zero-indegree nodes exposes the next safe work and detects a cycle by count.', implementation: 'Direct every edge consistently from prerequisite to dependent before computing indegrees.' },
  { match: /redundant|connected|accounts merge|spanning/i, question: 'Are groups merged repeatedly while connectivity is queried?', observation: 'Representatives let union-find answer whether a new edge joins or repeats a component.', implementation: 'Always union roots and use path compression plus size or rank.' },
  { match: /robber|climb|coin|decode|word break|subsequence|partition equal/i, question: 'What choices does brute force make, and which complete state repeats?', observation: 'The recurrence should follow directly from choose/skip or from the last decision.', implementation: 'Define the state in one sentence before writing base cases or loops.' },
  { match: /grid|matrix|paths|distance|square/i, question: 'Which row, column, or prior-state dimensions completely determine the future?', observation: 'Two-dimensional state is justified only when one index is insufficient.', implementation: 'Write dependencies first, then choose an iteration order in which they are already computed.' },
  { match: /profit|jump|gas|partition labels|hand of straights/i, question: 'What local frontier dominates weaker alternatives, and why is committing safe?', observation: 'A greedy solution needs an exchange, reachability, or dominance argument rather than intuition.', implementation: 'Track only the strongest feasible frontier once the proof shows weaker states are irrelevant.' },
  { match: /trie|prefix|dictionary|autocomplete/i, question: 'Are many operations repeating work over the same string prefixes?', observation: 'Shared prefix paths make query cost depend on word length instead of dictionary size.', implementation: 'Store an explicit terminal marker so a prefix is not confused with a complete word.' },
  { match: /bit|single number|missing number|power of/i, question: 'What invariant holds independently at each binary position?', observation: 'Parity, masks, and XOR cancellation can replace larger state when only bit facts matter.', implementation: 'State the truth-table behavior before using a bit trick.' },
]

function difficultyInstruction(problem: RoadmapProblem) {
  if (problem.difficulty === 'Easy') return 'Use this problem to make one invariant automatic before adding variations.'
  if (problem.difficulty === 'Medium') return 'Derive the simple approach first, then identify exactly which repeated work must be removed.'
  return 'Decompose the problem into smaller claims and prove each optimization before composing them.'
}

export function getProblemTeachingGuide(problem: RoadmapProblem): ResolvedProblemGuide {
  const corePattern = getCorePattern(problem)
  const handcrafted = PROBLEM_GUIDES[problem.id]
  if (handcrafted) {
    return { guide: handcrafted, source: 'handcrafted', corePattern, taxonomy: problem.patterns }
  }

  const lesson = PATTERN_LESSONS[corePattern]
  const variant = PROBLEM_VARIANTS.find((item) => item.match.test(`${problem.title} ${problem.patterns.join(' ')}`))
  const primaryTaxonomy = problem.patterns[0] ?? problem.pattern
  const question = variant?.question ?? lesson.hints[0]
  const observation = variant?.observation ?? lesson.hints[1]
  const implementation = variant?.implementation ?? `Adapt the ${corePattern} template only after naming every state variable.`
  const guide: ProblemTeachingGuide = {
    title: problem.title,
    intuition: `${problem.title} is a ${problem.difficulty.toLowerCase()} ${problem.topic} problem. ${question}`,
    bruteForce: `Start by writing the most direct correct approach for ${problem.title}. ${lesson.commonWrongApproaches[0]}.`,
    whyBruteForceFails: `${lesson.why} ${difficultyInstruction(problem)}`,
    keyObservation: `${observation} The roadmap's more specific classification is ${primaryTaxonomy}.`,
    derivation: [
      `State the exact output of ${problem.title} and identify whether order, contiguity, or connectivity matters.`,
      'Write the direct approach and name the work it repeats.',
      `Test whether ${corePattern} removes that repeated work while preserving correctness.`,
      `Prove the move, transition, or stored state before adapting the ${primaryTaxonomy} variation.`,
    ],
    algorithm: [...lesson.algorithm, implementation],
    python: lesson.pythonTemplate,
    complexity: lesson.complexity,
    commonMistakes: [...lesson.commonWrongApproaches, `Applying ${corePattern} by name without proving why it fits this problem.`],
    recognitionClues: [...lesson.recognitionClues, `Fine-grained taxonomy: ${problem.patterns.join(' + ')}`],
    variations: [...lesson.variations, `Compare with nearby ${problem.topic} problems in the knowledge graph.`],
    hints: [
      question,
      observation,
      `Try ${corePattern}. The specific variation is ${primaryTaxonomy}.`,
      `${lesson.algorithm.join(' ')}`,
      `Pseudocode structure: ${lesson.hints[4]}`,
      `${implementation} Use the Python pattern template as a scaffold, not as a copied answer.`,
    ],
  }
  return { guide, source: 'pattern-derived', corePattern, taxonomy: problem.patterns }
}

function difficultyDistance(left: RoadmapProblem, right: RoadmapProblem) {
  const rank = { Easy: 0, Medium: 1, Hard: 2 }
  return Math.abs(rank[left.difficulty] - rank[right.difficulty])
}

export function getRelatedProblems(problem: RoadmapProblem, problems: RoadmapProblem[], limit = 6) {
  const corePattern = getCorePattern(problem)
  const patterns = new Set(problem.patterns)
  return problems
    .filter((candidate) => candidate.id !== problem.id)
    .map((candidate) => {
      const shared = candidate.patterns.filter((pattern) => patterns.has(pattern))
      const score = shared.length * 12 +
        (getCorePattern(candidate) === corePattern ? 8 : 0) +
        (candidate.topic === problem.topic ? 4 : 0) -
        difficultyDistance(problem, candidate) * 2 -
        Math.min(4, Math.abs(candidate.recommendedOrder - problem.recommendedOrder) / 40)
      return { problem: candidate, sharedPatterns: shared, score }
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.problem.recommendedOrder - right.problem.recommendedOrder)
    .slice(0, limit)
}

export function getRecognitionOptions(problem: RoadmapProblem, problems: RoadmapProblem[]) {
  const answer = getCorePattern(problem)
  const allPatterns = [...new Set(problems.map(getCorePattern))]
  const start = problem.recommendedOrder % allPatterns.length
  const distractors: CorePattern[] = []
  for (let offset = 0; distractors.length < 3 && offset < allPatterns.length; offset += 1) {
    const candidate = allPatterns[(start + offset * 5) % allPatterns.length]
    if (candidate !== answer && !distractors.includes(candidate)) distractors.push(candidate)
  }
  const options = [answer, ...distractors]
  return options.sort((left, right) => {
    const leftScore = (problem.leetcodeNumber * 31 + left.length * 17) % 97
    const rightScore = (problem.leetcodeNumber * 31 + right.length * 17) % 97
    return leftScore - rightScore || left.localeCompare(right)
  })
}