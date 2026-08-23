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
]

export function createAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map((achievement) => ({
    ...achievement,
    unlockedAt: null,
  }))
}