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
export type MentorLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
export type HintLevel = 0 | 1 | 2 | 3 | 4 | 5
export type LearningMode = 'guided' | 'blind' | 'recognition' | 'medium-trainer'
export type FailureReason =
  | 'problem-understanding'
  | 'pattern-recognition'
  | 'wrong-approach'
  | 'implementation'
  | 'edge-case'
  | 'complexity'
  | 'time'

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
  patternGuess?: string | null
  patternCorrect?: boolean | null
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
  understandingScore: 1 | 2 | 3 | 4 | 5
  patternRecognitionScore: 1 | 2 | 3 | 4 | 5
  approachScore: 1 | 2 | 3 | 4 | 5
  explanationScore: 1 | 2 | 3 | 4 | 5
  codingScore: 1 | 2 | 3 | 4 | 5
  complexityScore: 1 | 2 | 3 | 4 | 5
  communicationScore: 1 | 2 | 3 | 4 | 5
  hintsUsed: number
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

export interface GuidedProblemSession {
  id: string
  problemId: string
  mode: LearningMode
  startedAt: string
  completedAt: string | null
  hintLevelReached: HintLevel
  recognizedPattern: boolean | null
  bruteForceCaptured: boolean
  understandingScore: number | null
  derivationScore: number | null
  implementationCompleted: boolean
  code: string
  codeScore: number | null
  explanation: string
  explanationScore: 1 | 2 | 3 | 4 | 5 | null
  failureReason: FailureReason | null
  reflection: string
}

export interface PatternRecognitionAttempt {
  id: string
  problemId: string
  selectedPattern: string
  expectedPattern: string
  correct: boolean
  confidence: 1 | 2 | 3 | 4 | 5
  createdAt: string
}

export interface MistakeRecord {
  id: string
  problemId: string
  category: FailureReason
  note: string
  createdAt: string
  resolvedAt: string | null
}

export interface DiagnosticAnswer {
  questionId: string
  pattern: string
  correct: boolean
}

export interface DiagnosticResult {
  completedAt: string
  recommendedLevel: MentorLevel
  answers: DiagnosticAnswer[]
}

export interface LeetCodeProfileSnapshot {
  username: string
  syncedAt: string
  ranking: number | null
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  acceptanceRate: number | null
  activeDays: number | null
  maxStreak: number | null
  primaryLanguage: string | null
  matchedProblemIds: string[]
  source: string
}

export interface AlgorithmLabRecord {
  sceneId: string
  completedAt: string
  framesViewed: number
  correctPredictions: number
  totalPredictions: number
}

export interface PythonLessonRecord {
  lessonId: string
  completedAt: string | null
  runs: number
  challengePassed: boolean
  quizCorrect: boolean | null
  lastCode: string
}

export interface MentorState {
  displayName: string
  onboardingComplete: boolean
  currentLevel: MentorLevel
  diagnostic: DiagnosticResult | null
  yearPlanStartedAt: string | null
  completedPlanWeeks: number[]
  algorithmLab: Record<string, AlgorithmLabRecord>
  pythonCourse: Record<string, PythonLessonRecord>
  guidedSessions: GuidedProblemSession[]
  recognitionAttempts: PatternRecognitionAttempt[]
  mistakes: MistakeRecord[]
  leetcodeProfile: LeetCodeProfileSnapshot | null
}

export interface DailyActivity {
  date: string
  attemptedProblemIds: string[]
  solvedProblemIds: string[]
  studySeconds: number
}

export interface AppState {
  version: 3
  progress: Record<string, ProblemProgress>
  attempts: SolveAttempt[]
  revisions: RevisionRecord[]
  sessions: StudySession[]
  interviewSessions: InterviewSession[]
  activeTimer: ActiveTimer | null
  settings: UserSettings
  achievements: Achievement[]
  mentor: MentorState
  createdAt: string
  updatedAt: string
}

export interface ActiveTimer {
  problemId: string
  startedAt: string
  elapsedSeconds: number
  running: boolean
}