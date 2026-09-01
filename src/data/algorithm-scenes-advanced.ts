import type {
  AlgorithmFrame,
  AlgorithmSceneDefinition,
  SceneEdge,
  SceneEntity,
  SceneEntityState,
} from './algorithm-scenes'
import { barRow, edge, entity, frame } from './algorithm-scenes-extra'

type Position = [number, number, number]

const TREE_POSITIONS: Position[] = [
  [0, 2.2, 0],
  [-2.6, 0.6, 0],
  [2.6, 0.6, 0],
  [-3.8, -1.1, 0],
  [-1.4, -1.1, 0],
  [1.4, -1.1, 0],
  [3.8, -1.1, 0],
]

const TREE_EDGES: Array<[number, number]> = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]]

function graphEntities(labels: string[], positions: Position[], states: Record<number, SceneEntityState> = {}) {
  return labels.map((label, index) => entity(`node-${index}`, label, positions[index], states[index] ?? 'idle'))
}

function graphEdges(connections: Array<[number, number]>, directed = false, active: Array<[number, number]> = []) {
  const activeSet = new Set(active.map(([from, to]) => `${from}-${to}`))
  return connections.map(([from, to]) => edge(`node-${from}`, `node-${to}`, directed, activeSet.has(`${from}-${to}`) ? 'active' : 'idle'))
}

function stackScene(): AlgorithmSceneDefinition {
  const stack = (labels: string[], active = -1) => labels.map((label, index) => entity(`stack-${index}`, label, [0, -1.2 + index * 1.05, 0], index === active ? 'active' : 'candidate', 'cube', [2.2, 0.7, 1.1]))
  return { id: 'stack-lifo', title: 'Stack: LIFO', category: 'Structures', level: 'Foundation', summary: 'Push and pop the most recent unresolved item.', mentalModel: 'A stack of plates: only the top is immediately accessible.', useWhen: ['Nested delimiters', 'Undo', 'DFS', 'Monotonic candidates'], pitfalls: ['Popping an empty stack', 'Storing values when indices are needed'], complexity: { best: 'O(1) operation', average: 'O(1) operation', worst: 'O(1) operation', space: 'O(n)' }, frames: [
    frame('Push A', 'A becomes the first and top stack entry.', 'The top is always the most recently pushed unpopped item.', 'stack.append("A")', stack(['A'], 0)),
    frame('Push B', 'B sits above A and becomes the only item pop can remove next.', 'Earlier entries remain unchanged below the top.', 'stack.append("B")', stack(['A', 'B'], 1)),
    frame('Push C', 'C becomes the newest unresolved state.', 'LIFO order preserves nested or backtracking structure.', 'stack.append("C")', stack(['A', 'B', 'C'], 2)),
    frame('Pop C', 'Remove C first because it was pushed last.', 'After pop, B becomes the top again.', 'value = stack.pop()', stack(['A', 'B'], 1)),
  ] }
}

function queueScene(): AlgorithmSceneDefinition {
  const queue = (labels: string[], active = -1) => labels.map((label, index) => entity(`queue-${label}`, label, [(index - (labels.length - 1) / 2) * 1.35, 0, 0], index === active ? 'active' : 'candidate', 'cube', [1, 0.85, 1]))
  return { id: 'queue-fifo', title: 'Queue: FIFO', category: 'Structures', level: 'Foundation', summary: 'Process states in the order they were discovered.', mentalModel: 'A fair line: the oldest waiting item leaves first.', useWhen: ['BFS layers', 'Task scheduling', 'Streaming buffers'], pitfalls: ['Using list.pop(0) in Python', 'Marking visited too late'], complexity: { best: 'O(1) operation', average: 'O(1) operation', worst: 'O(1) operation', space: 'O(n)' }, frames: [
    frame('Enqueue A', 'A enters at the back and is also the front because the queue was empty.', 'The front is the oldest retained item.', 'queue.append("A")', queue(['A'], 0)),
    frame('Enqueue B and C', 'New states join at the back without disturbing A.', 'Discovery order is preserved.', 'queue.extend(["B", "C"])', queue(['A', 'B', 'C'], 0)),
    frame('Dequeue A', 'A leaves from the front; B is now oldest.', 'FIFO makes graph distance layers emerge in order.', 'value = queue.popleft()', queue(['B', 'C'], 0)),
    frame('Enqueue D', 'D joins behind C while B remains next.', 'Appending never changes the front order.', 'queue.append("D")', queue(['B', 'C', 'D'], 0)),
  ] }
}

function linkedListScene(): AlgorithmSceneDefinition {
  const positions: Position[] = [[-3, 0, 0], [-1, 0, 0], [1, 0, 0], [3, 0, 0]]
  const list = (states: Record<number, SceneEntityState>, reversedThrough = -1) => {
    const entities = graphEntities(['1', '2', '3', 'None'], positions, states)
    const edges: SceneEdge[] = []
    for (let index = 0; index < 3; index += 1) {
      if (index <= reversedThrough) edges.push(edge(`node-${index + 1}`, `node-${index}`, true, 'active'))
      else edges.push(edge(`node-${index}`, `node-${index + 1}`, true))
    }
    return { entities, edges }
  }
  const initial = list({ 0: 'active' })
  const first = list({ 0: 'done', 1: 'active' }, 0)
  const second = list({ 0: 'done', 1: 'done', 2: 'active' }, 1)
  const final = list({ 0: 'done', 1: 'done', 2: 'done', 3: 'muted' }, 2)
  return { id: 'linked-list-reversal', title: 'Linked List Reversal', category: 'Structures', level: 'Core', summary: 'Reverse next pointers while preserving access to the remaining chain.', mentalModel: 'Turn one arrow at a time, but hold the next rope before cutting the current one.', useWhen: ['In-place reversal', 'Sublist reversal', 'Pointer interviews'], pitfalls: ['Losing next before rewiring', 'Returning current instead of previous'], complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' }, frames: [
    frame('Save the next node', 'Current is 1. Save node 2 before replacing current.next.', 'next_node always preserves the unprocessed suffix.', 'next_node = current.next', initial.entities, initial.edges),
    frame('Reverse the first arrow', 'Point 1 backward to previous, then advance current to 2.', 'The processed prefix is reversed; current starts the untouched suffix.', 'current.next = previous', first.entities, first.edges),
    frame('Repeat at node 2', 'Save 3, reverse 2 toward 1, then advance.', 'No node is lost because next is saved before every mutation.', 'previous, current = current, next_node', second.entities, second.edges),
    frame('Previous is the new head', 'Current reaches None and previous points at node 3.', 'All arrows in the original chain now point backward.', 'return previous', final.entities, final.edges),
  ] }
}

function treeTraversalScene(): AlgorithmSceneDefinition {
  const labels = ['8', '4', '12', '2', '6', '10', '14']
  const order = [0, 1, 3, 4, 2, 5, 6]
  return { id: 'tree-dfs-traversal', title: 'Tree DFS Traversal', category: 'Trees', level: 'Core', summary: 'Visit a node and recursively explore complete subtrees.', mentalModel: 'Walk down one branch until it ends, then return to the nearest unfinished fork.', useWhen: ['Subtree aggregates', 'Paths', 'Pre/in/postorder traversal'], pitfalls: ['Missing the None base case', 'Returning the wrong subtree fact'], complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(h)' }, frames: order.map((activeIndex, step) => {
    const states = Object.fromEntries(labels.map((_, index): [number, SceneEntityState] => [index, order.slice(0, step).includes(index) ? 'visited' : index === activeIndex ? 'active' : 'idle']))
    return frame(`Visit node ${labels[activeIndex]}`, step === 0 ? 'Preorder processes the root before either subtree.' : `DFS follows the recursive call stack to ${labels[activeIndex]}.`, 'A completed call has fully processed its entire subtree.', 'visit(node); dfs(node.left); dfs(node.right)', graphEntities(labels, TREE_POSITIONS, states), graphEdges(TREE_EDGES), [0, 3.7, 11])
  }) }
}

function bstSearchScene(): AlgorithmSceneDefinition {
  const labels = ['8', '4', '12', '2', '6', '10', '14']
  const path = [0, 2, 5]
  return { id: 'bst-search', title: 'Binary Search Tree', category: 'Trees', level: 'Core', summary: 'Use the BST ordering invariant to discard one subtree at every node.', mentalModel: 'A binary-search decision tree stored as nodes instead of array indices.', useWhen: ['Ordered dynamic sets', 'Predecessor/successor', 'Range queries'], pitfalls: ['Assuming any binary tree is a BST', 'Ignoring duplicate-key policy'], complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(n)', space: 'O(1) iterative' }, frames: path.map((activeIndex, step) => {
    const states = Object.fromEntries(labels.map((_, index): [number, SceneEntityState] => [index, path.slice(0, step).includes(index) ? 'muted' : index === activeIndex ? step === path.length - 1 ? 'done' : 'active' : 'idle']))
    const narration = activeIndex === 0 ? 'Target 10 is larger than 8, so the entire left subtree is impossible.' : activeIndex === 2 ? 'Target 10 is smaller than 12, so move into its left subtree.' : 'Node 10 matches the target.'
    return frame(`Compare target 10 with ${labels[activeIndex]}`, narration, 'Every left subtree key is smaller; every right subtree key is larger.', 'node = node.left if target < node.value else node.right', graphEntities(labels, TREE_POSITIONS, states), graphEdges(TREE_EDGES), [0, 3.7, 11])
  }) }
}

function heapScene(): AlgorithmSceneDefinition {
  const labels = ['2', '4', '3', '9', '7', '8']
  const positions = TREE_POSITIONS.slice(0, 6)
  const connections = TREE_EDGES.filter(([, to]) => to < 6)
  const frames: AlgorithmFrame[] = [
    frame('Min-heap invariant', 'Every parent is no larger than either child, so the root is the global minimum.', 'Only parent-child order is guaranteed; siblings are not fully sorted.', 'heap[0] is the minimum', graphEntities(labels, positions, { 0: 'done' }), graphEdges(connections), [0, 3.7, 11]),
    frame('Insert value 1', 'Append 1 at the next open leaf before restoring heap order.', 'All old parent-child relationships remain valid; only the new root path may violate.', 'heap.append(1)', graphEntities([...labels, '1'], TREE_POSITIONS, { 6: 'active' }), graphEdges(TREE_EDGES), [0, 3.7, 11]),
    frame('Bubble 1 upward', '1 swaps with parent 3 because the min-heap invariant is violated.', 'After each swap, only the next ancestor edge may remain invalid.', 'while heap[parent] > heap[index]: swap()', graphEntities(['2', '4', '1', '9', '7', '8', '3'], TREE_POSITIONS, { 2: 'active', 6: 'candidate' }), graphEdges(TREE_EDGES, false, [[2, 6]]), [0, 3.7, 11]),
    frame('New minimum reaches root', '1 swaps with 2 and becomes the heap root.', 'The root is again the smallest value in the heap.', 'heapq.heappush(heap, 1)', graphEntities(['1', '4', '2', '9', '7', '8', '3'], TREE_POSITIONS, { 0: 'done' }), graphEdges(TREE_EDGES), [0, 3.7, 11]),
  ]
  return { id: 'heap-priority-queue', title: 'Heap / Priority Queue', category: 'Trees', level: 'Core', summary: 'Maintain the next minimum or maximum while values arrive and leave.', mentalModel: 'A tournament bracket keeps the best candidate at the root without sorting everyone.', useWhen: ['Top K', 'Repeated min/max extraction', 'Dijkstra frontier'], pitfalls: ['Expecting complete sorted order', 'Forgetting heapq is a min-heap'], complexity: { best: 'O(1) peek', average: 'O(log n) push/pop', worst: 'O(log n) push/pop', space: 'O(n)' }, frames }
}

function trieScene(): AlgorithmSceneDefinition {
  const labels = ['root', 'c', 'a', 't', 'r', 'd', 'o', 'g']
  const positions: Position[] = [[0, 2.5, 0], [-2, 1.1, 0], [-2, -0.2, 0], [-3.2, -1.5, 0], [-0.8, -1.5, 0], [2, 1.1, 0], [2, -0.2, 0], [2, -1.5, 0]]
  const connections: Array<[number, number]> = [[0, 1], [1, 2], [2, 3], [2, 4], [0, 5], [5, 6], [6, 7]]
  const path = [0, 1, 2, 4]
  return { id: 'trie-prefix-search', title: 'Trie / Prefix Tree', category: 'Trees', level: 'Intermediate', summary: 'Share character-prefix paths across many words.', mentalModel: 'A word dictionary where every letter chooses the next corridor.', useWhen: ['Prefix queries', 'Autocomplete', 'Dictionary word search'], pitfalls: ['Not marking complete-word endings', 'Creating nodes during read-only search'], complexity: { best: 'O(L)', average: 'O(L)', worst: 'O(L)', space: 'O(total characters)' }, frames: path.map((activeIndex, step) => frame(step === 0 ? 'Start at root' : `Follow character ${labels[activeIndex]}`, step === path.length - 1 ? 'The terminal marker confirms that car is a complete word, not only a prefix.' : 'Consume one query character and follow its matching child edge.', 'Traversal work depends on query length, not the number of stored words.', 'node = node.children[character]', graphEntities(labels, positions, Object.fromEntries(labels.map((_, index): [number, SceneEntityState] => [index, path.slice(0, step).includes(index) ? 'visited' : index === activeIndex ? step === path.length - 1 ? 'done' : 'active' : 'idle']))), graphEdges(connections, true, step ? [[path[step - 1], activeIndex]] : []), [0, 4, 11])) }
}

const GRAPH_POSITIONS: Position[] = [[-3.5, 1.5, 0], [-1, 2.4, 0], [-1.2, 0, 0], [1.4, 1.4, 0], [3.5, 2.3, 0], [3.4, -0.5, 0]]
const GRAPH_CONNECTIONS: Array<[number, number]> = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 5], [3, 4], [3, 5], [4, 5]]

function traversalScene(kind: 'bfs' | 'dfs'): AlgorithmSceneDefinition {
  const order = kind === 'bfs' ? [0, 1, 2, 3, 5, 4] : [0, 1, 3, 4, 5, 2]
  const titles = kind === 'bfs' ? ['Graph BFS', 'Queue explores by distance'] : ['Graph DFS', 'Stack explores one path deeply']
  return { id: `graph-${kind}`, title: titles[0], category: 'Graphs', level: 'Core', summary: kind === 'bfs' ? 'Explore neighbors layer by layer with a queue.' : 'Explore one path completely with recursion or a stack.', mentalModel: titles[1], useWhen: kind === 'bfs' ? ['Unweighted shortest paths', 'Levels', 'Multi-source spread'] : ['Connectivity', 'Components', 'Cycle and path exploration'], pitfalls: kind === 'bfs' ? ['Marking visited when dequeued', 'Using DFS for shortest edge count'] : ['Marking visited after recursion', 'Stack overflow on deep graphs'], complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' }, frames: order.map((activeIndex, step) => {
    const visited = order.slice(0, step)
    const states = Object.fromEntries(Array.from({ length: 6 }, (_, index): [number, SceneEntityState] => [index, visited.includes(index) ? 'visited' : index === activeIndex ? 'active' : 'idle']))
    return frame(`${kind.toUpperCase()} visits ${String.fromCharCode(65 + activeIndex)}`, kind === 'bfs' ? 'The queue removes the oldest discovered node, preserving distance layers.' : 'The call stack continues along the newest unvisited neighbor before backtracking.', kind === 'bfs' ? 'A node is first discovered through the minimum number of unweighted edges.' : 'A completed DFS call has explored every reachable path through its subtree.', kind === 'bfs' ? 'node = queue.popleft()' : 'dfs(neighbor)', graphEntities(['A', 'B', 'C', 'D', 'E', 'F'], GRAPH_POSITIONS, states), graphEdges(GRAPH_CONNECTIONS), [0, 4.2, 11])
  }) }
}

function topologicalScene(): AlgorithmSceneDefinition {
  const positions: Position[] = [[-3.4, 1.5, 0], [-1.3, 2.2, 0], [-1.3, 0.6, 0], [1, 1.4, 0], [3.3, 1.4, 0]]
  const connections: Array<[number, number]> = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]]
  const steps = [[0], [0, 1, 2], [0, 1, 2, 3], [0, 1, 2, 3, 4]]
  return { id: 'topological-sort', title: 'Topological Sort', category: 'Graphs', level: 'Intermediate', summary: 'Repeatedly remove nodes with no unmet directed prerequisites.', mentalModel: 'A project board where tasks unlock only after every dependency is complete.', useWhen: ['Course ordering', 'Build systems', 'DAG scheduling'], pitfalls: ['Reversing edge direction', 'Forgetting cycle detection by processed count'], complexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(V + E)' }, frames: steps.map((processed, step) => frame(step === 0 ? 'Queue indegree-zero A' : `Process unlocked layer ${step}`, step === 0 ? 'A has no unmet prerequisite and can begin.' : 'Removing completed nodes decrements dependent indegrees; newly zero nodes join the queue.', 'Only zero-indegree nodes are safe to append to the order.', 'if indegree[node] == 0: queue.append(node)', graphEntities(['A:0', 'B:1', 'C:1', 'D:2', 'E:1'], positions, Object.fromEntries(Array.from({ length: 5 }, (_, index): [number, SceneEntityState] => [index, processed.includes(index) ? index === processed.at(-1) ? 'active' : 'done' : 'idle']))), graphEdges(connections, true), [0, 4, 11])) }
}

function dijkstraScene(): AlgorithmSceneDefinition {
  const weighted: Array<[number, number, string]> = [[0, 1, '4'], [0, 2, '1'], [2, 1, '2'], [1, 3, '1'], [2, 3, '5'], [3, 4, '3']]
  const connections = weighted.map(([from, to]) => [from, to] as [number, number])
  const labelsByStep = [
    ['A:0', 'B:∞', 'C:∞', 'D:∞', 'E:∞'],
    ['A:0', 'B:4', 'C:1', 'D:∞', 'E:∞'],
    ['A:0', 'B:3', 'C:1', 'D:6', 'E:∞'],
    ['A:0', 'B:3', 'C:1', 'D:4', 'E:∞'],
    ['A:0', 'B:3', 'C:1', 'D:4', 'E:7'],
  ]
  const activeNodes = [0, 0, 2, 1, 3]
  return { id: 'dijkstra-shortest-path', title: 'Dijkstra Shortest Path', category: 'Graphs', level: 'Advanced', summary: 'Finalize the smallest tentative distance and relax its outgoing nonnegative edges.', mentalModel: 'A wavefront reaches the closest unfinished city next, then offers cheaper routes to its neighbors.', useWhen: ['Nonnegative weighted shortest paths', 'Network routing'], pitfalls: ['Negative edges', 'Marking a node final before popping its minimum distance'], complexity: { best: 'O((V+E) log V)', average: 'O((V+E) log V)', worst: 'O((V+E) log V)', space: 'O(V + E)' }, frames: labelsByStep.map((labels, step) => frame(step === 0 ? 'Seed source A' : `Relax from ${String.fromCharCode(65 + activeNodes[step])}`, step === 0 ? 'Distance to the source is zero; every other node begins unreachable.' : 'Pop the smallest tentative distance and offer current distance plus edge weight to each neighbor.', 'A popped minimum-distance node is final when all edge weights are nonnegative.', 'candidate = distance[node] + weight', graphEntities(labels, GRAPH_POSITIONS.slice(0, 5), Object.fromEntries(labels.map((_, index): [number, SceneEntityState] => [index, index === activeNodes[step] ? 'active' : step > 0 && labels[index] !== `${String.fromCharCode(65 + index)}:∞` ? 'visited' : 'idle']))), graphEdges(connections, true, step ? [connections[step - 1] ?? connections[0]] : []), [0, 4.2, 11])) }
}

function unionFindScene(): AlgorithmSceneDefinition {
  const positions: Position[] = [[-3, 1.4, 0], [-1.5, 0, 0], [0, 1.4, 0], [1.5, 0, 0], [3, 1.4, 0]]
  return { id: 'union-find', title: 'Union-Find / DSU', category: 'Graphs', level: 'Intermediate', summary: 'Maintain changing connected components through representative parents.', mentalModel: 'Every group elects a root representative; merging groups changes only one root link.', useWhen: ['Dynamic connectivity', 'Redundant edges', 'Kruskal MST'], pitfalls: ['Unioning raw nodes instead of roots', 'Skipping compression and weighting'], complexity: { best: 'O(α(n)) amortized', average: 'O(α(n)) amortized', worst: 'O(α(n)) amortized', space: 'O(n)' }, frames: [
    frame('Five separate components', 'Every node begins as its own representative.', 'find(x) returns the root representing x’s component.', 'parent = list(range(n))', graphEntities(['1', '2', '3', '4', '5'], positions), []),
    frame('Union 1 and 2', 'Find both roots and attach the smaller component under the larger.', 'Only roots are linked; every member still reaches one representative.', 'parent[root_b] = root_a', graphEntities(['1:R', '2', '3:R', '4:R', '5:R'], positions, { 0: 'active', 1: 'candidate' }), [edge('node-0', 'node-1', true, 'active')]),
    frame('Union 2 and 3', 'find(2) reaches root 1, so component {1,2} merges with root 3.', 'Union operates on representatives even when input nodes are not roots.', 'union(2, 3)', graphEntities(['1:R', '2', '3', '4:R', '5:R'], positions, { 0: 'active', 2: 'candidate' }), [edge('node-0', 'node-1', true), edge('node-0', 'node-2', true, 'active')]),
    frame('Compress paths', 'A find call rewrites intermediate parents directly to root 1.', 'Compression preserves component identity while shortening future paths.', 'parent[node] = find(parent[node])', graphEntities(['1:R', '2', '3', '4:R', '5:R'], positions, { 0: 'done', 1: 'visited', 2: 'visited' }), [edge('node-0', 'node-1', true, 'active'), edge('node-0', 'node-2', true, 'active')]),
  ] }
}

function kruskalScene(): AlgorithmSceneDefinition {
  const positions: Position[] = [[-3, 1, 0], [-1, 2, 0], [1, 1, 0], [3, 2, 0], [0, -1, 0]]
  const connections: Array<[number, number]> = [[0, 1], [1, 2], [0, 4], [2, 4], [2, 3], [3, 4]]
  const chosen: Array<Array<[number, number]>> = [[], [[0, 1]], [[0, 1], [1, 2]], [[0, 1], [1, 2], [2, 4]], [[0, 1], [1, 2], [2, 4], [2, 3]]]
  return { id: 'kruskal-mst', title: 'Kruskal Minimum Spanning Tree', category: 'Graphs', level: 'Advanced', summary: 'Process edges from lightest to heaviest and accept only edges joining different components.', mentalModel: 'Connect islands with the cheapest bridge that does not create a loop.', useWhen: ['Minimum spanning tree', 'Sparse weighted undirected graphs'], pitfalls: ['Forgetting to sort edges', 'Accepting an edge whose endpoints already connect'], complexity: { best: 'O(E log E)', average: 'O(E log E)', worst: 'O(E log E)', space: 'O(V)' }, frames: chosen.map((active, step) => frame(step === 0 ? 'Sort all edges by weight' : `Accept edge ${step}`, step === 0 ? 'Kruskal considers the cheapest available connection first.' : 'Union-find confirms this edge joins two different components, so it is safe to include.', 'The chosen edges remain acyclic and are extendable to a minimum spanning tree.', 'if union(source, target): mst.append(edge)', graphEntities(['A', 'B', 'C', 'D', 'E'], positions, Object.fromEntries(Array.from({ length: 5 }, (_, index): [number, SceneEntityState] => [index, active.some(([from, to]) => from === index || to === index) ? 'visited' : 'idle']))), graphEdges(connections, false, active), [0, 4.2, 11])) }
}

function recursionScene(): AlgorithmSceneDefinition {
  const stack = (depth: number, returning = false) => Array.from({ length: depth }, (_, index) => entity(`call-${index}`, `fib(${5 - index})`, [0, -1.3 + index * 0.9, 0], index === depth - 1 ? returning ? 'done' : 'active' : 'candidate', 'cube', [2.3, 0.58, 1]))
  return { id: 'recursion-call-stack', title: 'Recursion Call Stack', category: 'Recursion & DP', level: 'Foundation', summary: 'Each call stores its local state until smaller calls return.', mentalModel: 'Open nested boxes; the innermost box must finish before outer boxes can close.', useWhen: ['Tree structure', 'Divide-and-conquer', 'Backtracking'], pitfalls: ['No base case', 'No progress toward base case', 'Confusing local and shared state'], complexity: { best: 'Problem-dependent', average: 'Problem-dependent', worst: 'Can be exponential', space: 'O(recursion depth)' }, frames: [
    frame('Call fib(5)', 'The first frame pauses while it asks smaller states for answers.', 'Every call owns independent parameters and a return address.', 'def fib(n):', stack(1)),
    frame('Descend toward base case', 'fib(5) waits for fib(4), which waits for fib(3).', 'Each recursive argument is strictly smaller, guaranteeing progress.', 'return fib(n - 1) + fib(n - 2)', stack(3)),
    frame('Reach a base case', 'fib(1) can answer immediately without another call.', 'The base case anchors correctness and termination.', 'if n <= 1: return n', stack(5)),
    frame('Unwind with return values', 'Completed inner calls disappear and their values resume waiting outer frames.', 'A caller combines exactly the facts promised by child calls.', 'left = fib(n - 1); right = fib(n - 2)', stack(3, true)),
  ] }
}

function backtrackingScene(): AlgorithmSceneDefinition {
  const positions: Position[] = [[0, 2.5, 0], [-2.6, 0.8, 0], [0, 0.8, 0], [2.6, 0.8, 0], [-3.5, -1, 0], [-1.7, -1, 0], [-0.8, -1, 0], [0.8, -1, 0], [1.7, -1, 0], [3.5, -1, 0]]
  const labels = ['[]', '[1]', '[2]', '[3]', '[1,2]', '[1,3]', '[2,1]', '[2,3]', '[3,1]', '[3,2]']
  const connections: Array<[number, number]> = [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 6], [2, 7], [3, 8], [3, 9]]
  const paths = [[0], [0, 1], [0, 1, 4], [0, 1], [0, 1, 5], [0]]
  return { id: 'backtracking-tree', title: 'Backtracking Decision Tree', category: 'Recursion & DP', level: 'Core', summary: 'Choose, explore, undo, and try the next valid decision.', mentalModel: 'Walk a maze with chalk: mark a choice, explore it, erase the mark, then try another corridor.', useWhen: ['Permutations', 'Subsets', 'Combinations', 'Constraint search'], pitfalls: ['Forgetting to undo', 'Saving the same mutable path object', 'Missing safe pruning'], complexity: { best: 'Output-dependent', average: 'Often exponential', worst: 'O(branching^depth)', space: 'O(depth)' }, frames: paths.map((path, step) => frame(step === 0 ? 'Start at empty path' : step === 3 || step === 5 ? 'Undo the last choice' : `Explore ${labels[path.at(-1)!]}`, step === 3 || step === 5 ? 'Pop the most recent choice so the sibling branch begins from the correct parent state.' : 'Append one valid choice and recurse into the smaller remaining decision problem.', 'The current path exactly represents choices along the active root-to-node route.', step === 3 || step === 5 ? 'path.pop()' : 'path.append(choice); search(); path.pop()', graphEntities(labels, positions, Object.fromEntries(labels.map((_, index): [number, SceneEntityState] => [index, path.includes(index) ? index === path.at(-1) ? 'active' : 'path' : 'muted']))), graphEdges(connections, true, path.slice(1).map((node, index) => [path[index], node] as [number, number])), [0, 4.3, 12])) }
}

function dynamicProgramming1D(): AlgorithmSceneDefinition {
  const values = [2, 7, 9, 3, 1]
  const dp = [2, 7, 11, 11, 12]
  return { id: 'dp-1d-house-robber', title: '1D Dynamic Programming', category: 'Recursion & DP', level: 'Core', summary: 'Cache the best answer for each processed prefix.', mentalModel: 'Every new state chooses between carrying yesterday’s best or combining today with a compatible earlier best.', useWhen: ['Choose/skip optimization', 'Linear recurrences', 'Overlapping prefix states'], pitfalls: ['Undefined state meaning', 'Wrong base cases', 'Reading a state before it is computed'], complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(n), compressible to O(1)' }, frames: dp.map((answer, index) => frame(`Compute dp[${index}] = ${answer}`, index < 2 ? 'Initialize the smallest prefixes directly.' : `Compare skip = ${dp[index - 1]} with take = ${values[index]} + ${dp[index - 2]}.`, 'dp[i] is the maximum value obtainable from houses 0 through i without adjacent choices.', 'dp[i] = max(dp[i - 1], dp[i - 2] + values[i])', [...barRow(values, Object.fromEntries(values.map((_, itemIndex): [number, SceneEntityState] => [itemIndex, itemIndex === index ? 'active' : itemIndex < index ? 'visited' : 'idle'])), -1), ...dp.map((value, itemIndex) => entity(`dp-${itemIndex}`, itemIndex <= index ? `dp=${value}` : 'dp=?', [(itemIndex - 2) * 1.25, 0.4, 1.4], itemIndex === index ? 'done' : itemIndex < index ? 'candidate' : 'muted', 'tile', [1, 1, 1]))], [], [0, 5.3, 12])) }
}

function gridDynamicProgramming(): AlgorithmSceneDefinition {
  const rows = 3
  const columns = 4
  const values = [[1, 3, 1, 2], [1, 5, 1, 3], [4, 2, 1, 1]]
  const dp = Array.from({ length: rows }, () => Array(columns).fill(0) as number[])
  const frames: AlgorithmFrame[] = []
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const up = row ? dp[row - 1][column] : Number.POSITIVE_INFINITY
      const left = column ? dp[row][column - 1] : Number.POSITIVE_INFINITY
      dp[row][column] = values[row][column] + (row === 0 && column === 0 ? 0 : Math.min(up, left))
      const entities: SceneEntity[] = []
      for (let r = 0; r < rows; r += 1) for (let c = 0; c < columns; c += 1) {
        const processed = r < row || r === row && c <= column
        entities.push(entity(`cell-${r}-${c}`, processed ? String(dp[r][c]) : String(values[r][c]), [(c - 1.5) * 1.25, 0, (r - 1) * 1.25], r === row && c === column ? 'active' : processed ? 'done' : 'idle', 'tile', [1, 1, 1]))
      }
      frames.push(frame(`Fill cell (${row}, ${column})`, row === 0 && column === 0 ? 'The starting cost is its own value.' : 'Choose the cheaper completed predecessor from above or left, then add the current cost.', 'Every filled cell stores the optimal cost to reach exactly that position.', 'dp[row][column] = grid[row][column] + min(up, left)', entities, [], [0, 7.8, 8.8]))
    }
  }
  return { id: 'dp-grid', title: '2D Grid Dynamic Programming', category: 'Recursion & DP', level: 'Intermediate', summary: 'Fill states in an order that guarantees every dependency is already solved.', mentalModel: 'Each tile records the best route reaching it from allowed predecessor directions.', useWhen: ['Grid paths', 'Edit distance tables', 'Two-index state'], pitfalls: ['Wrong iteration direction', 'Uninitialized border states'], complexity: { best: 'O(rows·cols)', average: 'O(rows·cols)', worst: 'O(rows·cols)', space: 'O(rows·cols)' }, frames }
}

function knapsackScene(): AlgorithmSceneDefinition {
  const weights = [2, 3, 4]
  const values = [4, 5, 7]
  const capacity = 6
  const dp = Array(capacity + 1).fill(0) as number[]
  const frames: AlgorithmFrame[] = []
  weights.forEach((weight, itemIndex) => {
    for (let current = capacity; current >= weight; current -= 1) {
      const take = values[itemIndex] + dp[current - weight]
      const skip = dp[current]
      dp[current] = Math.max(skip, take)
      const entities = dp.map((value, capacityIndex) => entity(`capacity-${capacityIndex}`, `${capacityIndex}:${value}`, [(capacityIndex - capacity / 2) * 1.2, 0, 0], capacityIndex === current ? 'active' : capacityIndex > current ? 'done' : 'candidate', 'tile', [1, 1, 1]))
      frames.push(frame(`Item ${itemIndex + 1}: weight ${weight}, value ${values[itemIndex]}`, `At capacity ${current}, compare skip ${skip} against take ${values[itemIndex]} + dp[${current - weight}] = ${take}.`, 'Descending capacity ensures each item is used at most once in 0/1 knapsack.', 'dp[c] = max(dp[c], value + dp[c - weight])', entities, [], [0, 4.6, 11]))
    }
  })
  return { id: 'dp-knapsack', title: '0/1 Knapsack DP', category: 'Recursion & DP', level: 'Advanced', summary: 'Optimize value across item choices and remaining capacity.', mentalModel: 'For every bag size, compare leaving the current item behind with packing it once.', useWhen: ['Subset optimization', 'Partition Equal Subset Sum', 'Bounded choices'], pitfalls: ['Iterating capacity upward and reusing one item', 'Confusing unbounded and 0/1 variants'], complexity: { best: 'O(items·capacity)', average: 'O(items·capacity)', worst: 'O(items·capacity)', space: 'O(capacity)' }, frames }
}

function bitScene(): AlgorithmSceneDefinition {
  const values = [4, 1, 2, 1, 2]
  const accumulators = [4, 5, 7, 6, 4]
  const bits = (value: number, prefix: string, state: SceneEntityState) => Array.from({ length: 4 }, (_, index) => {
    const bit = 3 - index
    return entity(`${prefix}-${bit}`, String((value >> bit) & 1), [(index - 1.5) * 1.1, prefix === 'acc' ? 0.8 : -0.8, 0], state, 'cube', [0.78, 0.78, 0.78])
  })
  return { id: 'bitwise-xor', title: 'Bitwise XOR', category: 'Foundations', level: 'Intermediate', summary: 'Track parity independently at every bit so equal values cancel.', mentalModel: 'Every 1-bit flips a switch; flipping the same switches twice restores zero.', useWhen: ['Single unmatched value', 'Parity', 'Bit masks'], pitfalls: ['Using a trick without stating its truth-table invariant', 'Python negative-number representation'], complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' }, frames: values.map((value, index) => frame(`Accumulator XOR ${value}`, index === values.length - 1 ? 'Both duplicate pairs have canceled, leaving unique value 4.' : `${accumulators[Math.max(0, index - 1)] ?? 0} XOR ${value} produces the next bitwise result ${accumulators[index]}.`, 'x XOR x = 0, x XOR 0 = x, and XOR order does not matter.', 'result ^= value', [...bits(value, 'value', 'compare'), ...bits(accumulators[index], 'acc', index === values.length - 1 ? 'done' : 'active')], [], [0, 3.6, 9])) }
}

export const ADVANCED_ALGORITHM_SCENES: AlgorithmSceneDefinition[] = [
  stackScene(),
  queueScene(),
  linkedListScene(),
  treeTraversalScene(),
  bstSearchScene(),
  heapScene(),
  trieScene(),
  traversalScene('bfs'),
  traversalScene('dfs'),
  topologicalScene(),
  dijkstraScene(),
  unionFindScene(),
  kruskalScene(),
  recursionScene(),
  backtrackingScene(),
  dynamicProgramming1D(),
  gridDynamicProgramming(),
  knapsackScene(),
  bitScene(),
]