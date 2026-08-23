import { z } from 'zod'
import { createAchievements } from '../data/achievements'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { PROBLEM_STATUSES, type AppState } from '../types'
import { clearBackups, readBackup, rotateBackups } from './backups'

export const STORAGE_KEY = 'neetcode-250-tracker:v2'
export const BACKUP_KEY = 'neetcode-250-tracker:backup:v2'
const LEGACY_STORAGE_KEY = 'neetcode-250-tracker:v1'
const LEGACY_BACKUP_KEY = 'neetcode-250-tracker:backup:v1'

let storageHealthy = true
const storageHealthListeners = new Set<() => void>()

function setStorageHealth(healthy: boolean) {
  if (storageHealthy === healthy) return
  storageHealthy = healthy
  storageHealthListeners.forEach((listener) => listener())
}

export function subscribeStorageHealth(listener: () => void) {
  storageHealthListeners.add(listener)
  return () => {
    storageHealthListeners.delete(listener)
  }
}

export function getStorageHealth() {
  return storageHealthy
}

const confidenceSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
])
const nullableConfidenceSchema = confidenceSchema.nullable()
const progressSchema = z.object({
  problemId: z.string(),
  status: z.enum(PROBLEM_STATUSES),
  attempts: z.number().int().nonnegative(),
  confidence: nullableConfidenceSchema,
  notes: z.string(),
  totalTimeSeconds: z.number().nonnegative(),
  solvedAt: z.string().nullable(),
  lastAttemptAt: z.string().nullable(),
  lastRevisedAt: z.string().nullable(),
  revisionStage: z.number().int().nonnegative(),
  nextRevisionAt: z.string().nullable(),
  revisionEase: z.number().min(1.3).max(4).default(2.5),
  revisionIntervalDays: z.number().int().nonnegative().default(1),
  revisionLapses: z.number().int().nonnegative().default(0),
  successfulRecalls: z.number().int().nonnegative().default(0),
  lastRevisionResult: z.enum(['recalled', 'weak']).nullable().default(null),
})
const attemptSchema = z.object({
  id: z.string(),
  problemId: z.string(),
  startedAt: z.string(),
  completedAt: z.string(),
  durationSeconds: z.number().nonnegative(),
  outcome: z.enum(['independent', 'hint', 'solution', 'unable', 'revision']),
  attempts: z.number().int().positive(),
  confidence: confidenceSchema,
  notes: z.string(),
  revisionNeeded: z.boolean(),
  sessionId: z.string().nullable(),
})
const revisionSchema = z.object({
  id: z.string(),
  problemId: z.string(),
  completedAt: z.string(),
  result: z.enum(['recalled', 'weak']),
  stageBefore: z.number().int().nonnegative(),
  stageAfter: z.number().int().nonnegative(),
  confidence: confidenceSchema,
  durationSeconds: z.number().nonnegative(),
  intervalDays: z.number().int().nonnegative().default(1),
  easeAfter: z.number().min(1.3).max(4).default(2.5),
})
const sessionSchema = z.object({
  id: z.string(),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  goal: z.union([z.number().int().positive(), z.literal('revision')]),
  problemIds: z.array(z.string()),
  attemptIds: z.array(z.string()),
  durationSeconds: z.number().nonnegative(),
})
const achievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  unlockedAt: z.string().nullable(),
})
const timerSchema = z.object({
  problemId: z.string(),
  startedAt: z.string(),
  elapsedSeconds: z.number().nonnegative(),
  running: z.boolean(),
})
const interviewResultSchema = z.object({
  problemId: z.string(),
  durationSeconds: z.number().nonnegative(),
  outcome: z.enum(['independent', 'hint', 'solution', 'unable']),
  explanationScore: confidenceSchema,
  codingScore: confidenceSchema,
  communicationScore: confidenceSchema,
  notes: z.string(),
})
const interviewSessionSchema = z.object({
  id: z.string(),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  targetMinutes: z.number().int().positive(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Mixed']),
  problemIds: z.array(z.string()),
  results: z.array(interviewResultSchema),
  status: z.enum(['active', 'completed', 'abandoned']),
})
const plannerSchema = z.object({
  targetDate: z.string().nullable(),
  studyDays: z.array(z.number().int().min(0).max(6)).min(1),
  sessionMinutes: z.number().int().min(15).max(360),
  mode: z.enum(['balanced', 'foundation', 'interview']),
})

const appStateSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  progress: z.record(z.string(), progressSchema),
  attempts: z.array(attemptSchema),
  revisions: z.array(revisionSchema),
  sessions: z.array(sessionSchema),
  interviewSessions: z.array(interviewSessionSchema).default([]),
  activeTimer: timerSchema.nullable(),
  settings: z.object({
    dailyGoal: z.number().int().min(1).max(25),
    activeTopic: z.string(),
    theme: z.enum(['light', 'dark', 'system']),
    autoStartTimer: z.boolean(),
    revisionIntervals: z.array(z.number().int().positive()).min(1).max(12),
    revisionMode: z.enum(['adaptive', 'fixed']).default('adaptive'),
    backupRetention: z.number().int().min(1).max(10).default(5),
    planner: plannerSchema.default({
      targetDate: null,
      studyDays: [1, 2, 3, 4, 5, 6],
      sessionMinutes: 75,
      mode: 'balanced',
    }),
  }),
  achievements: z.array(achievementSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
}).transform((state): AppState => ({ ...state, version: 2 }))

export function createInitialState(): AppState {
  const now = new Date().toISOString()
  return {
    version: 2,
    progress: {},
    attempts: [],
    revisions: [],
    sessions: [],
    interviewSessions: [],
    activeTimer: null,
    settings: {
      dailyGoal: 2,
      activeTopic: ROADMAP_PROBLEMS[0].topic,
      theme: 'system',
      autoStartTimer: true,
      revisionIntervals: [1, 3, 7, 14, 30, 60],
      revisionMode: 'adaptive',
      backupRetention: 5,
      planner: {
        targetDate: null,
        studyDays: [1, 2, 3, 4, 5, 6],
        sessionMinutes: 75,
        mode: 'balanced',
      },
    },
    achievements: createAchievements(),
    createdAt: now,
    updatedAt: now,
  }
}

function parseState(value: string | null): AppState | null {
  if (!value) return null
  try {
    const result = appStateSchema.safeParse(JSON.parse(value))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function loadState() {
  const primary = parseState(localStorage.getItem(STORAGE_KEY))
  if (primary) return { state: primary, recovered: false }
  for (let index = 0; index < 10; index += 1) {
    const rotated = readBackup(index)
    const valid = rotated ? parseState(JSON.stringify(rotated)) : null
    if (valid) return { state: valid, recovered: true }
  }
  const backup = parseState(localStorage.getItem(BACKUP_KEY))
  if (backup) return { state: backup, recovered: true }
  const legacy = parseState(localStorage.getItem(LEGACY_STORAGE_KEY))
  if (legacy) return { state: legacy, recovered: false }
  const legacyBackup = parseState(localStorage.getItem(LEGACY_BACKUP_KEY))
  if (legacyBackup) return { state: legacyBackup, recovered: true }
  return { state: createInitialState(), recovered: false }
}

export function saveState(state: AppState) {
  try {
    const current = localStorage.getItem(STORAGE_KEY)
    const currentState = parseState(current)
    if (currentState && currentState.updatedAt !== state.updatedAt) {
      rotateBackups(currentState, state.settings.backupRetention)
      localStorage.setItem(BACKUP_KEY, current as string)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    setStorageHealth(true)
    return true
  } catch {
    setStorageHealth(false)
    return false
  }
}

export function serializeState(state: AppState) {
  return JSON.stringify(state, null, 2)
}

export function clearStoredData() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(BACKUP_KEY)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
  localStorage.removeItem(LEGACY_BACKUP_KEY)
  clearBackups()
}

export function parseImportedState(value: string): AppState {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error('This file is not valid JSON.')
  }

  const result = appStateSchema.safeParse(parsed)
  if (!result.success) throw new Error('This backup is not a valid NeetCode 250 Tracker export.')

  const knownIds = new Set(ROADMAP_PROBLEMS.map((problem) => problem.id))
  const hasUnknownProblem = [
    ...Object.keys(result.data.progress),
    ...result.data.attempts.map((attempt) => attempt.problemId),
    ...result.data.revisions.map((revision) => revision.problemId),
    ...result.data.sessions.flatMap((session) => session.problemIds),
    ...result.data.interviewSessions.flatMap((session) => [
      ...session.problemIds,
      ...session.results.map((interviewResult) => interviewResult.problemId),
    ]),
  ].some((problemId) => !knownIds.has(problemId))

  if (hasUnknownProblem) throw new Error('This backup contains unknown roadmap problems.')
  return result.data
}