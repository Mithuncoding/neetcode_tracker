export const ALGORITHM_CATEGORIES = [
  'Foundations',
  'Searching',
  'Sorting',
  'Patterns',
  'Structures',
  'Trees',
  'Graphs',
  'Recursion & DP',
] as const

export type AlgorithmCategory = (typeof ALGORITHM_CATEGORIES)[number]
export type SceneEntityShape = 'bar' | 'cube' | 'sphere' | 'cylinder' | 'tile' | 'ring'
export type SceneEntityState =
  | 'idle'
  | 'active'
  | 'compare'
  | 'candidate'
  | 'pivot'
  | 'frontier'
  | 'visited'
  | 'path'
  | 'done'
  | 'muted'
  | 'bad'

export interface SceneEntity {
  id: string
  label: string
  value?: number
  shape: SceneEntityShape
  position: [number, number, number]
  scale: [number, number, number]
  state: SceneEntityState
}

export interface SceneEdge {
  id: string
  from: string
  to: string
  directed?: boolean
  state?: SceneEntityState
  label?: string
}

export interface SceneQuiz {
  prompt: string
  options: string[]
  answer: number
  explanation: string
}

export interface AlgorithmFrame {
  title: string
  narration: string
  invariant: string
  code: string
  entities: SceneEntity[]
  edges: SceneEdge[]
  quiz?: SceneQuiz
  camera?: [number, number, number]
}

export interface AlgorithmComplexity {
  best: string
  average: string
  worst: string
  space: string
}

export interface AlgorithmSceneDefinition {
  id: string
  title: string
  category: AlgorithmCategory
  level: 'Foundation' | 'Core' | 'Intermediate' | 'Advanced'
  summary: string
  mentalModel: string
  useWhen: string[]
  pitfalls: string[]
  complexity: AlgorithmComplexity
  stable?: boolean
  inPlace?: boolean
  frames: AlgorithmFrame[]
}

interface SortItem {
  id: string
  value: number
}

interface FrameOptions {
  states?: Map<string, SceneEntityState>
  title: string
  narration: string
  invariant: string
  code: string
  quiz?: SceneQuiz
  zOffset?: number
}

const createItems = (values: number[]) => values.map((value, index) => ({ id: `item-${index}`, value }))

function arrayEntities(items: SortItem[], states = new Map<string, SceneEntityState>(), zOffset = 0) {
  const maximum = Math.max(...items.map((item) => item.value), 1)
  return items.map((item, index): SceneEntity => {
    const height = 0.6 + (item.value / maximum) * 3.1
    return {
      id: item.id,
      label: String(item.value),
      value: item.value,
      shape: 'bar',
      position: [(index - (items.length - 1) / 2) * 1.05, -1.7 + height / 2, zOffset],
      scale: [0.72, height, 0.72],
      state: states.get(item.id) ?? 'idle',
    }
  })
}

function sortFrame(items: SortItem[], options: FrameOptions): AlgorithmFrame {
  return {
    title: options.title,
    narration: options.narration,
    invariant: options.invariant,
    code: options.code,
    entities: arrayEntities(items, options.states, options.zOffset),
    edges: [],
    quiz: options.quiz,
    camera: [0, 3.2, 9.5],
  }
}

function states(entries: Array<[SortItem, SceneEntityState]>) {
  return new Map(entries.map(([item, state]) => [item.id, state]))
}

function markDone(done: Set<string>, active: Array<[SortItem, SceneEntityState]> = []) {
  const result = new Map<string, SceneEntityState>()
  done.forEach((id) => result.set(id, 'done'))
  active.forEach(([item, state]) => result.set(item.id, state))
  return result
}

function bubbleSortScene(): AlgorithmSceneDefinition {
  const items = createItems([7, 3, 8, 2, 6, 1])
  const frames: AlgorithmFrame[] = [sortFrame(items, {
    title: 'Start with adjacent pairs',
    narration: 'Bubble sort repeatedly compares neighbors. Larger values drift right one swap at a time.',
    invariant: 'After each full pass, the largest unsorted value is fixed at the right boundary.',
    code: 'for end in range(n - 1, 0, -1):',
  })]
  const done = new Set<string>()
  for (let end = items.length - 1; end > 0; end -= 1) {
    let swapped = false
    for (let index = 0; index < end; index += 1) {
      frames.push(sortFrame(items, {
        title: `Compare ${items[index].value} and ${items[index + 1].value}`,
        narration: items[index].value > items[index + 1].value
          ? 'The pair is inverted, so swapping moves the larger value toward its final boundary.'
          : 'The pair is already ordered. Leave it unchanged and advance.',
        invariant: 'Only adjacent inversions are swapped; values beyond the pass boundary are already final.',
        code: 'if values[index] > values[index + 1]:',
        states: markDone(done, [[items[index], 'compare'], [items[index + 1], 'compare']]),
        quiz: frames.length === 1 ? {
          prompt: 'What should happen when the left value is larger?',
          options: ['Swap the adjacent pair', 'Restart from index zero', 'Move both to a new array'],
          answer: 0,
          explanation: 'Swapping removes this adjacent inversion and moves the larger value one position right.',
        } : undefined,
      }))
      if (items[index].value > items[index + 1].value) {
        ;[items[index], items[index + 1]] = [items[index + 1], items[index]]
        swapped = true
        frames.push(sortFrame(items, {
          title: 'Swap the inversion',
          narration: 'The two values exchange positions. No other relative order changes.',
          invariant: 'Every swap reduces the number of inversions by one.',
          code: 'values[index], values[index + 1] = values[index + 1], values[index]',
          states: markDone(done, [[items[index], 'active'], [items[index + 1], 'active']]),
        }))
      }
    }
    done.add(items[end].id)
    frames.push(sortFrame(items, {
      title: `${items[end].value} reaches its final position`,
      narration: 'Nothing left of this boundary can be larger after the completed pass.',
      invariant: 'The sorted suffix grows by one after every pass.',
      code: '# values[end:] is sorted',
      states: markDone(done),
    }))
    if (!swapped) break
  }
  items.forEach((item) => done.add(item.id))
  frames.push(sortFrame(items, {
    title: 'Array sorted',
    narration: 'All adjacent inversions are gone, so the full sequence is ordered.',
    invariant: 'An array with no adjacent inversion is sorted.',
    code: 'return values',
    states: markDone(done),
  }))
  return {
    id: 'bubble-sort', title: 'Bubble Sort', category: 'Sorting', level: 'Foundation',
    summary: 'Repeatedly swap adjacent inversions so the largest unsorted value bubbles right.',
    mentalModel: 'A heavy value moves one seat right whenever its neighbor is smaller.',
    useWhen: ['Teaching swaps and invariants', 'Very small or nearly sorted inputs'],
    pitfalls: ['Using it for large inputs', 'Forgetting the early-exit swapped flag'],
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    stable: true, inPlace: true, frames,
  }
}

function selectionSortScene(): AlgorithmSceneDefinition {
  const items = createItems([7, 3, 8, 2, 6, 1])
  const frames: AlgorithmFrame[] = [sortFrame(items, {
    title: 'Select the minimum',
    narration: 'Selection sort scans the unsorted suffix and chooses its smallest value for the next output position.',
    invariant: 'The prefix before start is sorted and contains the globally smallest processed values.',
    code: 'for start in range(len(values)):',
  })]
  const done = new Set<string>()
  for (let start = 0; start < items.length - 1; start += 1) {
    let minimum = start
    for (let index = start + 1; index < items.length; index += 1) {
      const candidateIsSmaller = items[index].value < items[minimum].value
      frames.push(sortFrame(items, {
        title: `Scan candidate ${items[index].value}`,
        narration: candidateIsSmaller
          ? `${items[index].value} becomes the new minimum candidate.`
          : `${items[index].value} cannot replace minimum ${items[minimum].value}.`,
        invariant: 'The minimum candidate is the smallest value seen in the current suffix scan.',
        code: 'if values[index] < values[minimum]: minimum = index',
        states: markDone(done, [[items[minimum], 'candidate'], [items[index], 'compare']]),
      }))
      if (candidateIsSmaller) minimum = index
    }
    ;[items[start], items[minimum]] = [items[minimum], items[start]]
    done.add(items[start].id)
    frames.push(sortFrame(items, {
      title: `Place ${items[start].value} into the sorted prefix`,
      narration: 'Swap the smallest suffix value into the next final position.',
      invariant: 'The sorted prefix grows and never needs to be revisited.',
      code: 'values[start], values[minimum] = values[minimum], values[start]',
      states: markDone(done, [[items[start], 'active']]),
    }))
  }
  items.forEach((item) => done.add(item.id))
  frames.push(sortFrame(items, { title: 'Array sorted', narration: 'Every position now holds the minimum of its former suffix.', invariant: 'The full array is the completed sorted prefix.', code: 'return values', states: markDone(done) }))
  return {
    id: 'selection-sort', title: 'Selection Sort', category: 'Sorting', level: 'Foundation',
    summary: 'Select the minimum remaining value and place it into the next final position.',
    mentalModel: 'Find the shortest person in the waiting line and move them to the next seat.',
    useWhen: ['Minimizing writes', 'Teaching prefix invariants'],
    pitfalls: ['Assuming it becomes linear on nearly sorted data', 'Losing the minimum index during the scan'],
    complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    stable: false, inPlace: true, frames,
  }
}

function insertionSortScene(): AlgorithmSceneDefinition {
  const items = createItems([7, 3, 8, 2, 6, 1])
  const frames: AlgorithmFrame[] = [sortFrame(items, {
    title: 'Grow a sorted prefix',
    narration: 'Insertion sort takes the next value and shifts it left until it fits inside the sorted prefix.',
    invariant: 'Before each insertion, values left of index are already sorted.',
    code: 'for index in range(1, len(values)):',
    states: states([[items[0], 'done']]),
  })]
  for (let index = 1; index < items.length; index += 1) {
    let cursor = index
    frames.push(sortFrame(items, {
      title: `Insert ${items[cursor].value}`,
      narration: 'Treat the current value as a card that must be inserted into the ordered hand on its left.',
      invariant: 'The prefix is sorted; only the new value may violate its order.',
      code: 'cursor = index',
      states: states(items.map((item, itemIndex) => [item, itemIndex < index ? 'done' : itemIndex === index ? 'active' : 'idle'])),
    }))
    while (cursor > 0 && items[cursor - 1].value > items[cursor].value) {
      frames.push(sortFrame(items, {
        title: `Compare with ${items[cursor - 1].value}`,
        narration: 'The left neighbor is larger, so the inserted value must move one position left.',
        invariant: 'Only the inserted value moves through the already sorted prefix.',
        code: 'while cursor > 0 and values[cursor - 1] > values[cursor]:',
        states: states([[items[cursor - 1], 'compare'], [items[cursor], 'active']]),
      }))
      ;[items[cursor - 1], items[cursor]] = [items[cursor], items[cursor - 1]]
      cursor -= 1
      frames.push(sortFrame(items, {
        title: 'Shift left', narration: 'The inserted value moves left; the displaced value shifts right.', invariant: 'The prefix remains sorted after each local swap.', code: 'values[cursor - 1], values[cursor] = values[cursor], values[cursor - 1]', states: states([[items[cursor], 'active']]),
      }))
    }
  }
  frames.push(sortFrame(items, { title: 'Array sorted', narration: 'The sorted prefix has expanded across the entire array.', invariant: 'Every value was inserted into its correct prefix position.', code: 'return values', states: states(items.map((item) => [item, 'done'])) }))
  return {
    id: 'insertion-sort', title: 'Insertion Sort', category: 'Sorting', level: 'Foundation',
    summary: 'Insert each new value into an already sorted prefix.', mentalModel: 'Sort playing cards in your hand one card at a time.',
    useWhen: ['Small arrays', 'Nearly sorted data', 'Sorting tiny runs inside hybrid algorithms'],
    pitfalls: ['Overwriting the inserted value during shifts', 'Missing the cursor boundary'],
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' }, stable: true, inPlace: true, frames,
  }
}

function mergeSortScene(): AlgorithmSceneDefinition {
  const items = createItems([8, 3, 5, 1, 7, 4])
  const frames: AlgorithmFrame[] = [sortFrame(items, {
    title: 'Divide the problem', narration: 'Merge sort recursively splits the array until every piece has one element.', invariant: 'A one-element array is already sorted.', code: 'mid = (left + right) // 2',
    quiz: { prompt: 'Why split all the way to one element?', options: ['One element is a sorted base case', 'It removes duplicate values', 'It makes swaps constant time'], answer: 0, explanation: 'The recursive proof needs a trivially sorted base case, which is a range of length zero or one.' },
  })]
  const merge = (left: number, middle: number, right: number, depth: number) => {
    frames.push(sortFrame(items, {
      title: `Split range [${left}, ${right}]`, narration: `The active range divides at ${middle}. Each half will be sorted independently.`, invariant: 'If both halves are sorted, a linear merge can produce a sorted whole.', code: `sort(${left}, ${middle}); sort(${middle + 1}, ${right})`,
      states: states(items.map((item, index) => [item, index >= left && index <= right ? 'active' : 'muted'])), zOffset: depth * 0.35,
    }))
  }
  const mergeRange = (left: number, middle: number, right: number) => {
    const merged = [...items.slice(left, middle + 1), ...items.slice(middle + 1, right + 1)].sort((a, b) => a.value - b.value)
    items.splice(left, merged.length, ...merged)
    frames.push(sortFrame(items, {
      title: `Merge [${left}, ${middle}] with [${middle + 1}, ${right}]`, narration: 'Compare the front of each sorted half and repeatedly take the smaller value.', invariant: 'The merged output is sorted, and every unchosen value is at least as large as the chosen front.', code: 'merged.append(left_value if left_value <= right_value else right_value)',
      states: states(items.map((item, index) => [item, index >= left && index <= right ? 'done' : 'muted'])),
    }))
  }
  merge(0, 2, 5, 0)
  merge(0, 1, 2, 1)
  merge(0, 0, 1, 2)
  mergeRange(0, 0, 1)
  mergeRange(0, 1, 2)
  merge(3, 4, 5, 1)
  merge(3, 3, 4, 2)
  mergeRange(3, 3, 4)
  mergeRange(3, 4, 5)
  mergeRange(0, 2, 5)
  frames.push(sortFrame(items, { title: 'Array sorted', narration: 'The final merge combines two sorted halves into the complete ordered result.', invariant: 'Divide establishes smaller sorted problems; merge preserves sorted order.', code: 'return merged', states: states(items.map((item) => [item, 'done'])) }))
  return {
    id: 'merge-sort', title: 'Merge Sort', category: 'Sorting', level: 'Core', summary: 'Divide into sorted halves, then merge those halves in linear time.', mentalModel: 'Split a deck into tiny sorted piles, then zip piles together by always taking the smaller top card.', useWhen: ['Stable O(n log n) sorting', 'Linked lists', 'External sorting'], pitfalls: ['Forgetting leftover values after one half empties', 'Incorrect midpoint or temporary-array boundaries'], complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' }, stable: true, inPlace: false, frames,
  }
}

function quickSortScene(): AlgorithmSceneDefinition {
  const items = createItems([7, 3, 8, 2, 6, 1])
  const frames: AlgorithmFrame[] = [sortFrame(items, { title: 'Choose a pivot', narration: 'Quick sort partitions values around a pivot, then solves both sides independently.', invariant: 'After partitioning, the pivot is in its final sorted position.', code: 'pivot = values[right]' })]
  const quickSort = (left: number, right: number) => {
    if (left >= right) return
    const pivotItem = items[right]
    let boundary = left
    frames.push(sortFrame(items, { title: `Pivot on ${pivotItem.value}`, narration: 'Values smaller than the pivot will move before the boundary; larger values remain after it.', invariant: 'Before boundary: smaller than pivot. From boundary to scan: not yet accepted.', code: 'pivot = values[right]; boundary = left', states: states(items.map((item, index) => [item, index === right ? 'pivot' : index >= left && index < right ? 'active' : 'muted'])) }))
    for (let scan = left; scan < right; scan += 1) {
      frames.push(sortFrame(items, { title: `Compare ${items[scan].value} with pivot`, narration: items[scan].value < pivotItem.value ? 'This value belongs in the smaller partition.' : 'This value stays in the larger partition.', invariant: 'The boundary separates confirmed smaller values from the unclassified range.', code: 'if values[scan] < pivot:', states: states([[pivotItem, 'pivot'], [items[scan], 'compare'], ...(boundary < items.length ? [[items[boundary], 'candidate'] as [SortItem, SceneEntityState]] : [])]) }))
      if (items[scan].value < pivotItem.value) {
        ;[items[boundary], items[scan]] = [items[scan], items[boundary]]
        boundary += 1
      }
    }
    const currentPivotIndex = items.findIndex((item) => item.id === pivotItem.id)
    ;[items[boundary], items[currentPivotIndex]] = [items[currentPivotIndex], items[boundary]]
    frames.push(sortFrame(items, { title: `Fix pivot ${pivotItem.value}`, narration: 'Place the pivot between the smaller and larger partitions.', invariant: 'The pivot will never move again.', code: 'values[boundary], values[right] = values[right], values[boundary]', states: states([[pivotItem, 'done']]) }))
    quickSort(left, boundary - 1)
    quickSort(boundary + 1, right)
  }
  quickSort(0, items.length - 1)
  frames.push(sortFrame(items, { title: 'Array sorted', narration: 'Every pivot established one final boundary, recursively ordering all partitions.', invariant: 'All partition pivots and one-element ranges are final.', code: 'return values', states: states(items.map((item) => [item, 'done'])) }))
  return {
    id: 'quick-sort', title: 'Quick Sort', category: 'Sorting', level: 'Core', summary: 'Partition around a pivot and recursively sort each side.', mentalModel: 'Choose a divider, send smaller values left and larger values right, then repeat inside each room.', useWhen: ['Fast in-memory sorting', 'Partition-based selection'], pitfalls: ['Worst-case pivots on sorted input', 'Mixing partition boundary conventions'], complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n) average' }, stable: false, inPlace: true, frames,
  }
}

function binarySearchScene(): AlgorithmSceneDefinition {
  const values = [1, 3, 5, 7, 9, 11, 13, 15]
  const items = createItems(values)
  const target = 11
  const frames: AlgorithmFrame[] = []
  let left = 0
  let right = values.length - 1
  while (left <= right) {
    const middle = left + Math.floor((right - left) / 2)
    const frameStates = new Map<string, SceneEntityState>()
    items.forEach((item, index) => frameStates.set(item.id, index < left || index > right ? 'muted' : index === middle ? 'pivot' : 'active'))
    frames.push(sortFrame(items, {
      title: `Inspect midpoint ${values[middle]}`,
      narration: values[middle] === target ? 'The midpoint equals the target.' : values[middle] < target ? 'The midpoint is too small, so it and everything left of it are impossible.' : 'The midpoint is too large, so it and everything right of it are impossible.',
      invariant: 'If the target exists, it is inside the current inclusive interval.',
      code: 'middle = left + (right - left) // 2',
      states: frameStates,
      quiz: frames.length === 0 ? { prompt: 'Midpoint 7 is smaller than target 11. Which interval remains?', options: ['The right half', 'The left half', 'Both halves'], answer: 0, explanation: 'Sorted order proves every value left of 7 is also too small.' } : undefined,
    }))
    if (values[middle] === target) break
    if (values[middle] < target) left = middle + 1
    else right = middle - 1
  }
  const targetItem = items[values.indexOf(target)]
  frames.push(sortFrame(items, { title: `Found ${target}`, narration: 'The search interval has converged on the target after discarding impossible halves.', invariant: 'Every discarded value was proven unable to equal the target.', code: 'return middle', states: states(items.map((item) => [item, item.id === targetItem.id ? 'done' : 'muted'])) }))
  return {
    id: 'binary-search', title: 'Binary Search', category: 'Searching', level: 'Core', summary: 'Use sorted order or a monotonic predicate to eliminate half the search space.', mentalModel: 'Open a dictionary near the middle and discard the half whose words cannot contain your target.', useWhen: ['Sorted data', 'First/last valid boundary', 'Monotonic answer spaces'], pitfalls: ['Mixing inclusive and half-open templates', 'Failing to make a boundary move past middle'], complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' }, frames,
  }
}

function linearSearchScene(): AlgorithmSceneDefinition {
  const items = createItems([4, 8, 1, 9, 3, 6])
  const target = 3
  const frames = items.slice(0, 5).map((item, index) => sortFrame(items, {
    title: `Check index ${index}`,
    narration: item.value === target ? `${target} matches at index ${index}.` : `${item.value} is not ${target}; no ordering exists to skip the next value.`,
    invariant: 'Every earlier index has been checked and cannot contain the target.',
    code: 'for index, value in enumerate(values):',
    states: states(items.map((candidate, candidateIndex) => [candidate, candidateIndex < index ? 'muted' : candidateIndex === index ? item.value === target ? 'done' : 'compare' : 'idle'])),
  }))
  return { id: 'linear-search', title: 'Linear Search', category: 'Searching', level: 'Foundation', summary: 'Check candidates one by one when no structure supports elimination.', mentalModel: 'Inspect every drawer until the item is found.', useWhen: ['Unsorted data', 'One small scan', 'Baseline correctness'], pitfalls: ['Using it repeatedly when indexing or preprocessing is possible'], complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' }, frames }
}

import { EXTRA_ALGORITHM_SCENES_PART_ONE } from './algorithm-scenes-extra'
import { ADVANCED_ALGORITHM_SCENES } from './algorithm-scenes-advanced'

export const ALGORITHM_SCENES: AlgorithmSceneDefinition[] = [
  linearSearchScene(),
  binarySearchScene(),
  bubbleSortScene(),
  selectionSortScene(),
  insertionSortScene(),
  mergeSortScene(),
  quickSortScene(),
  ...EXTRA_ALGORITHM_SCENES_PART_ONE,
  ...ADVANCED_ALGORITHM_SCENES,
]

export const ALGORITHM_SCENE_BY_ID = new Map(ALGORITHM_SCENES.map((scene) => [scene.id, scene]))