import { describe, expect, it } from 'vitest'
import { ROADMAP_PROBLEMS } from '../src/data/problems'
import { getProblemKnowledgeGraph } from '../src/lib/knowledge-graph'
import { createInitialState } from '../src/lib/storage'

describe('personal DSA knowledge graph', () => {
  it('connects a problem to pattern, curriculum, taxonomy, and related problems', () => {
    const state = createInitialState()
    const problem = ROADMAP_PROBLEMS.find((item) => item.title === 'Longest Substring Without Repeating Characters')!
    const graph = getProblemKnowledgeGraph(state, problem, ROADMAP_PROBLEMS)
    expect(graph.corePattern).toBe('Sliding Window')
    expect(graph.nodes.some((node) => node.type === 'concept')).toBe(true)
    expect(graph.nodes.filter((node) => node.type === 'related')).toHaveLength(6)
    expect(graph.edges.some((edge) => edge.label === 'uses')).toBe(true)
  })

  it('adds personal mistakes and revision state as problem edges', () => {
    const state = createInitialState()
    const problem = ROADMAP_PROBLEMS[0]
    state.mentor.mistakes.push({
      id: 'mistake-1',
      problemId: problem.id,
      category: 'pattern-recognition',
      note: 'Missed the frequency clue.',
      createdAt: '2026-09-02T00:00:00.000Z',
      resolvedAt: null,
    })
    state.progress[problem.id] = {
      problemId: problem.id,
      status: 'needs-revision',
      attempts: 1,
      confidence: 2,
      notes: '',
      totalTimeSeconds: 600,
      solvedAt: '2026-09-02T00:00:00.000Z',
      lastAttemptAt: '2026-09-02T00:00:00.000Z',
      lastRevisedAt: null,
      revisionStage: 0,
      nextRevisionAt: '2026-09-03T00:00:00.000Z',
      revisionEase: 2.5,
      revisionIntervalDays: 1,
      revisionLapses: 0,
      successfulRecalls: 0,
      lastRevisionResult: null,
    }
    const graph = getProblemKnowledgeGraph(state, problem, ROADMAP_PROBLEMS)
    expect(graph.nodes.some((node) => node.type === 'mistake')).toBe(true)
    expect(graph.nodes.some((node) => node.type === 'revision')).toBe(true)
  })
})