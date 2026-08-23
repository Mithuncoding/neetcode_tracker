import type { ProblemStatus } from '../types'

export const STATUS_LABELS: Record<ProblemStatus, string> = {
  'not-started': 'Not started',
  attempting: 'Attempting',
  solved: 'Solved',
  'solved-with-hint': 'Solved with hint',
  'solved-after-solution': 'Watched solution',
  'needs-revision': 'Needs revision',
  mastered: 'Mastered',
}