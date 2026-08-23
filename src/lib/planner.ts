import {
  differenceInCalendarDays,
  eachDayOfInterval,
  isAfter,
  parseISO,
  startOfDay,
} from 'date-fns'
import type { AppState, RoadmapProblem } from '../types'
import { getDefaultProgress, percent } from './utils'

export interface PatternStat {
  pattern: string
  practiced: number
  completed: number
  averageConfidence: number
  independentRate: number
  recallRate: number
  weakness: number
}

export function getPatternStats(state: AppState, problems: RoadmapProblem[]): PatternStat[] {
  const patterns = [...new Set(problems.flatMap((problem) => problem.patterns))]
  return patterns.map((pattern) => {
    const matching = problems.filter((problem) => problem.patterns.includes(pattern))
    const matchingIds = new Set(matching.map((problem) => problem.id))
    const attempts = state.attempts.filter((attempt) => matchingIds.has(attempt.problemId))
    const revisions = state.revisions.filter((revision) => matchingIds.has(revision.problemId))
    const completedProgress = matching
      .map((problem) => state.progress[problem.id] ?? getDefaultProgress(problem.id))
      .filter((progress) => progress.solvedAt)
    const confidences = completedProgress.flatMap((progress) =>
      progress.confidence ? [progress.confidence] : [],
    )
    const solvedAttempts = attempts.filter((attempt) =>
      ['independent', 'hint', 'solution'].includes(attempt.outcome),
    )
    const averageConfidence = confidences.length
      ? confidences.reduce((total, value) => total + value, 0) / confidences.length
      : 0
    const independentRate = solvedAttempts.length
      ? solvedAttempts.filter((attempt) => attempt.outcome === 'independent').length / solvedAttempts.length
      : 0
    const recallRate = revisions.length
      ? revisions.filter((revision) => revision.result === 'recalled').length / revisions.length
      : 0
    const completionRate = matching.length ? completedProgress.length / matching.length : 0
    const weakness = Math.round(
      (1 - completionRate) * 35 +
      (1 - averageConfidence / 5) * 30 +
      (1 - independentRate) * 20 +
      (revisions.length ? 1 - recallRate : 0.5) * 15,
    )
    return {
      pattern,
      practiced: attempts.length,
      completed: completedProgress.length,
      averageConfidence: Math.round(averageConfidence * 10) / 10,
      independentRate: Math.round(independentRate * 100),
      recallRate: Math.round(recallRate * 100),
      weakness,
    }
  }).sort((left, right) => right.weakness - left.weakness || right.practiced - left.practiced)
}

export function getPlannerSummary(
  state: AppState,
  problems: RoadmapProblem[],
  now = new Date(),
) {
  const completed = Object.values(state.progress).filter((progress) => progress.solvedAt).length
  const remaining = Math.max(0, problems.length - completed)
  const target = state.settings.planner.targetDate
    ? startOfDay(parseISO(state.settings.planner.targetDate))
    : null
  const today = startOfDay(now)
  const daysUntilTarget = target ? Math.max(0, differenceInCalendarDays(target, today)) : null
  const studyDates = target && !isAfter(today, target)
    ? eachDayOfInterval({ start: today, end: target }).filter((date) =>
        state.settings.planner.studyDays.includes(date.getDay()),
      )
    : []
  const studyDaysRemaining = target ? studyDates.length : null
  const requiredPerStudyDay = studyDaysRemaining
    ? Math.ceil(remaining / studyDaysRemaining)
    : state.settings.dailyGoal
  const isStudyDay = state.settings.planner.studyDays.includes(today.getDay())
  const plannedToday = isStudyDay
    ? Math.min(12, Math.max(state.settings.dailyGoal, requiredPerStudyDay))
    : 0

  return {
    target,
    daysUntilTarget,
    studyDaysRemaining,
    requiredPerStudyDay,
    plannedToday,
    isStudyDay,
    remaining,
    completionPercentage: percent(completed, problems.length),
    risk: target && studyDaysRemaining !== null
      ? requiredPerStudyDay > 5
        ? 'high'
        : requiredPerStudyDay > state.settings.dailyGoal
          ? 'watch'
          : 'on-track'
      : 'unconfigured',
  } as const
}

export function getAdaptiveRecommendations(
  state: AppState,
  problems: RoadmapProblem[],
  limit = 5,
  now = new Date(),
) {
  const patternStats = getPatternStats(state, problems)
  const weaknessByPattern = new Map(patternStats.map((item) => [item.pattern, item.weakness]))
  const recentBoundary = now.getTime() - 30 * 24 * 60 * 60 * 1000
  const recentAttempts = state.attempts.filter((attempt) => Date.parse(attempt.completedAt) >= recentBoundary)
  const lastAttempt = state.attempts.at(-1)
  const lastTopic = problems.find((problem) => problem.id === lastAttempt?.problemId)?.topic
  const planner = getPlannerSummary(state, problems, now)

  return problems.map((problem) => {
    const progress = state.progress[problem.id] ?? getDefaultProgress(problem.id)
    const dueAt = progress.nextRevisionAt ? Date.parse(progress.nextRevisionAt) : null
    const overdueDays = dueAt !== null && dueAt <= now.getTime()
      ? Math.max(0, differenceInCalendarDays(startOfDay(now), startOfDay(new Date(dueAt))))
      : 0
    const isDue = dueAt !== null && dueAt <= now.getTime()
    const patternWeakness = Math.max(...problem.patterns.map((pattern) => weaknessByPattern.get(pattern) ?? 50))
    const recentForProblem = recentAttempts.filter((attempt) => attempt.problemId === problem.id)
    const recentHelpPenalty = recentForProblem.some((attempt) =>
      ['hint', 'solution', 'unable'].includes(attempt.outcome),
    ) ? 35 : 0
    const confidencePenalty = progress.confidence ? (5 - progress.confidence) * 12 : 16
    const activeTopicScore = problem.topic === state.settings.activeTopic ? 32 : 0
    const varietyScore = lastTopic && problem.topic !== lastTopic ? 8 : 0
    const orderScore = Math.max(0, 24 - problem.recommendedOrder / 15)
    const paceScore = planner.risk === 'high' && !progress.solvedAt ? 20 : 0
    const modeScore = state.settings.planner.mode === 'foundation'
      ? problem.difficulty === 'Easy' ? 25 : problem.difficulty === 'Medium' ? 12 : -15
      : state.settings.planner.mode === 'interview'
        ? problem.difficulty === 'Hard' ? 25 : problem.difficulty === 'Medium' ? 18 : -8
        : problem.difficulty === 'Medium' ? 12 : 6
    const score = (isDue ? 1000 + overdueDays * 20 : 0) +
      (!progress.solvedAt ? patternWeakness * 0.7 : 0) +
      recentHelpPenalty + confidencePenalty + activeTopicScore + varietyScore +
      orderScore + paceScore + modeScore
    const weakestPattern = [...problem.patterns]
      .sort((left, right) => (weaknessByPattern.get(right) ?? 0) - (weaknessByPattern.get(left) ?? 0))[0]
    const reason = isDue
      ? overdueDays ? `${overdueDays}d overdue` : 'Revision due'
      : recentHelpPenalty
        ? 'Recent weak attempt'
        : patternWeakness >= 65
          ? `Weak pattern: ${weakestPattern}`
          : problem.topic === state.settings.activeTopic
            ? 'Current topic'
            : planner.risk === 'high'
              ? 'Target pace'
              : 'Balanced next step'
    return { problem, reason, priority: score, score: Math.round(score) }
  }).filter(({ problem, priority }) => {
    const progress = state.progress[problem.id] ?? getDefaultProgress(problem.id)
    const due = progress.nextRevisionAt && Date.parse(progress.nextRevisionAt) <= now.getTime()
    return Boolean(due || !progress.solvedAt) && priority > 0
  }).sort((left, right) =>
    right.score - left.score || left.problem.recommendedOrder - right.problem.recommendedOrder,
  ).slice(0, limit)
}