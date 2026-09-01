import type {
  AppState,
  GuidedProblemSession,
  MentorLevel,
  RoadmapProblem,
  SolveAttempt,
} from '../types'
import { CORE_PATTERNS, type CorePattern } from '../data/mentor-content'
import { PYTHON_LESSONS } from '../data/python-course'
import { getAdaptiveRecommendations } from './planner'
import { getLevelProgression } from './progression'

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))
const average = (values: number[]) => values.length
  ? values.reduce((total, value) => total + value, 0) / values.length
  : null

const SPECIALIZED_PATTERN_RULES: Array<[RegExp, CorePattern]> = [
  [/sliding window/, 'Sliding Window'],
  [/prefix|cumulative sum/, 'Prefix Sum'],
  [/binary search|lower bound|upper bound/, 'Binary Search'],
  [/monotonic stack|parentheses|stack/, 'Stack'],
  [/fast.?slow|two pointer|palindrome/, 'Two Pointers'],
  [/linked list/, 'Linked Lists'],
  [/interval|sweep line/, 'Intervals'],
  [/trie|prefix tree/, 'Tries'],
  [/heap|priority queue|top k/, 'Heap'],
  [/backtrack|permutation|combination|subset/, 'Backtracking'],
  [/topological|indegree|course schedule/, 'Topological Sort'],
  [/union.find|disjoint set|kruskal/, 'Union Find'],
  [/breadth.first|\bbfs\b|shortest path/, 'Graph BFS'],
  [/depth.first|\bdfs\b|flood fill|island/, 'Graph DFS'],
  [/dynamic programming|\bdp\b|knapsack|subsequence|memoization|tabulation/, 'Dynamic Programming'],
  [/greedy/, 'Greedy'],
  [/bit|xor/, 'Bit Manipulation'],
]

export function getCorePattern(problem: RoadmapProblem): CorePattern {
  const metadata = `${problem.title} ${problem.pattern} ${problem.patterns.join(' ')}`.toLowerCase()
  const specialized = SPECIALIZED_PATTERN_RULES.find(([rule]) => rule.test(metadata))
  if (specialized) return specialized[1]

  const topic = problem.topic.toLowerCase()
  if (topic.includes('tree')) return 'Trees'
  if (topic.includes('linked')) return 'Linked Lists'
  if (topic.includes('interval')) return 'Intervals'
  if (topic.includes('heap')) return 'Heap'
  if (topic.includes('backtrack')) return 'Backtracking'
  if (topic.includes('graph')) return 'Graph DFS'
  if (topic.includes('dynamic')) return 'Dynamic Programming'
  if (topic.includes('greedy')) return 'Greedy'
  if (topic.includes('bit')) return 'Bit Manipulation'
  if (topic.includes('trie')) return 'Tries'
  if (topic.includes('binary search')) return 'Binary Search'
  if (topic.includes('stack')) return 'Stack'
  if (topic.includes('two pointer')) return 'Two Pointers'
  if (topic.includes('sliding')) return 'Sliding Window'
  return 'Arrays & Hashing'
}

function implementationScore(attempt: SolveAttempt) {
  const confidenceBonus = attempt.confidence * 3
  if (attempt.outcome === 'independent') return Math.min(100, 85 + confidenceBonus)
  if (attempt.outcome === 'hint') return Math.min(78, 52 + confidenceBonus)
  if (attempt.outcome === 'solution') return Math.min(52, 25 + confidenceBonus)
  if (attempt.outcome === 'unable') return Math.min(20, confidenceBonus)
  return 60
}

function independenceScore(attempt: SolveAttempt) {
  if (attempt.outcome === 'independent') return 100
  if (attempt.outcome === 'hint') return 45
  if (attempt.outcome === 'solution') return 15
  if (attempt.outcome === 'revision') return 60
  return 0
}

function guidedIndependenceScore(session: GuidedProblemSession) {
  if (!session.implementationCompleted) return 0
  return Math.max(10, 100 - session.hintLevelReached * 18)
}

export interface PatternMastery {
  pattern: CorePattern
  mastery: number
  recognition: number | null
  implementation: number | null
  recall: number | null
  independence: number | null
  evidence: number
  diagnosis: string
}

function diagnosePattern(item: Omit<PatternMastery, 'diagnosis'>) {
  if (!item.evidence) return `No measured evidence for ${item.pattern} yet. Start with recognition, not a score guess.`
  if (item.recognition === null) return `You have practice evidence for ${item.pattern}, but recognition from a blank prompt has not been measured yet.`
  if (item.implementation !== null && item.recognition + 15 < item.implementation) {
    return `You can implement ${item.pattern} better than you can recognize it. Train blank-prompt classification next.`
  }
  if (item.independence !== null && item.implementation !== null && item.independence + 15 < item.implementation) {
    return `You understand ${item.pattern} after guidance, but still depend on hints to finish it.`
  }
  if (item.recall !== null && item.recall + 15 < item.mastery) {
    return `Your first-pass ${item.pattern} work is stronger than your later recall. Schedule a blind re-solve.`
  }
  if (item.implementation !== null && item.implementation < 55) {
    return `Recognition is not the only blocker in ${item.pattern}; implementation needs smaller, repeated drills.`
  }
  return `${item.pattern} is developing evenly. Add independent variations before treating it as mastered.`
}

export function getPatternMastery(state: AppState, problems: RoadmapProblem[]): PatternMastery[] {
  return CORE_PATTERNS.map((pattern) => {
    const matchingIds = new Set(
      problems.filter((problem) => getCorePattern(problem) === pattern).map((problem) => problem.id),
    )
    const attempts = state.attempts.filter((attempt) => matchingIds.has(attempt.problemId) && attempt.outcome !== 'revision')
    const guided = state.mentor.guidedSessions.filter((session) => matchingIds.has(session.problemId))
    const recognitionAttempts = state.mentor.recognitionAttempts.filter((attempt) =>
      attempt.expectedPattern === pattern || matchingIds.has(attempt.problemId),
    )
    const revisions = state.revisions.filter((revision) => matchingIds.has(revision.problemId))
    const blindSessions = guided.filter((session) => session.mode === 'blind' && session.completedAt)

    const recognition = average(recognitionAttempts.map((attempt) => attempt.correct ? 100 : 0))
    const implementation = average([
      ...attempts.map(implementationScore),
      ...guided.filter((session) => session.completedAt).map((session) => session.implementationCompleted ? session.codeScore ?? 80 : 15),
    ])
    const recall = average([
      ...revisions.map((revision) => revision.result === 'recalled' ? 100 : 15),
      ...blindSessions.map((session) => session.implementationCompleted && session.hintLevelReached === 0 ? 100 : session.implementationCompleted ? 55 : 0),
    ])
    const independence = average([
      ...attempts.map(independenceScore),
      ...guided.filter((session) => session.completedAt).map(guidedIndependenceScore),
    ])
    const evidence = attempts.length + guided.length + recognitionAttempts.length + revisions.length
    const dimensions: Array<[number | null, number]> = [
      [recognition, 0.3],
      [implementation, 0.25],
      [recall, 0.25],
      [independence, 0.2],
    ]
    const measured = dimensions.filter((entry): entry is [number, number] => entry[0] !== null)
    const totalWeight = measured.reduce((total, [, weight]) => total + weight, 0)
    const rawMastery = totalWeight
      ? measured.reduce((total, [score, weight]) => total + score * weight, 0) / totalWeight
      : 0
    const evidenceConfidence = Math.min(1, evidence / 8)
    const mastery = evidence ? clamp(rawMastery * (0.35 + evidenceConfidence * 0.65)) : 0
    const item = {
      pattern,
      mastery,
      recognition: recognition === null ? null : clamp(recognition),
      implementation: implementation === null ? null : clamp(implementation),
      recall: recall === null ? null : clamp(recall),
      independence: independence === null ? null : clamp(independence),
      evidence,
    }
    return { ...item, diagnosis: diagnosePattern(item) }
  })
}

function evidenceAdjustedRate(successes: number, total: number, targetEvidence: number) {
  if (!total) return 0
  return clamp((successes / total) * 100 * Math.min(1, total / targetEvidence))
}

export interface ReadinessProfile {
  score: number
  fundamentals: number
  patternRecognition: number
  mediumSolving: number
  independence: number
  codingSpeed: number
  complexityReasoning: number
  recall: number
  communication: number
  diagnosis: string
}

export function getMentorReadiness(state: AppState, problems: RoadmapProblem[]): ReadinessProfile {
  const mastery = getPatternMastery(state, problems)
  const byPattern = new Map(mastery.map((item) => [item.pattern, item]))
  const fundamentals = clamp(average([
    byPattern.get('Arrays & Hashing')?.mastery ?? 0,
    byPattern.get('Two Pointers')?.mastery ?? 0,
    byPattern.get('Stack')?.mastery ?? 0,
    byPattern.get('Binary Search')?.mastery ?? 0,
  ]) ?? 0)
  const recognitionEvidence = state.mentor.recognitionAttempts
  const patternRecognition = evidenceAdjustedRate(
    recognitionEvidence.filter((attempt) => attempt.correct).length,
    recognitionEvidence.length,
    12,
  )
  const mediumIds = new Set(problems.filter((problem) => problem.difficulty === 'Medium').map((problem) => problem.id))
  const mediumAttempts = state.attempts.filter((attempt) => mediumIds.has(attempt.problemId) && attempt.outcome !== 'revision')
  const mediumIndependent = mediumAttempts.filter((attempt) => attempt.outcome === 'independent')
  const mediumSolving = evidenceAdjustedRate(mediumIndependent.length, mediumAttempts.length, 10)
  const solveAttempts = state.attempts.filter((attempt) => attempt.outcome !== 'revision')
  const independence = evidenceAdjustedRate(
    solveAttempts.filter((attempt) => attempt.outcome === 'independent').length,
    solveAttempts.length,
    15,
  )
  const timedMedium = mediumIndependent.filter((attempt) => attempt.durationSeconds > 0)
  const averageMediumMinutes = average(timedMedium.map((attempt) => attempt.durationSeconds / 60))
  const codingSpeed = averageMediumMinutes === null
    ? 0
    : clamp((100 - Math.max(0, averageMediumMinutes - 20) * 2.5) * Math.min(1, timedMedium.length / 5))
  const completedGuided = state.mentor.guidedSessions.filter((session) => session.completedAt)
  const derivationEvidence = completedGuided.flatMap((session) =>
    session.derivationScore === null ? [] : [session.derivationScore],
  )
  const complexityReasoning = derivationEvidence.length
    ? clamp((average(derivationEvidence) ?? 0) * Math.min(1, derivationEvidence.length / 8))
    : evidenceAdjustedRate(
        completedGuided.filter((session) => session.bruteForceCaptured).length,
        completedGuided.length,
        8,
      )
  const recall = evidenceAdjustedRate(
    state.revisions.filter((revision) => revision.result === 'recalled').length,
    state.revisions.length,
    10,
  )
  const communicationEvidence = [
    ...state.interviewSessions.flatMap((session) => session.results.flatMap((result) => [result.explanationScore, result.communicationScore])),
    ...completedGuided.flatMap((session) => session.explanationScore ? [session.explanationScore] : []),
  ]
  const communication = communicationEvidence.length
    ? clamp((average(communicationEvidence) ?? 0) * 20 * Math.min(1, communicationEvidence.length / 8))
    : 0
  const score = clamp(
    fundamentals * 0.18 + patternRecognition * 0.18 + mediumSolving * 0.18 +
    independence * 0.15 + codingSpeed * 0.08 + complexityReasoning * 0.08 +
    recall * 0.08 + communication * 0.07,
  )
  const dimensions = [
    ['fundamentals', fundamentals],
    ['pattern recognition', patternRecognition],
    ['Medium independence', mediumSolving],
    ['independent solving', independence],
    ['coding speed', codingSpeed],
    ['derivation', complexityReasoning],
    ['recall', recall],
    ['communication', communication],
  ] as const
  const weakest = [...dimensions].sort((left, right) => left[1] - right[1])[0]
  return {
    score,
    fundamentals,
    patternRecognition,
    mediumSolving,
    independence,
    codingSpeed,
    complexityReasoning,
    recall,
    communication,
    diagnosis: score
      ? `Your lowest measured readiness dimension is ${weakest[0]} at ${weakest[1]}%. Train that before adding harder volume.`
      : 'There is not enough first-party evidence yet. Complete the diagnostic and one guided solve before trusting a readiness number.',
  }
}

export function getRecommendedLevel(correctAnswers: number, totalAnswers: number): MentorLevel {
  const rate = totalAnswers ? correctAnswers / totalAnswers : 0
  if (rate < 0.25) return 0
  if (rate < 0.5) return 1
  if (rate < 0.75) return 2
  return 3
}

export interface ExplanationEvaluation {
  score: 1 | 2 | 3 | 4 | 5
  criteria: Array<{ label: string; met: boolean }>
}

export function evaluateExplanation(text: string, pattern: CorePattern): ExplanationEvaluation {
  const normalized = text.trim().toLowerCase()
  const patternWords = pattern.toLowerCase().split(/\s|&/).filter((word) => word.length > 3)
  const criteria = [
    { label: 'Names the pattern or core invariant', met: patternWords.some((word) => normalized.includes(word)) || /invariant|maintain/.test(normalized) },
    { label: 'Explains the algorithm steps', met: normalized.length >= 100 && /then|each|while|for|update|move|recurse|store/.test(normalized) },
    { label: 'Explains why the approach works', met: /because|therefore|ensures|guarantee|so that|cannot/.test(normalized) },
    { label: 'States time or space complexity', met: /o\s*\([^)]+\)/i.test(text) },
    { label: 'Covers an edge case', met: /edge|empty|single|duplicate|null|none|boundary|overflow/.test(normalized) },
  ]
  const met = criteria.filter((criterion) => criterion.met).length
  return { score: Math.max(1, met) as 1 | 2 | 3 | 4 | 5, criteria }
}

export interface SolveLadderStep {
  id: 'understand' | 'think' | 'hint' | 'solution' | 'reimplement' | 'explain' | 'revisit'
  label: string
  complete: boolean
}

export function getSolveLadder(state: AppState, problemId: string): SolveLadderStep[] {
  const sessions = state.mentor.guidedSessions.filter((session) => session.problemId === problemId)
  const attempts = state.attempts.filter((attempt) => attempt.problemId === problemId)
  const latest = sessions.at(-1)
  return [
    { id: 'understand', label: 'Understand', complete: Boolean(latest) },
    { id: 'think', label: 'Think', complete: Boolean(latest?.bruteForceCaptured) },
    { id: 'hint', label: 'Hint', complete: Boolean(latest && latest.hintLevelReached > 0) },
    { id: 'solution', label: 'Solution', complete: attempts.some((attempt) => attempt.outcome === 'solution') || Boolean(latest && latest.hintLevelReached === 5) },
    { id: 'reimplement', label: 'Re-implement', complete: sessions.some((session) => session.mode === 'blind' && session.implementationCompleted) },
    { id: 'explain', label: 'Explain', complete: sessions.some((session) => (session.explanationScore ?? 0) >= 3) },
    { id: 'revisit', label: 'Revisit', complete: state.revisions.some((revision) => revision.problemId === problemId && revision.result === 'recalled') },
  ]
}

export interface MissionTask {
  id: string
  label: string
  detail: string
  route: string
  problemId?: string
}

export function getDailyMentorMission(state: AppState, problems: RoadmapProblem[]): MissionTask[] {
  const mastery = getPatternMastery(state, problems)
  const progression = getLevelProgression(state, problems)
  const practiced = mastery.filter((item) => item.evidence > 0)
  const weakest = (practiced.length ? practiced : mastery).sort((left, right) => left.mastery - right.mastery)[0]
  const recommendations = getAdaptiveRecommendations(state, problems, 8)
  const due = recommendations.find(({ reason }) => reason.includes('overdue') || reason === 'Revision due')
  const warmup = recommendations.find(({ problem }) => problem.difficulty === 'Easy') ?? recommendations[0]
  const challenge = progression.activeLevel >= 3
    ? recommendations.find(({ problem }) => problem.difficulty === 'Medium')
    : null
  const recentSolved = [...state.attempts].reverse().find((attempt) => ['independent', 'hint', 'solution'].includes(attempt.outcome))
  const nextPythonLesson = PYTHON_LESSONS.find((lesson) => !state.mentor.pythonCourse[lesson.id]?.completedAt)
  const tasks: MissionTask[] = []
  if (nextPythonLesson) tasks.push({ id: 'python', label: `Python: ${nextPythonLesson.title}`, detail: `Lesson ${nextPythonLesson.order} of ${PYTHON_LESSONS.length}. Pass its executable challenge and understanding check.`, route: `/mentor/python?lesson=${nextPythonLesson.id}` })
  tasks.push(
    { id: 'concept', label: `Learn ${weakest.pattern}`, detail: 'Study recognition clues, then explain the invariant in your own words.', route: '/mentor/curriculum' },
    { id: 'recognition', label: 'Pattern recognition drill', detail: 'Classify five prompts before writing any code.', route: '/mentor/recognition' },
  )
  if (warmup) tasks.push({ id: 'warmup', label: `Guided warm-up: ${warmup.problem.title}`, detail: warmup.reason, route: `/mentor/problem/${warmup.problem.id}`, problemId: warmup.problem.id })
  if (challenge) tasks.push({ id: 'challenge', label: `Medium bridge: ${challenge.problem.title}`, detail: 'Derive brute force first; reveal only the hint level you need.', route: `/mentor/problem/${challenge.problem.id}?mode=medium-trainer`, problemId: challenge.problem.id })
  if (!challenge && progression.nextGate) tasks.push({ id: 'gate', label: `Earn Level ${progression.nextGate.level}`, detail: `Current gate progress: ${progression.nextGate.progress}%. Build Easy independence before random Mediums.`, route: '/mentor/curriculum' })
  if (due) tasks.push({ id: 'revision', label: `Blind re-solve: ${due.problem.title}`, detail: due.reason, route: `/mentor/problem/${due.problem.id}?mode=blind`, problemId: due.problem.id })
  if (recentSolved) tasks.push({ id: 'explain', label: 'Explain one solved problem', detail: 'Give the invariant, derivation, complexity, and one edge case without notes.', route: `/mentor/problem/${recentSolved.problemId}?stage=explain`, problemId: recentSolved.problemId })
  if (progression.activeLevel >= 4) tasks.push({ id: 'interview', label: 'Timed interview drill', detail: 'Practice understanding, recognition, approach, code, complexity, and communication.', route: '/interview' })
  return tasks.slice(0, 6)
}

export interface MediumLadderItem {
  problem: RoadmapProblem
  stage: 'warm-up' | 'reinforce' | 'bridge' | 'medium' | 'unseen-medium'
  complete: boolean
}

export function getMediumLadder(state: AppState, problems: RoadmapProblem[]): { pattern: CorePattern; items: MediumLadderItem[] } {
  const mastery = getPatternMastery(state, problems)
  const candidates = mastery
    .filter((item) => problems.some((problem) => getCorePattern(problem) === item.pattern && problem.difficulty === 'Easy') &&
      problems.some((problem) => getCorePattern(problem) === item.pattern && problem.difficulty === 'Medium'))
    .sort((left, right) => left.mastery - right.mastery)
  const pattern = candidates[0]?.pattern ?? 'Arrays & Hashing'
  const matching = problems.filter((problem) => getCorePattern(problem) === pattern)
  const easy = matching.filter((problem) => problem.difficulty === 'Easy').slice(0, 2)
  const medium = matching.filter((problem) => problem.difficulty === 'Medium').slice(0, 3)
  const ordered = [...easy, ...medium]
  const stages: MediumLadderItem['stage'][] = ['warm-up', 'reinforce', 'bridge', 'medium', 'unseen-medium']
  return {
    pattern,
    items: ordered.map((problem, index) => ({
      problem,
      stage: stages[index] ?? 'unseen-medium',
      complete: Boolean(state.progress[problem.id]?.solvedAt),
    })),
  }
}

export function getMistakeSummary(state: AppState) {
  const counts = new Map<string, number>()
  state.mentor.mistakes.filter((mistake) => !mistake.resolvedAt).forEach((mistake) => {
    counts.set(mistake.category, (counts.get(mistake.category) ?? 0) + 1)
  })
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((left, right) => right.count - left.count)
}