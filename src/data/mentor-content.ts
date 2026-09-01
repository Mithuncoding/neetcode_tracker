export const CORE_PATTERNS = [
  'Arrays & Hashing',
  'Two Pointers',
  'Sliding Window',
  'Prefix Sum',
  'Binary Search',
  'Stack',
  'Linked Lists',
  'Intervals',
  'Trees',
  'Heap',
  'Backtracking',
  'Graph DFS',
  'Graph BFS',
  'Topological Sort',
  'Union Find',
  'Greedy',
  'Dynamic Programming',
  'Bit Manipulation',
  'Tries',
] as const

export type CorePattern = (typeof CORE_PATTERNS)[number]

export interface PatternLesson {
  pattern: CorePattern
  what: string
  why: string
  recognitionClues: string[]
  commonWrongApproaches: string[]
  derivation: string[]
  algorithm: string[]
  pythonTemplate: string
  complexity: string
  variations: string[]
  hints: [string, string, string, string, string, string]
}

export const PATTERN_LESSONS: Record<CorePattern, PatternLesson> = {
  'Arrays & Hashing': {
    pattern: 'Arrays & Hashing',
    what: 'Store facts you have already seen so future lookups become constant-time questions.',
    why: 'A dictionary or set trades memory for speed and removes repeated scans of the same array.',
    recognitionClues: ['Need fast membership or frequency checks', 'Pairs or groups depend on a complement', 'Duplicates, anagrams, or counts matter'],
    commonWrongApproaches: ['Nested loops for every pair', 'Sorting when original order or indices matter', 'Using a list for repeated membership checks'],
    derivation: ['Write the brute-force repeated question.', 'Ask what answer could be cached.', 'Choose set for existence or dict/Counter for associated data.'],
    algorithm: ['Scan once.', 'Query the stored facts.', 'Update the structure at the correct time.'],
    pythonTemplate: `seen: dict[int, int] = {}\nfor index, value in enumerate(nums):\n    needed = target - value\n    if needed in seen:\n        return [seen[needed], index]\n    seen[value] = index`,
    complexity: 'Usually O(n) time and O(n) space.',
    variations: ['Frequency maps', 'Complement lookup', 'Grouping by a canonical key'],
    hints: ['What fact do you repeatedly search for?', 'Could you remember earlier values as you scan?', 'Use a set or dictionary.', 'Check the needed fact, then update your stored state.', 'Pseudocode: for each item, query cache; if found return; otherwise store.', 'Implement with dict, set, Counter, or defaultdict depending on the stored fact.'],
  },
  'Two Pointers': {
    pattern: 'Two Pointers',
    what: 'Move two indices through related positions instead of comparing every pair.',
    why: 'Ordering or an invariant tells you which side can move without losing a valid answer.',
    recognitionClues: ['Sorted input', 'Pair or palindrome constraints', 'In-place compaction', 'Opposite ends or fast/slow movement'],
    commonWrongApproaches: ['Trying every pair', 'Moving both pointers without proving it is safe', 'Forgetting equal-value or crossing cases'],
    derivation: ['Identify what left and right mean.', 'State the invariant.', 'Prove which move discards only impossible candidates.'],
    algorithm: ['Initialize pointer positions.', 'Evaluate the current state.', 'Move exactly the pointer justified by the invariant.'],
    pythonTemplate: `left, right = 0, len(nums) - 1\nwhile left < right:\n    current = nums[left] + nums[right]\n    if current == target:\n        return [left, right]\n    if current < target:\n        left += 1\n    else:\n        right -= 1`,
    complexity: 'Usually O(n) time and O(1) auxiliary space.',
    variations: ['Opposite-direction pointers', 'Fast and slow pointers', 'Read/write pointers'],
    hints: ['Which comparisons become impossible after one observation?', 'Can positions move monotonically instead of restarting?', 'Use two pointers.', 'Define why left or right moves after each comparison.', 'Pseudocode: inspect pair; move the side that cannot participate in a solution.', 'Implement with explicit left/right updates and a crossing condition.'],
  },
  'Sliding Window': {
    pattern: 'Sliding Window',
    what: 'Maintain a contiguous valid range while its right edge expands and its left edge repairs violations.',
    why: 'The window reuses prior work; each element enters and leaves at most once.',
    recognitionClues: ['Contiguous subarray or substring', 'Longest, shortest, or count under a constraint', 'A range can be updated incrementally'],
    commonWrongApproaches: ['Restarting every range from scratch', 'Shrinking with if when multiple removals may be required', 'Updating the answer while the window is invalid'],
    derivation: ['Describe validity for one range.', 'List the minimum state needed to test validity.', 'Expand once and shrink only until valid again.'],
    algorithm: ['Move right across the input.', 'Add the new item to window state.', 'While invalid, remove nums[left] and advance left.', 'Record the answer at a valid point.'],
    pythonTemplate: `left = 0\ncounts: dict[str, int] = {}\nbest = 0\nfor right, value in enumerate(values):\n    counts[value] = counts.get(value, 0) + 1\n    while not valid(counts):\n        old = values[left]\n        counts[old] -= 1\n        left += 1\n    best = max(best, right - left + 1)`,
    complexity: 'O(n) time because both pointers move forward; O(k) state.',
    variations: ['Fixed-size window', 'Variable-size valid window', 'At-most K transformed into exactly K'],
    hints: ['What makes one contiguous range valid?', 'Can you update that validity when one item enters or leaves?', 'Use a sliding window.', 'Expand right; while invalid, advance left and undo its contribution.', 'Pseudocode: add right, shrink until valid, update best.', 'Implement with a frequency dict and a while loop for repair.'],
  },
  'Prefix Sum': {
    pattern: 'Prefix Sum',
    what: 'Store cumulative values so any range aggregate becomes a difference of two prefixes.',
    why: 'Repeated range work is paid once during preprocessing.',
    recognitionClues: ['Many range sums', 'Contiguous subarray sum equals a target', 'Balance of two categories', 'Count ranges with a property'],
    commonWrongApproaches: ['Summing every range repeatedly', 'Missing the empty prefix at index zero', 'Using a set when prefix frequencies are required'],
    derivation: ['Write a range sum algebraically.', 'Rearrange the target equation.', 'Store earlier prefixes needed by the rearranged equation.'],
    algorithm: ['Start with prefix zero.', 'Accumulate the current prefix.', 'Query a previous prefix or subtract two stored prefixes.', 'Store the current prefix.'],
    pythonTemplate: `frequency = {0: 1}\nprefix = answer = 0\nfor value in nums:\n    prefix += value\n    answer += frequency.get(prefix - target, 0)\n    frequency[prefix] = frequency.get(prefix, 0) + 1`,
    complexity: 'O(n) time and O(n) space for hash-assisted prefix sums.',
    variations: ['Static range queries', 'Prefix frequency counting', '2D prefix sums'],
    hints: ['Can a range answer be written using work before its endpoints?', 'What earlier cumulative value would produce the target now?', 'Use prefix sums.', 'Maintain current prefix and query prefix - target.', 'Pseudocode: seed zero; accumulate; count needed prefix; store current prefix.', 'Implement with a frequency dictionary, including {0: 1}.'],
  },
  'Binary Search': {
    pattern: 'Binary Search',
    what: 'Discard half of an ordered search space after evaluating a midpoint.',
    why: 'A monotonic condition proves that one half cannot contain the answer.',
    recognitionClues: ['Sorted data', 'Find first or last valid value', 'Answer feasibility changes from false to true', 'Logarithmic time expected'],
    commonWrongApproaches: ['Mixing inclusive and exclusive boundaries', 'Not defining what remains possible', 'Using binary search without monotonicity'],
    derivation: ['Define the search interval.', 'Define a monotonic predicate.', 'Decide which boundary remains a candidate after mid.'],
    algorithm: ['Initialize bounds.', 'Compute midpoint safely.', 'Keep the half that can still contain the answer.', 'Return the boundary specified by the invariant.'],
    pythonTemplate: `left, right = 0, len(nums)\nwhile left < right:\n    mid = left + (right - left) // 2\n    if feasible(nums[mid]):\n        right = mid\n    else:\n        left = mid + 1\nreturn left`,
    complexity: 'O(log n) predicate checks and usually O(1) space.',
    variations: ['Exact lookup', 'Lower/upper bound', 'Binary search on the answer'],
    hints: ['What ordering or monotonic fact can eliminate candidates?', 'Can one midpoint prove an entire half impossible?', 'Use binary search.', 'Choose one boundary convention and state its invariant.', 'Pseudocode: while bounds differ, test mid and retain the feasible half.', 'Implement a half-open [left, right) lower-bound template.'],
  },
  Stack: {
    pattern: 'Stack',
    what: 'Keep unresolved items in last-in, first-out order, optionally preserving a monotonic property.',
    why: 'The newest unresolved item is often the first one the current input can resolve.',
    recognitionClues: ['Nested structure', 'Undo or matching delimiters', 'Nearest greater or smaller element', 'Expression evaluation'],
    commonWrongApproaches: ['Comparing only adjacent elements', 'Storing values when indices are needed', 'Failing to process unresolved items at the end'],
    derivation: ['Identify what remains unresolved.', 'Ask which unresolved item should be checked first.', 'Define what each stack entry represents.'],
    algorithm: ['Scan input.', 'Pop and resolve while the top condition is met.', 'Push the current unresolved item.', 'Handle leftovers if required.'],
    pythonTemplate: `stack: list[int] = []\nfor index, value in enumerate(nums):\n    while stack and nums[stack[-1]] < value:\n        previous = stack.pop()\n        answer[previous] = index - previous\n    stack.append(index)`,
    complexity: 'O(n) amortized time and O(n) space.',
    variations: ['Delimiter stack', 'Monotonic increasing/decreasing stack', 'Expression stack'],
    hints: ['Which earlier item is still waiting to be resolved?', 'Should the most recent unresolved item be checked first?', 'Use a stack.', 'Define what causes entries to pop and resolve.', 'Pseudocode: while top is resolved by current, pop; then push current.', 'Implement with a Python list using append and pop.'],
  },
  'Linked Lists': {
    pattern: 'Linked Lists',
    what: 'Manipulate node references while preserving access to the remaining chain.',
    why: 'Pointer rewiring can change structure in constant space, but update order is critical.',
    recognitionClues: ['Node references instead of indices', 'Reverse, merge, cycle, or middle', 'Constant-space structural change'],
    commonWrongApproaches: ['Overwriting next before saving it', 'Dereferencing None', 'Skipping dummy nodes for awkward head cases'],
    derivation: ['Draw the references before and after one step.', 'Save every edge that would be lost.', 'Use a dummy head when the result head may change.'],
    algorithm: ['Track current and needed neighboring nodes.', 'Save the next reference.', 'Rewire one edge.', 'Advance pointers.'],
    pythonTemplate: `previous = None\ncurrent = head\nwhile current:\n    next_node = current.next\n    current.next = previous\n    previous = current\n    current = next_node\nreturn previous`,
    complexity: 'Typically O(n) time and O(1) auxiliary space.',
    variations: ['Dummy-head construction', 'Fast/slow cycle detection', 'In-place reversal'],
    hints: ['Which reference will be lost when you rewire this node?', 'Draw one pointer update before writing code.', 'Use pointer manipulation, often with a dummy or previous node.', 'Save next, rewire current, then advance.', 'Pseudocode: next = cur.next; cur.next = prev; shift prev and cur.', 'Implement with descriptive node variables, not index logic.'],
  },
  Intervals: {
    pattern: 'Intervals',
    what: 'Sort ranges by an endpoint so overlap decisions become local.',
    why: 'After sorting, any new conflict is usually with the last retained interval.',
    recognitionClues: ['Start/end ranges', 'Overlap, merge, meeting, or scheduling', 'Minimum removals or rooms'],
    commonWrongApproaches: ['Comparing every interval pair', 'Sorting by the wrong endpoint for the objective', 'Confusing touching with overlapping'],
    derivation: ['Choose an ordering that exposes conflicts.', 'Define overlap precisely.', 'Decide whether a conflict means merge, count, or discard.'],
    algorithm: ['Sort intervals.', 'Compare with the active or last retained interval.', 'Merge or update the chosen endpoint.', 'Append only when disjoint.'],
    pythonTemplate: `intervals.sort(key=lambda item: item[0])\nmerged: list[list[int]] = []\nfor start, end in intervals:\n    if merged and start <= merged[-1][1]:\n        merged[-1][1] = max(merged[-1][1], end)\n    else:\n        merged.append([start, end])`,
    complexity: 'O(n log n) time for sorting and O(n) output space.',
    variations: ['Merge overlaps', 'Sweep line', 'Greedy scheduling by end time'],
    hints: ['Can sorting make each conflict local?', 'Which endpoint ordering supports your goal?', 'Use the interval pattern.', 'Compare each sorted range with the current active range.', 'Pseudocode: sort; merge overlap; otherwise append.', 'Implement using tuple unpacking and a key function when needed.'],
  },
  Trees: {
    pattern: 'Trees',
    what: 'Solve a node from answers returned by its children, or carry state from its ancestors.',
    why: 'Recursive structure gives each subtree the same smaller problem.',
    recognitionClues: ['Parent/child hierarchy', 'Subtree aggregate', 'Path or depth', 'BST ordering'],
    commonWrongApproaches: ['Using global state without a clear invariant', 'Missing the None base case', 'Returning the wrong information to the parent'],
    derivation: ['Define the answer for one subtree.', 'Write the empty-tree answer.', 'Decide what the parent needs returned.'],
    algorithm: ['Handle the base case.', 'Recurse into children.', 'Combine child results.', 'Return one precise value.'],
    pythonTemplate: `def dfs(node):\n    if node is None:\n        return 0\n    left = dfs(node.left)\n    right = dfs(node.right)\n    return 1 + max(left, right)`,
    complexity: 'Usually O(n) time; O(h) recursion space for tree height h.',
    variations: ['Pre/in/postorder DFS', 'Level-order BFS', 'BST boundary search'],
    hints: ['What should this function mean for one subtree?', 'What does an empty subtree return?', 'Use tree DFS or BFS.', 'Ask children for exactly the facts the parent needs.', 'Pseudocode: base case; recurse; combine; return.', 'Implement a small nested dfs function with an explicit return contract.'],
  },
  Heap: {
    pattern: 'Heap',
    what: 'Maintain quick access to the smallest or largest relevant candidate as data changes.',
    why: 'A heap updates an ordered frontier without fully sorting after every change.',
    recognitionClues: ['Top K', 'Repeated min/max extraction', 'Merge sorted streams', 'Scheduling by next event'],
    commonWrongApproaches: ['Sorting the entire collection repeatedly', 'Forgetting heapq is a min-heap', 'Keeping all values when only K matter'],
    derivation: ['Identify the candidate needed next.', 'Ask whether candidates arrive incrementally.', 'Keep only the frontier or K best values.'],
    algorithm: ['Push candidates.', 'Pop the next best candidate.', 'Add newly unlocked candidates.', 'Optionally cap heap size at K.'],
    pythonTemplate: `import heapq\nheap: list[int] = []\nfor value in nums:\n    heapq.heappush(heap, value)\n    if len(heap) > k:\n        heapq.heappop(heap)\nreturn heap[0]`,
    complexity: 'Commonly O(n log k) time and O(k) space.',
    variations: ['Top K min-heap', 'Negated max-heap', 'Multi-source merge'],
    hints: ['Which candidate must be available immediately?', 'Do you need full order or only the current best?', 'Use a heap / priority queue.', 'Push new candidates and pop only when needed.', 'Pseudocode: maintain heap; cap at K or repeatedly extract minimum.', 'Implement with heapq; negate numeric values for max-heap behavior.'],
  },
  Backtracking: {
    pattern: 'Backtracking',
    what: 'Build one decision path, undo it, and explore the next choice.',
    why: 'The search tree represents all valid combinations while pruning impossible prefixes.',
    recognitionClues: ['All combinations, permutations, or partitions', 'Choose/skip decisions', 'Constraint satisfaction', 'Need every valid construction'],
    commonWrongApproaches: ['Appending the same mutable path object', 'Forgetting to undo a choice', 'Exploring branches that already violate constraints'],
    derivation: ['Define one recursion level as one decision.', 'List available choices.', 'Define completion and pruning conditions.'],
    algorithm: ['Check completion.', 'Iterate valid choices.', 'Choose and recurse.', 'Undo the choice.'],
    pythonTemplate: `answer: list[list[int]] = []\npath: list[int] = []\ndef search(start: int) -> None:\n    if complete(path):\n        answer.append(path.copy())\n        return\n    for index in range(start, len(nums)):\n        path.append(nums[index])\n        search(index + 1)\n        path.pop()`,
    complexity: 'Output-sensitive and often exponential; recursion depth follows decisions.',
    variations: ['Subsets', 'Permutations', 'Combination sum', 'Grid word search'],
    hints: ['What choices can be made at one step?', 'Can you represent all choices as a decision tree?', 'Use backtracking.', 'Choose, recurse, then undo; prune invalid prefixes.', 'Pseudocode: if complete save copy; for each choice apply/search/unapply.', 'Implement with path.append, recursion, and path.pop.'],
  },
  'Graph DFS': {
    pattern: 'Graph DFS',
    what: 'Explore one connected path fully before returning to alternatives.',
    why: 'Visited state ensures each reachable node is processed once despite cycles.',
    recognitionClues: ['Connectivity or components', 'Grid islands', 'Path existence', 'Recursive exploration'],
    commonWrongApproaches: ['Marking visited after recursion', 'Treating a directed graph as undirected', 'Forgetting grid boundaries'],
    derivation: ['Define nodes and edges.', 'Choose a visited representation.', 'State what one DFS call guarantees.'],
    algorithm: ['Reject invalid or visited nodes.', 'Mark visited immediately.', 'Explore every neighbor.', 'Aggregate or count components.'],
    pythonTemplate: `visited: set[int] = set()\ndef dfs(node: int) -> None:\n    if node in visited:\n        return\n    visited.add(node)\n    for neighbor in graph[node]:\n        dfs(neighbor)`,
    complexity: 'O(V + E) time and O(V) space.',
    variations: ['Connected components', 'Cycle detection', 'Flood fill'],
    hints: ['What are the nodes and edges?', 'How will you prevent revisiting a cycle?', 'Use graph DFS.', 'Mark a node before recursively exploring neighbors.', 'Pseudocode: if visited return; mark; dfs each neighbor.', 'Implement visited as a set or mutate a grid cell.'],
  },
  'Graph BFS': {
    pattern: 'Graph BFS',
    what: 'Explore a graph layer by layer from one or more starting nodes.',
    why: 'In an unweighted graph, the first visit reaches a node with the fewest edges.',
    recognitionClues: ['Shortest unweighted path', 'Minimum steps', 'Level-by-level traversal', 'Spread from multiple sources'],
    commonWrongApproaches: ['Using DFS for shortest steps', 'Marking visited only when dequeued', 'Losing layer boundaries'],
    derivation: ['Define one edge as one step.', 'Identify all starting states.', 'Use a queue so distance order is preserved.'],
    algorithm: ['Seed queue and visited.', 'Pop from the left.', 'Enqueue unseen neighbors and mark immediately.', 'Track distance by entries or layers.'],
    pythonTemplate: `from collections import deque\nqueue = deque([(start, 0)])\nvisited = {start}\nwhile queue:\n    node, distance = queue.popleft()\n    if goal(node):\n        return distance\n    for neighbor in graph[node]:\n        if neighbor not in visited:\n            visited.add(neighbor)\n            queue.append((neighbor, distance + 1))`,
    complexity: 'O(V + E) time and O(V) space.',
    variations: ['Level-order tree traversal', 'Multi-source BFS', 'State-space BFS'],
    hints: ['Does each move have equal cost?', 'Would exploring by distance layers guarantee the first answer is shortest?', 'Use BFS.', 'Queue states and mark visited when enqueuing.', 'Pseudocode: seed; pop left; enqueue unseen neighbors with distance + 1.', 'Implement with collections.deque, never list.pop(0).'],
  },
  'Topological Sort': {
    pattern: 'Topological Sort',
    what: 'Order directed tasks so every prerequisite appears before its dependent task.',
    why: 'Repeatedly removing zero-indegree nodes exposes what is currently safe to perform.',
    recognitionClues: ['Prerequisites or dependencies', 'Course/task ordering', 'Cycle blocks completion', 'Directed acyclic graph'],
    commonWrongApproaches: ['Applying it to undirected edges', 'Not counting all nodes', 'Assuming an order exists without cycle detection'],
    derivation: ['Direct each prerequisite edge.', 'Count unmet prerequisites.', 'Ask which tasks are available now.'],
    algorithm: ['Build adjacency and indegree.', 'Queue every zero-indegree node.', 'Remove one and decrement dependents.', 'Verify all nodes were ordered.'],
    pythonTemplate: `from collections import deque\nqueue = deque(node for node in nodes if indegree[node] == 0)\norder: list[int] = []\nwhile queue:\n    node = queue.popleft()\n    order.append(node)\n    for neighbor in graph[node]:\n        indegree[neighbor] -= 1\n        if indegree[neighbor] == 0:\n            queue.append(neighbor)\nreturn order if len(order) == len(nodes) else []`,
    complexity: 'O(V + E) time and O(V + E) space.',
    variations: ['Kahn BFS', 'DFS postorder', 'Unique ordering'],
    hints: ['Which tasks currently have no unmet prerequisites?', 'What changes when one available task is completed?', 'Use topological sort.', 'Track indegrees and queue zero-indegree nodes.', 'Pseudocode: build graph; queue zeros; remove and decrement; detect cycle by count.', 'Implement Kahn\'s algorithm with deque.'],
  },
  'Union Find': {
    pattern: 'Union Find',
    what: 'Maintain changing connected components with representative parents.',
    why: 'Path compression and union by size make repeated connectivity updates nearly constant time.',
    recognitionClues: ['Edges added over time', 'Repeated connectivity queries', 'Detect redundant connection', 'Merge groups'],
    commonWrongApproaches: ['Running a full DFS after every edge', 'Unioning raw nodes instead of roots', 'Skipping path compression'],
    derivation: ['Give each node a component representative.', 'Define find and union operations.', 'Use an edge whose roots match to detect a cycle.'],
    algorithm: ['Initialize each node as its own parent.', 'Find roots with compression.', 'Attach smaller root under larger.', 'Update component count if needed.'],
    pythonTemplate: `parent = list(range(n))\nsize = [1] * n\ndef find(node: int) -> int:\n    while node != parent[node]:\n        parent[node] = parent[parent[node]]\n        node = parent[node]\n    return node\ndef union(a: int, b: int) -> bool:\n    root_a, root_b = find(a), find(b)\n    if root_a == root_b:\n        return False\n    if size[root_a] < size[root_b]:\n        root_a, root_b = root_b, root_a\n    parent[root_b] = root_a\n    size[root_a] += size[root_b]\n    return True`,
    complexity: 'O((V + E) α(V)) time, effectively linear, and O(V) space.',
    variations: ['Cycle detection', 'Kruskal MST', 'Counting components'],
    hints: ['Do components merge repeatedly?', 'Can each group have one representative?', 'Use union-find / disjoint set union.', 'Find roots, then attach one root to the other.', 'Pseudocode: parent/size arrays; compressed find; weighted union.', 'Implement path compression and union by size.'],
  },
  Greedy: {
    pattern: 'Greedy',
    what: 'Make a locally optimal irreversible choice backed by an exchange or dominance argument.',
    why: 'The proof shows any optimal solution can adopt the greedy choice without becoming worse.',
    recognitionClues: ['Scheduling or coverage', 'Minimize removals or maximize count', 'A best local boundary dominates alternatives', 'One pass after sorting'],
    commonWrongApproaches: ['Calling any heuristic greedy', 'Coding before proving the choice', 'Keeping unnecessary history'],
    derivation: ['Name the local choice.', 'Compare it with a competing optimal choice.', 'Show swapping to the greedy choice preserves feasibility.'],
    algorithm: ['Sort if the proof needs order.', 'Track the best boundary or resource state.', 'Accept a choice only when it improves or remains feasible.'],
    pythonTemplate: `items.sort(key=lambda item: item[1])\nchosen = 0\nlast_end = float('-inf')\nfor start, end in items:\n    if start >= last_end:\n        chosen += 1\n        last_end = end`,
    complexity: 'Often O(n log n) due to sorting, then O(n) scanning.',
    variations: ['Interval scheduling', 'Reachability frontier', 'Frequency-based construction'],
    hints: ['What local choice leaves the most room for the future?', 'Can you prove replacing another choice with it never hurts?', 'Use greedy only with that proof.', 'Track the strongest feasible frontier after each item.', 'Pseudocode: sort by proof-relevant key; take a choice if feasible.', 'Implement a concise scan after sorting.'],
  },
  'Dynamic Programming': {
    pattern: 'Dynamic Programming',
    what: 'Cache answers to overlapping subproblems whose state contains all information needed for the future.',
    why: 'Each distinct state is solved once instead of through exponentially many repeated paths.',
    recognitionClues: ['Count ways or optimize a value', 'Choose among alternatives over prefixes', 'Overlapping recursive choices', 'Answer depends on smaller states'],
    commonWrongApproaches: ['Choosing a state that omits needed information', 'Writing recurrence without base cases', 'Using DP when a greedy proof exists'],
    derivation: ['Write the brute-force choice recursion.', 'Define state in one sentence.', 'Write recurrence and base cases.', 'Choose memoization or iteration order.'],
    algorithm: ['Define state.', 'Initialize base states.', 'Transition from already solved states.', 'Return the requested state.'],
    pythonTemplate: `previous_two, previous_one = 0, 1\nfor value in values:\n    current = combine(previous_two, previous_one, value)\n    previous_two, previous_one = previous_one, current\nreturn previous_one`,
    complexity: 'Number of states multiplied by work per transition; space can often be compressed.',
    variations: ['1D prefix DP', 'Grid/2D DP', 'Knapsack', 'Subsequence DP', 'Interval DP'],
    hints: ['What choices does brute force branch on?', 'Do different paths ask the same smaller question?', 'Use dynamic programming.', 'Define a state that completely describes the remaining decision.', 'Pseudocode: base cases; for each state, combine prior states; return target.', 'Implement top-down with functools.cache first, then derive bottom-up if useful.'],
  },
  'Bit Manipulation': {
    pattern: 'Bit Manipulation',
    what: 'Use binary digits as compact flags and exploit XOR or masks for per-bit invariants.',
    why: 'Bit operations process membership and parity in constant-size machine words.',
    recognitionClues: ['Every value appears twice except one', 'Power of two', 'Subset masks', 'Per-bit counts'],
    commonWrongApproaches: ['Using bit tricks without stating the invariant', 'Confusing logical and arithmetic shifts', 'Forgetting Python integers are unbounded'],
    derivation: ['Write the truth table for one bit.', 'Identify cancellation or masking behavior.', 'Apply the invariant independently to all bits.'],
    algorithm: ['Initialize mask or accumulator.', 'Apply XOR/AND/OR/shift per value.', 'Interpret the resulting bits.'],
    pythonTemplate: `result = 0\nfor value in nums:\n    result ^= value\nreturn result`,
    complexity: 'Often O(n) time and O(1) auxiliary space.',
    variations: ['XOR cancellation', 'Bit masks for subsets', 'Brian Kernighan bit counting'],
    hints: ['What happens independently at each binary position?', 'Is parity or membership all that matters?', 'Use a bit invariant.', 'XOR cancels equal values and preserves the unmatched value.', 'Pseudocode: accumulator = 0; XOR every value.', 'Implement with &, |, ^, ~, <<, or >> only after naming the invariant.'],
  },
  Tries: {
    pattern: 'Tries',
    what: 'Store strings by shared prefixes, one character edge at a time.',
    why: 'Prefix queries depend on query length instead of the number of stored words.',
    recognitionClues: ['Many prefix searches', 'Dictionary of words', 'Autocomplete or wildcard matching', 'Character-by-character branching'],
    commonWrongApproaches: ['Scanning every word for each query', 'Not distinguishing a word end from a prefix', 'Creating missing nodes during read-only search'],
    derivation: ['View each word as a path of characters.', 'Share nodes for common prefixes.', 'Store an explicit terminal marker.'],
    algorithm: ['Start at root.', 'Follow or create one child per character.', 'Mark terminal on insert.', 'Require terminal for full-word search.'],
    pythonTemplate: `node = root\nfor character in word:\n    node = node.setdefault(character, {})\nnode['#'] = True`,
    complexity: 'O(L) per operation for word length L, plus total stored characters.',
    variations: ['Prefix search', 'Wildcard DFS', 'Bitwise trie'],
    hints: ['Do many words repeat the same prefix work?', 'Could prefixes be represented as shared paths?', 'Use a trie.', 'Each character selects a child; store a separate end marker.', 'Pseudocode: walk/create chars; mark terminal; search by walking chars.', 'Implement nested dicts or a small TrieNode class.'],
  },
}

export interface ProblemTeachingGuide {
  title: string
  intuition: string
  bruteForce: string
  whyBruteForceFails: string
  keyObservation: string
  derivation: string[]
  algorithm: string[]
  python: string
  complexity: string
  commonMistakes: string[]
  recognitionClues: string[]
  variations: string[]
  hints: [string, string, string, string, string, string]
}

export const PROBLEM_GUIDES: Record<string, ProblemTeachingGuide> = {
  '0001-two-sum': {
    title: 'Two Sum',
    intuition: 'At each number, the only useful question is whether the value needed to complete the target has appeared already.',
    bruteForce: 'Try every pair and return the pair whose sum equals the target.',
    whyBruteForceFails: 'Every index scans many of the same later values, producing O(n²) comparisons.',
    keyObservation: 'If the current value is x, its partner must be target - x. Earlier values can be remembered by value and index.',
    derivation: ['Write the missing partner as target - value.', 'Replace the inner scan with a dictionary lookup.', 'Check before storing so the same element is never reused.'],
    algorithm: ['Create an empty value-to-index dictionary.', 'For each value, compute its complement.', 'Return when the complement is present.', 'Otherwise store the current value and index.'],
    python: `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        seen: dict[int, int] = {}\n        for index, value in enumerate(nums):\n            complement = target - value\n            if complement in seen:\n                return [seen[complement], index]\n            seen[value] = index\n        return []`,
    complexity: 'O(n) time and O(n) space.',
    commonMistakes: ['Storing before checking and accidentally reusing one index', 'Returning values instead of indices', 'Using a nested loop despite large constraints'],
    recognitionClues: ['Unsorted pair sum', 'Need original indices', 'Complement lookup'],
    variations: ['Two Sum II on sorted input uses two pointers', 'Three Sum adds sorting and an outer loop', 'Count pairs stores frequencies'],
    hints: ['For the current number, what exact partner value is needed?', 'Could earlier values answer that question immediately?', 'Use an Arrays & Hashing complement map.', 'Scan once; check target - value before storing value.', 'Pseudocode: for each index/value, if complement in map return; else map[value] = index.', 'Use the Python implementation shown in the solution teaching section.'],
  },
  '0003-longest-substring-without-repeating-characters': {
    title: 'Longest Substring Without Repeating Characters',
    intuition: 'Keep one substring that is valid right now. When a new character repeats, repair only the left side instead of starting over.',
    bruteForce: 'Generate every substring and test whether all of its characters are unique.',
    whyBruteForceFails: 'There are O(n²) substrings, and checking each one can add another O(n), while much of the work repeats.',
    keyObservation: 'Both boundaries only move forward. A set or last-seen map tells when the current range stops being valid.',
    derivation: ['Define a valid range as one with no duplicate character.', 'Expand right by one character.', 'If invalid, move left and remove characters until valid again.', 'Record the longest valid width.'],
    algorithm: ['Initialize left at zero and an empty set.', 'For each right character, shrink while that character is already present.', 'Add the character.', 'Update the best length from right - left + 1.'],
    python: `class Solution:\n    def lengthOfLongestSubstring(self, text: str) -> int:\n        window: set[str] = set()\n        left = 0\n        best = 0\n        for right, character in enumerate(text):\n            while character in window:\n                window.remove(text[left])\n                left += 1\n            window.add(character)\n            best = max(best, right - left + 1)\n        return best`,
    complexity: 'O(n) time because each character enters and leaves once; O(k) space for the active alphabet.',
    commonMistakes: ['Using if instead of while when repairing the window', 'Forgetting to remove text[left]', 'Updating the answer before restoring validity', 'Confusing subsequence with substring'],
    recognitionClues: ['Longest contiguous substring', 'Uniqueness constraint', 'Validity can be updated at both ends'],
    variations: ['At most K distinct characters', 'Character replacement budget', 'Minimum covering window'],
    hints: ['What exactly makes a current substring valid?', 'What minimum information tells whether the next character breaks validity?', 'Use a Sliding Window.', 'Expand right; while duplicated, remove text[left] and increment left.', 'Pseudocode: for right, shrink duplicate; add current; update max width.', 'Use a set-based Python window first; optimize to last-seen indices only after understanding it.'],
  },
  '0121-best-time-to-buy-and-sell-stock': {
    title: 'Best Time to Buy And Sell Stock',
    intuition: 'For every selling day, only the cheapest earlier buying price matters.',
    bruteForce: 'Try every buy day with every later sell day.',
    whyBruteForceFails: 'The same earlier prices are reconsidered for every selling day, giving O(n²) time.',
    keyObservation: 'Maintain the minimum price seen so far and ask what profit today would produce.',
    derivation: ['Fix today as the sell day.', 'The best valid buy is the smallest price before today.', 'Update the answer, then update the running minimum.'],
    algorithm: ['Initialize minimum price to infinity and best profit to zero.', 'For each price, compute price - minimum.', 'Update best profit.', 'Update minimum price.'],
    python: `class Solution:\n    def maxProfit(self, prices: list[int]) -> int:\n        minimum = float('inf')\n        best = 0\n        for price in prices:\n            best = max(best, price - minimum)\n            minimum = min(minimum, price)\n        return best`,
    complexity: 'O(n) time and O(1) space.',
    commonMistakes: ['Allowing sell before buy', 'Tracking the largest price instead of cheapest prior price', 'Returning a negative profit'],
    recognitionClues: ['Ordered buy then sell', 'Best earlier state for each current position'],
    variations: ['Unlimited transactions', 'Cooldown', 'Transaction fee'],
    hints: ['If today is the sell day, what earlier fact gives the best profit?', 'Only the cheapest earlier price matters.', 'Use a one-pass window/frontier.', 'Track minimum price and best difference.', 'Pseudocode: best=max(best, price-minimum); minimum=min(minimum, price).', 'Implement with two scalar variables; no nested loop is needed.'],
  },
  '0704-binary-search': {
    title: 'Binary Search',
    intuition: 'A midpoint comparison proves that half of a sorted array cannot contain the target.',
    bruteForce: 'Scan from left to right until the target is found.',
    whyBruteForceFails: 'Linear scanning ignores the sorted order and costs O(n).',
    keyObservation: 'If nums[mid] is too small, every position at or left of mid is also too small; the symmetric fact holds when it is too large.',
    derivation: ['Keep an inclusive interval that may still contain the target.', 'Compare the midpoint.', 'Discard the impossible half without discarding a possible target.'],
    algorithm: ['Set left and right to the array endpoints.', 'While left <= right, inspect mid.', 'Return on equality.', 'Move left to mid + 1 or right to mid - 1.'],
    python: `class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        left, right = 0, len(nums) - 1\n        while left <= right:\n            mid = left + (right - left) // 2\n            if nums[mid] == target:\n                return mid\n            if nums[mid] < target:\n                left = mid + 1\n            else:\n                right = mid - 1\n        return -1`,
    complexity: 'O(log n) time and O(1) space.',
    commonMistakes: ['Using left < right with inclusive boundaries', 'Setting a boundary to mid and never making progress', 'Mixing lower-bound and exact-search templates'],
    recognitionClues: ['Sorted array', 'Exact target', 'Logarithmic requirement'],
    variations: ['First occurrence', 'Rotated sorted array', 'Binary search on an answer'],
    hints: ['What does one midpoint comparison prove about many values?', 'Sorted order lets you discard one whole half.', 'Use Binary Search.', 'Maintain an inclusive interval [left, right].', 'Pseudocode: while left <= right; compare mid; move past mid.', 'Use the exact-search Python implementation in the teaching section.'],
  },
  '0200-number-of-islands': {
    title: 'Number of Islands',
    intuition: 'Each time you discover unvisited land, you have found one new component; traverse all of it so it is never counted again.',
    bruteForce: 'For every land cell, repeatedly search whether it connects to land already counted.',
    whyBruteForceFails: 'Without marking a component, the same cells are explored many times.',
    keyObservation: 'A DFS or BFS from one land cell visits exactly one island.',
    derivation: ['Treat land cells as nodes and orthogonal adjacency as edges.', 'Scan for an unseen node.', 'Count it once, then mark its full connected component.'],
    algorithm: ['Scan each cell.', 'When land is found, increment count and start DFS.', 'Reject boundaries and water.', 'Mark each visited land cell as water before exploring neighbors.'],
    python: `class Solution:\n    def numIslands(self, grid: list[list[str]]) -> int:\n        rows, columns = len(grid), len(grid[0])\n        def flood(row: int, column: int) -> None:\n            if row < 0 or row == rows or column < 0 or column == columns or grid[row][column] != '1':\n                return\n            grid[row][column] = '0'\n            flood(row + 1, column)\n            flood(row - 1, column)\n            flood(row, column + 1)\n            flood(row, column - 1)\n        islands = 0\n        for row in range(rows):\n            for column in range(columns):\n                if grid[row][column] == '1':\n                    islands += 1\n                    flood(row, column)\n        return islands`,
    complexity: 'O(rows × columns) time and O(rows × columns) worst-case recursion space.',
    commonMistakes: ['Marking visited after exploring neighbors', 'Missing a boundary check', 'Counting every land cell instead of every traversal start'],
    recognitionClues: ['Grid connectivity', 'Count components', 'Four-direction neighbors'],
    variations: ['Maximum island area', 'Surrounded regions', 'Multi-source distance from land'],
    hints: ['What does one complete traversal from a land cell represent?', 'Count traversal starts, not individual cells.', 'Use Graph DFS or BFS.', 'Mark land visited immediately, then explore four neighbors.', 'Pseudocode: scan; if land count++; flood component.', 'Use an in-place mark or a visited set in Python.'],
  },
  '0198-house-robber': {
    title: 'House Robber',
    intuition: 'At each house, the best prefix either skips it or takes it together with the best prefix ending two positions earlier.',
    bruteForce: 'Recursively choose to rob or skip every house.',
    whyBruteForceFails: 'Different choice paths repeatedly solve the same suffixes, creating O(2ⁿ) work.',
    keyObservation: 'Only two prior optimal prefix values are needed for the next decision.',
    derivation: ['Define dp[i] as the best result from the first i houses.', 'Skipping uses dp[i-1].', 'Taking uses value + dp[i-2].', 'Choose the larger result.'],
    algorithm: ['Start previous-two and previous-one at zero.', 'For each value, compute max(previous-one, previous-two + value).', 'Shift both states forward.', 'Return previous-one.'],
    python: `class Solution:\n    def rob(self, nums: list[int]) -> int:\n        previous_two = 0\n        previous_one = 0\n        for value in nums:\n            current = max(previous_one, previous_two + value)\n            previous_two, previous_one = previous_one, current\n        return previous_one`,
    complexity: 'O(n) time and O(1) space.',
    commonMistakes: ['Using greedy largest-first choices', 'Mixing the meanings of previous-one and previous-two', 'Memorizing the recurrence without defining the state'],
    recognitionClues: ['Choose or skip', 'Adjacent choices conflict', 'Optimize over a prefix'],
    variations: ['Circular houses', 'Delete and Earn', 'Weighted independent set on a tree'],
    hints: ['At one house, what two choices exist?', 'If you take it, which earlier best answer is still compatible?', 'Use 1D Dynamic Programming.', 'State = best value for a processed prefix; transition = max(skip, take).', 'Pseudocode: current=max(prev1, prev2+value); shift.', 'Implement with two rolling variables after you can explain the full dp array.'],
  },
}

export interface RecognitionDrill {
  id: string
  problemTitle: string
  level: 1 | 2 | 3 | 4 | 5
  prompt: string
  clues: string[]
  answer: CorePattern
  options: CorePattern[]
  explanation: string
}

export const RECOGNITION_DRILLS: RecognitionDrill[] = [
  { id: 'rec-contains-duplicate', problemTitle: 'Contains Duplicate', level: 1, prompt: 'Determine whether any value occurs more than once.', clues: ['Only existence matters', 'Input is not sorted'], answer: 'Arrays & Hashing', options: ['Arrays & Hashing', 'Two Pointers', 'Binary Search', 'Dynamic Programming'], explanation: 'A set records seen values and detects the first repeat in one pass.' },
  { id: 'rec-valid-anagram', problemTitle: 'Valid Anagram', level: 1, prompt: 'Decide whether two strings contain exactly the same characters with the same counts.', clues: ['Order is irrelevant', 'Frequency is essential'], answer: 'Arrays & Hashing', options: ['Arrays & Hashing', 'Sliding Window', 'Stack', 'Tries'], explanation: 'A frequency map or Counter compares the multiset of characters.' },
  { id: 'rec-two-sum', problemTitle: 'Two Sum', level: 1, prompt: 'Return indices of two unsorted values whose sum equals a target.', clues: ['Original indices matter', 'Each value has one required complement'], answer: 'Arrays & Hashing', options: ['Arrays & Hashing', 'Two Pointers', 'Binary Search', 'Backtracking'], explanation: 'Store prior values by index and query the current complement.' },
  { id: 'rec-valid-palindrome', problemTitle: 'Valid Palindrome', level: 1, prompt: 'Compare alphanumeric characters from both ends while ignoring punctuation.', clues: ['Mirrored positions', 'Pointers move inward'], answer: 'Two Pointers', options: ['Two Pointers', 'Stack', 'Sliding Window', 'Dynamic Programming'], explanation: 'Two inward pointers compare each relevant mirrored pair once.' },
  { id: 'rec-stock', problemTitle: 'Best Time to Buy And Sell Stock', level: 2, prompt: 'Choose an earlier buy and later sell to maximize one transaction.', clues: ['Order matters', 'For each sell, only the cheapest earlier buy matters'], answer: 'Sliding Window', options: ['Sliding Window', 'Greedy', 'Prefix Sum', 'Heap'], explanation: 'Maintain the best left boundary (minimum price) as the right boundary advances.' },
  { id: 'rec-longest-substring', problemTitle: 'Longest Substring Without Repeating Characters', level: 2, prompt: 'Find the longest contiguous range whose characters are all unique.', clues: ['Contiguous', 'Validity changes when endpoints move'], answer: 'Sliding Window', options: ['Sliding Window', 'Two Pointers', 'Prefix Sum', 'Backtracking'], explanation: 'A variable window expands and repairs duplicates by moving its left edge.' },
  { id: 'rec-binary-search', problemTitle: 'Binary Search', level: 2, prompt: 'Find a target index in an ascending array in logarithmic time.', clues: ['Sorted', 'O(log n) requested'], answer: 'Binary Search', options: ['Binary Search', 'Two Pointers', 'Arrays & Hashing', 'Greedy'], explanation: 'Each midpoint comparison eliminates one sorted half.' },
  { id: 'rec-daily-temperatures', problemTitle: 'Daily Temperatures', level: 3, prompt: 'For each day, find how long until a warmer future day.', clues: ['Nearest future greater value', 'Earlier positions wait unresolved'], answer: 'Stack', options: ['Stack', 'Heap', 'Sliding Window', 'Binary Search'], explanation: 'A monotonic stack holds unresolved indices until a warmer value pops them.' },
  { id: 'rec-k-frequent', problemTitle: 'Top K Frequent Elements', level: 3, prompt: 'Return the K values with the highest frequencies.', clues: ['Top K', 'Frequency first, ranking second'], answer: 'Heap', options: ['Heap', 'Arrays & Hashing', 'Binary Search', 'Greedy'], explanation: 'Count with a map, then keep an ordered frontier with a size-K heap or buckets.' },
  { id: 'rec-islands', problemTitle: 'Number of Islands', level: 3, prompt: 'Count disconnected groups of adjacent land cells.', clues: ['Grid as a graph', 'Connected components'], answer: 'Graph DFS', options: ['Graph DFS', 'Graph BFS', 'Union Find', 'Dynamic Programming'], explanation: 'Each traversal from unseen land marks one whole component.' },
  { id: 'rec-level-order', problemTitle: 'Binary Tree Level Order Traversal', level: 3, prompt: 'Return tree values grouped by depth from the root.', clues: ['Layer-by-layer output'], answer: 'Graph BFS', options: ['Graph BFS', 'Trees', 'Graph DFS', 'Heap'], explanation: 'A queue preserves depth order and exposes one level at a time.' },
  { id: 'rec-course', problemTitle: 'Course Schedule', level: 4, prompt: 'Decide whether all directed prerequisite relationships can be completed.', clues: ['Dependencies', 'A directed cycle blocks completion'], answer: 'Topological Sort', options: ['Topological Sort', 'Union Find', 'Graph BFS', 'Greedy'], explanation: 'Topological processing succeeds exactly when every node can be removed from the dependency graph.' },
  { id: 'rec-combination', problemTitle: 'Combination Sum', level: 4, prompt: 'Return every combination of candidates that reaches a target.', clues: ['All valid constructions', 'Choose and undo'], answer: 'Backtracking', options: ['Backtracking', 'Dynamic Programming', 'Greedy', 'Two Pointers'], explanation: 'The output is a decision tree of choices, so explore and undo each path.' },
  { id: 'rec-house-robber', problemTitle: 'House Robber', level: 4, prompt: 'Maximize selected values when adjacent positions cannot both be used.', clues: ['Choose or skip', 'Repeated optimal prefixes'], answer: 'Dynamic Programming', options: ['Dynamic Programming', 'Greedy', 'Sliding Window', 'Prefix Sum'], explanation: 'Each best prefix is max(skip current, take current plus the best two positions back).' },
  { id: 'rec-redundant', problemTitle: 'Redundant Connection', level: 5, prompt: 'Find the edge that first joins two nodes already connected.', clues: ['Edges arrive one at a time', 'Repeated connectivity queries'], answer: 'Union Find', options: ['Union Find', 'Topological Sort', 'Graph DFS', 'Heap'], explanation: 'Union-find detects an edge whose endpoints already share a representative.' },
]

export interface CurriculumNode {
  id: string
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
  title: string
  outcome: string
  patterns: CorePattern[]
  prerequisites: string[]
  masteryCriteria: string[]
}

export const CURRICULUM: CurriculumNode[] = [
  { id: 'python-dsa', level: 0, title: 'Python for DSA', outcome: 'Use lists, dict, set, Counter, defaultdict, deque, heapq, bisect, sorting keys, and tuple unpacking deliberately.', patterns: ['Arrays & Hashing'], prerequisites: [], masteryCriteria: ['Trace mutable state without guessing', 'Choose the right built-in collection', 'State time cost of common operations'] },
  { id: 'complexity', level: 0, title: 'Complexity and constraints', outcome: 'Translate input limits into a realistic complexity target before coding.', patterns: [], prerequisites: ['python-dsa'], masteryCriteria: ['Reject O(n²) when constraints require better', 'Analyze time and auxiliary space'] },
  { id: 'recursion', level: 0, title: 'Recursion mechanics', outcome: 'Define a function contract, base case, recursive progress, and return value.', patterns: ['Trees', 'Backtracking'], prerequisites: ['python-dsa'], masteryCriteria: ['Trace call stack', 'Write terminating base cases'] },
  { id: 'hashing', level: 1, title: 'Arrays and hashing', outcome: 'Replace repeated lookup work with stored facts.', patterns: ['Arrays & Hashing'], prerequisites: ['complexity'], masteryCriteria: ['Recognize complement/frequency clues', 'Solve three Easy problems independently', 'Explain set versus dict'] },
  { id: 'two-pointers', level: 1, title: 'Two pointers', outcome: 'Derive safe monotonic pointer movement from an invariant.', patterns: ['Two Pointers'], prerequisites: ['hashing'], masteryCriteria: ['State pointer invariant', 'Solve opposite-end and read/write variants'] },
  { id: 'stack-queue', level: 1, title: 'Stacks and queues', outcome: 'Recognize LIFO resolution and FIFO layer ordering.', patterns: ['Stack', 'Graph BFS'], prerequisites: ['python-dsa'], masteryCriteria: ['Implement with list and deque', 'Explain why operation order matters'] },
  { id: 'sliding-window', level: 2, title: 'Sliding window', outcome: 'Maintain a valid contiguous range without restarting.', patterns: ['Sliding Window'], prerequisites: ['two-pointers', 'hashing'], masteryCriteria: ['Define validity state', 'Derive expand/shrink logic', 'Solve fixed and variable windows'] },
  { id: 'prefix-sum', level: 2, title: 'Prefix sums', outcome: 'Turn range equations into prefix lookups.', patterns: ['Prefix Sum'], prerequisites: ['hashing'], masteryCriteria: ['Seed empty prefix correctly', 'Derive prefix - target lookup'] },
  { id: 'binary-search', level: 2, title: 'Binary search invariants', outcome: 'Search sorted data and monotonic answer spaces without boundary guessing.', patterns: ['Binary Search'], prerequisites: ['complexity'], masteryCriteria: ['Write one consistent boundary template', 'Explain first-valid search'] },
  { id: 'linked-lists', level: 2, title: 'Linked-list references', outcome: 'Rewire nodes without losing the remaining chain.', patterns: ['Linked Lists'], prerequisites: ['python-dsa'], masteryCriteria: ['Draw pointer changes', 'Reverse and merge independently'] },
  { id: 'intervals', level: 3, title: 'Intervals and local overlap', outcome: 'Use sorting to make global range conflicts local.', patterns: ['Intervals', 'Greedy'], prerequisites: ['two-pointers'], masteryCriteria: ['Choose correct sort key', 'Distinguish merge from scheduling goals'] },
  { id: 'trees', level: 3, title: 'Tree return contracts', outcome: 'Build parent answers from precise subtree results.', patterns: ['Trees', 'Graph BFS'], prerequisites: ['recursion', 'stack-queue'], masteryCriteria: ['Write DFS base/combine/return', 'Use BFS for levels'] },
  { id: 'heap', level: 3, title: 'Priority queues and Top K', outcome: 'Maintain only the ordered frontier required by the problem.', patterns: ['Heap'], prerequisites: ['complexity'], masteryCriteria: ['Choose heap over repeated sorting', 'Explain min-heap size K'] },
  { id: 'medium-bridge', level: 3, title: 'Easy-to-Medium bridge', outcome: 'Move from recognizing one pattern to deriving its variation under constraints.', patterns: ['Sliding Window', 'Binary Search', 'Trees'], prerequisites: ['sliding-window', 'binary-search', 'trees'], masteryCriteria: ['Produce brute force first', 'Optimize with no more than one conceptual hint', 'Re-solve after 72 hours'] },
  { id: 'backtracking', level: 4, title: 'Decision-tree backtracking', outcome: 'Generate valid choices with explicit choose, recurse, and undo steps.', patterns: ['Backtracking'], prerequisites: ['recursion'], masteryCriteria: ['Draw decision tree', 'Prune invalid prefixes', 'Avoid mutable path bugs'] },
  { id: 'graphs', level: 4, title: 'Graph traversal', outcome: 'Model entities and relationships, then choose DFS or BFS from the goal.', patterns: ['Graph DFS', 'Graph BFS'], prerequisites: ['trees', 'stack-queue'], masteryCriteria: ['Build adjacency representation', 'Handle visited timing', 'Choose BFS for unweighted shortest paths'] },
  { id: 'greedy', level: 4, title: 'Greedy proof', outcome: 'Support a local choice with an exchange or dominance argument.', patterns: ['Greedy'], prerequisites: ['intervals'], masteryCriteria: ['State why local choice is safe', 'Identify when greedy fails'] },
  { id: 'dp-1d', level: 4, title: '1D dynamic programming', outcome: 'Derive state, recurrence, base cases, and evaluation order from brute force.', patterns: ['Dynamic Programming'], prerequisites: ['recursion', 'medium-bridge'], masteryCriteria: ['Write memoized recurrence first', 'Compress state only after correctness'] },
  { id: 'graph-structure', level: 5, title: 'Directed and dynamic connectivity', outcome: 'Use dependency order and disjoint sets for structural graph questions.', patterns: ['Topological Sort', 'Union Find'], prerequisites: ['graphs'], masteryCriteria: ['Detect directed cycles', 'Implement compressed find and weighted union'] },
  { id: 'dp-2d', level: 5, title: '2D, knapsack, and subsequence DP', outcome: 'Choose multi-variable states that retain exactly the needed future information.', patterns: ['Dynamic Programming'], prerequisites: ['dp-1d'], masteryCriteria: ['Explain each state dimension', 'Derive transitions without memorizing a table'] },
  { id: 'monotonic', level: 5, title: 'Monotonic structures', outcome: 'Resolve nearest-boundary questions in amortized linear time.', patterns: ['Stack'], prerequisites: ['stack-queue'], masteryCriteria: ['Define stack order', 'Explain why each item pops once'] },
  { id: 'tries-bits', level: 5, title: 'Tries and bit state', outcome: 'Represent prefixes and compact binary state when the data shape justifies it.', patterns: ['Tries', 'Bit Manipulation'], prerequisites: ['hashing', 'recursion'], masteryCriteria: ['Implement terminal markers', 'State a bit invariant before coding'] },
  { id: 'advanced-graphs', level: 6, title: 'Advanced graph algorithms', outcome: 'Apply weighted shortest path, minimum spanning tree, and strongly connected component reasoning.', patterns: ['Heap', 'Union Find', 'Graph DFS'], prerequisites: ['graph-structure', 'heap'], masteryCriteria: ['Distinguish weighted from unweighted shortest path', 'Derive algorithm from edge assumptions'] },
  { id: 'hard-composition', level: 6, title: 'Hard pattern composition', outcome: 'Combine multiple proven invariants without losing correctness.', patterns: ['Dynamic Programming', 'Binary Search', 'Heap'], prerequisites: ['dp-2d', 'advanced-graphs'], masteryCriteria: ['Decompose into independently testable claims', 'Solve unseen combinations under bounded hints'] },
  { id: 'interview-simulation', level: 7, title: 'Interview simulation', outcome: 'Recognize, derive, implement, test, analyze, and communicate under time pressure.', patterns: [], prerequisites: ['hard-composition'], masteryCriteria: ['Consistent Medium independence', 'Clear complexity and edge-case discussion', 'Stable performance across mock interviews'] },
]

export interface DiagnosticQuestion {
  id: string
  prompt: string
  clues: string[]
  options: CorePattern[]
  answer: CorePattern
  explanation: string
}

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  { id: 'diag-hash', prompt: 'Find whether any two values sum to a target in an unsorted array.', clues: ['One pass is preferred', 'You need to know whether a complement appeared earlier'], options: ['Arrays & Hashing', 'Two Pointers', 'Binary Search', 'Greedy'], answer: 'Arrays & Hashing', explanation: 'A dictionary stores earlier values or their indices for O(1) complement lookup.' },
  { id: 'diag-two', prompt: 'Decide whether a cleaned string is a palindrome without creating every substring.', clues: ['Only mirrored positions matter'], options: ['Two Pointers', 'Sliding Window', 'Stack', 'Dynamic Programming'], answer: 'Two Pointers', explanation: 'Pointers moving inward compare each mirrored pair exactly once.' },
  { id: 'diag-window', prompt: 'Find the longest contiguous substring containing no repeated character.', clues: ['The answer is contiguous', 'Validity changes when a character enters or leaves'], options: ['Sliding Window', 'Prefix Sum', 'Binary Search', 'Backtracking'], answer: 'Sliding Window', explanation: 'Expand a range and move its left boundary only when a duplicate invalidates it.' },
  { id: 'diag-search', prompt: 'Find the first position where a monotonic condition becomes true.', clues: ['Everything before the boundary is false', 'Everything after is true'], options: ['Binary Search', 'Two Pointers', 'Greedy', 'Graph BFS'], answer: 'Binary Search', explanation: 'A monotonic predicate lets each midpoint discard half of the candidates.' },
  { id: 'diag-tree', prompt: 'Compute the maximum depth of a binary tree.', clues: ['The answer for a node depends on the answers from both children'], options: ['Trees', 'Graph BFS', 'Heap', 'Dynamic Programming'], answer: 'Trees', explanation: 'A subtree returns its depth; the parent combines those two smaller answers.' },
  { id: 'diag-bfs', prompt: 'Find the minimum number of moves through an unweighted maze.', clues: ['Every move has equal cost'], options: ['Graph BFS', 'Graph DFS', 'Greedy', 'Union Find'], answer: 'Graph BFS', explanation: 'BFS visits states in increasing move count, so the first arrival is shortest.' },
  { id: 'diag-dfs', prompt: 'Count disconnected islands in a grid.', clues: ['Each land cell belongs to one connected component'], options: ['Graph DFS', 'Graph BFS', 'Union Find', 'Sliding Window'], answer: 'Graph DFS', explanation: 'Start a traversal at each unseen land cell and mark its full component.' },
  { id: 'diag-dp', prompt: 'Maximize non-adjacent values selected from a row.', clues: ['At each index, choose it or skip it', 'The same prefixes repeat'], options: ['Dynamic Programming', 'Greedy', 'Sliding Window', 'Heap'], answer: 'Dynamic Programming', explanation: 'The best prefix ending here depends on a small set of previously solved prefixes.' },
  { id: 'diag-topo', prompt: 'Return an order for courses when some courses are prerequisites of others.', clues: ['Dependencies are directed', 'A cycle makes completion impossible'], options: ['Topological Sort', 'Union Find', 'Graph DFS', 'Greedy'], answer: 'Topological Sort', explanation: 'A topological order places every prerequisite before the course that depends on it.' },
]

export const STUCK_DECISION_TREE = [
  { question: 'Need fast membership, frequency, grouping, or a complement?', tryPattern: 'Arrays & Hashing' },
  { question: 'Contiguous subarray or substring with a maintainable constraint?', tryPattern: 'Sliding Window or Prefix Sum' },
  { question: 'Sorted input, mirrored positions, or in-place compaction?', tryPattern: 'Two Pointers' },
  { question: 'Sorted or monotonic search space?', tryPattern: 'Binary Search' },
  { question: 'Nearest greater/smaller, nesting, or unresolved recent items?', tryPattern: 'Stack' },
  { question: 'Top K or repeated access to the next minimum/maximum?', tryPattern: 'Heap' },
  { question: 'Relationships, connectivity, paths, or a grid?', tryPattern: 'Graph DFS / BFS' },
  { question: 'All valid choices, arrangements, or partitions?', tryPattern: 'Backtracking' },
  { question: 'Optimization or counting over repeated smaller states?', tryPattern: 'Dynamic Programming' },
  { question: 'Prerequisites or changing connected groups?', tryPattern: 'Topological Sort / Union Find' },
] as const