export const PROBLEM_STATUSES = [
  'not-started',
  'attempting',
  'solved',
  'solved-with-hint',
  'solved-after-solution',
  'needs-revision',
  'mastered',
] as const

export type ProblemStatus = (typeof PROBLEM_STATUSES)[number]
export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type ThemePreference = 'light' | 'dark' | 'system'
export type SolveOutcome =
  | 'independent'
  | 'hint'
  | 'solution'
  | 'unable'
  | 'revision'
export type RevisionResult = 'recalled' | 'weak'
export type SessionGoal = 1 | 2 | 3 | 5 | 'revision' | number
export type PlannerMode = 'balanced' | 'foundation' | 'interview'
export type RevisionMode = 'adaptive' | 'fixed'
export type InterviewStatus = 'active' | 'completed' | 'abandoned'

export interface RoadmapProblem {
  id: string
  leetcodeNumber: number
  title: string
  neetcodeUrl: string
  leetcodeUrl: string
  difficulty: Difficulty
  topic: string
  pattern: string
  patterns: string[]
  recommendedOrder: number
}

export interface ProblemProgress {
  problemId: string
  status: ProblemStatus
  attempts: number
  confidence: 1 | 2 | 3 | 4 | 5 | null
  notes: string
  totalTimeSeconds: number
  solvedAt: string | null
  lastAttemptAt: string | null
  lastRevisedAt: string | null
  revisionStage: number
  nextRevisionAt: string | null
  revisionEase: number
  revisionIntervalDays: number
  revisionLapses: number
  successfulRecalls: number
  lastRevisionResult: RevisionResult | null
}

export interface SolveAttempt {
  id: string
  problemId: string
  startedAt: string
  completedAt: string
  durationSeconds: number
  outcome: SolveOutcome
  attempts: number
  confidence: 1 | 2 | 3 | 4 | 5
  notes: string
  revisionNeeded: boolean
  sessionId: string | null
}

export interface RevisionRecord {
  id: string
  problemId: string
  completedAt: string
  result: RevisionResult
  stageBefore: number
  stageAfter: number
  confidence: 1 | 2 | 3 | 4 | 5
  durationSeconds: number
  intervalDays: number
  easeAfter: number
}

export interface StudySession {
  id: string
  startedAt: string
  endedAt: string | null
  goal: SessionGoal
  problemIds: string[]
  attemptIds: string[]
  durationSeconds: number
}

export interface InterviewResult {
  problemId: string
  durationSeconds: number
  outcome: Exclude<SolveOutcome, 'revision'>
  explanationScore: 1 | 2 | 3 | 4 | 5
  codingScore: 1 | 2 | 3 | 4 | 5
  communicationScore: 1 | 2 | 3 | 4 | 5
  notes: string
}

export interface InterviewSession {
  id: string
  startedAt: string
  endedAt: string | null
  targetMinutes: number
  difficulty: Difficulty | 'Mixed'
  problemIds: string[]
  results: InterviewResult[]
  status: InterviewStatus
}

export interface PlannerSettings {
  targetDate: string | null
  studyDays: number[]
  sessionMinutes: number
  mode: PlannerMode
}

export interface UserSettings {
  dailyGoal: number
  activeTopic: string
  theme: ThemePreference
  autoStartTimer: boolean
  revisionIntervals: number[]
  revisionMode: RevisionMode
  backupRetention: number
  planner: PlannerSettings
}

export interface Achievement {
  id: string
  title: string
  description: string
  unlockedAt: string | null
}

export interface DailyActivity {
  date: string
  attemptedProblemIds: string[]
  solvedProblemIds: string[]
  studySeconds: number
}

export interface AppState {
  version: 2
  progress: Record<string, ProblemProgress>
  attempts: SolveAttempt[]
  revisions: RevisionRecord[]
  sessions: StudySession[]
  interviewSessions: InterviewSession[]
  activeTimer: ActiveTimer | null
  settings: UserSettings
  achievements: Achievement[]
  createdAt: string
  updatedAt: string
}

export interface ActiveTimer {
  problemId: string
  startedAt: string
  elapsedSeconds: number
  running: boolean
}