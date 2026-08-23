import { addDays, startOfDay } from 'date-fns'
import type {
  ProblemProgress,
  RevisionMode,
  RevisionResult,
  UserSettings,
} from '../types'
import { clamp } from './utils'

function dueDate(now: string, intervalDays: number) {
  return addDays(startOfDay(new Date(now)), intervalDays).toISOString()
}

function fixedInterval(
  confidence: number,
  stage: number,
  intervals: number[],
) {
  const base = intervals[Math.min(stage, intervals.length - 1)] ?? 1
  const factor = confidence <= 2
    ? 0.5
    : confidence === 3
      ? 1
      : confidence === 4
        ? 1.25
        : 1.5
  return Math.max(1, Math.round(base * factor))
}

export function scheduleInitialReview(
  confidence: number,
  settings: Pick<UserSettings, 'revisionMode' | 'revisionIntervals'>,
  now: string,
) {
  const intervalDays = settings.revisionMode === 'fixed'
    ? fixedInterval(confidence, 0, settings.revisionIntervals)
    : confidence <= 2
      ? 1
      : confidence === 3
        ? 2
        : confidence === 4
          ? 3
          : 4

  return {
    intervalDays,
    nextRevisionAt: dueDate(now, intervalDays),
    ease: confidence <= 2 ? 2.3 : confidence === 5 ? 2.6 : 2.5,
  }
}

export interface RevisionSchedule {
  stageAfter: number
  complete: boolean
  intervalDays: number
  nextRevisionAt: string | null
  easeAfter: number
  lapsesAfter: number
  successfulRecallsAfter: number
}

export function advanceRevision(
  progress: ProblemProgress,
  result: RevisionResult,
  confidence: 1 | 2 | 3 | 4 | 5,
  settings: Pick<UserSettings, 'revisionMode' | 'revisionIntervals'>,
  now: string,
): RevisionSchedule {
  if (result === 'weak') {
    const calibrationPenalty = confidence >= 4 ? 0.35 : 0.2
    const easeAfter = clamp(progress.revisionEase - calibrationPenalty, 1.3, 4)
    return {
      stageAfter: 0,
      complete: false,
      intervalDays: 1,
      nextRevisionAt: dueDate(now, 1),
      easeAfter,
      lapsesAfter: progress.revisionLapses + 1,
      successfulRecallsAfter: progress.successfulRecalls,
    }
  }

  const stageAfter = progress.revisionStage + 1
  const qualityGap = 5 - confidence
  const easeDelta = 0.1 - qualityGap * (0.08 + qualityGap * 0.02)
  const easeAfter = clamp(progress.revisionEase + easeDelta, 1.3, 4)
  const successfulRecallsAfter = progress.successfulRecalls + 1
  const complete = stageAfter >= settings.revisionIntervals.length && confidence >= 4
  let intervalDays: number

  if (settings.revisionMode === 'fixed') {
    intervalDays = fixedInterval(confidence, stageAfter, settings.revisionIntervals)
  } else if (successfulRecallsAfter === 1) {
    intervalDays = confidence >= 4 ? 2 : 1
  } else if (successfulRecallsAfter === 2) {
    intervalDays = confidence >= 4 ? 5 : 3
  } else {
    const confidenceFactor = confidence === 3 ? 0.8 : confidence === 5 ? 1.15 : 1
    intervalDays = clamp(
      Math.round(Math.max(progress.revisionIntervalDays + 1, progress.revisionIntervalDays * easeAfter * confidenceFactor)),
      1,
      180,
    )
  }

  return {
    stageAfter,
    complete,
    intervalDays: complete ? 0 : intervalDays,
    nextRevisionAt: complete ? null : dueDate(now, intervalDays),
    easeAfter,
    lapsesAfter: progress.revisionLapses,
    successfulRecallsAfter,
  }
}

export function revisionModeLabel(mode: RevisionMode) {
  return mode === 'adaptive' ? 'Adaptive recall' : 'Fixed intervals'
}