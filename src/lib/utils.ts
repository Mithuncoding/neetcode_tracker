import { addDays, format, isSameDay, parseISO, startOfDay } from 'date-fns'
import type { ActiveTimer, ProblemProgress } from '../types'

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function uid(prefix: string) {
  const id = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  return `${prefix}_${id}`
}

export function dateKey(value: Date | string = new Date()) {
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, 'yyyy-MM-dd')
}

export function addDaysIso(value: Date | string, days: number) {
  const date = typeof value === 'string' ? parseISO(value) : value
  return addDays(startOfDay(date), days).toISOString()
}

export function isToday(value: string) {
  return isSameDay(parseISO(value), new Date())
}

export function formatDuration(totalSeconds: number, compact = false) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return compact ? '0m' : '0 min'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.max(1, Math.round((totalSeconds % 3600) / 60))
  if (!hours) return `${minutes}${compact ? 'm' : ' min'}`
  return `${hours}h ${minutes}m`
}

export function formatTimer(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60
  return [hours, minutes, seconds]
    .map((part, index) => (index === 0 ? String(part) : String(part).padStart(2, '0')))
    .join(':')
}

export function getTimerSeconds(timer: ActiveTimer | null, now = Date.now()) {
  if (!timer) return 0
  if (!timer.running) return timer.elapsedSeconds
  return timer.elapsedSeconds + Math.max(0, Math.floor((now - Date.parse(timer.startedAt)) / 1000))
}

export function getDefaultProgress(problemId: string): ProblemProgress {
  return {
    problemId,
    status: 'not-started',
    attempts: 0,
    confidence: null,
    notes: '',
    totalTimeSeconds: 0,
    solvedAt: null,
    lastAttemptAt: null,
    lastRevisedAt: null,
    revisionStage: 0,
    nextRevisionAt: null,
    revisionEase: 2.5,
    revisionIntervalDays: 1,
    revisionLapses: 0,
    successfulRecalls: 0,
    lastRevisionResult: null,
  }
}

export function median(values: number[]) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const midpoint = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[midpoint]
    : (sorted[midpoint - 1] + sorted[midpoint]) / 2
}

export function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}