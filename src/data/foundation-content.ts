export interface ConceptSection {
  title: string
  explanation: string
  code?: string
  checks: string[]
}

export interface ConceptLesson {
  nodeId: string
  mentalModel: string
  sections: ConceptSection[]
  exercises: string[]
}

export const CONCEPT_LESSONS: Record<string, ConceptLesson> = {
  'python-dsa': {
    nodeId: 'python-dsa',
    mentalModel: 'Python is the notation for your reasoning. Choose the simplest built-in structure whose operations match the invariant.',
    sections: [
      { title: 'Lists and strings', explanation: 'Use lists for indexed mutable sequences and strings for immutable text. Appending to a list is amortized O(1); inserting at the front is O(n). Slicing copies data.', code: `values = [4, 1, 7]\nvalues.append(3)       # amortized O(1)\nlast = values.pop()     # O(1)\ntext = "window"\ncharacter = text[2]     # O(1)`, checks: ['Can I mutate this sequence?', 'Do I need an index, a value, or a contiguous copy?', 'Am I accidentally copying inside a loop?'] },
      { title: 'Dictionaries and sets', explanation: 'Use a set for existence and a dictionary for value-to-information relationships. Average lookup, insertion, and deletion are O(1).', code: `seen: set[int] = set()\nposition: dict[int, int] = {}\nfor index, value in enumerate(values):\n    seen.add(value)\n    position[value] = index`, checks: ['Do I need existence, count, index, or grouped values?', 'What is the dictionary key invariant?', 'Should I query before updating?'] },
      { title: 'Counter and defaultdict', explanation: 'Counter expresses frequencies; defaultdict expresses a safe default for grouped or accumulated data. Prefer explicit structures over repeated key checks.', code: `from collections import Counter, defaultdict\nfrequency = Counter("anagram")\ngraph: dict[int, list[int]] = defaultdict(list)\nfor source, target in edges:\n    graph[source].append(target)`, checks: ['Would a count or grouped collection remove repeated scans?', 'Does reading a missing key have a meaningful default?'] },
      { title: 'Stacks and queues', explanation: 'A Python list is an efficient stack. Use deque for a queue; list.pop(0) is O(n) because every remaining element shifts.', code: `from collections import deque\nstack: list[int] = []\nstack.append(4)\nlatest = stack.pop()\nqueue = deque([start])\noldest = queue.popleft()`, checks: ['Must the newest or oldest unresolved item leave first?', 'When is a state marked visited?'] },
      { title: 'Sorting, heapq, and bisect', explanation: 'Sorting is O(n log n) and accepts a key. heapq maintains a changing minimum frontier. bisect searches an already sorted list.', code: `import bisect, heapq\nintervals.sort(key=lambda item: item[1])\nheapq.heappush(heap, value)\nsmallest = heapq.heappop(heap)\nposition = bisect.bisect_left(sorted_values, target)`, checks: ['Do I need full order or only the next best candidate?', 'Which field should determine sorting?', 'Will insertion into a sorted list still cost O(n)?'] },
      { title: 'Readable interview Python', explanation: 'Use enumerate, zip, tuple unpacking, and descriptive names when they clarify state. Avoid compressed tricks that make the invariant harder to explain.', code: `for index, value in enumerate(values):\n    pass\nfor left_value, right_value in zip(left, right):\n    pass\nstart, end = interval`, checks: ['Can I explain every variable role?', 'Is a standard-library tool hiding essential reasoning?', 'Can I test this code manually without decoding it first?'] },
    ],
    exercises: ['Implement a stack and queue with the correct Python structures.', 'Count characters in a string and group words by first character.', 'Sort intervals by start and then by end; explain how the objective changes the key.', 'State the average complexity of list append, set lookup, dict lookup, deque popleft, sorting, and heap push.'],
  },
  complexity: {
    nodeId: 'complexity',
    mentalModel: 'Constraints are instructions. They tell you how much repeated work the judge can tolerate.',
    sections: [
      { title: 'Translate constraints', explanation: 'As a rough interview guide: n around 20 may permit exponential search; n around 1,000 often permits O(n squared); n around 100,000 usually requires O(n log n) or O(n). Constants and language still matter.', checks: ['What is n?', 'How many operations does my loop structure imply?', 'Does the problem contain multiple independent dimensions?'] },
      { title: 'Count total movement, not syntax', explanation: 'A nested while loop can still be O(n) if each element enters and leaves once. Conversely, slicing inside one loop may create hidden O(n squared) copying.', code: `left = 0\nfor right in range(len(values)):\n    while invalid(left, right):\n        left += 1\n# Both pointers move forward at most n times.`, checks: ['How many times can one item be processed?', 'Does any operation copy, sort, or scan hidden data?'] },
      { title: 'Space is part of the design', explanation: 'Separate output space from auxiliary space. Recursion uses stack depth. A hash map may be the correct trade when it turns O(n squared) time into O(n).', checks: ['What grows with input size?', 'Is recursion depth safe?', 'Can state be compressed without obscuring correctness?'] },
    ],
    exercises: ['Analyze a double loop where the inner pointer never moves backward.', 'Compare sorting plus scanning with a hash-map solution.', 'Identify hidden copying in string concatenation or slicing loops.'],
  },
  recursion: {
    nodeId: 'recursion',
    mentalModel: 'Do not think about the entire call tree at once. Define what one function call promises, trust smaller calls, and combine their answers.',
    sections: [
      { title: 'The four-part contract', explanation: 'Every recursive solution needs a state, a base case, guaranteed progress toward that base case, and a return value with one precise meaning.', code: `def depth(node):\n    if node is None:          # base case\n        return 0\n    left = depth(node.left)   # smaller state\n    right = depth(node.right)\n    return 1 + max(left, right)`, checks: ['What does depth(node) mean in one sentence?', 'Why must recursion terminate?', 'What does the parent need returned?'] },
      { title: 'Return value versus shared answer', explanation: 'Some facts travel upward through return values; others compare multiple paths and update a nonlocal result at each node. Keep those roles separate.', checks: ['Is this value useful to the parent?', 'Is the final answer allowed to pass through the parent edge?'] },
      { title: 'Backtracking mutation', explanation: 'Backtracking uses recursion plus reversible state. Choose, recurse, and undo in the same frame. Save a copy when recording a mutable path.', code: `path.append(choice)\nsearch(next_state)\npath.pop()`, checks: ['Did every mutation get undone?', 'Did I save path.copy() rather than the live list?', 'Can this branch be pruned safely?'] },
    ],
    exercises: ['Trace maximum tree depth by hand.', 'Write recursive factorial and identify all four contract parts.', 'Generate all subsets and explain why path.pop() is required.'],
  },
  'medium-bridge': {
    nodeId: 'medium-bridge',
    mentalModel: 'A Medium is usually a familiar primitive plus one new invariant, constraint, or composition. Reduce novelty before increasing difficulty.',
    sections: [
      { title: 'The bridge sequence', explanation: 'Move through Easy concept, Easy implementation, variation, scaffolded Medium, blind Medium, then unseen Medium. Do not skip directly from solution videos to random Mediums.', checks: ['Can I recognize the base pattern?', 'Can I implement the Easy without notes?', 'What exactly changed in this variation?'] },
      { title: 'The 20-minute stuck protocol', explanation: 'Restate input/output, construct a tiny example, write brute force, identify repeated work, inspect constraints, and state one candidate invariant. Only then reveal Hint 0 or Hint 1.', checks: ['Did I write anything testable?', 'Am I stuck on recognition, derivation, or syntax?', 'What is the weakest hint that unblocks one next step?'] },
      { title: 'After seeing help', explanation: 'Close the explanation. Re-derive the approach in your own words, implement from blank, explain complexity, then schedule a blind re-solve. Otherwise recognition is easily mistaken for learning.', checks: ['Can I reproduce it without the tab open?', 'Can I explain why each pointer or state update is safe?', 'When will this return for recall?'] },
    ],
    exercises: ['Complete one full Medium ladder without skipping a stage.', 'Classify three failed Medium attempts by root cause.', 'Blind re-solve an assisted Medium after three days.'],
  },
  'interview-simulation': {
    nodeId: 'interview-simulation',
    mentalModel: 'An interview evaluates the observable reasoning process, not only whether final code eventually passes.',
    sections: [
      { title: 'First five minutes', explanation: 'Clarify inputs, outputs, constraints, mutability, duplicates, and edge cases. Walk a small example before naming an algorithm.', checks: ['Did I confirm assumptions?', 'Can I restate the problem without copying its words?', 'Did I expose ambiguity early?'] },
      { title: 'Derive and communicate', explanation: 'State brute force and its bottleneck. Propose an optimization, define its invariant or state, and verify it on the example before coding.', checks: ['Why is this move safe?', 'What alternative did I reject?', 'Does complexity fit the constraints?'] },
      { title: 'Code and verify', explanation: 'Use readable names, narrate major transitions, dry-run one normal and one edge case, then state time and auxiliary space clearly.', checks: ['Did I test empty/single/duplicate boundaries?', 'Can the interviewer follow my state updates?', 'Did I repair mistakes calmly?'] },
    ],
    exercises: ['Record a 35-minute one-problem mock.', 'Review the weakest rubric dimension and repeat a focused drill.', 'Practice one behavioral story using Situation, Task, Action, Result, and reflection.'],
  },
}