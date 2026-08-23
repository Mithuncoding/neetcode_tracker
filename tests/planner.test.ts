import { describe, expect, it } from 'vitest'
import { ROADMAP_PROBLEMS } from '../src/data/problems'
import { createInitialState } from '../src/lib/storage'
import { getAdaptiveRecommendations, getPatternStats, getPlannerSummary } from '../src/lib/planner'
import { getDefaultProgress } from '../src/lib/utils'

describe('adaptive planner', () => {
  it('prioritizes overdue revision above unsolved work', () => {
    const state = createInitialState()
    const due = ROADMAP_PROBLEMS[10]
    state.progress[due.id] = {
      ...getDefaultProgress(due.id),
      status: 'solved',
      solvedAt: '2026-08-01T00:00:00.000Z',
      nextRevisionAt: '2026-08-20T00:00:00.000Z',
    }
    const recommendations = getAdaptiveRecommendations(
      state,
      ROADMAP_PROBLEMS,
      5,
      new Date('2026-08-23T12:00:00.000Z'),
    )
    expect(recommendations[0].problem.id).toBe(due.id)
    expect(recommendations[0].reason).toContain('overdue')
  })

  it('computes target-date workload from selected study days', () => {
    const state = createInitialState()
    state.settings.planner.targetDate = '2026-09-23'
    state.settings.planner.studyDays = [1, 2, 3, 4, 5]
    const summary = getPlannerSummary(state, ROADMAP_PROBLEMS, new Date('2026-08-24T10:00:00'))
    expect(summary.studyDaysRemaining).toBeGreaterThan(0)
    expect(summary.requiredPerStudyDay).toBeGreaterThan(0)
    expect(summary.isStudyDay).toBe(true)
  })

  it('produces fine-grained pattern weakness data', () => {
    const stats = getPatternStats(createInitialState(), ROADMAP_PROBLEMS)
    expect(stats.some((item) => item.pattern === 'Monotonic Stack')).toBe(true)
    expect(stats.every((item) => item.weakness >= 0 && item.weakness <= 100)).toBe(true)
  })
})