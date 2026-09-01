import { CURRICULUM } from '../data/mentor-content'
import type { AppState, RoadmapProblem } from '../types'
import { getDefaultProgress } from './utils'
import { getProblemTeachingGuide, getRelatedProblems } from './problem-guides'

export type KnowledgeNodeType = 'problem' | 'pattern' | 'concept' | 'taxonomy' | 'related' | 'mistake' | 'revision'

export interface KnowledgeNode {
  id: string
  type: KnowledgeNodeType
  label: string
  detail: string
  problemId?: string
}

export interface KnowledgeEdge {
  from: string
  to: string
  label: string
}

export function getProblemKnowledgeGraph(
  state: AppState,
  problem: RoadmapProblem,
  problems: RoadmapProblem[],
) {
  const resolved = getProblemTeachingGuide(problem)
  const related = getRelatedProblems(problem, problems)
  const curriculum = CURRICULUM.find((node) => node.patterns.includes(resolved.corePattern))
  const progress = state.progress[problem.id] ?? getDefaultProgress(problem.id)
  const mistakes = state.mentor.mistakes.filter((mistake) => mistake.problemId === problem.id)
  const nodes: KnowledgeNode[] = [
    { id: `problem:${problem.id}`, type: 'problem', label: problem.title, detail: `${problem.difficulty} · ${problem.topic}`, problemId: problem.id },
    { id: `pattern:${resolved.corePattern}`, type: 'pattern', label: resolved.corePattern, detail: resolved.guide.keyObservation },
    ...resolved.taxonomy.slice(0, 4).map((pattern) => ({ id: `taxonomy:${pattern}`, type: 'taxonomy' as const, label: pattern, detail: 'Fine-grained roadmap technique' })),
    ...related.map(({ problem: item, sharedPatterns }) => ({
      id: `related:${item.id}`,
      type: 'related' as const,
      label: item.title,
      detail: `${item.difficulty} · ${sharedPatterns.join(', ') || resolved.corePattern}`,
      problemId: item.id,
    })),
    ...mistakes.map((mistake) => ({
      id: `mistake:${mistake.id}`,
      type: 'mistake' as const,
      label: mistake.category.replaceAll('-', ' '),
      detail: mistake.note || 'No reflection recorded',
      problemId: mistake.problemId,
    })),
  ]
  if (curriculum) {
    nodes.push({ id: `concept:${curriculum.id}`, type: 'concept', label: curriculum.title, detail: curriculum.outcome })
  }
  if (progress.nextRevisionAt) {
    nodes.push({
      id: `revision:${problem.id}`,
      type: 'revision',
      label: progress.lastRevisionResult === 'weak' ? 'Recall needs repair' : `Revision stage ${progress.revisionStage}`,
      detail: `Next review ${new Date(progress.nextRevisionAt).toLocaleDateString()} · ${progress.revisionLapses} lapses`,
      problemId: problem.id,
    })
  }

  const problemNode = `problem:${problem.id}`
  const patternNode = `pattern:${resolved.corePattern}`
  const edges: KnowledgeEdge[] = [
    { from: problemNode, to: patternNode, label: 'uses' },
    ...resolved.taxonomy.slice(0, 4).map((pattern) => ({ from: patternNode, to: `taxonomy:${pattern}`, label: 'specializes into' })),
    ...related.map(({ problem: item }) => ({ from: patternNode, to: `related:${item.id}`, label: 'reinforced by' })),
    ...mistakes.map((mistake) => ({ from: problemNode, to: `mistake:${mistake.id}`, label: 'failed because' })),
  ]
  if (curriculum) edges.push({ from: `concept:${curriculum.id}`, to: patternNode, label: 'teaches' })
  if (progress.nextRevisionAt) edges.push({ from: problemNode, to: `revision:${problem.id}`, label: 'revisited by' })

  return {
    problem,
    corePattern: resolved.corePattern,
    guideSource: resolved.source,
    curriculum,
    related,
    mistakes,
    progress,
    nodes,
    edges,
  }
}