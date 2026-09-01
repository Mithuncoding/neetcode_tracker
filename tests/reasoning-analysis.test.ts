import { describe, expect, it } from 'vitest'
import { analyzeReasoning } from '../src/lib/reasoning-analysis'

describe('guided reasoning analysis', () => {
  it('identifies missing derivation evidence and asks the next question', () => {
    const result = analyzeReasoning(
      'I need to return the longest contiguous substring from a string; an empty input is an edge case.',
      'I would try every substring.',
    )
    expect(result.understandingScore).toBeGreaterThanOrEqual(75)
    expect(result.derivationScore).toBeLessThan(75)
    expect(result.nextQuestion).toMatch(/time|space/i)
  })

  it('recognizes a complete brute-force-to-optimization derivation', () => {
    const result = analyzeReasoning(
      'The input is a string and I need to return the longest contiguous unique substring. An empty string and duplicates are edge cases.',
      'Brute force would try every substring with nested loops, taking O(n cubed) time because uniqueness is rescanned. I can store window characters and use pointers to remove repeated work.',
    )
    expect(result.understandingScore).toBe(100)
    expect(result.derivationScore).toBe(100)
  })
})