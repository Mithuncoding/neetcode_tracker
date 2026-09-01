import type {
  AppState,
  Difficulty,
  InterviewResult,
  InterviewSession,
  RoadmapProblem,
} from '../types'
import { getAdaptiveRecommendations } from './planner'
import { clamp } from './utils'

export function selectInterviewProblems(
  state: AppState,
  problems: RoadmapProblem[],
  count: number,
  difficulty: Difficulty | 'Mixed',
) {
  const adaptiveScores = new Map(
    getAdaptiveRecommendations(state, problems, problems.length)
      .map(({ problem, score }) => [problem.id, score]),
  )
  const attemptedIds = new Set(state.attempts.map((attempt) => attempt.problemId))
  const ranked = problems.map((problem) => ({
    problem,
    score: (adaptiveScores.get(problem.id) ?? 0) + (attemptedIds.has(problem.id) ? 0 : 10_000),
  }))
    .filter(({ problem }) => difficulty === 'Mixed' || problem.difficulty === difficulty)
    .sort((left, right) => right.score - left.score || left.problem.recommendedOrder - right.problem.recommendedOrder)

  if (difficulty !== 'Mixed') {
    return ranked.slice(0, count).map(({ problem }) => problem)
  }

  const selected: RoadmapProblem[] = []
  const order: Difficulty[] = ['Medium', 'Hard', 'Easy']
  for (let index = 0; selected.length < count && index < ranked.length * 2; index += 1) {
    const desired = order[index % order.length]
    const candidate = ranked.find(({ problem }) =>
      problem.difficulty === desired && !selected.some((item) => item.id === problem.id),
    )
    if (candidate) selected.push(candidate.problem)
  }
  return selected.slice(0, count)
}

export function getInterviewSessionScore(session: InterviewSession) {
  if (!session.results.length) {
    return { overall: 0, understanding: 0, patternRecognition: 0, approach: 0, coding: 0, complexity: 0, explanation: 0, communication: 0, independentRate: 0, weakest: 'Not measured' }
  }
  const average = (key: 'understandingScore' | 'patternRecognitionScore' | 'approachScore' | 'codingScore' | 'complexityScore' | 'explanationScore' | 'communicationScore') =>
    session.results.reduce((total, result) => total + result[key], 0) / session.results.length
  const understanding = average('understandingScore')
  const patternRecognition = average('patternRecognitionScore')
  const approach = average('approachScore')
  const coding = average('codingScore')
  const complexity = average('complexityScore')
  const explanation = average('explanationScore')
  const communication = average('communicationScore')
  const independentRate = session.results.filter((result) => result.outcome === 'independent' && result.hintsUsed === 0).length /
    session.results.length
  const overall = clamp(Math.round(
    (understanding / 5) * 10 +
    (patternRecognition / 5) * 15 +
    (approach / 5) * 15 +
    (coding / 5) * 20 +
    (complexity / 5) * 10 +
    (explanation / 5) * 10 +
    (communication / 5) * 10 +
    independentRate * 10,
  ), 0, 100)
  const rounded = (value: number) => Math.round(value * 10) / 10
  const dimensions = [
    ['Problem understanding', understanding],
    ['Pattern recognition', patternRecognition],
    ['Approach', approach],
    ['Coding', coding],
    ['Complexity', complexity],
    ['Explanation', explanation],
    ['Communication', communication],
  ] as const
  const weakest = [...dimensions].sort((left, right) => left[1] - right[1])[0][0]
  return {
    overall,
    understanding: rounded(understanding),
    patternRecognition: rounded(patternRecognition),
    approach: rounded(approach),
    coding: rounded(coding),
    complexity: rounded(complexity),
    explanation: rounded(explanation),
    communication: rounded(communication),
    independentRate: Math.round(independentRate * 100),
    weakest,
  }
}

export function getReadinessScore(sessions: InterviewSession[]) {
  const completed = sessions.filter((session) => session.status === 'completed' && session.results.length)
  if (!completed.length) return { score: 0, trend: 0, sessions: 0 }
  const recent = completed.slice(-5).map((session) => getInterviewSessionScore(session).overall)
  const previous = completed.slice(-10, -5).map((session) => getInterviewSessionScore(session).overall)
  const average = (values: number[]) => values.reduce((total, value) => total + value, 0) / values.length
  const score = Math.round(average(recent))
  const trend = previous.length ? score - Math.round(average(previous)) : 0
  return { score, trend, sessions: completed.length }
}

export function getInterviewResultLabel(result: InterviewResult) {
  if (result.outcome === 'independent') return 'Independent solve'
  if (result.outcome === 'hint') return 'Solved with a hint'
  if (result.outcome === 'solution') return 'Needed the solution'
  return 'Unable to finish'
}