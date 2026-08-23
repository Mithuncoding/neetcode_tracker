import { describe, expect, it } from 'vitest'
import { advanceRevision, scheduleInitialReview } from '../src/lib/spaced-repetition'
import { getDefaultProgress } from '../src/lib/utils'

const settings = {
  revisionMode: 'adaptive' as const,
  revisionIntervals: [1, 3, 7, 14, 30, 60],
}

describe('adaptive spaced repetition', () => {
  it('schedules weak initial confidence sooner', () => {
    const weak = scheduleInitialReview(1, settings, '2026-08-23T12:00:00.000Z')
    const strong = scheduleInitialReview(5, settings, '2026-08-23T12:00:00.000Z')
    expect(weak.intervalDays).toBe(1)
    expect(strong.intervalDays).toBe(4)
  })

  it('penalizes an overconfident failed recall', () => {
    const progress = getDefaultProgress('0001-two-sum')
    const result = advanceRevision(progress, 'weak', 5, settings, '2026-08-23T12:00:00.000Z')
    expect(result.stageAfter).toBe(0)
    expect(result.intervalDays).toBe(1)
    expect(result.lapsesAfter).toBe(1)
    expect(result.easeAfter).toBeLessThan(progress.revisionEase)
  })

  it('grows intervals after successful recalls', () => {
    const firstProgress = getDefaultProgress('0001-two-sum')
    const first = advanceRevision(firstProgress, 'recalled', 4, settings, '2026-08-23T12:00:00.000Z')
    const secondProgress = {
      ...firstProgress,
      revisionStage: first.stageAfter,
      revisionEase: first.easeAfter,
      revisionIntervalDays: first.intervalDays,
      successfulRecalls: first.successfulRecallsAfter,
    }
    const second = advanceRevision(secondProgress, 'recalled', 5, settings, '2026-08-25T12:00:00.000Z')
    expect(second.intervalDays).toBeGreaterThan(first.intervalDays)
    expect(second.successfulRecallsAfter).toBe(2)
  })
})