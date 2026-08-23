import {
  useEffect,
  useReducer,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { getStreaks } from '../lib/analytics'
import {
  createInitialState,
  getStorageHealth,
  loadState,
  saveState,
  subscribeStorageHealth,
  clearStoredData,
} from '../lib/storage'
import {
  getDefaultProgress,
  getTimerSeconds,
  uid,
} from '../lib/utils'
import { advanceRevision, scheduleInitialReview } from '../lib/spaced-repetition'
import { selectInterviewProblems } from '../lib/interview'
import type {
  AppState,
  ProblemStatus,
  SessionGoal,
  SolveOutcome,
  UserSettings,
} from '../types'
import {
  TrackerContext,
  type LogAttemptInput,
  type MarkRevisionInput,
  type TrackerContextValue,
  type StartInterviewInput,
  type RecordInterviewInput,
} from './tracker-context'

type Action =
  | { type: 'log-attempt'; payload: LogAttemptInput; now: string }
  | { type: 'set-status'; problemId: string; status: ProblemStatus; now: string }
  | { type: 'set-notes'; problemId: string; notes: string; now: string }
  | { type: 'set-revision-date'; problemId: string; date: string | null; now: string }
  | { type: 'start-timer'; problemId: string; now: string }
  | { type: 'pause-timer'; now: string }
  | { type: 'resume-timer'; now: string }
  | { type: 'cancel-timer'; now: string }
  | { type: 'mark-revision'; payload: MarkRevisionInput; now: string }
  | { type: 'update-settings'; settings: Partial<UserSettings>; now: string }
  | { type: 'start-session'; id: string; goal: SessionGoal; now: string }
  | { type: 'end-session'; id: string; now: string }
  | { type: 'start-interview'; id: string; input: StartInterviewInput; problemIds: string[]; now: string }
  | { type: 'record-interview'; input: RecordInterviewInput; now: string }
  | { type: 'finish-interview'; id: string; abandoned: boolean; now: string }
  | { type: 'import-state'; state: AppState }
  | { type: 'reset-progress'; now: string }
  | { type: 'reset-analytics'; now: string }
  | { type: 'reset-all' }

function statusForOutcome(outcome: SolveOutcome): ProblemStatus {
  if (outcome === 'independent') return 'solved'
  if (outcome === 'hint') return 'solved-with-hint'
  if (outcome === 'solution') return 'solved-after-solution'
  return 'needs-revision'
}

function unlockAchievements(state: AppState, now: string) {
  const completedIds = new Set(
    Object.values(state.progress)
      .filter((progress) => progress.solvedAt)
      .map((progress) => progress.problemId),
  )
  const independent = state.attempts.filter((attempt) => attempt.outcome === 'independent').length
  const hard = ROADMAP_PROBLEMS.filter(
    (problem) => problem.difficulty === 'Hard' && completedIds.has(problem.id),
  ).length
  const successfulRevisions = state.revisions.filter((revision) => revision.result === 'recalled').length
  const { longest } = getStreaks(state)
  const unlocked = new Set<string>()

  if (completedIds.size >= 1) unlocked.add('first-problem')
  if (longest >= 7) unlocked.add('streak-7')
  if (longest >= 30) unlocked.add('streak-30')
  for (const count of [10, 50, 100, 150, 200, 250]) {
    if (completedIds.size >= count) unlocked.add(`solved-${count}`)
  }
  if (independent >= 10) unlocked.add('independent-10')
  if (independent >= 50) unlocked.add('independent-50')
  if (hard >= 1) unlocked.add('first-hard')
  if (hard >= 10) unlocked.add('hard-10')
  if (successfulRevisions >= 25) unlocked.add('revision-master')

  return {
    ...state,
    achievements: state.achievements.map((achievement) =>
      unlocked.has(achievement.id) && !achievement.unlockedAt
        ? { ...achievement, unlockedAt: now }
        : achievement,
    ),
  }
}

function reducer(state: AppState, action: Action): AppState {
  if (action.type === 'import-state') return action.state
  if (action.type === 'reset-all') return createInitialState()

  if (action.type === 'start-timer') {
    const existingProgress = state.progress[action.problemId] ?? getDefaultProgress(action.problemId)
    return {
      ...state,
      progress: {
        ...state.progress,
        [action.problemId]: {
          ...existingProgress,
          status: existingProgress.solvedAt ? existingProgress.status : 'attempting',
          lastAttemptAt: action.now,
        },
      },
      activeTimer: {
        problemId: action.problemId,
        startedAt: action.now,
        elapsedSeconds: 0,
        running: true,
      },
      updatedAt: action.now,
    }
  }

  if (action.type === 'pause-timer' && state.activeTimer?.running) {
    return {
      ...state,
      activeTimer: {
        ...state.activeTimer,
        elapsedSeconds: getTimerSeconds(state.activeTimer, Date.parse(action.now)),
        running: false,
      },
      updatedAt: action.now,
    }
  }

  if (action.type === 'resume-timer' && state.activeTimer && !state.activeTimer.running) {
    return {
      ...state,
      activeTimer: { ...state.activeTimer, startedAt: action.now, running: true },
      updatedAt: action.now,
    }
  }

  if (action.type === 'cancel-timer') {
    return { ...state, activeTimer: null, updatedAt: action.now }
  }

  if (action.type === 'log-attempt') {
    const payload = action.payload
    const current = state.progress[payload.problemId] ?? getDefaultProgress(payload.problemId)
    const timerMatches = state.activeTimer?.problemId === payload.problemId
    const durationSeconds = payload.durationSeconds ??
      (timerMatches ? getTimerSeconds(state.activeTimer, Date.parse(action.now)) : 0)
    const solved = ['independent', 'hint', 'solution'].includes(payload.outcome)
    const initialReview = scheduleInitialReview(payload.confidence, state.settings, action.now)
    const status = payload.revisionNeeded && solved ? 'needs-revision' : statusForOutcome(payload.outcome)
    const attemptId = uid('attempt')
    const attempt = {
      id: attemptId,
      problemId: payload.problemId,
      startedAt: payload.startedAt ??
        (timerMatches ? state.activeTimer?.startedAt ?? action.now : action.now),
      completedAt: action.now,
      durationSeconds,
      outcome: payload.outcome,
      attempts: payload.attempts,
      confidence: payload.confidence,
      notes: payload.notes.trim(),
      revisionNeeded: payload.revisionNeeded,
      sessionId: payload.sessionId ?? null,
    }
    const progress = {
      ...current,
      status,
      attempts: current.attempts + payload.attempts,
      confidence: payload.confidence,
      notes: payload.notes.trim() || current.notes,
      totalTimeSeconds: current.totalTimeSeconds + durationSeconds,
      solvedAt: solved ? current.solvedAt ?? action.now : current.solvedAt,
      lastAttemptAt: action.now,
      revisionStage: solved ? 0 : current.revisionStage,
      revisionEase: solved ? initialReview.ease : current.revisionEase,
      revisionIntervalDays: solved ? initialReview.intervalDays : current.revisionIntervalDays,
      successfulRecalls: solved ? 0 : current.successfulRecalls,
      lastRevisionResult: solved ? null : current.lastRevisionResult,
      nextRevisionAt: solved || payload.outcome === 'unable'
        ? initialReview.nextRevisionAt
        : current.nextRevisionAt,
    }
    const sessions = payload.sessionId
      ? state.sessions.map((session) =>
          session.id === payload.sessionId
            ? {
                ...session,
                problemIds: session.problemIds.includes(payload.problemId)
                  ? session.problemIds
                  : [...session.problemIds, payload.problemId],
                attemptIds: [...session.attemptIds, attemptId],
              }
            : session,
        )
      : state.sessions
    const nextState: AppState = {
      ...state,
      progress: { ...state.progress, [payload.problemId]: progress },
      attempts: [...state.attempts, attempt],
      sessions,
      activeTimer: timerMatches ? null : state.activeTimer,
      updatedAt: action.now,
    }
    return unlockAchievements(nextState, action.now)
  }

  if (action.type === 'set-status') {
    const current = state.progress[action.problemId] ?? getDefaultProgress(action.problemId)
    const solvedStatus = ['solved', 'solved-with-hint', 'solved-after-solution', 'needs-revision', 'mastered'].includes(
      action.status,
    )
    const initialReview = scheduleInitialReview(current.confidence ?? 3, state.settings, action.now)
    return {
      ...state,
      progress: {
        ...state.progress,
        [action.problemId]: {
          ...current,
          status: action.status,
          solvedAt: solvedStatus ? current.solvedAt ?? action.now : null,
          nextRevisionAt: solvedStatus && !current.nextRevisionAt
            ? initialReview.nextRevisionAt
            : current.nextRevisionAt,
        },
      },
      updatedAt: action.now,
    }
  }

  if (action.type === 'set-notes') {
    const current = state.progress[action.problemId] ?? getDefaultProgress(action.problemId)
    return {
      ...state,
      progress: { ...state.progress, [action.problemId]: { ...current, notes: action.notes } },
      updatedAt: action.now,
    }
  }

  if (action.type === 'set-revision-date') {
    const current = state.progress[action.problemId] ?? getDefaultProgress(action.problemId)
    return {
      ...state,
      progress: {
        ...state.progress,
        [action.problemId]: { ...current, nextRevisionAt: action.date },
      },
      updatedAt: action.now,
    }
  }

  if (action.type === 'mark-revision') {
    const payload = action.payload
    const current = state.progress[payload.problemId] ?? getDefaultProgress(payload.problemId)
    const schedule = advanceRevision(
      current,
      payload.result,
      payload.confidence,
      state.settings,
      action.now,
    )
    const durationSeconds = payload.durationSeconds ??
      (state.activeTimer?.problemId === payload.problemId
        ? getTimerSeconds(state.activeTimer, Date.parse(action.now))
        : 0)
    const sessions = payload.sessionId
      ? state.sessions.map((session) =>
          session.id === payload.sessionId
            ? {
                ...session,
                problemIds: session.problemIds.includes(payload.problemId)
                  ? session.problemIds
                  : [...session.problemIds, payload.problemId],
              }
            : session,
        )
      : state.sessions
    const nextState: AppState = {
      ...state,
      progress: {
        ...state.progress,
        [payload.problemId]: {
          ...current,
          status: payload.result === 'weak'
            ? 'needs-revision'
            : schedule.complete
              ? 'mastered'
              : current.status === 'needs-revision'
                ? 'solved'
                : current.status,
          confidence: payload.confidence,
          totalTimeSeconds: current.totalTimeSeconds + durationSeconds,
          lastRevisedAt: action.now,
          revisionStage: schedule.stageAfter,
          nextRevisionAt: schedule.nextRevisionAt,
          revisionEase: schedule.easeAfter,
          revisionIntervalDays: schedule.intervalDays,
          revisionLapses: schedule.lapsesAfter,
          successfulRecalls: schedule.successfulRecallsAfter,
          lastRevisionResult: payload.result,
        },
      },
      revisions: [
        ...state.revisions,
        {
          id: uid('revision'),
          problemId: payload.problemId,
          completedAt: action.now,
          result: payload.result,
          stageBefore: current.revisionStage,
          stageAfter: schedule.stageAfter,
          confidence: payload.confidence,
          durationSeconds,
          intervalDays: schedule.intervalDays,
          easeAfter: schedule.easeAfter,
        },
      ],
      sessions,
      activeTimer: state.activeTimer?.problemId === payload.problemId ? null : state.activeTimer,
      updatedAt: action.now,
    }
    return unlockAchievements(nextState, action.now)
  }

  if (action.type === 'update-settings') {
    return {
      ...state,
      settings: { ...state.settings, ...action.settings },
      updatedAt: action.now,
    }
  }

  if (action.type === 'start-session') {
    return {
      ...state,
      sessions: [
        ...state.sessions.map((session) =>
          session.endedAt
            ? session
            : {
                ...session,
                endedAt: action.now,
                durationSeconds: Math.max(0, Math.floor((Date.parse(action.now) - Date.parse(session.startedAt)) / 1000)),
              },
        ),
        {
          id: action.id,
          startedAt: action.now,
          endedAt: null,
          goal: action.goal,
          problemIds: [],
          attemptIds: [],
          durationSeconds: 0,
        },
      ],
      updatedAt: action.now,
    }
  }

  if (action.type === 'end-session') {
    return {
      ...state,
      sessions: state.sessions.map((session) =>
        session.id === action.id
          ? {
              ...session,
              endedAt: action.now,
              durationSeconds: Math.max(0, Math.floor((Date.parse(action.now) - Date.parse(session.startedAt)) / 1000)),
            }
          : session,
      ),
      activeTimer: null,
      updatedAt: action.now,
    }
  }

  if (action.type === 'start-interview') {
    return {
      ...state,
      interviewSessions: [
        ...state.interviewSessions.map((session) =>
          session.status === 'active'
            ? { ...session, status: 'abandoned' as const, endedAt: action.now }
            : session,
        ),
        {
          id: action.id,
          startedAt: action.now,
          endedAt: null,
          targetMinutes: action.input.targetMinutes,
          difficulty: action.input.difficulty,
          problemIds: action.problemIds,
          results: [],
          status: 'active',
        },
      ],
      updatedAt: action.now,
    }
  }

  if (action.type === 'record-interview') {
    return {
      ...state,
      interviewSessions: state.interviewSessions.map((session) =>
        session.id === action.input.sessionId
          ? {
              ...session,
              results: [
                ...session.results,
                {
                  problemId: action.input.problemId,
                  durationSeconds: action.input.durationSeconds,
                  outcome: action.input.outcome,
                  explanationScore: action.input.explanationScore,
                  codingScore: action.input.codingScore,
                  communicationScore: action.input.communicationScore,
                  notes: action.input.notes,
                },
              ],
            }
          : session,
      ),
      updatedAt: action.now,
    }
  }

  if (action.type === 'finish-interview') {
    return {
      ...state,
      interviewSessions: state.interviewSessions.map((session) =>
        session.id === action.id
          ? {
              ...session,
              endedAt: action.now,
              status: action.abandoned ? 'abandoned' : 'completed',
            }
          : session,
      ),
      activeTimer: null,
      updatedAt: action.now,
    }
  }

  if (action.type === 'reset-progress') {
    return {
      ...state,
      progress: {},
      attempts: [],
      revisions: [],
      sessions: [],
      interviewSessions: [],
      activeTimer: null,
      achievements: createInitialState().achievements,
      updatedAt: action.now,
    }
  }

  if (action.type === 'reset-analytics') {
    const progress = Object.fromEntries(
      Object.entries(state.progress).map(([problemId, item]) => [
        problemId,
        { ...item, attempts: 0, totalTimeSeconds: 0 },
      ]),
    )
    return {
      ...state,
      progress,
      attempts: [],
      revisions: [],
      sessions: [],
      interviewSessions: [],
      activeTimer: null,
      updatedAt: action.now,
    }
  }

  return state
}

export function TrackerProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(loadState)
  const [state, dispatch] = useReducer(reducer, loaded.state)
  const [undoEntry, setUndoEntry] = useState<{ state: AppState; label: string } | null>(null)
  const storageHealthy = useSyncExternalStore(
    subscribeStorageHealth,
    getStorageHealth,
    () => true,
  )

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    if (!undoEntry) return
    const timeout = window.setTimeout(() => setUndoEntry(null), 10_000)
    return () => window.clearTimeout(timeout)
  }, [undoEntry])

  useEffect(() => {
    const root = document.documentElement
    const applyTheme = () => {
      const dark = state.settings.theme === 'dark' ||
        (state.settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
      root.dataset.theme = dark ? 'dark' : 'light'
      root.style.colorScheme = dark ? 'dark' : 'light'
    }
    applyTheme()
    const query = matchMedia('(prefers-color-scheme: dark)')
    query.addEventListener('change', applyTheme)
    return () => query.removeEventListener('change', applyTheme)
  }, [state.settings.theme])

  const now = () => new Date().toISOString()
  const value: TrackerContextValue = {
    state,
    recoveredFromBackup: loaded.recovered,
    storageHealthy,
    canUndo: Boolean(undoEntry),
    undoLabel: undoEntry?.label ?? null,
    logAttempt: (payload) => dispatch({ type: 'log-attempt', payload, now: now() }),
    quickSolve: (problemId, sessionId = null) => {
      const title = ROADMAP_PROBLEMS.find((problem) => problem.id === problemId)?.title ?? 'Problem'
      setUndoEntry({ state, label: `${title} marked solved` })
      dispatch({
        type: 'log-attempt',
        payload: {
          problemId,
          outcome: 'independent',
          attempts: 1,
          confidence: 3,
          notes: '',
          revisionNeeded: false,
          durationSeconds: 0,
          sessionId,
        },
        now: now(),
      })
    },
    setProblemStatus: (problemId, status) =>
      dispatch({ type: 'set-status', problemId, status, now: now() }),
    setNotes: (problemId, notes) => dispatch({ type: 'set-notes', problemId, notes, now: now() }),
    setRevisionDate: (problemId, date) =>
      dispatch({ type: 'set-revision-date', problemId, date, now: now() }),
    startTimer: (problemId) => dispatch({ type: 'start-timer', problemId, now: now() }),
    pauseTimer: () => dispatch({ type: 'pause-timer', now: now() }),
    resumeTimer: () => dispatch({ type: 'resume-timer', now: now() }),
    cancelTimer: () => dispatch({ type: 'cancel-timer', now: now() }),
    markRevision: (payload) => dispatch({ type: 'mark-revision', payload, now: now() }),
    updateSettings: (settings) => dispatch({ type: 'update-settings', settings, now: now() }),
    startSession: (goal) => {
      const id = uid('session')
      dispatch({ type: 'start-session', id, goal, now: now() })
      return id
    },
    endSession: (id) => dispatch({ type: 'end-session', id, now: now() }),
    startInterview: (input) => {
      const problems = selectInterviewProblems(state, ROADMAP_PROBLEMS, input.problemCount, input.difficulty)
      if (!problems.length) return null
      const id = uid('interview')
      dispatch({
        type: 'start-interview',
        id,
        input,
        problemIds: problems.map((problem) => problem.id),
        now: now(),
      })
      return id
    },
    recordInterviewResult: (input) => {
      const timestamp = now()
      dispatch({
        type: 'log-attempt',
        payload: {
          problemId: input.problemId,
          outcome: input.outcome,
          attempts: 1,
          confidence: input.codingScore,
          notes: input.notes,
          revisionNeeded: input.outcome !== 'independent' || input.explanationScore <= 2,
          durationSeconds: input.durationSeconds,
          sessionId: null,
        },
        now: timestamp,
      })
      dispatch({ type: 'record-interview', input, now: timestamp })
    },
    finishInterview: (id, abandoned = false) =>
      dispatch({ type: 'finish-interview', id, abandoned, now: now() }),
    importState: (nextState) => dispatch({ type: 'import-state', state: nextState }),
    resetProgress: () => dispatch({ type: 'reset-progress', now: now() }),
    resetAnalytics: () => dispatch({ type: 'reset-analytics', now: now() }),
    resetAll: () => {
      clearStoredData()
      setUndoEntry(null)
      dispatch({ type: 'reset-all' })
    },
    undo: () => {
      if (!undoEntry) return
      dispatch({ type: 'import-state', state: undoEntry.state })
      setUndoEntry(null)
    },
    dismissUndo: () => setUndoEntry(null),
  }

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
}