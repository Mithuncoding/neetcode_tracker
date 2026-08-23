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
    return { overall: 0, coding: 0, explanation: 0, communication: 0, independentRate: 0 }
  }
  const average = (key: 'codingScore' | 'explanationScore' | 'communicationScore') =>
    session.results.reduce((total, result) => total + result[key], 0) / session.results.length
  const coding = average('codingScore')
  const explanation = average('explanationScore')
  const communication = average('communicationScore')
  const independentRate = session.results.filter((result) => result.outcome === 'independent').length /
    session.results.length
  const overall = clamp(Math.round(
    (coding / 5) * 35 +
    (explanation / 5) * 30 +
    (communication / 5) * 20 +
    independentRate * 15,
  ), 0, 100)
  return {
    overall,
    coding: Math.round(coding * 10) / 10,
    explanation: Math.round(explanation * 10) / 10,
    communication: Math.round(communication * 10) / 10,
    independentRate: Math.round(independentRate * 100),
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