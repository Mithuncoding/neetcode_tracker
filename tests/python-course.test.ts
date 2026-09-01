import { parser } from '@lezer/python'
import { describe, expect, it } from 'vitest'
import { PYTHON_LESSONS, PYTHON_MODULES } from '../src/data/python-course'

function syntaxErrorCount(code: string) {
  const cursor = parser.parse(code).cursor()
  let errors = 0
  do {
    if (cursor.type.isError) errors += 1
  } while (cursor.next())
  return errors
}

describe('Python Zero-to-Interview curriculum', () => {
  it('contains 12 ordered modules and 48 unique executable lessons', () => {
    expect(PYTHON_MODULES).toHaveLength(12)
    expect(PYTHON_LESSONS).toHaveLength(48)
    expect(new Set(PYTHON_LESSONS.map((lesson) => lesson.id)).size).toBe(48)
    expect(PYTHON_LESSONS.map((lesson) => lesson.order)).toEqual(Array.from({ length: 48 }, (_, index) => index + 1))
  })

  it('includes requested interview-useful Python topics', () => {
    const ids = new Set(PYTHON_LESSONS.map((lesson) => lesson.id))
    const required = ['hello-world', 'ord-chr', 'map-filter', 'class-object', 'init-self', 'counter', 'defaultdict', 'deque', 'heapq', 'bisect', 'functools-cache']
    required.forEach((id) => expect(ids.has(id), id).toBe(true))
  })

  it('provides valid examples, starter code, solutions, tests, and quizzes', () => {
    PYTHON_LESSONS.forEach((lesson) => {
      expect(lesson.summary.length, lesson.id).toBeGreaterThan(20)
      expect(lesson.challenge.length, lesson.id).toBeGreaterThan(15)
      expect(lesson.tests, lesson.id).toContain('assert')
      expect(syntaxErrorCount(lesson.example), `${lesson.id} example`).toBe(0)
      expect(syntaxErrorCount(lesson.solution), `${lesson.id} solution`).toBe(0)
      expect(syntaxErrorCount(`${lesson.solution}\n${lesson.tests}`), `${lesson.id} tests`).toBe(0)
      expect(lesson.quiz.options[lesson.quiz.answer], lesson.id).toBeTruthy()
    })
  })
})