import { describe, expect, it } from 'vitest'
import { ALGORITHM_SCENES, ALGORITHM_SCENE_BY_ID } from '../src/data/algorithm-scenes'

function finalValues(sceneId: string) {
  const scene = ALGORITHM_SCENE_BY_ID.get(sceneId)!
  return scene.frames.at(-1)!.entities
    .filter((entity) => entity.value !== undefined)
    .sort((left, right) => left.position[0] - right.position[0])
    .map((entity) => entity.value)
}

describe('3D algorithm scene definitions', () => {
  it('provides valid frames and stable entity ids for every scene', () => {
    expect(ALGORITHM_SCENES.length).toBeGreaterThanOrEqual(37)
    ALGORITHM_SCENES.forEach((scene) => {
      expect(scene.frames.length).toBeGreaterThan(1)
      scene.frames.forEach((frame) => {
        expect(frame.entities.length).toBeGreaterThan(0)
        expect(new Set(frame.entities.map((entity) => entity.id)).size).toBe(frame.entities.length)
        expect(frame.narration.length, `${scene.id}: ${frame.title}`).toBeGreaterThan(20)
        expect(frame.invariant.length, `${scene.id}: ${frame.title}`).toBeGreaterThan(15)
      })
    })
  })

  it.each(['bubble-sort', 'selection-sort', 'insertion-sort', 'merge-sort', 'quick-sort', 'heap-sort', 'counting-sort', 'radix-sort', 'timsort'])('%s ends with a sorted array', (sceneId) => {
    const values = finalValues(sceneId)
    expect(values).toEqual([...values].sort((left, right) => left! - right!))
  })

  it('binary search keeps shrinking the visible candidate interval', () => {
    const scene = ALGORITHM_SCENE_BY_ID.get('binary-search')!
    const candidates = scene.frames.slice(0, -1).map((frame) => frame.entities.filter((entity) => entity.state !== 'muted').length)
    expect(candidates.every((count, index) => index === 0 || count <= candidates[index - 1])).toBe(true)
    expect(scene.frames.at(-1)?.entities.filter((entity) => entity.state === 'done')).toHaveLength(1)
  })

  it('covers every required learning category', () => {
    expect(new Set(ALGORITHM_SCENES.map((scene) => scene.category))).toEqual(new Set([
      'Foundations', 'Searching', 'Sorting', 'Patterns', 'Structures', 'Trees', 'Graphs', 'Recursion & DP',
    ]))
  })
})