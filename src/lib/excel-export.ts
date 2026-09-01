import ExcelJS from 'exceljs'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { PROBLEM_STATUSES, type AppState, type ProblemStatus } from '../types'
import { STATUS_LABELS } from './status'
import { getTimerSeconds } from './utils'

const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const SECONDS_PER_DAY = 86_400
const HEADER_COLOR = 'FF173F35'
const ACCENT_COLOR = 'FF1D7A5B'
const BORDER_COLOR = 'FFD9E2DE'
const MUTED_FILL = 'FFF1F5F3'

const STATUS_COLORS: Record<ProblemStatus, string> = {
  'not-started': 'FFE8ECEA',
  attempting: 'FFDCEBFA',
  solved: 'FFDDF3E8',
  'solved-with-hint': 'FFFFF0C9',
  'solved-after-solution': 'FFFFE3C2',
  'needs-revision': 'FFF9DADA',
  mastered: 'FFE8E0F5',
}

const DIFFICULTY_COLORS = {
  Easy: 'FFDDF3E8',
  Medium: 'FFFFF0C9',
  Hard: 'FFF9DADA',
} as const

type ExportRow = Record<string, ExcelJS.CellValue>

interface ExportColumn {
  header: string
  key: string
  width: number
  numFmt?: string
}

function toExcelDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date
}

function toExcelDuration(seconds: number) {
  return seconds / SECONDS_PER_DAY
}

function problemFor(problemId: string) {
  return ROADMAP_PROBLEMS.find((problem) => problem.id === problemId)
}

function applyHeaderStyle(row: ExcelJS.Row) {
  row.height = 28
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    cell.border = { bottom: { style: 'thin', color: { argb: HEADER_COLOR } } }
  })
}

function addDataSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  columns: ExportColumn[],
  rows: ExportRow[],
) {
  const worksheet = workbook.addWorksheet(name, {
    views: [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }],
  })
  worksheet.columns = columns
  worksheet.addRows(rows)
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  }
  worksheet.properties.defaultRowHeight = 21
  worksheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  }
  applyHeaderStyle(worksheet.getRow(1))

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: 'Aptos', size: 10, color: { argb: 'FF20332D' } }
      cell.alignment = { vertical: 'top' }
      cell.border = { bottom: { style: 'hair', color: { argb: BORDER_COLOR } } }
    })
  })

  for (const column of columns) {
    if (column.numFmt) worksheet.getColumn(column.key).numFmt = column.numFmt
  }
  return worksheet
}

function addSummarySheet(workbook: ExcelJS.Workbook, state: AppState, exportedAt: Date) {
  const worksheet = workbook.addWorksheet('Summary', {
    views: [{ state: 'frozen', ySplit: 3, activeCell: 'A4' }],
  })
  worksheet.columns = [
    { width: 22 }, { width: 14 }, { width: 3 }, { width: 25 },
    { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 },
  ]
  worksheet.mergeCells('A1:H1')
  worksheet.getCell('A1').value = 'NEETCODE 250 TRACKER'
  worksheet.getCell('A1').font = { name: 'Aptos Display', size: 22, bold: true, color: { argb: 'FFFFFFFF' } }
  worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } }
  worksheet.getCell('A1').alignment = { vertical: 'middle' }
  worksheet.getRow(1).height = 42
  worksheet.mergeCells('A2:H2')
  worksheet.getCell('A2').value = `Snapshot exported ${exportedAt.toISOString()}`
  worksheet.getCell('A2').font = { name: 'Aptos', size: 10, italic: true, color: { argb: 'FF52665F' } }
  worksheet.getRow(2).height = 24

  const completed = ROADMAP_PROBLEMS.filter((problem) => state.progress[problem.id]?.solvedAt).length
  const mastered = ROADMAP_PROBLEMS.filter((problem) => state.progress[problem.id]?.status === 'mastered').length
  const attempted = ROADMAP_PROBLEMS.filter((problem) => (state.progress[problem.id]?.attempts ?? 0) > 0).length
  const dueForRevision = ROADMAP_PROBLEMS.filter((problem) => {
    const nextRevisionAt = state.progress[problem.id]?.nextRevisionAt
    return nextRevisionAt && Date.parse(nextRevisionAt) <= exportedAt.getTime()
  }).length
  const totalTime = Object.values(state.progress).reduce((sum, progress) => sum + progress.totalTimeSeconds, 0)
  const metrics: Array<[string, ExcelJS.CellValue]> = [
    ['Total problems', ROADMAP_PROBLEMS.length],
    ['Completed', completed],
    ['Completion', completed / ROADMAP_PROBLEMS.length],
    ['Mastered', mastered],
    ['Attempted', attempted],
    ['Due for revision', dueForRevision],
    ['Logged attempts', state.attempts.length],
    ['Total time', toExcelDuration(totalTime)],
  ]
  metrics.forEach(([label, value], index) => {
    const labelCell = worksheet.getCell(4 + Math.floor(index / 4) * 2, 1 + (index % 4) * 2)
    const valueCell = worksheet.getCell(labelCell.row + 1, labelCell.col)
    labelCell.value = label
    labelCell.font = { name: 'Aptos', size: 9, bold: true, color: { argb: 'FF52665F' } }
    valueCell.value = value
    valueCell.font = { name: 'Aptos Display', size: 18, bold: true, color: { argb: ACCENT_COLOR } }
    valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MUTED_FILL } }
  })
  worksheet.getCell('E5').numFmt = '0.0%'
  worksheet.getCell('G7').numFmt = '[h]:mm:ss'

  worksheet.getCell('A10').value = 'Status breakdown'
  worksheet.getCell('A10').font = { bold: true, size: 12, color: { argb: HEADER_COLOR } }
  worksheet.getRow(11).values = ['Status', 'Problems']
  PROBLEM_STATUSES.forEach((status, index) => {
    const row = 12 + index
    worksheet.getCell(row, 1).value = STATUS_LABELS[status]
    worksheet.getCell(row, 2).value = ROADMAP_PROBLEMS.filter(
      (problem) => (state.progress[problem.id]?.status ?? 'not-started') === status,
    ).length
    worksheet.getCell(row, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STATUS_COLORS[status] } }
  })

  worksheet.getCell('D10').value = 'Topic progress'
  worksheet.getCell('D10').font = { bold: true, size: 12, color: { argb: HEADER_COLOR } }
  worksheet.getRow(11).getCell(4).value = 'Topic'
  worksheet.getRow(11).getCell(5).value = 'Completed'
  worksheet.getRow(11).getCell(6).value = 'Total'
  worksheet.getRow(11).getCell(7).value = 'Progress'
  applyHeaderStyle(worksheet.getRow(11))
  const topics = [...new Set(ROADMAP_PROBLEMS.map((problem) => problem.topic))]
  topics.forEach((topic, index) => {
    const row = 12 + index
    const problems = ROADMAP_PROBLEMS.filter((problem) => problem.topic === topic)
    const solved = problems.filter((problem) => state.progress[problem.id]?.solvedAt).length
    worksheet.getCell(row, 4).value = topic
    worksheet.getCell(row, 5).value = solved
    worksheet.getCell(row, 6).value = problems.length
    worksheet.getCell(row, 7).value = solved / problems.length
    worksheet.getCell(row, 7).numFmt = '0.0%'
  })

  worksheet.eachRow((row, rowNumber) => {
    if ([1, 11].includes(rowNumber)) return
    row.eachCell({ includeEmpty: true }, (cell) => {
      if (!cell.font) cell.font = { name: 'Aptos', size: 10, color: { argb: 'FF20332D' } }
    })
  })
  return worksheet
}

function addProblemTracker(workbook: ExcelJS.Workbook, state: AppState) {
  const columns: ExportColumn[] = [
    { header: 'Order', key: 'order', width: 8 },
    { header: 'LeetCode #', key: 'leetcodeNumber', width: 12 },
    { header: 'Problem', key: 'title', width: 32 },
    { header: 'Difficulty', key: 'difficulty', width: 12 },
    { header: 'Topic', key: 'topic', width: 24 },
    { header: 'Patterns', key: 'patterns', width: 36 },
    { header: 'Status', key: 'status', width: 22 },
    { header: 'Attempts', key: 'attempts', width: 10 },
    { header: 'Confidence', key: 'confidence', width: 12 },
    { header: 'Time Spent', key: 'totalTime', width: 14, numFmt: '[h]:mm:ss' },
    { header: 'Notes', key: 'notes', width: 48 },
    { header: 'Solved At', key: 'solvedAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'Last Attempt', key: 'lastAttemptAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'Last Revised', key: 'lastRevisedAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'Revision Stage', key: 'revisionStage', width: 14 },
    { header: 'Next Revision', key: 'nextRevisionAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'Revision Ease', key: 'revisionEase', width: 13, numFmt: '0.00' },
    { header: 'Interval (Days)', key: 'revisionIntervalDays', width: 15 },
    { header: 'Successful Recalls', key: 'successfulRecalls', width: 17 },
    { header: 'Lapses', key: 'revisionLapses', width: 9 },
    { header: 'Last Revision Result', key: 'lastRevisionResult', width: 20 },
    { header: 'NeetCode', key: 'neetcodeUrl', width: 12 },
    { header: 'LeetCode', key: 'leetcodeUrl', width: 12 },
    { header: 'Problem ID', key: 'problemId', width: 30 },
  ]
  const rows = ROADMAP_PROBLEMS.map((problem): ExportRow => {
    const progress = state.progress[problem.id]
    return {
      order: problem.recommendedOrder,
      leetcodeNumber: problem.leetcodeNumber,
      title: problem.title,
      difficulty: problem.difficulty,
      topic: problem.topic,
      patterns: problem.patterns.join(', '),
      status: STATUS_LABELS[progress?.status ?? 'not-started'],
      attempts: progress?.attempts ?? 0,
      confidence: progress?.confidence ?? null,
      totalTime: toExcelDuration(progress?.totalTimeSeconds ?? 0),
      notes: progress?.notes ?? '',
      solvedAt: toExcelDate(progress?.solvedAt ?? null),
      lastAttemptAt: toExcelDate(progress?.lastAttemptAt ?? null),
      lastRevisedAt: toExcelDate(progress?.lastRevisedAt ?? null),
      revisionStage: progress?.revisionStage ?? 0,
      nextRevisionAt: toExcelDate(progress?.nextRevisionAt ?? null),
      revisionEase: progress?.revisionEase ?? 2.5,
      revisionIntervalDays: progress?.revisionIntervalDays ?? 1,
      successfulRecalls: progress?.successfulRecalls ?? 0,
      revisionLapses: progress?.revisionLapses ?? 0,
      lastRevisionResult: progress?.lastRevisionResult ?? '',
      neetcodeUrl: { text: 'Open', hyperlink: problem.neetcodeUrl },
      leetcodeUrl: { text: 'Open', hyperlink: problem.leetcodeUrl },
      problemId: problem.id,
    }
  })
  const worksheet = addDataSheet(workbook, 'Problem Tracker', columns, rows)
  worksheet.pageSetup.printTitlesRow = '1:1'
  worksheet.getColumn('notes').alignment = { vertical: 'top', wrapText: true }
  worksheet.getColumn('confidence').alignment = { vertical: 'top', horizontal: 'center' }
  worksheet.getColumn('attempts').alignment = { vertical: 'top', horizontal: 'center' }
  worksheet.getColumn('status').eachCell((cell, rowNumber) => {
    if (rowNumber === 1) return
    const status = PROBLEM_STATUSES.find((candidate) => STATUS_LABELS[candidate] === cell.value)
    if (status) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STATUS_COLORS[status] } }
  })
  worksheet.getColumn('difficulty').eachCell((cell, rowNumber) => {
    if (rowNumber === 1) return
    const difficulty = cell.value as keyof typeof DIFFICULTY_COLORS
    if (DIFFICULTY_COLORS[difficulty]) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DIFFICULTY_COLORS[difficulty] } }
    }
  })
  return worksheet
}

function addAttemptSheet(workbook: ExcelJS.Workbook, state: AppState) {
  return addDataSheet(workbook, 'Attempts', [
    { header: 'Completed At', key: 'completedAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'Started At', key: 'startedAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'LeetCode #', key: 'leetcodeNumber', width: 12 },
    { header: 'Problem', key: 'problem', width: 32 },
    { header: 'Topic', key: 'topic', width: 24 },
    { header: 'Difficulty', key: 'difficulty', width: 12 },
    { header: 'Outcome', key: 'outcome', width: 18 },
    { header: 'Attempts', key: 'attempts', width: 10 },
    { header: 'Confidence', key: 'confidence', width: 12 },
    { header: 'Duration', key: 'duration', width: 14, numFmt: '[h]:mm:ss' },
    { header: 'Revision Needed', key: 'revisionNeeded', width: 16 },
    { header: 'Notes', key: 'notes', width: 48 },
    { header: 'Study Session ID', key: 'sessionId', width: 30 },
    { header: 'Attempt ID', key: 'attemptId', width: 30 },
    { header: 'Problem ID', key: 'problemId', width: 30 },
  ], state.attempts.map((attempt): ExportRow => {
    const problem = problemFor(attempt.problemId)
    return {
      completedAt: toExcelDate(attempt.completedAt),
      startedAt: toExcelDate(attempt.startedAt),
      leetcodeNumber: problem?.leetcodeNumber ?? '',
      problem: problem?.title ?? attempt.problemId,
      topic: problem?.topic ?? '',
      difficulty: problem?.difficulty ?? '',
      outcome: attempt.outcome,
      attempts: attempt.attempts,
      confidence: attempt.confidence,
      duration: toExcelDuration(attempt.durationSeconds),
      revisionNeeded: attempt.revisionNeeded ? 'Yes' : 'No',
      notes: attempt.notes,
      sessionId: attempt.sessionId ?? '',
      attemptId: attempt.id,
      problemId: attempt.problemId,
    }
  }))
}

function addRevisionSheet(workbook: ExcelJS.Workbook, state: AppState) {
  return addDataSheet(workbook, 'Revisions', [
    { header: 'Completed At', key: 'completedAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'LeetCode #', key: 'leetcodeNumber', width: 12 },
    { header: 'Problem', key: 'problem', width: 32 },
    { header: 'Result', key: 'result', width: 12 },
    { header: 'Stage Before', key: 'stageBefore', width: 13 },
    { header: 'Stage After', key: 'stageAfter', width: 12 },
    { header: 'Confidence', key: 'confidence', width: 12 },
    { header: 'Duration', key: 'duration', width: 14, numFmt: '[h]:mm:ss' },
    { header: 'Interval (Days)', key: 'intervalDays', width: 15 },
    { header: 'Ease After', key: 'easeAfter', width: 12, numFmt: '0.00' },
    { header: 'Revision ID', key: 'revisionId', width: 30 },
    { header: 'Problem ID', key: 'problemId', width: 30 },
  ], state.revisions.map((revision): ExportRow => {
    const problem = problemFor(revision.problemId)
    return {
      completedAt: toExcelDate(revision.completedAt),
      leetcodeNumber: problem?.leetcodeNumber ?? '',
      problem: problem?.title ?? revision.problemId,
      result: revision.result,
      stageBefore: revision.stageBefore,
      stageAfter: revision.stageAfter,
      confidence: revision.confidence,
      duration: toExcelDuration(revision.durationSeconds),
      intervalDays: revision.intervalDays,
      easeAfter: revision.easeAfter,
      revisionId: revision.id,
      problemId: revision.problemId,
    }
  }))
}

function addSessionSheet(workbook: ExcelJS.Workbook, state: AppState) {
  return addDataSheet(workbook, 'Study Sessions', [
    { header: 'Started At', key: 'startedAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'Ended At', key: 'endedAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'Goal', key: 'goal', width: 12 },
    { header: 'Duration', key: 'duration', width: 14, numFmt: '[h]:mm:ss' },
    { header: 'Problems', key: 'problemCount', width: 11 },
    { header: 'Attempts', key: 'attemptCount', width: 11 },
    { header: 'Problem Titles', key: 'problemTitles', width: 52 },
    { header: 'Session ID', key: 'sessionId', width: 30 },
    { header: 'Problem IDs', key: 'problemIds', width: 52 },
    { header: 'Attempt IDs', key: 'attemptIds', width: 52 },
  ], state.sessions.map((session): ExportRow => ({
    startedAt: toExcelDate(session.startedAt),
    endedAt: toExcelDate(session.endedAt),
    goal: session.goal,
    duration: toExcelDuration(session.durationSeconds),
    problemCount: session.problemIds.length,
    attemptCount: session.attemptIds.length,
    problemTitles: session.problemIds.map((problemId) => problemFor(problemId)?.title ?? problemId).join(', '),
    sessionId: session.id,
    problemIds: session.problemIds.join(', '),
    attemptIds: session.attemptIds.join(', '),
  })))
}

function addInterviewSheet(workbook: ExcelJS.Workbook, state: AppState) {
  const rows = state.interviewSessions.flatMap((session): ExportRow[] => {
    const results = session.results.length ? session.results : [null]
    return results.map((result): ExportRow => {
      const problem = result ? problemFor(result.problemId) : undefined
      return {
        startedAt: toExcelDate(session.startedAt),
        endedAt: toExcelDate(session.endedAt),
        status: session.status,
        targetMinutes: session.targetMinutes,
        difficulty: session.difficulty,
        plannedProblems: session.problemIds.map((problemId) => problemFor(problemId)?.title ?? problemId).join(', '),
        resultProblem: problem?.title ?? '',
        resultOutcome: result?.outcome ?? '',
        resultDuration: result ? toExcelDuration(result.durationSeconds) : null,
        understandingScore: result?.understandingScore ?? null,
        patternRecognitionScore: result?.patternRecognitionScore ?? null,
        approachScore: result?.approachScore ?? null,
        explanationScore: result?.explanationScore ?? null,
        codingScore: result?.codingScore ?? null,
        complexityScore: result?.complexityScore ?? null,
        communicationScore: result?.communicationScore ?? null,
        hintsUsed: result?.hintsUsed ?? null,
        notes: result?.notes ?? '',
        sessionId: session.id,
        plannedProblemIds: session.problemIds.join(', '),
        resultProblemId: result?.problemId ?? '',
      }
    })
  })
  return addDataSheet(workbook, 'Interviews', [
    { header: 'Started At', key: 'startedAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'Ended At', key: 'endedAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Target Minutes', key: 'targetMinutes', width: 15 },
    { header: 'Difficulty', key: 'difficulty', width: 12 },
    { header: 'Planned Problems', key: 'plannedProblems', width: 52 },
    { header: 'Result Problem', key: 'resultProblem', width: 32 },
    { header: 'Outcome', key: 'resultOutcome', width: 16 },
    { header: 'Duration', key: 'resultDuration', width: 14, numFmt: '[h]:mm:ss' },
    { header: 'Understanding', key: 'understandingScore', width: 14 },
    { header: 'Pattern Recognition', key: 'patternRecognitionScore', width: 20 },
    { header: 'Approach', key: 'approachScore', width: 11 },
    { header: 'Explanation', key: 'explanationScore', width: 12 },
    { header: 'Coding', key: 'codingScore', width: 10 },
    { header: 'Complexity', key: 'complexityScore', width: 12 },
    { header: 'Communication', key: 'communicationScore', width: 15 },
    { header: 'Hints Used', key: 'hintsUsed', width: 11 },
    { header: 'Notes', key: 'notes', width: 48 },
    { header: 'Interview ID', key: 'sessionId', width: 30 },
    { header: 'Planned Problem IDs', key: 'plannedProblemIds', width: 52 },
    { header: 'Result Problem ID', key: 'resultProblemId', width: 30 },
  ], rows)
}

function addMentorSessionSheet(workbook: ExcelJS.Workbook, state: AppState) {
  return addDataSheet(workbook, 'Mentor Sessions', [
    { header: 'Started At', key: 'startedAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'Completed At', key: 'completedAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'Problem', key: 'problem', width: 34 },
    { header: 'Mode', key: 'mode', width: 18 },
    { header: 'Hint Level', key: 'hintLevel', width: 12 },
    { header: 'Recognized Pattern', key: 'recognizedPattern', width: 19 },
    { header: 'Brute Force Captured', key: 'bruteForceCaptured', width: 20 },
    { header: 'Understanding Score', key: 'understandingScore', width: 20 },
    { header: 'Derivation Score', key: 'derivationScore', width: 17 },
    { header: 'Implementation', key: 'implementation', width: 16 },
    { header: 'Code Score', key: 'codeScore', width: 12 },
    { header: 'Python Code', key: 'code', width: 72 },
    { header: 'Explanation Score', key: 'explanationScore', width: 18 },
    { header: 'Explanation', key: 'explanation', width: 56 },
    { header: 'Failure Reason', key: 'failureReason', width: 22 },
    { header: 'Reflection', key: 'reflection', width: 56 },
    { header: 'Session ID', key: 'sessionId', width: 30 },
    { header: 'Problem ID', key: 'problemId', width: 30 },
  ], state.mentor.guidedSessions.map((session): ExportRow => ({
    startedAt: toExcelDate(session.startedAt),
    completedAt: toExcelDate(session.completedAt),
    problem: problemFor(session.problemId)?.title ?? session.problemId,
    mode: session.mode,
    hintLevel: session.hintLevelReached,
    recognizedPattern: session.recognizedPattern === null ? 'Not measured' : session.recognizedPattern ? 'Yes' : 'No',
    bruteForceCaptured: session.bruteForceCaptured ? 'Yes' : 'No',
    understandingScore: session.understandingScore,
    derivationScore: session.derivationScore,
    implementation: session.implementationCompleted ? 'Completed' : 'Blocked',
    codeScore: session.codeScore,
    code: session.code,
    explanationScore: session.explanationScore,
    explanation: session.explanation,
    failureReason: session.failureReason ?? '',
    reflection: session.reflection,
    sessionId: session.id,
    problemId: session.problemId,
  })))
}

function addRecognitionSheet(workbook: ExcelJS.Workbook, state: AppState) {
  return addDataSheet(workbook, 'Pattern Recognition', [
    { header: 'Created At', key: 'createdAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'Problem', key: 'problem', width: 34 },
    { header: 'Selected Pattern', key: 'selectedPattern', width: 24 },
    { header: 'Expected Pattern', key: 'expectedPattern', width: 24 },
    { header: 'Correct', key: 'correct', width: 10 },
    { header: 'Confidence', key: 'confidence', width: 12 },
    { header: 'Attempt ID', key: 'attemptId', width: 30 },
    { header: 'Problem ID', key: 'problemId', width: 30 },
  ], state.mentor.recognitionAttempts.map((attempt): ExportRow => ({
    createdAt: toExcelDate(attempt.createdAt),
    problem: problemFor(attempt.problemId)?.title ?? attempt.problemId,
    selectedPattern: attempt.selectedPattern,
    expectedPattern: attempt.expectedPattern,
    correct: attempt.correct ? 'Yes' : 'No',
    confidence: attempt.confidence,
    attemptId: attempt.id,
    problemId: attempt.problemId,
  })))
}

function addMistakeSheet(workbook: ExcelJS.Workbook, state: AppState) {
  return addDataSheet(workbook, 'Mistake Memory', [
    { header: 'Created At', key: 'createdAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'Problem', key: 'problem', width: 34 },
    { header: 'Category', key: 'category', width: 24 },
    { header: 'Note', key: 'note', width: 64 },
    { header: 'Resolved At', key: 'resolvedAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'Mistake ID', key: 'mistakeId', width: 30 },
    { header: 'Problem ID', key: 'problemId', width: 30 },
  ], state.mentor.mistakes.map((mistake): ExportRow => ({
    createdAt: toExcelDate(mistake.createdAt),
    problem: problemFor(mistake.problemId)?.title ?? mistake.problemId,
    category: mistake.category,
    note: mistake.note,
    resolvedAt: toExcelDate(mistake.resolvedAt),
    mistakeId: mistake.id,
    problemId: mistake.problemId,
  })))
}

function addAlgorithmLabSheet(workbook: ExcelJS.Workbook, state: AppState) {
  return addDataSheet(workbook, '3D Algorithm Lab', [
    { header: 'Scene ID', key: 'sceneId', width: 28 },
    { header: 'Completed At', key: 'completedAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'Frames Viewed', key: 'framesViewed', width: 15 },
    { header: 'Correct Predictions', key: 'correctPredictions', width: 20 },
    { header: 'Total Predictions', key: 'totalPredictions', width: 18 },
  ], Object.values(state.mentor.algorithmLab).map((record): ExportRow => ({
    sceneId: record.sceneId,
    completedAt: toExcelDate(record.completedAt),
    framesViewed: record.framesViewed,
    correctPredictions: record.correctPredictions,
    totalPredictions: record.totalPredictions,
  })))
}

function addAchievementSheet(workbook: ExcelJS.Workbook, state: AppState) {
  return addDataSheet(workbook, 'Achievements', [
    { header: 'Achievement', key: 'title', width: 28 },
    { header: 'Description', key: 'description', width: 56 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Unlocked At', key: 'unlockedAt', width: 20, numFmt: 'yyyy-mm-dd hh:mm' },
    { header: 'Achievement ID', key: 'achievementId', width: 30 },
  ], state.achievements.map((achievement): ExportRow => ({
    title: achievement.title,
    description: achievement.description,
    status: achievement.unlockedAt ? 'Unlocked' : 'Locked',
    unlockedAt: toExcelDate(achievement.unlockedAt),
    achievementId: achievement.id,
  })))
}

function addSettingsSheet(workbook: ExcelJS.Workbook, state: AppState, exportedAt: Date) {
  const activeTimerProblem = state.activeTimer ? problemFor(state.activeTimer.problemId) : null
  const activeTimerSeconds = state.activeTimer
    ? getTimerSeconds(state.activeTimer, exportedAt.getTime())
    : 0
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const rows: ExportRow[] = [
    { setting: 'Exported at', value: toExcelDate(exportedAt.toISOString()) },
    { setting: 'Tracker created at', value: toExcelDate(state.createdAt) },
    { setting: 'Tracker updated at', value: toExcelDate(state.updatedAt) },
    { setting: 'Data version', value: state.version },
    { setting: 'Daily problem goal', value: state.settings.dailyGoal },
    { setting: 'Active topic', value: state.settings.activeTopic },
    { setting: 'Theme', value: state.settings.theme },
    { setting: 'Start timer automatically', value: state.settings.autoStartTimer ? 'Yes' : 'No' },
    { setting: 'Revision mode', value: state.settings.revisionMode },
    { setting: 'Revision intervals (days)', value: state.settings.revisionIntervals.join(', ') },
    { setting: 'Backup retention', value: state.settings.backupRetention },
    { setting: 'Planner target date', value: state.settings.planner.targetDate ?? '' },
    { setting: 'Planner study days', value: state.settings.planner.studyDays.map((day) => dayNames[day]).join(', ') },
    { setting: 'Planner session minutes', value: state.settings.planner.sessionMinutes },
    { setting: 'Planner mode', value: state.settings.planner.mode },
    { setting: 'Active timer problem', value: activeTimerProblem?.title ?? '' },
    { setting: 'Active timer elapsed', value: toExcelDuration(activeTimerSeconds) },
    { setting: 'Active timer running', value: state.activeTimer?.running ? 'Yes' : 'No' },
    { setting: 'Mentor display name', value: state.mentor.displayName },
    { setting: 'Mentor current level', value: state.mentor.currentLevel },
    { setting: 'Mentor onboarding complete', value: state.mentor.onboardingComplete ? 'Yes' : 'No' },
    { setting: 'One-year plan started at', value: toExcelDate(state.mentor.yearPlanStartedAt) },
    { setting: 'Completed plan weeks', value: state.mentor.completedPlanWeeks.join(', ') },
    { setting: 'LeetCode username', value: state.mentor.leetcodeProfile?.username ?? '' },
    { setting: 'LeetCode profile synced at', value: toExcelDate(state.mentor.leetcodeProfile?.syncedAt ?? null) },
    { setting: 'LeetCode public solved count', value: state.mentor.leetcodeProfile?.totalSolved ?? '' },
  ]
  const worksheet = addDataSheet(workbook, 'Settings', [
    { header: 'Setting', key: 'setting', width: 32 },
    { header: 'Value', key: 'value', width: 64 },
  ], rows)
  worksheet.getCell(2, 2).numFmt = 'yyyy-mm-dd hh:mm'
  worksheet.getCell(3, 2).numFmt = 'yyyy-mm-dd hh:mm'
  worksheet.getCell(4, 2).numFmt = 'yyyy-mm-dd hh:mm'
  worksheet.getCell(18, 2).numFmt = '[h]:mm:ss'
  return worksheet
}

export function createTrackerWorkbook(state: AppState, exportedAt = new Date()) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'NeetCode 250 Tracker'
  workbook.title = 'NeetCode 250 Progress Tracker'
  workbook.subject = 'NeetCode roadmap progress and activity export'
  workbook.created = exportedAt
  workbook.modified = exportedAt
  workbook.calcProperties.fullCalcOnLoad = true

  addSummarySheet(workbook, state, exportedAt)
  addProblemTracker(workbook, state)
  addAttemptSheet(workbook, state)
  addRevisionSheet(workbook, state)
  addSessionSheet(workbook, state)
  addInterviewSheet(workbook, state)
  addMentorSessionSheet(workbook, state)
  addRecognitionSheet(workbook, state)
  addMistakeSheet(workbook, state)
  addAlgorithmLabSheet(workbook, state)
  addAchievementSheet(workbook, state)
  addSettingsSheet(workbook, state, exportedAt)
  return workbook
}

export async function downloadTrackerWorkbook(state: AppState) {
  const exportedAt = new Date()
  const workbook = createTrackerWorkbook(state, exportedAt)
  const buffer = await workbook.xlsx.writeBuffer()
  const url = URL.createObjectURL(new Blob([buffer], { type: EXCEL_MIME_TYPE }))
  const link = document.createElement('a')
  link.href = url
  link.download = `neetcode-250-tracker-${exportedAt.toISOString().slice(0, 10)}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}