import { describe, expect, it } from 'vitest'
import { ROADMAP_PROBLEMS } from '../src/data/problems'
import { parseAcceptedProblemList } from '../src/lib/leetcode-import'

describe('LeetCode accepted-list reconciliation', () => {
  it('matches titles, slugs, URLs, and CSV-like rows', () => {
    const parsed = parseAcceptedProblemList(`Two Sum
longest-substring-without-repeating-characters
https://leetcode.com/problems/number-of-islands/
704, Binary Search, Accepted`, ROADMAP_PROBLEMS)
    expect(parsed.matchedProblemIds).toEqual(expect.arrayContaining([
      '0001-two-sum',
      '0003-longest-substring-without-repeating-characters',
      '0200-number-of-islands',
      '0704-binary-search',
    ]))
  })

  it('reads common JSON title fields and reports unmatched values', () => {
    const parsed = parseAcceptedProblemList(JSON.stringify([
      { title: 'House Robber', titleSlug: 'house-robber' },
      { title: 'A problem outside this roadmap' },
    ]), ROADMAP_PROBLEMS)
    expect(parsed.matchedProblemIds).toContain('0198-house-robber')
    expect(parsed.unmatched).toContain('A problem outside this roadmap')
  })
})