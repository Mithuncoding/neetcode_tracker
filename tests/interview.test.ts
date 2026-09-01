import { describe, expect, it } from 'vitest'
import { ROADMAP_PROBLEMS } from '../src/data/problems'
import { getInterviewSessionScore, getReadinessScore, selectInterviewProblems } from '../src/lib/interview'
import { createInitialState } from '../src/lib/storage'
import type { InterviewSession } from '../src/types'

function session(score: 1 | 2 | 3 | 4 | 5, startedAt: string): InterviewSession {
  return {
    id: startedAt,
    startedAt,
    endedAt: startedAt,
    targetMinutes: 45,
    difficulty: 'Medium',
    problemIds: ['0049-group-anagrams'],
    status: 'completed',
    results: [{
      problemId: '0049-group-anagrams',
      durationSeconds: 1800,
      outcome: 'independent',
      understandingScore: score,
      patternRecognitionScore: score,
      approachScore: score,
      codingScore: score,
      complexityScore: score,
      explanationScore: score,
      communicationScore: score,
      hintsUsed: 0,
      notes: '',
    }],
  }
}

describe('interview readiness', () => {
  it('prioritizes unseen problems for a mock', () => {
    const state = createInitialState()
    const first = ROADMAP_PROBLEMS[0]
    state.attempts.push({
      id: 'seen',
      problemId: first.id,
      startedAt: '2026-08-20T00:00:00.000Z',
      completedAt: '2026-08-20T00:10:00.000Z',
      durationSeconds: 600,
      outcome: 'unable',
      attempts: 1,
      confidence: 1,
      notes: '',
      revisionNeeded: true,
      sessionId: null,
    })
    const selected = selectInterviewProblems(state, ROADMAP_PROBLEMS, 3, first.difficulty)
    expect(selected).toHaveLength(3)
    expect(selected.map((problem) => problem.id)).not.toContain(first.id)
  })

  it('combines the full interview rubric and no-hint independence', () => {
    const result = getInterviewSessionScore(session(4, '2026-08-20T00:00:00.000Z'))
    expect(result.overall).toBe(82)
    expect(result.independentRate).toBe(100)
    expect(result.patternRecognition).toBe(4)
  })

  it('does not count a hinted result as independent', () => {
    const hinted = session(4, '2026-08-20T00:00:00.000Z')
    hinted.results[0].hintsUsed = 1
    expect(getInterviewSessionScore(hinted).independentRate).toBe(0)
  })

  it('reports readiness trend across recent mocks', () => {
    const sessions = [
      ...Array.from({ length: 5 }, (_, index) => session(2, `2026-07-${10 + index}T00:00:00.000Z`)),
      ...Array.from({ length: 5 }, (_, index) => session(4, `2026-08-${10 + index}T00:00:00.000Z`)),
    ]
    const readiness = getReadinessScore(sessions)
    expect(readiness.sessions).toBe(10)
    expect(readiness.trend).toBeGreaterThan(0)
  })
})