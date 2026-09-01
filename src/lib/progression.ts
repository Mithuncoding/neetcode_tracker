import type { AppState, MentorLevel, RoadmapProblem } from '../types'
import { getInterviewSessionScore } from './interview'

export const LEVEL_NAMES = [
  'Programming foundation',
  'Pattern recognition',
  'Easy implementation',
  'Easy to Medium transition',
  'Medium pattern mastery',
  'Medium combinations',
  'Advanced problem solving',
  'Interview simulation',
] as const

export interface LevelRequirement {
  label: string
  current: number
  target: number
  suffix?: string
  met: boolean
}

export interface LevelGate {
  level: MentorLevel
  name: string
  requirements: LevelRequirement[]
  complete: boolean
  progress: number
}

const requirement = (label: string, current: number, target: number, suffix = ''): LevelRequirement => ({
  label,
  current,
  target,
  suffix,
  met: current >= target,
})

function uniqueIndependent(state: AppState, ids: Set<string>) {
  return new Set(state.attempts
    .filter((attempt) => attempt.outcome === 'independent' && ids.has(attempt.problemId))
    .map((attempt) => attempt.problemId)).size
}

function developedPatternCount(state: AppState, problems: RoadmapProblem[]) {
  const topicByProblem = new Map(problems.map((problem) => [problem.id, problem.topic]))
  const evidence = new Map<string, { independent: Set<string>; recognition: number; recall: number }>()
  const entry = (problemId: string) => {
    const topic = topicByProblem.get(problemId)
    if (!topic) return null
    const current = evidence.get(topic) ?? { independent: new Set<string>(), recognition: 0, recall: 0 }
    evidence.set(topic, current)
    return current
  }
  state.attempts.filter((attempt) => attempt.outcome === 'independent').forEach((attempt) => {
    entry(attempt.problemId)?.independent.add(attempt.problemId)
  })
  state.mentor.recognitionAttempts.filter((attempt) => attempt.correct).forEach((attempt) => {
    const current = entry(attempt.problemId)
    if (current) current.recognition += 1
  })
  state.revisions.filter((revision) => revision.result === 'recalled').forEach((revision) => {
    const current = entry(revision.problemId)
    if (current) current.recall += 1
  })
  return [...evidence.values()].filter((item) =>
    item.independent.size >= 3 && item.recognition >= 2 && item.recall >= 1,
  ).length
}

export function getLevelGates(state: AppState, problems: RoadmapProblem[]): LevelGate[] {
  const easyIds = new Set(problems.filter((problem) => problem.difficulty === 'Easy').map((problem) => problem.id))
  const mediumIds = new Set(problems.filter((problem) => problem.difficulty === 'Medium').map((problem) => problem.id))
  const hardIds = new Set(problems.filter((problem) => problem.difficulty === 'Hard').map((problem) => problem.id))
  const recognitionTotal = state.mentor.recognitionAttempts.length
  const recognitionCorrect = state.mentor.recognitionAttempts.filter((attempt) => attempt.correct).length
  const recognitionRate = recognitionTotal ? Math.round((recognitionCorrect / recognitionTotal) * 100) : 0
  const independentEasy = uniqueIndependent(state, easyIds)
  const independentMedium = uniqueIndependent(state, mediumIds)
  const independentHard = uniqueIndependent(state, hardIds)
  const blindRecalls = state.mentor.guidedSessions.filter((session) =>
    session.mode === 'blind' && session.implementationCompleted && session.hintLevelReached === 0,
  ).length
  const strongExplanations = state.mentor.guidedSessions.filter((session) =>
    (session.explanationScore ?? 0) >= 4,
  ).length
  const masteredPatterns = developedPatternCount(state, problems)
  const timedMediums = new Set(state.attempts.filter((attempt) =>
    attempt.outcome === 'independent' && mediumIds.has(attempt.problemId) &&
    attempt.durationSeconds > 0 && attempt.durationSeconds <= 45 * 60,
  ).map((attempt) => attempt.problemId)).size
  const completedMocks = state.interviewSessions.filter((session) =>
    session.status === 'completed' && session.results.length > 0,
  )
  const mockAverage = completedMocks.length
    ? Math.round(completedMocks.reduce((total, session) => total + getInterviewSessionScore(session).overall, 0) / completedMocks.length)
    : 0

  const gateRequirements: LevelRequirement[][] = [
    [],
    [requirement('Complete the reasoning diagnostic', state.mentor.onboardingComplete ? 1 : 0, 1)],
    [
      requirement('Recognition attempts', recognitionTotal, 10),
      requirement('Recognition accuracy', recognitionRate, 60, '%'),
      requirement('Independent Easy solves', independentEasy, 5),
    ],
    [
      requirement('Recognition attempts', recognitionTotal, 20),
      requirement('Recognition accuracy', recognitionRate, 70, '%'),
      requirement('Independent Easy solves', independentEasy, 15),
      requirement('Developing patterns', masteredPatterns, 3),
    ],
    [
      requirement('Independent Medium solves', independentMedium, 5),
      requirement('Blind recalls without hints', blindRecalls, 5),
      requirement('Strong explanations', strongExplanations, 5),
    ],
    [
      requirement('Independent Medium solves', independentMedium, 20),
      requirement('Mastered patterns', masteredPatterns, 8),
      requirement('Recognition accuracy', recognitionRate, 75, '%'),
      requirement('Blind recalls without hints', blindRecalls, 15),
    ],
    [
      requirement('Independent Medium solves', independentMedium, 40),
      requirement('Independent Hard solves', independentHard, 3),
      requirement('Mastered patterns', masteredPatterns, 12),
      requirement('Timed Medium solves', timedMediums, 15),
    ],
    [
      requirement('Completed mock interviews', completedMocks.length, 5),
      requirement('Average mock score', mockAverage, 70, '%'),
      requirement('Timed Medium solves', timedMediums, 25),
      requirement('Strong explanations', strongExplanations, 25),
    ],
  ]

  return gateRequirements.map((requirements, level) => {
    const progress = requirements.length
      ? Math.round(requirements.reduce((total, item) => total + Math.min(1, item.current / item.target), 0) / requirements.length * 100)
      : 100
    return {
      level: level as MentorLevel,
      name: LEVEL_NAMES[level],
      requirements,
      complete: requirements.every((item) => item.met),
      progress,
    }
  })
}

export function getLevelProgression(state: AppState, problems: RoadmapProblem[]) {
  const gates = getLevelGates(state, problems)
  let earnedLevel: MentorLevel = 0
  for (const gate of gates.slice(1)) {
    if (!gate.complete) break
    earnedLevel = gate.level
  }
  const activeLevel = Math.max(state.mentor.currentLevel, earnedLevel) as MentorLevel
  const nextLevel = Math.min(7, activeLevel + 1) as MentorLevel
  return {
    placementLevel: state.mentor.currentLevel,
    earnedLevel,
    activeLevel,
    nextGate: gates[nextLevel],
    gates,
  }
}