import type { Achievement } from '../types'

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'first-problem', title: 'First Problem', description: 'Complete your first problem.' },
  { id: 'streak-7', title: 'Seven Day Streak', description: 'Stay active for seven days.' },
  { id: 'streak-30', title: 'Thirty Day Streak', description: 'Stay active for thirty days.' },
  { id: 'solved-10', title: 'First Ten', description: 'Complete 10 problems.' },
  { id: 'solved-50', title: 'Building Momentum', description: 'Complete 50 problems.' },
  { id: 'solved-100', title: 'Triple Digits', description: 'Complete 100 problems.' },
  { id: 'solved-150', title: 'NeetCode 150', description: 'Complete 150 problems.' },
  { id: 'solved-200', title: 'Final Stretch', description: 'Complete 200 problems.' },
  { id: 'solved-250', title: 'Roadmap Complete', description: 'Complete all 250 problems.' },
  { id: 'independent-10', title: 'Independent Ten', description: 'Solve 10 problems without help.' },
  { id: 'independent-50', title: 'Pattern Fluency', description: 'Solve 50 problems without help.' },
  { id: 'first-hard', title: 'First Hard', description: 'Complete your first hard problem.' },
  { id: 'hard-10', title: 'Hard Problem Habit', description: 'Complete 10 hard problems.' },
  { id: 'revision-master', title: 'Revision Master', description: 'Complete 25 successful revisions.' },
  { id: 'pattern-hunter', title: 'Pattern Hunter', description: 'Correctly identify 20 patterns before solving.' },
  { id: 'pattern-master', title: 'Pattern Master', description: 'Solve five problems from one core pattern independently.' },
  { id: 'recall-master', title: 'Recall Master', description: 'Complete 10 blind re-solves without hints.' },
  { id: 'medium-breakthrough', title: 'Medium Breakthrough', description: 'Solve five Medium problems independently.' },
  { id: 'explain-10', title: 'Clear Explainer', description: 'Give 10 explanations scoring at least 3/5.' },
  { id: 'interview-ready', title: 'Interview Practice', description: 'Complete 10 scored mock interviews.' },
  { id: 'visual-first', title: 'First Visual Model', description: 'Complete your first 3D algorithm lab.' },
  { id: 'visual-10', title: 'Algorithm Cartographer', description: 'Complete 10 different 3D algorithm labs.' },
  { id: 'visual-30', title: 'Visual Systems Thinker', description: 'Complete 30 different 3D algorithm labs.' },
  { id: 'python-first', title: 'Python First Step', description: 'Complete your first executable Python lesson.' },
  { id: 'python-foundation', title: 'Python Foundation', description: 'Complete 24 Python lessons through core collections.' },
  { id: 'python-interview-ready', title: 'Python Interview Toolkit', description: 'Complete all 48 Python Zero-to-Interview lessons.' },
]

export function createAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map((achievement) => ({
    ...achievement,
    unlockedAt: null,
  }))
}