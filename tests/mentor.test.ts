import { describe, expect, it } from 'vitest'
import { ROADMAP_PROBLEMS } from '../src/data/problems'
import {
  evaluateExplanation,
  getCorePattern,
  getDailyMentorMission,
  getMediumLadder,
  getMentorReadiness,
  getPatternMastery,
  getRecommendedLevel,
} from '../src/lib/mentor'
import { createInitialState } from '../src/lib/storage'
import { getDefaultProgress } from '../src/lib/utils'

describe('mentor learning intelligence', () => {
  it('normalizes roadmap metadata into teachable core patterns', () => {
    const longestSubstring = ROADMAP_PROBLEMS.find((problem) => problem.title === 'Longest Substring Without Repeating Characters')
    const courseSchedule = ROADMAP_PROBLEMS.find((problem) => problem.title === 'Course Schedule')
    expect(longestSubstring && getCorePattern(longestSubstring)).toBe('Sliding Window')
    expect(courseSchedule && getCorePattern(courseSchedule)).toBe('Topological Sort')
  })

  it('combines recognition, implementation, recall, and independence evidence', () => {
    const state = createInitialState()
    const problem = ROADMAP_PROBLEMS.find((item) => item.title === 'Two Sum')!
    state.progress[problem.id] = {
      ...getDefaultProgress(problem.id),
      status: 'solved',
      solvedAt: '2026-09-01T10:00:00.000Z',
      confidence: 4,
    }
    state.attempts.push({
      id: 'attempt-1',
      problemId: problem.id,
      startedAt: '2026-09-01T09:45:00.000Z',
      completedAt: '2026-09-01T10:00:00.000Z',
      durationSeconds: 900,
      outcome: 'independent',
      attempts: 1,
      confidence: 4,
      notes: '',
      revisionNeeded: false,
      sessionId: null,
    })
    state.mentor.recognitionAttempts.push({
      id: 'recognition-1',
      problemId: problem.id,
      selectedPattern: 'Arrays & Hashing',
      expectedPattern: 'Arrays & Hashing',
      correct: true,
      confidence: 4,
      createdAt: '2026-09-01T09:44:00.000Z',
    })
    state.revisions.push({
      id: 'revision-1',
      problemId: problem.id,
      completedAt: '2026-09-04T10:00:00.000Z',
      result: 'recalled',
      stageBefore: 0,
      stageAfter: 1,
      confidence: 4,
      durationSeconds: 600,
      intervalDays: 4,
      easeAfter: 2.7,
    })

    const mastery = getPatternMastery(state, ROADMAP_PROBLEMS).find((item) => item.pattern === 'Arrays & Hashing')!
    expect(mastery.recognition).toBe(100)
    expect(mastery.implementation).toBeGreaterThan(90)
    expect(mastery.recall).toBe(100)
    expect(mastery.independence).toBe(100)
    expect(mastery.mastery).toBeLessThan(100)
    expect(mastery.mastery).toBeGreaterThan(50)
  })

  it('does not treat a public LeetCode count as proof of interview readiness', () => {
    const state = createInitialState()
    state.mentor.leetcodeProfile = {
      username: 'Mithuncoding',
      syncedAt: '2026-09-02T00:00:00.000Z',
      ranking: 1_793_902,
      totalSolved: 90,
      easySolved: 76,
      mediumSolved: 13,
      hardSolved: 1,
      acceptanceRate: 68.75,
      activeDays: 43,
      maxStreak: 15,
      primaryLanguage: 'Python',
      matchedProblemIds: [],
      source: 'https://leetcode.com/u/Mithuncoding/',
    }
    expect(getMentorReadiness(state, ROADMAP_PROBLEMS).score).toBe(0)
  })

  it('builds a gradual Easy-to-Medium ladder for one weak pattern', () => {
    const ladder = getMediumLadder(createInitialState(), ROADMAP_PROBLEMS)
    expect(ladder.items.length).toBeGreaterThanOrEqual(3)
    expect(ladder.items[0].problem.difficulty).toBe('Easy')
    expect(ladder.items.some((item) => item.problem.difficulty === 'Medium')).toBe(true)
  })

  it('keeps the initial diagnostic within foundation transition levels', () => {
    expect(getRecommendedLevel(0, 9)).toBe(0)
    expect(getRecommendedLevel(4, 9)).toBe(1)
    expect(getRecommendedLevel(6, 9)).toBe(2)
    expect(getRecommendedLevel(9, 9)).toBe(3)
  })

  it('does not put a new learner into a random Medium mission', () => {
    const mission = getDailyMentorMission(createInitialState(), ROADMAP_PROBLEMS)
    expect(mission.some((task) => task.id === 'challenge')).toBe(false)
    expect(mission.some((task) => task.id === 'gate')).toBe(true)
  })

  it('scores explanations against an inspectable interview rubric', () => {
    const strong = evaluateExplanation(
      'I maintain a sliding window. For each right character, I move left while duplicated because this restores the invariant. Each character moves twice, so time is O(n) and space is O(n). An empty string is an edge case.',
      'Sliding Window',
    )
    const weak = evaluateExplanation('I use a loop and it works.', 'Sliding Window')
    expect(strong.score).toBe(5)
    expect(weak.score).toBe(1)
  })
})