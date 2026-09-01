import type { AppState } from '../types'

export const BACKUP_PREFIX = 'neetcode-250-tracker:backup:v3:'
const LEGACY_BACKUP_PREFIX = 'neetcode-250-tracker:backup:v2:'

interface BackupEnvelope {
  savedAt: string
  state: AppState
}

function readEnvelope(index: number): BackupEnvelope | null {
  const value = localStorage.getItem(`${BACKUP_PREFIX}${index}`)
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as BackupEnvelope
    return parsed?.state?.version === 3 ? parsed : null
  } catch {
    return null
  }
}

export interface BackupSnapshot {
  index: number
  savedAt: string
  updatedAt: string
  completed: number
  attempts: number
}

export function rotateBackups(state: AppState, retention: number) {
  for (let index = retention - 1; index >= 1; index -= 1) {
    const previous = localStorage.getItem(`${BACKUP_PREFIX}${index - 1}`)
    if (previous) localStorage.setItem(`${BACKUP_PREFIX}${index}`, previous)
  }
  localStorage.setItem(`${BACKUP_PREFIX}0`, JSON.stringify({
    savedAt: new Date().toISOString(),
    state,
  } satisfies BackupEnvelope))
  for (let index = retention; index < 10; index += 1) {
    localStorage.removeItem(`${BACKUP_PREFIX}${index}`)
  }
}

export function listBackups(): BackupSnapshot[] {
  const snapshots: BackupSnapshot[] = []
  for (let index = 0; index < 10; index += 1) {
    const backup = readEnvelope(index)
    if (!backup) continue
    snapshots.push({
      index,
      savedAt: backup.savedAt,
      updatedAt: backup.state.updatedAt,
      completed: Object.values(backup.state.progress).filter((progress) => progress.solvedAt).length,
      attempts: backup.state.attempts.length,
    })
  }
  return snapshots
}

export function readBackup(index: number) {
  return readEnvelope(index)?.state ?? null
}

export function readLegacyBackup(index: number) {
  const value = localStorage.getItem(`${LEGACY_BACKUP_PREFIX}${index}`)
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as { state?: unknown }
    return parsed.state ?? null
  } catch {
    return null
  }
}

export function clearBackups() {
  for (let index = 0; index < 10; index += 1) {
    localStorage.removeItem(`${BACKUP_PREFIX}${index}`)
    localStorage.removeItem(`${LEGACY_BACKUP_PREFIX}${index}`)
  }
}