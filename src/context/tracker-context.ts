import { createContext } from 'react'
import type {
  AppState,
  ProblemStatus,
  RevisionResult,
  Difficulty,
  InterviewResult,
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
  importState: (state: AppState) => void
  resetProgress: () => void
  resetAnalytics: () => void
  resetAll: () => void
  undo: () => void
  dismissUndo: () => void
}

export const TrackerContext = createContext<TrackerContextValue | null>(null)