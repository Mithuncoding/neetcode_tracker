import { describe, expect, it } from 'vitest'
import { clearBackups, listBackups, readBackup, rotateBackups } from '../src/lib/backups'
import {
  createInitialState,
  loadState,
  parseImportedState,
  saveState,
  STORAGE_KEY,
} from '../src/lib/storage'

function createLegacyState() {
  const state = structuredClone(createInitialState()) as unknown as Record<string, unknown>
  state.version = 1
  delete state.interviewSessions
  const settings = state.settings as Record<string, unknown>
  delete settings.revisionMode
  delete settings.backupRetention
  delete settings.planner
  state.progress = {
    '0001-two-sum': {
      problemId: '0001-two-sum',
      status: 'solved',
      attempts: 1,
      confidence: 4,
      notes: '',
      totalTimeSeconds: 900,
      solvedAt: '2026-08-20T10:00:00.000Z',
      lastAttemptAt: '2026-08-20T10:00:00.000Z',
      lastRevisedAt: null,
      revisionStage: 0,
      nextRevisionAt: '2026-08-21T00:00:00.000Z',
    },
  }
  return state
}

describe('state migration and recovery', () => {
  it('migrates a version-1 export to version 2 defaults', () => {
    const migrated = parseImportedState(JSON.stringify(createLegacyState()))
    expect(migrated.version).toBe(2)
    expect(migrated.settings.revisionMode).toBe('adaptive')
    expect(migrated.settings.planner.mode).toBe('balanced')
    expect(migrated.progress['0001-two-sum'].revisionEase).toBe(2.5)
  })

  it('loads a legacy localStorage save', () => {
    localStorage.setItem('neetcode-250-tracker:v1', JSON.stringify(createLegacyState()))
    const loaded = loadState()
    expect(loaded.state.version).toBe(2)
    expect(loaded.state.progress['0001-two-sum'].solvedAt).toBeTruthy()
  })

  it('falls back to a rotated recovery point when primary data is corrupted', () => {
    const state = createInitialState()
    rotateBackups(state, 5)
    localStorage.setItem(STORAGE_KEY, '{bad-json')
    const loaded = loadState()
    expect(loaded.recovered).toBe(true)
    expect(loaded.state.version).toBe(2)
  })

  it('keeps newest rotating snapshots first', () => {
    const first = createInitialState()
    first.updatedAt = '2026-08-20T00:00:00.000Z'
    const second = { ...first, updatedAt: '2026-08-21T00:00:00.000Z' }
    rotateBackups(first, 3)
    rotateBackups(second, 3)
    expect(listBackups()).toHaveLength(2)
    expect(readBackup(0)?.updatedAt).toBe(second.updatedAt)
    expect(readBackup(1)?.updatedAt).toBe(first.updatedAt)
    clearBackups()
    expect(listBackups()).toHaveLength(0)
  })

  it('rotates the previous primary state on save', () => {
    const first = createInitialState()
    first.updatedAt = '2026-08-20T00:00:00.000Z'
    const second = { ...first, updatedAt: '2026-08-21T00:00:00.000Z' }
    saveState(first)
    saveState(second)
    expect(readBackup(0)?.updatedAt).toBe(first.updatedAt)
  })
})