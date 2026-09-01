import { describe, expect, it } from 'vitest'
import { createPythonProgram, hasBuiltInPythonTests } from '../src/lib/python-runtime'

describe('Python execution harness', () => {
  it('adds curated assertions to handcrafted problems', () => {
    const program = createPythonProgram('class Solution: pass', '0001-two-sum')
    expect(program).toContain('solution.twoSum')
    expect(program).toContain('All built-in checks passed.')
    expect(hasBuiltInPythonTests('0001-two-sum')).toBe(true)
  })

  it('leaves other solutions available for user-written assertions', () => {
    const code = 'print("hello")'
    expect(createPythonProgram(code, '0217-contains-duplicate')).toBe(code)
    expect(hasBuiltInPythonTests('0217-contains-duplicate')).toBe(false)
  })
})