import type {
  AlgorithmFrame,
  AlgorithmSceneDefinition,
  SceneEdge,
  SceneEntity,
  SceneEntityShape,
  SceneEntityState,
} from './algorithm-scenes'

type Position = [number, number, number]

const entity = (
  id: string,
  label: string,
  position: Position,
  state: SceneEntityState = 'idle',
  shape: SceneEntityShape = 'sphere',
  scale: Position = [0.82, 0.82, 0.82],
  value?: number,
): SceneEntity => ({ id, label, position, state, shape, scale, value })

const edge = (from: string, to: string, directed = false, state: SceneEntityState = 'idle', label?: string): SceneEdge => ({
  id: `${from}-${to}`,
  from,
  to,
  directed,
  state,
  label,
})

const frame = (
  title: string,
  narration: string,
  invariant: string,
  code: string,
  entities: SceneEntity[],
  edges: SceneEdge[] = [],
  camera: Position = [0, 4.5, 11],
): AlgorithmFrame => ({ title, narration, invariant, code, entities, edges, camera })

function barRow(values: number[], states: Record<number, SceneEntityState> = {}, z = 0) {
  const maximum = Math.max(...values, 1)
  return values.map((value, index) => {
    const height = 0.55 + value / maximum * 3
    return entity(`bar-${index}`, String(value), [(index - (values.length - 1) / 2) * 1.05, -1.7 + height / 2, z], states[index] ?? 'idle', 'bar', [0.72, height, 0.72], value)
  })
}

function heapSort(): AlgorithmSceneDefinition {
  const values = [4, 10, 3, 5, 1]
  const layouts: Array<{ values: number[]; states: Record<number, SceneEntityState>; title: string; narration: string; code: string }> = [
    { values, states: {}, title: 'Treat the array as a tree', narration: 'Index arithmetic gives every parent two child positions without storing pointers.', code: 'left = 2 * parent + 1' },
    { values: [10, 5, 3, 4, 1], states: { 0: 'pivot', 1: 'active', 3: 'active' }, title: 'Build a max heap', narration: 'Sift larger children upward until every parent is at least as large as its children.', code: 'sift_down(values, parent, size)' },
    { values: [1, 5, 3, 4, 10], states: { 0: 'compare', 4: 'done' }, title: 'Extract maximum 10', narration: 'Swap the root with the last heap position. The maximum is now final.', code: 'values[0], values[end] = values[end], values[0]' },
    { values: [5, 4, 3, 1, 10], states: { 0: 'pivot', 1: 'active', 4: 'done' }, title: 'Restore the heap', narration: 'Sift the new root down inside the reduced heap.', code: 'sift_down(values, 0, end)' },
    { values: [1, 4, 3, 5, 10], states: { 3: 'done', 4: 'done' }, title: 'Extract maximum 5', narration: 'The sorted suffix grows while the heap prefix shrinks.', code: '# heap is values[:end]' },
    { values: [1, 3, 4, 5, 10], states: { 2: 'done', 3: 'done', 4: 'done' }, title: 'Continue extraction', narration: 'Each root extraction fixes exactly one additional largest value.', code: 'for end in range(n - 1, 0, -1):' },
    { values: [1, 3, 4, 5, 10], states: { 0: 'done', 1: 'done', 2: 'done', 3: 'done', 4: 'done' }, title: 'Array sorted', narration: 'The heap has collapsed into a completely sorted suffix.', code: 'return values' },
  ]
  return {
    id: 'heap-sort', title: 'Heap Sort', category: 'Sorting', level: 'Intermediate',
    summary: 'Build a max heap, repeatedly move its root to the end, and restore the reduced heap.',
    mentalModel: 'Keep the largest remaining value on a podium, move it to the final seat, then rebuild the podium.',
    useWhen: ['Guaranteed O(n log n) in-place sorting', 'Memory is constrained'],
    pitfalls: ['Using child indices beyond heap size', 'Sifting into the sorted suffix'],
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
    stable: false, inPlace: true,
    frames: layouts.map((item) => frame(item.title, item.narration, 'The prefix is a valid max heap; the suffix is sorted and final.', item.code, barRow(item.values, item.states))),
  }
}

function countingSort(): AlgorithmSceneDefinition {
  const input = [4, 2, 2, 8, 3, 3, 1]
  const buckets = (counts: number[], active = -1) => counts.map((count, value) => entity(`count-${value}`, `${value}:${count}`, [(value - 4.5) * 0.9, -1.1, 1.7], value === active ? 'active' : count ? 'candidate' : 'muted', 'cylinder', [0.62, 0.55 + count * 0.55, 0.62]))
  const counts = Array(9).fill(0) as number[]
  const frames: AlgorithmFrame[] = [frame('Allocate value buckets', 'Counting sort creates one counter for each value in the known small range.', 'Counter index equals the value; no comparisons are required.', 'counts = [0] * (maximum + 1)', [...barRow(input, {}, -1), ...buckets(counts)], [], [0, 5.2, 12])]
  input.forEach((value, index) => {
    counts[value] += 1
    frames.push(frame(`Count value ${value}`, `Increment bucket ${value}. It has now appeared ${counts[value]} time${counts[value] === 1 ? '' : 's'}.`, 'After scanning index i, counts exactly describe values in input[:i+1].', 'counts[value] += 1', [...barRow(input, { [index]: 'compare' }, -1), ...buckets(counts, value)], [], [0, 5.2, 12]))
  })
  const sorted = counts.flatMap((count, value) => Array(count).fill(value) as number[])
  frames.push(frame('Reconstruct in value order', 'Walk the buckets from smallest to largest and emit each value by its frequency.', 'All emitted values are no greater than any value remaining in later buckets.', 'for value, count in enumerate(counts): output.extend([value] * count)', [...barRow(sorted, Object.fromEntries(sorted.map((_, index) => [index, 'done'])), -1), ...buckets(counts)], [], [0, 5.2, 12]))
  return { id: 'counting-sort', title: 'Counting Sort', category: 'Sorting', level: 'Intermediate', summary: 'Count a small integer domain, then rebuild values in numeric order.', mentalModel: 'Drop identical values into numbered bins, then empty bins from left to right.', useWhen: ['Integer keys in a small known range', 'Linear-time stable variants'], pitfalls: ['Huge or negative value range without offset/compression', 'Confusing O(n + k) with O(n) when k is large'], complexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n + k)', space: 'O(k)' }, stable: false, inPlace: false, frames }
}

function radixSort(): AlgorithmSceneDefinition {
  const values = [170, 45, 75, 90, 802, 24, 2, 66]
  const ones = [170, 90, 802, 2, 24, 45, 75, 66]
  const tens = [802, 2, 24, 45, 66, 170, 75, 90]
  const hundreds = [2, 24, 45, 66, 75, 90, 170, 802]
  const digitStates = (active: number): Record<number, SceneEntityState> => Object.fromEntries(
    values.map((_, index): [number, SceneEntityState] => [index, index === active ? 'active' : 'candidate']),
  )
  return {
    id: 'radix-sort', title: 'Radix Sort', category: 'Sorting', level: 'Intermediate', summary: 'Apply a stable bucket sort one digit at a time from least significant to most significant.', mentalModel: 'Sort mail by apartment digit, then floor digit, then building digit without disturbing prior equal groups.', useWhen: ['Fixed-width integers or strings', 'Large collections with bounded key length'], pitfalls: ['Using an unstable digit sort', 'Forgetting negative values need special handling'], complexity: { best: 'O(d(n + k))', average: 'O(d(n + k))', worst: 'O(d(n + k))', space: 'O(n + k)' }, stable: true, inPlace: false,
    frames: [
      frame('Read the ones digit', 'Only the rightmost digit determines the first stable bucket pass.', 'Equal ones digits retain their original relative order.', 'digit = (value // 1) % 10', barRow(values, digitStates(0))),
      frame('Stable ones-digit order', 'Values are grouped by ones digit without destroying their within-bucket order.', 'The array is sorted by its last one digit.', 'values = stable_counting_sort(values, place=1)', barRow(ones, Object.fromEntries(ones.map((_, index) => [index, 'active'])))),
      frame('Stable tens-digit order', 'Regroup by tens digit. Stability preserves the ones-digit ordering inside each tens group.', 'The array is sorted by its last two digits.', 'values = stable_counting_sort(values, place=10)', barRow(tens, Object.fromEntries(tens.map((_, index) => [index, 'candidate'])))),
      frame('Stable hundreds-digit order', 'The final significant digit pass completes numeric order.', 'All processed digits together determine complete order.', 'values = stable_counting_sort(values, place=100)', barRow(hundreds, Object.fromEntries(hundreds.map((_, index) => [index, 'done'])))),
    ],
  }
}

function timSort(): AlgorithmSceneDefinition {
  const values = [1, 4, 7, 9, 8, 5, 3, 2]
  return {
    id: 'timsort', title: 'Python Timsort', category: 'Sorting', level: 'Advanced', summary: 'Detect natural runs, extend short runs with insertion sort, then merge them strategically.', mentalModel: 'Reuse order already present instead of pretending every input is random.', useWhen: ['Python list.sort and sorted', 'Stable general-purpose object sorting', 'Partially ordered real-world data'], pitfalls: ['Assuming Python uses quicksort', 'Writing a custom sort when a key function is enough'], complexity: { best: 'O(n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' }, stable: true, inPlace: false,
    frames: [
      frame('Detect ascending run', 'Timsort recognizes the existing ascending run 1, 4, 7, 9.', 'A natural run is already sorted and can be reused.', '# detect ascending or descending run', barRow(values, { 0: 'active', 1: 'active', 2: 'active', 3: 'active', 4: 'muted', 5: 'muted', 6: 'muted', 7: 'muted' })),
      frame('Reverse descending run', 'The remaining descending run 8, 5, 3, 2 is reversed into ascending order.', 'Reversing a strictly descending run is stable because equal keys are not crossed.', 'run.reverse()', barRow([1, 4, 7, 9, 2, 3, 5, 8], { 0: 'done', 1: 'done', 2: 'done', 3: 'done', 4: 'active', 5: 'active', 6: 'active', 7: 'active' })),
      frame('Merge neighboring runs', 'Merge the two sorted runs while preserving equal-key order.', 'The run stack maintains size rules that prevent badly unbalanced merges.', 'merge(left_run, right_run)', barRow([1, 2, 3, 4, 5, 7, 8, 9], { 0: 'done', 1: 'done', 2: 'done', 3: 'done', 4: 'done', 5: 'done', 6: 'done', 7: 'done' })),
    ],
  }
}

function bigOGrowth(): AlgorithmSceneDefinition {
  const makeGrowth = (n: number, active: SceneEntityState = 'idle') => [
    entity('constant', 'O(1)', [-3, -1.25, 0], 'done', 'bar', [0.7, 0.9, 0.7], 1),
    entity('log', 'O(log n)', [-1.5, -0.9, 0], active, 'bar', [0.7, 1.6 + Math.log2(n) * 0.12, 0.7], Math.log2(n)),
    entity('linear', 'O(n)', [0, -0.2, 0], active, 'bar', [0.7, Math.min(4.3, 0.5 + n * 0.16), 0.7], n),
    entity('nlogn', 'O(n log n)', [1.5, 0.25, 0], active, 'bar', [0.7, Math.min(5.1, 0.4 + n * Math.log2(n) * 0.04), 0.7], n * Math.log2(n)),
    entity('quadratic', 'O(n²)', [3, 0.7, 0], 'bad', 'bar', [0.7, Math.min(5.9, 0.35 + n * n * 0.02), 0.7], n * n),
  ]
  return { id: 'big-o-growth', title: 'Big-O Growth', category: 'Foundations', level: 'Foundation', summary: 'Compare how operation counts grow as the input becomes larger.', mentalModel: 'Complexity is the slope of required work, not the stopwatch reading for one input.', useWhen: ['Choosing a feasible approach from constraints', 'Comparing repeated work'], pitfalls: ['Dropping meaningful dimensions', 'Assuming every nested loop is quadratic'], complexity: { best: 'Model-dependent', average: 'Model-dependent', worst: 'Model-dependent', space: 'Analyze separately' }, frames: [8, 16, 32].map((n) => frame(`Input doubles to n = ${n}`, 'Watch how linear and logarithmic work remain controlled while quadratic work accelerates.', 'Ignore constants for growth classes, but count how often each input item can participate.', '# estimate dominant operations as n grows', makeGrowth(n, 'active'), [], [0, 4.2, 11])) }
}

function hashBuckets(): AlgorithmSceneDefinition {
  const positions: Position[] = [[-3, 0, 0], [-1.5, 0, 0], [0, 0, 0], [1.5, 0, 0], [3, 0, 0]]
  const bucketEntities = (labels: string[], active = -1) => labels.map((label, index) => entity(`bucket-${index}`, label, positions[index], index === active ? 'active' : label.includes(':') ? 'candidate' : 'muted', 'cylinder', [0.9, 1.5, 0.9]))
  return { id: 'hash-map-buckets', title: 'Hash Map Buckets', category: 'Foundations', level: 'Core', summary: 'Map a key to a bucket so lookup avoids scanning every stored item.', mentalModel: 'A deterministic address sends each key near where its value lives.', useWhen: ['Membership and frequency', 'Key-to-value association', 'Grouping'], pitfalls: ['Mutating keys', 'Assuming worst-case lookup is always constant', 'Checking after an update when order matters'], complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(n)', space: 'O(n)' }, frames: [
    frame('Start with empty buckets', 'The table allocates addressable buckets before any keys arrive.', 'The hash function always maps the same key to the same bucket.', 'index = hash(key) % capacity', bucketEntities(['0', '1', '2', '3', '4'])),
    frame('Insert key 12', 'hash(12) maps to bucket 2, so its associated value is stored there.', 'Lookup repeats the same address calculation.', 'table[hash(12) % 5] = value', bucketEntities(['0', '1', '2:12', '3', '4'], 2)),
    frame('Collision at bucket 2', 'Key 7 maps to the same bucket. Collision handling keeps both distinguishable.', 'Equal bucket addresses do not imply equal keys.', 'bucket.append((key, value))', bucketEntities(['0', '1', '2:12,7', '3', '4'], 2)),
    frame('Direct lookup', 'Key 7 recomputes bucket 2 and checks only that collision chain.', 'Average lookup touches a small bucket rather than all n entries.', 'return find_in_bucket(2, 7)', bucketEntities(['0', '1', 'FOUND 7', '3', '4'], 2)),
  ] }
}

function twoPointers(): AlgorithmSceneDefinition {
  const values = [1, 2, 4, 7, 11, 15]
  const statesFor = (left: number, right: number, result = false): Record<number, SceneEntityState> => Object.fromEntries(
    values.map((_, index): [number, SceneEntityState] => [index, index === left || index === right ? result ? 'done' : 'active' : index < left || index > right ? 'muted' : 'idle']),
  )
  return { id: 'two-pointers', title: 'Two Pointers', category: 'Patterns', level: 'Core', summary: 'Move two ordered boundaries while proving discarded pairs cannot be answers.', mentalModel: 'Squeeze an ordered search corridor from both ends.', useWhen: ['Sorted pair constraints', 'Palindrome checks', 'In-place compaction'], pitfalls: ['Moving a pointer without a proof', 'Skipping equality or crossing cases'], complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' }, frames: [
    frame('Inspect endpoints 1 and 15', 'Their sum 16 is too large for target 13, so every pair using 15 with a value at least 1 is too large.', 'The target pair, if present, remains between the two pointers.', 'if current > target: right -= 1', barRow(values, statesFor(0, 5))),
    frame('Move the right pointer', 'Now inspect 1 and 11. Their sum is too small, so pointer left must move right.', 'Sorted order proves no smaller left value can make this right endpoint reach the target.', 'left += 1', barRow(values, statesFor(0, 4))),
    frame('Find 2 + 11', 'The current pair equals target 13.', 'Every skipped pair was eliminated by an ordering proof.', 'return [left, right]', barRow(values, statesFor(1, 4, true))),
  ] }
}

function slidingWindow(): AlgorithmSceneDefinition {
  const values = [2, 1, 3, 2, 4, 1]
  const windowStates = (left: number, right: number, invalid = false): Record<number, SceneEntityState> => Object.fromEntries(
    values.map((_, index): [number, SceneEntityState] => [index, index >= left && index <= right ? invalid ? 'bad' : 'active' : index < left ? 'muted' : 'idle']),
  )
  return { id: 'sliding-window', title: 'Sliding Window', category: 'Patterns', level: 'Core', summary: 'Maintain one contiguous range and repair it incrementally as boundaries move.', mentalModel: 'A camera frame expands to include new data and crops from the left only when validity breaks.', useWhen: ['Contiguous subarrays or substrings', 'Longest/shortest valid range', 'Fixed-size rolling aggregate'], pitfalls: ['Using if when repeated shrinking is needed', 'Updating the answer while invalid'], complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(k)' }, frames: [
    frame('Open the window', 'Expand right across a valid contiguous range while maintaining its state.', 'Every item inside the boundaries contributes exactly once to window state.', 'for right, value in enumerate(values):', barRow(values, windowStates(0, 0))),
    frame('Expand while valid', 'The window [2, 1, 3] satisfies the example constraint.', 'Right expands monotonically; prior work is reused.', 'add(values[right])', barRow(values, windowStates(0, 2))),
    frame('Constraint breaks', 'Adding the next 2 violates uniqueness, so this range cannot be scored yet.', 'An invalid window must be repaired before updating the answer.', 'while not valid(window):', barRow(values, windowStates(0, 3, true))),
    frame('Shrink from the left', 'Remove values from the left until the window becomes valid again.', 'Each value leaves at most once, making the two moving boundaries linear overall.', 'remove(values[left]); left += 1', barRow(values, windowStates(1, 3))),
  ] }
}

function prefixSum(): AlgorithmSceneDefinition {
  const values = [3, -1, 4, 2, -2]
  const prefixes = [0, 3, 2, 6, 8, 6]
  const prefixEntities = (active: number) => prefixes.map((value, index) => entity(`prefix-${index}`, `P${index}=${value}`, [(index - 2.5) * 1.2, index === active ? 0.1 : -0.4, 1.2], index === active ? 'active' : index < active ? 'done' : 'muted', 'tile', [0.95, 1, 0.95]))
  return { id: 'prefix-sum', title: 'Prefix Sum', category: 'Patterns', level: 'Core', summary: 'Precompute cumulative values so a range aggregate becomes a difference.', mentalModel: 'Record the odometer at every boundary; distance between two points is the difference of readings.', useWhen: ['Repeated range sums', 'Subarray target equations', '2D rectangular queries'], pitfalls: ['Forgetting the empty prefix at index zero', 'Off-by-one range endpoints'], complexity: { best: 'O(n) build', average: 'O(1) query', worst: 'O(n) build', space: 'O(n)' }, frames: prefixes.map((_, index) => frame(index === 0 ? 'Seed the empty prefix' : `Build prefix ${index}`, index === 0 ? 'Prefix zero represents the sum before any input value.' : `Add input value ${values[index - 1]} to the prior cumulative total.`, 'prefix[i] equals the aggregate of values before boundary i.', 'prefix.append(prefix[-1] + value)', [...barRow(values, {}, -1), ...prefixEntities(index)], [], [0, 5.5, 12])) }
}

function monotonicStack(): AlgorithmSceneDefinition {
  const values = [73, 74, 75, 71, 69, 72, 76]
  const row = (states: Record<number, SceneEntityState>, stack: number[]) => [
    ...barRow(values, states, -0.8),
    ...stack.map((index, level) => entity(`stack-${index}`, `${values[index]}@${index}`, [3.9, -1.15 + level * 0.9, 1.4], 'candidate', 'cube', [1.1, 0.58, 0.7])),
  ]
  return { id: 'monotonic-stack', title: 'Monotonic Stack', category: 'Patterns', level: 'Intermediate', summary: 'Keep unresolved candidates in monotonic order so the current value resolves dominated entries.', mentalModel: 'A taller person reveals which shorter people have finally found their next taller neighbor.', useWhen: ['Nearest greater or smaller', 'Histogram boundaries', 'Daily Temperatures'], pitfalls: ['Storing values when indices are needed', 'Choosing the wrong increasing/decreasing order'], complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(n)' }, frames: [
    frame('Push unresolved index 0', 'Temperature 73 waits for a warmer future day.', 'Stack indices have temperatures in decreasing unresolved order.', 'stack.append(index)', row({ 0: 'active' }, [0])),
    frame('74 resolves 73', 'Current 74 is warmer than the stack top, so pop index 0 and compute distance 1.', 'Any popped index has found its nearest warmer future value.', 'while stack and values[stack[-1]] < value:', row({ 0: 'done', 1: 'active' }, [1])),
    frame('75 resolves 74', 'The newest unresolved 74 is resolved before older candidates.', 'LIFO order matches nearest-future resolution.', 'previous = stack.pop()', row({ 1: 'done', 2: 'active' }, [2])),
    frame('71 and 69 wait', 'Both are cooler than 75, so they stack as unresolved decreasing candidates.', 'Every index is pushed once and remains until one future value resolves it.', 'stack.append(index)', row({ 3: 'active', 4: 'active' }, [2, 3, 4])),
    frame('72 pops two candidates', '72 resolves 69 and 71, but cannot resolve 75.', 'Each index pops at most once, so nested while work is amortized O(n).', 'answer[previous] = index - previous', row({ 3: 'done', 4: 'done', 5: 'active' }, [2, 5])),
  ] }
}

function intervalMerge(): AlgorithmSceneDefinition {
  const intervalEntities = (items: Array<[number, number]>, active: number[], done: number[] = []) => items.map(([start, end], index) => entity(`interval-${index}`, `[${start},${end}]`, [start - 5, -1 + index * 0.58, 0], done.includes(index) ? 'done' : active.includes(index) ? 'active' : 'muted', 'bar', [Math.max(0.6, end - start), 0.32, 0.8]))
  return { id: 'merge-intervals', title: 'Merge Intervals', category: 'Patterns', level: 'Core', summary: 'Sort ranges by start so each overlap is local to the last merged interval.', mentalModel: 'Lay time blocks on one timeline and fuse blocks whose shadows touch.', useWhen: ['Overlapping ranges', 'Calendar consolidation', 'Coverage unions'], pitfalls: ['Wrong sort key', 'Using the original end instead of the merged maximum'], complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' }, frames: [
    frame('Sort by start', 'Once starts are ordered, a new interval can overlap only the last merged interval.', 'Merged output remains sorted and non-overlapping.', 'intervals.sort(key=lambda item: item[0])', intervalEntities([[1, 3], [2, 6], [8, 10], [9, 12]], [0])),
    frame('Merge [1,3] and [2,6]', 'Start 2 is before active end 3, so extend the active end to 6.', 'The active interval covers the union of all overlapping ranges processed so far.', 'last_end = max(last_end, end)', intervalEntities([[1, 6], [2, 6], [8, 10], [9, 12]], [0, 1], [0])),
    frame('Start a new interval', 'Start 8 is after end 6, so no overlap is possible.', 'Completed intervals end before the new active start.', 'merged.append([start, end])', intervalEntities([[1, 6], [2, 6], [8, 10], [9, 12]], [2], [0, 1])),
    frame('Merge final overlap', 'Start 9 lies inside [8,10], producing [8,12].', 'Every input range is represented exactly once in the output union.', 'merged[-1][1] = max(merged[-1][1], end)', intervalEntities([[1, 6], [2, 6], [8, 12], [9, 12]], [2, 3], [0, 1, 2, 3])),
  ] }
}

export const EXTRA_ALGORITHM_SCENES_PART_ONE: AlgorithmSceneDefinition[] = [
  bigOGrowth(),
  hashBuckets(),
  heapSort(),
  countingSort(),
  radixSort(),
  timSort(),
  twoPointers(),
  slidingWindow(),
  prefixSum(),
  monotonicStack(),
  intervalMerge(),
]

export { edge, entity, frame, barRow }