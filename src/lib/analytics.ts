import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfWeek,
  subDays,
} from 'date-fns'
import type { AppState, DailyActivity, ProblemProgress, RoadmapProblem } from '../types'
import { clamp, dateKey, getDefaultProgress, median, percent } from './utils'
import { getAdaptiveRecommendations } from './planner'

export function getProblemProgress(state: AppState, problemId: string) {
  return state.progress[problemId] ?? getDefaultProgress(problemId)
}

export function getDailyActivity(state: AppState): DailyActivity[] {
  const activity = new Map<string, DailyActivity>()
  const ensureDay = (date: string) => {
    const key = dateKey(date)
    const existing = activity.get(key)
    if (existing) return existing
    const day = { date: key, attemptedProblemIds: [], solvedProblemIds: [], studySeconds: 0 }
    activity.set(key, day)
    return day
  }

  for (const attempt of state.attempts) {
    const day = ensureDay(attempt.completedAt)
    if (!day.attemptedProblemIds.includes(attempt.problemId)) day.attemptedProblemIds.push(attempt.problemId)
    if (
      ['independent', 'hint', 'solution'].includes(attempt.outcome) &&
      !day.solvedProblemIds.includes(attempt.problemId)
    ) {
      day.solvedProblemIds.push(attempt.problemId)
    }
    day.studySeconds += attempt.durationSeconds
  }

  for (const revision of state.revisions) {
    const day = ensureDay(revision.completedAt)
    if (!day.attemptedProblemIds.includes(revision.problemId)) day.attemptedProblemIds.push(revision.problemId)
    day.studySeconds += revision.durationSeconds
  }

  return [...activity.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function getStreaks(state: AppState) {
  const activeKeys = new Set(getDailyActivity(state).map((day) => day.date))
  if (!activeKeys.size) return { current: 0, longest: 0 }

  const sorted = [...activeKeys].sort()
  let longest = 1
  let run = 1
  for (let index = 1; index < sorted.length; index += 1) {
    run = differenceInCalendarDays(parseISO(sorted[index]), parseISO(sorted[index - 1])) === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  }

  let cursor = startOfDay(new Date())
  if (!activeKeys.has(dateKey(cursor))) cursor = subDays(cursor, 1)
  let current = 0
  while (activeKeys.has(dateKey(cursor))) {
    current += 1
    cursor = subDays(cursor, 1)
  }
  return { current, longest }
}

export function getCompletedIds(state: AppState) {
  return new Set(
    Object.values(state.progress)
      .filter((progress) => progress.solvedAt)
      .map((progress) => progress.problemId),
  )
}

export function getStats(state: AppState, problems: RoadmapProblem[]) {
  const completedIds = getCompletedIds(state)
  const activity = getDailyActivity(state)
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const monthKey = format(now, 'yyyy-MM')
  const solvedAttempts = state.attempts.filter((attempt) =>
    ['independent', 'hint', 'solution'].includes(attempt.outcome),
  )
  const durations = solvedAttempts.map((attempt) => attempt.durationSeconds).filter(Boolean)
  const streaks = getStreaks(state)

  return {
    completed: completedIds.size,
    remaining: problems.length - completedIds.size,
    percentage: percent(completedIds.size, problems.length),
    solvedToday: activity.find((day) => day.date === dateKey())?.solvedProblemIds.length ?? 0,
    solvedThisWeek: activity
      .filter((day) => !isBefore(parseISO(day.date), weekStart))
      .reduce((total, day) => total + day.solvedProblemIds.length, 0),
    solvedThisMonth: activity
      .filter((day) => day.date.startsWith(monthKey))
      .reduce((total, day) => total + day.solvedProblemIds.length, 0),
    independent: state.attempts.filter((attempt) => attempt.outcome === 'independent').length,
    averageSeconds: durations.length
      ? Math.round(durations.reduce((total, duration) => total + duration, 0) / durations.length)
      : 0,
    medianSeconds: Math.round(median(durations)),
    fastestSeconds: durations.length ? Math.min(...durations) : 0,
    slowestSeconds: durations.length ? Math.max(...durations) : 0,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
  }
}

export interface TopicStat {
  topic: string
  total: number
  completed: number
  percentage: number
  averageConfidence: number
  averageSeconds: number
  practiced: number
  easy: { completed: number; total: number }
  medium: { completed: number; total: number }
  hard: { completed: number; total: number }
}

export function getTopicStats(state: AppState, problems: RoadmapProblem[]): TopicStat[] {
  const topics = [...new Set(problems.map((problem) => problem.topic))]
  return topics.map((topic) => {
    const topicProblems = problems.filter((problem) => problem.topic === topic)
    const progress = topicProblems.map((problem) => getProblemProgress(state, problem.id))
    const completed = progress.filter((item) => item.solvedAt)
    const attempts = state.attempts.filter((attempt) =>
      topicProblems.some((problem) => problem.id === attempt.problemId),
    )
    const confidences = completed.flatMap((item) => (item.confidence ? [item.confidence] : []))
    const durations = attempts.map((attempt) => attempt.durationSeconds).filter(Boolean)
    const difficulty = (value: RoadmapProblem['difficulty']) => {
      const matching = topicProblems.filter((problem) => problem.difficulty === value)
      return {
        total: matching.length,
        completed: matching.filter((problem) => getProblemProgress(state, problem.id).solvedAt).length,
      }
    }

    return {
      topic,
      total: topicProblems.length,
      completed: completed.length,
      percentage: percent(completed.length, topicProblems.length),
      averageConfidence: confidences.length
        ? Math.round((confidences.reduce((sum, value) => sum + value, 0) / confidences.length) * 10) / 10
        : 0,
      averageSeconds: durations.length
        ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
        : 0,
      practiced: attempts.length,
      easy: difficulty('Easy'),
      medium: difficulty('Medium'),
      hard: difficulty('Hard'),
    }
  })
}

export function getRecommendations(state: AppState, problems: RoadmapProblem[], limit = 5) {
  return getAdaptiveRecommendations(state, problems, limit)
}

export function getRevisionBuckets(state: AppState, problems: RoadmapProblem[]) {
  const now = startOfDay(new Date())
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const items = problems
    .map((problem) => ({ problem, progress: getProblemProgress(state, problem.id) }))
    .filter((item): item is { problem: RoadmapProblem; progress: ProblemProgress & { nextRevisionAt: string } } =>
      Boolean(item.progress.nextRevisionAt),
    )
    .sort((a, b) => a.progress.nextRevisionAt.localeCompare(b.progress.nextRevisionAt))

  return {
    overdue: items.filter((item) => isBefore(parseISO(item.progress.nextRevisionAt), now)),
    today: items.filter((item) => isSameDay(parseISO(item.progress.nextRevisionAt), now)),
    thisWeek: items.filter((item) => {
      const due = parseISO(item.progress.nextRevisionAt)
      return isAfter(due, now) && !isAfter(due, weekEnd)
    }),
    upcoming: items.filter((item) => isAfter(parseISO(item.progress.nextRevisionAt), weekEnd)),
  }
}

export function getProgressSeries(state: AppState) {
  const solvedByDate = new Map<string, Set<string>>()
  for (const attempt of state.attempts) {
    if (!['independent', 'hint', 'solution'].includes(attempt.outcome)) continue
    const key = dateKey(attempt.completedAt)
    const ids = solvedByDate.get(key) ?? new Set<string>()
    ids.add(attempt.problemId)
    solvedByDate.set(key, ids)
  }
  if (!solvedByDate.size) return []
  const dates = [...solvedByDate.keys()].sort()
  const interval = eachDayOfInterval({ start: parseISO(dates[0]), end: new Date() })
  const completed = new Set<string>()
  return interval.map((day) => {
    const solved = solvedByDate.get(dateKey(day)) ?? new Set<string>()
    solved.forEach((id) => completed.add(id))
    return { date: format(day, 'MMM d'), solved: solved.size, cumulative: completed.size }
  })
}

export function getCompletionProjection(state: AppState, totalProblems: number) {
  const completed = getCompletedIds(state).size
  const activity = getDailyActivity(state)
  if (!completed) return { pace: 0, daysRemaining: null, date: null }
  const firstDate = parseISO(activity[0]?.date ?? dateKey())
  const elapsedDays = Math.max(1, differenceInCalendarDays(new Date(), firstDate) + 1)
  const pace = completed / elapsedDays
  const daysRemaining = Math.ceil((totalProblems - completed) / pace)
  const finish = new Date()
  finish.setDate(finish.getDate() + daysRemaining)
  return { pace: Math.round(pace * 100) / 100, daysRemaining, date: finish }
}

export function getHelpBreakdown(state: AppState) {
  const attempts = state.attempts.filter((attempt) => attempt.outcome !== 'revision')
  const count = (outcome: string) => attempts.filter((attempt) => attempt.outcome === outcome).length
  return [
    { name: 'Independent', value: percent(count('independent'), attempts.length), count: count('independent') },
    { name: 'Used hint', value: percent(count('hint'), attempts.length), count: count('hint') },
    { name: 'Watched solution', value: percent(count('solution'), attempts.length), count: count('solution') },
    { name: 'Unable initially', value: percent(count('unable'), attempts.length), count: count('unable') },
  ]
}

export function getScores(state: AppState, problems: RoadmapProblem[]) {
  const activity = getDailyActivity(state)
  const last28 = eachDayOfInterval({ start: subDays(new Date(), 27), end: new Date() })
  const activeDays = last28.filter((day) => activity.some((item) => item.date === dateKey(day))).length
  const goalDays = last28.filter((day) => {
    const solved = activity.find((item) => item.date === dateKey(day))?.solvedProblemIds.length ?? 0
    return solved >= state.settings.dailyGoal
  }).length
  const streaks = getStreaks(state)
  const consistency = clamp(Math.round(activeDays * 2 + goalDays * 2 + Math.min(streaks.current, 14) * 2), 0, 100)

  const completed = problems.filter((problem) => getProblemProgress(state, problem.id).solvedAt)
  const confidenceValues = completed.flatMap((problem) => {
    const confidence = getProblemProgress(state, problem.id).confidence
    return confidence ? [confidence] : []
  })
  const confidenceScore = confidenceValues.length
    ? (confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length / 5) * 45
    : 0
  const solvedAttempts = state.attempts.filter((attempt) => ['independent', 'hint', 'solution'].includes(attempt.outcome))
  const independentRate = solvedAttempts.length
    ? state.attempts.filter((attempt) => attempt.outcome === 'independent').length / solvedAttempts.length
    : 0
  const hardRate = percent(
    completed.filter((problem) => problem.difficulty === 'Hard').length,
    Math.max(1, problems.filter((problem) => problem.difficulty === 'Hard').length),
  )
  const revisionSuccess = state.revisions.length
    ? state.revisions.filter((revision) => revision.result === 'recalled').length / state.revisions.length
    : 0
  const strength = clamp(Math.round(confidenceScore + independentRate * 25 + hardRate * 0.15 + revisionSuccess * 15), 0, 100)
  return { consistency, strength }
}