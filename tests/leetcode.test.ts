import { describe, expect, it } from 'vitest'
import { ROADMAP_PROBLEMS } from '../src/data/problems'
import { parseLeetCodeProfile } from '../src/lib/leetcode'

const snapshot = {
  schemaVersion: 1,
  username: 'Mithuncoding',
  generatedAt: '2026-09-02T00:00:00.000Z',
  ranking: 1_793_902,
  totalSolved: 90,
  easySolved: 76,
  mediumSolved: 13,
  hardSolved: 1,
  acceptanceRate: 68.75,
  activeDays: 43,
  maxStreak: 15,
  primaryLanguage: 'Python3',
  recentAccepted: [
    { title: 'Two Sum', titleSlug: 'two-sum', timestamp: '1788285836' },
    { title: 'Contains Duplicate', titleSlug: 'contains-duplicate', timestamp: '1787941111' },
  ],
  source: 'https://leetcode.com/u/Mithuncoding/',
}

describe('LeetCode profile snapshots', () => {
  it('validates totals and maps public recent solves to roadmap ids', () => {
    const profile = parseLeetCodeProfile(snapshot, ROADMAP_PROBLEMS, 'mithuncoding')
    expect(profile.totalSolved).toBe(90)
    expect(profile.primaryLanguage).toBe('Python3')
    expect(profile.matchedProblemIds).toContain('0001-two-sum')
    expect(profile.matchedProblemIds.length).toBe(2)
  })

  it('rejects a deployment snapshot for a different account', () => {
    expect(() => parseLeetCodeProfile(snapshot, ROADMAP_PROBLEMS, 'another-user')).toThrow(/not another-user/i)
  })
})