import { webcrypto } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { decryptBackup, encryptBackup } from '../src/lib/crypto'
import { formatTimer, getTimerSeconds } from '../src/lib/utils'

Object.defineProperty(globalThis, 'crypto', {
  configurable: true,
  value: webcrypto,
})

describe('encrypted backups', () => {
  it('round-trips backup text and rejects a wrong passphrase', async () => {
    const encrypted = await encryptBackup('{"version":2}', 'correct horse battery')
    expect(encrypted).not.toContain('"version":2')
    await expect(decryptBackup(encrypted, 'correct horse battery')).resolves.toBe('{"version":2}')
    await expect(decryptBackup(encrypted, 'wrong passphrase')).rejects.toThrow(/incorrect|damaged/)
  })
})

describe('timer math', () => {
  it('adds elapsed wall time only while running', () => {
    const running = getTimerSeconds({
      problemId: '0001-two-sum',
      startedAt: '2026-08-23T10:00:00.000Z',
      elapsedSeconds: 30,
      running: true,
    }, Date.parse('2026-08-23T10:01:00.000Z'))
    const paused = getTimerSeconds({
      problemId: '0001-two-sum',
      startedAt: '2026-08-23T10:00:00.000Z',
      elapsedSeconds: 30,
      running: false,
    }, Date.parse('2026-08-23T10:01:00.000Z'))
    expect(running).toBe(90)
    expect(paused).toBe(30)
    expect(formatTimer(running)).toBe('0:01:30')
  })
})