import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { createTrackerWorkbook } from '../src/lib/excel-export'
import { createInitialState } from '../src/lib/storage'

function valueUnderHeading(worksheet: ExcelJS.Worksheet, rowNumber: number, heading: string) {
  const header = worksheet.getRow(1)
  const columnNumber = header.values.findIndex((value) => value === heading)
  return worksheet.getRow(rowNumber).getCell(columnNumber).value
}

describe('Excel tracker export', () => {
  it('exports the full roadmap and persisted tracker details', async () => {
    const state = createInitialState()
    state.createdAt = '2026-08-01T08:00:00.000Z'
    state.updatedAt = '2026-08-23T10:30:00.000Z'
    state.settings.dailyGoal = 4
    state.progress['0001-two-sum'] = {
      problemId: '0001-two-sum',
      status: 'needs-revision',
      attempts: 2,
      confidence: 3,
      notes: 'Revisit the complement-map explanation.',
      totalTimeSeconds: 1_500,
      solvedAt: '2026-08-23T10:30:00.000Z',
      lastAttemptAt: '2026-08-23T10:30:00.000Z',
      lastRevisedAt: null,
      revisionStage: 0,
      nextRevisionAt: '2026-08-24T10:30:00.000Z',
      revisionEase: 2.5,
      revisionIntervalDays: 1,
      revisionLapses: 0,
      successfulRecalls: 0,
      lastRevisionResult: null,
    }
    state.attempts.push({
      id: 'attempt-1',
      problemId: '0001-two-sum',
      startedAt: '2026-08-23T10:05:00.000Z',
      completedAt: '2026-08-23T10:30:00.000Z',
      durationSeconds: 1_500,
      outcome: 'hint',
      attempts: 2,
      confidence: 3,
      notes: 'Needed one hint.',
      revisionNeeded: true,
      sessionId: 'session-1',
    })
    state.revisions.push({
      id: 'revision-1',
      problemId: '0001-two-sum',
      completedAt: '2026-08-24T09:00:00.000Z',
      result: 'weak',
      stageBefore: 1,
      stageAfter: 0,
      confidence: 2,
      durationSeconds: 600,
      intervalDays: 1,
      easeAfter: 2.3,
    })
    state.sessions.push({
      id: 'session-1',
      startedAt: '2026-08-23T10:00:00.000Z',
      endedAt: '2026-08-23T10:35:00.000Z',
      goal: 1,
      problemIds: ['0001-two-sum'],
      attemptIds: ['attempt-1'],
      durationSeconds: 2_100,
    })
    state.interviewSessions.push({
      id: 'interview-1',
      startedAt: '2026-08-24T10:00:00.000Z',
      endedAt: '2026-08-24T10:30:00.000Z',
      targetMinutes: 30,
      difficulty: 'Easy',
      problemIds: ['0001-two-sum'],
      results: [{
        problemId: '0001-two-sum',
        durationSeconds: 1_200,
        outcome: 'independent',
        explanationScore: 4,
        codingScore: 5,
        communicationScore: 4,
        notes: 'Explain complexity before coding.',
      }],
      status: 'completed',
    })
    state.achievements[0].unlockedAt = '2026-08-23T10:30:00.000Z'

    const workbook = createTrackerWorkbook(state, new Date('2026-08-24T12:00:00.000Z'))
    const buffer = await workbook.xlsx.writeBuffer()
    const loaded = new ExcelJS.Workbook()
    await loaded.xlsx.load(buffer)

    expect(loaded.worksheets.map((worksheet) => worksheet.name)).toEqual([
      'Summary',
      'Problem Tracker',
      'Attempts',
      'Revisions',
      'Study Sessions',
      'Interviews',
      'Achievements',
      'Settings',
    ])

    const tracker = loaded.getWorksheet('Problem Tracker')
    expect(tracker).toBeDefined()
    expect(tracker!.rowCount).toBe(251)
    const twoSumRow = tracker!.getColumn(3).values.findIndex((value) => value === 'Two Sum')
    expect(valueUnderHeading(tracker!, twoSumRow, 'Status')).toBe('Needs revision')
    expect(valueUnderHeading(tracker!, twoSumRow, 'Notes')).toBe('Revisit the complement-map explanation.')
    expect(valueUnderHeading(tracker!, twoSumRow, 'Attempts')).toBe(2)

    const attempts = loaded.getWorksheet('Attempts')
    expect(valueUnderHeading(attempts!, 2, 'Problem')).toBe('Two Sum')
    expect(valueUnderHeading(attempts!, 2, 'Notes')).toBe('Needed one hint.')

    const revisions = loaded.getWorksheet('Revisions')
    expect(valueUnderHeading(revisions!, 2, 'Problem')).toBe('Two Sum')
    expect(valueUnderHeading(revisions!, 2, 'Result')).toBe('weak')

    const sessions = loaded.getWorksheet('Study Sessions')
    expect(valueUnderHeading(sessions!, 2, 'Problem Titles')).toBe('Two Sum')
    expect(valueUnderHeading(sessions!, 2, 'Attempt IDs')).toBe('attempt-1')

    const interviews = loaded.getWorksheet('Interviews')
    expect(valueUnderHeading(interviews!, 2, 'Result Problem')).toBe('Two Sum')
    expect(valueUnderHeading(interviews!, 2, 'Notes')).toBe('Explain complexity before coding.')

    const achievements = loaded.getWorksheet('Achievements')
    expect(valueUnderHeading(achievements!, 2, 'Status')).toBe('Unlocked')

    const settings = loaded.getWorksheet('Settings')
    const dailyGoalRow = settings!.getColumn(1).values.findIndex((value) => value === 'Daily problem goal')
    expect(settings!.getCell(dailyGoalRow, 2).value).toBe(4)
  })
})