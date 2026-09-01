import { describe, expect, it } from 'vitest'
import { analyzePythonCode, explainPythonLines } from '../src/lib/python-analysis'

describe('local Python analysis', () => {
  it('reports parser errors without claiming correctness', () => {
    const result = analyzePythonCode('def solve(:\n    return 1', 'Arrays & Hashing')
    expect(result.syntaxValid).toBe(false)
    expect(result.score).toBe(0)
    expect(result.errorLines.length).toBeGreaterThan(0)
  })

  it('recognizes an interview-readable sliding-window structure', () => {
    const result = analyzePythonCode(`def longest(text):
    window = set()
    left = 0
    best = 0
    for right, character in enumerate(text):
        while character in window:
            window.remove(text[left])
            left += 1
        window.add(character)
        best = max(best, right - left + 1)
    return best`, 'Sliding Window')
    expect(result.syntaxValid).toBe(true)
    expect(result.checks.find((check) => check.id === 'pattern')?.passed).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(75)
  })

  it('flags obvious nested-loop complexity risk', () => {
    const result = analyzePythonCode(`def pairs(nums):
    for left in range(len(nums)):
        for right in range(left + 1, len(nums)):
            if nums[left] == nums[right]:
                return True
    return False`, 'Arrays & Hashing')
    expect(result.likelyNestedLoops).toBe(true)
    expect(result.checks.find((check) => check.id === 'complexity')?.passed).toBe(false)
  })

  it('creates a visible explanation for every nonblank Python line', () => {
    const lines = explainPythonLines('def solve(nums):\n    for value in nums:\n        return value')
    expect(lines).toHaveLength(3)
    expect(lines[0].explanation).toMatch(/function contract/i)
    expect(lines[1].explanation).toMatch(/iterates/i)
    expect(lines[2].explanation).toMatch(/returns/i)
  })
})