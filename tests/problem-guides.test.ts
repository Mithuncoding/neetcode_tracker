import { describe, expect, it } from 'vitest'
import { ROADMAP_PROBLEMS } from '../src/data/problems'
import { getProblemTeachingGuide, getRecognitionOptions, getRelatedProblems } from '../src/lib/problem-guides'

describe('deterministic problem teaching coverage', () => {
  it('resolves a complete six-level guide for every roadmap problem', () => {
    const resolved = ROADMAP_PROBLEMS.map(getProblemTeachingGuide)
    expect(resolved).toHaveLength(250)
    expect(resolved.every(({ guide }) => guide.hints.length === 6)).toBe(true)
    expect(resolved.every(({ guide }) => guide.derivation.length >= 3)).toBe(true)
    expect(resolved.filter(({ source }) => source === 'handcrafted')).toHaveLength(6)
    expect(resolved.filter(({ source }) => source === 'pattern-derived')).toHaveLength(244)
  })

  it('builds related-problem reinforcement from shared patterns', () => {
    const problem = ROADMAP_PROBLEMS.find((item) => item.title === 'Two Sum')!
    const related = getRelatedProblems(problem, ROADMAP_PROBLEMS)
    expect(related).toHaveLength(6)
    expect(related.every((item) => item.problem.id !== problem.id)).toBe(true)
    expect(related.some((item) => item.sharedPatterns.length > 0)).toBe(true)
  })

  it('builds four unique recognition choices containing the correct pattern', () => {
    ROADMAP_PROBLEMS.forEach((problem) => {
      const options = getRecognitionOptions(problem, ROADMAP_PROBLEMS)
      expect(options).toHaveLength(4)
      expect(new Set(options).size).toBe(4)
      expect(options).toContain(getProblemTeachingGuide(problem).corePattern)
    })
  })
})