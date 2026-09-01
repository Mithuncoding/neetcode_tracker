import { describe, expect, it } from 'vitest'
import { ROADMAP_PROBLEMS } from '../src/data/problems'
import { getLevelProgression } from '../src/lib/progression'
import { createInitialState } from '../src/lib/storage'
import type { AppState } from '../src/types'

function completePythonLessons(state: AppState, count: number) {
  for (let index = 0; index < count; index += 1) {
    const lessonId = `lesson-${index}`
    state.mentor.pythonCourse[lessonId] = {
      lessonId,
      completedAt: '2026-09-01T00:00:00.000Z',
      runs: 1,
      challengePassed: true,
      quizCorrect: true,
      lastCode: '',
    }
  }
}

describe('mastery-gated level progression', () => {
  it('does not treat public LeetCode totals as earned learning levels', () => {
    const state = createInitialState()
    state.mentor.leetcodeProfile = {
      username: 'Mithuncoding',
      syncedAt: '2026-09-02T00:00:00.000Z',
      ranking: 1,
      totalSolved: 500,
      easySolved: 200,
      mediumSolved: 250,
      hardSolved: 50,
      acceptanceRate: 80,
      activeDays: 300,
      maxStreak: 100,
      primaryLanguage: 'Python3',
      matchedProblemIds: [],
      source: 'https://leetcode.com/u/Mithuncoding/',
    }
    expect(getLevelProgression(state, ROADMAP_PROBLEMS).earnedLevel).toBe(0)
  })

  it('earns Easy implementation only from recognition and independent evidence', () => {
    const state = createInitialState()
    state.mentor.onboardingComplete = true
    completePythonLessons(state, 24)
    const easy = ROADMAP_PROBLEMS.filter((problem) => problem.difficulty === 'Easy').slice(0, 5)
    easy.forEach((problem, index) => state.attempts.push({
      id: `attempt-${index}`,
      problemId: problem.id,
      startedAt: '2026-09-01T00:00:00.000Z',
      completedAt: '2026-09-01T00:10:00.000Z',
      durationSeconds: 600,
      outcome: 'independent',
      attempts: 1,
      confidence: 4,
      notes: '',
      revisionNeeded: false,
      sessionId: null,
    }))
    Array.from({ length: 10 }, (_, index) => state.mentor.recognitionAttempts.push({
      id: `recognition-${index}`,
      problemId: easy[index % easy.length].id,
      selectedPattern: 'Arrays & Hashing',
      expectedPattern: 'Arrays & Hashing',
      correct: index < 6,
      confidence: 3,
      createdAt: '2026-09-01T00:00:00.000Z',
    }))

    const progression = getLevelProgression(state, ROADMAP_PROBLEMS)
    expect(progression.earnedLevel).toBe(2)
    expect(progression.gates[2].progress).toBe(100)
    expect(progression.gates[3].complete).toBe(false)
  })

  it('does not let diagnostic placement bypass Python foundations', () => {
    const state = createInitialState()
    state.mentor.onboardingComplete = true
    state.mentor.currentLevel = 3
    const progression = getLevelProgression(state, ROADMAP_PROBLEMS)
    expect(progression.placementLevel).toBe(3)
    expect(progression.activeLevel).toBe(0)
    completePythonLessons(state, 8)
    expect(getLevelProgression(state, ROADMAP_PROBLEMS).activeLevel).toBe(1)
  })

  it('does not skip an unmet lower gate', () => {
    const state = createInitialState()
    const mediums = ROADMAP_PROBLEMS.filter((problem) => problem.difficulty === 'Medium').slice(0, 5)
    mediums.forEach((problem, index) => state.attempts.push({
      id: `medium-${index}`,
      problemId: problem.id,
      startedAt: '2026-09-01T00:00:00.000Z',
      completedAt: '2026-09-01T00:20:00.000Z',
      durationSeconds: 1200,
      outcome: 'independent',
      attempts: 1,
      confidence: 4,
      notes: '',
      revisionNeeded: false,
      sessionId: null,
    }))
    expect(getLevelProgression(state, ROADMAP_PROBLEMS).earnedLevel).toBe(0)
  })
})