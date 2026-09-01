import { createContext } from 'react'
import type {
  AppState,
  ProblemStatus,
  RevisionResult,
  Difficulty,
  DiagnosticAnswer,
  FailureReason,
  HintLevel,
  InterviewResult,
  LearningMode,
  LeetCodeProfileSnapshot,
  MentorLevel,
  SessionGoal,
  SolveOutcome,
  UserSettings,
} from '../types'

export interface LogAttemptInput {
  problemId: string
  outcome: SolveOutcome
  attempts: number
  confidence: 1 | 2 | 3 | 4 | 5
  notes: string
  revisionNeeded: boolean
  durationSeconds?: number
  startedAt?: string
  sessionId?: string | null
}

export interface MarkRevisionInput {
  problemId: string
  result: RevisionResult
  confidence: 1 | 2 | 3 | 4 | 5
  durationSeconds?: number
  sessionId?: string | null
}

export interface StartInterviewInput {
  targetMinutes: number
  difficulty: Difficulty | 'Mixed'
  problemCount: number
}

export interface RecordInterviewInput extends InterviewResult {
  sessionId: string
}

export interface CompleteDiagnosticInput {
  answers: DiagnosticAnswer[]
  recommendedLevel: MentorLevel
}

export interface RecordRecognitionInput {
  problemId: string
  selectedPattern: string
  expectedPattern: string
  correct: boolean
  confidence: 1 | 2 | 3 | 4 | 5
}

export interface RecordGuidedSessionInput {
  problemId: string
  mode: LearningMode
  startedAt: string
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

export interface RecordAlgorithmLabInput {
  sceneId: string
  framesViewed: number
  correctPredictions: number
  totalPredictions: number
}

export interface RecordPythonLessonInput {
  lessonId: string
  code: string
  challengePassed: boolean
  quizCorrect: boolean | null
  ranCode: boolean
  complete: boolean
}

export interface TrackerContextValue {
  state: AppState
  recoveredFromBackup: boolean
  storageHealthy: boolean
  canUndo: boolean
  undoLabel: string | null
  logAttempt: (input: LogAttemptInput) => void
  quickSolve: (problemId: string, sessionId?: string | null) => void
  setProblemStatus: (problemId: string, status: ProblemStatus) => void
  setNotes: (problemId: string, notes: string) => void
  setRevisionDate: (problemId: string, date: string | null) => void
  startTimer: (problemId: string) => void
  pauseTimer: () => void
  resumeTimer: () => void
  cancelTimer: () => void
  markRevision: (input: MarkRevisionInput) => void
  updateSettings: (settings: Partial<UserSettings>) => void
  startSession: (goal: SessionGoal) => string
  endSession: (id: string) => void
  startInterview: (input: StartInterviewInput) => string | null
  recordInterviewResult: (input: RecordInterviewInput) => void
  finishInterview: (id: string, abandoned?: boolean) => void
  completeDiagnostic: (input: CompleteDiagnosticInput) => void
  recordRecognition: (input: RecordRecognitionInput) => void
  recordGuidedSession: (input: RecordGuidedSessionInput) => void
  saveLeetCodeProfile: (profile: LeetCodeProfileSnapshot) => void
  mergeLeetCodeMatches: (problemIds: string[]) => void
  startYearPlan: () => void
  togglePlanWeek: (week: number) => void
  setMistakeResolved: (mistakeId: string, resolved: boolean) => void
  recordAlgorithmLab: (input: RecordAlgorithmLabInput) => void
  recordPythonLesson: (input: RecordPythonLessonInput) => void
  importState: (state: AppState) => void
  resetProgress: () => void
  resetAnalytics: () => void
  resetAll: () => void
  undo: () => void
  dismissUndo: () => void
}

export const TrackerContext = createContext<TrackerContextValue | null>(null)