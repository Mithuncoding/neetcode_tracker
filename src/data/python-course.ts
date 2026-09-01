export interface PythonLessonQuiz {
  prompt: string
  options: string[]
  answer: number
  explanation: string
}

export interface PythonLesson {
  id: string
  title: string
  summary: string
  why: string
  concepts: string[]
  example: string
  challenge: string
  starterCode: string
  tests: string
  solution: string
  quiz: PythonLessonQuiz
  labSceneId?: string
}

export interface PythonModule {
  id: string
  title: string
  description: string
  outcome: string
  lessons: PythonLesson[]
}

const quiz = (prompt: string, options: string[], answer: number, explanation: string): PythonLessonQuiz => ({ prompt, options, answer, explanation })

export const PYTHON_MODULES: PythonModule[] = [
  {
    id: 'first-steps',
    title: 'Start Here',
    description: 'Understand how Python executes code and learn names, values, output, and errors.',
    outcome: 'Write and explain small Python programs without treating syntax as magic.',
    lessons: [
      {
        id: 'hello-world', title: 'Hello, Python', summary: 'Run your first statement and understand source code, execution, and output.', why: 'Every later algorithm is still a sequence of statements executed in order.', concepts: ['print()', 'string literal', 'statement order', 'stdout'],
        example: `print("Hello, Mithun!")\nprint("I am learning how code executes.")`,
        challenge: 'Store exactly "Hello, LeetCode!" in message, then print it.', starterCode: `message = ""\nprint(message)`, tests: `assert message == "Hello, LeetCode!"`, solution: `message = "Hello, LeetCode!"\nprint(message)`, labSceneId: 'python-execution',
        quiz: quiz('What does print() do?', ['Stores a value permanently', 'Writes a value to program output', 'Converts every value to an integer'], 1, 'print sends a readable representation to standard output; it does not store the value.'),
      },
      {
        id: 'comments-errors', title: 'Comments and Errors', summary: 'Distinguish syntax errors, runtime errors, and comments.', why: 'Reading errors calmly is a core interview and debugging skill.', concepts: ['# comment', 'SyntaxError', 'NameError', 'traceback'],
        example: `# Python ignores this explanation.\nvalue = 7\nprint(value)`, challenge: 'Fix the program so result is 12 without deleting the explanatory comment.', starterCode: `# Add five and seven.\nresult = 5 +\nprint(result)`, tests: `assert result == 12`, solution: `# Add five and seven.\nresult = 5 + 7\nprint(result)`, labSceneId: 'python-execution',
        quiz: quiz('When is a SyntaxError raised?', ['Before invalid Python can execute', 'Only after a wrong answer', 'When a set contains duplicates'], 0, 'Python must parse valid syntax before it can run any statement.'),
      },
      {
        id: 'variables-references', title: 'Variables Are Names', summary: 'See assignment as binding a name to an object, not placing data inside a box.', why: 'Reference semantics explain aliasing bugs in lists, graphs, and linked structures.', concepts: ['assignment', 'name binding', 'reassignment', 'multiple assignment'],
        example: `score = 10\nprevious = score\nscore = 14\nprint(previous, score)`, challenge: 'Swap left and right using one Python assignment.', starterCode: `left = 3\nright = 9\n# Swap here.`, tests: `assert left == 9\nassert right == 3`, solution: `left = 3\nright = 9\nleft, right = right, left`, labSceneId: 'python-references',
        quiz: quiz('After b = a for a mutable list, what is true?', ['a and b initially reference the same list', 'b is always a deep copy', 'a is deleted'], 0, 'Plain assignment binds another name to the same mutable object.'),
      },
      {
        id: 'basic-output', title: 'Readable Output', summary: 'Combine values using f-strings and inspect type and value.', why: 'Clear output helps you trace algorithms and explain state transitions.', concepts: ['f-string', 'type()', 'repr()', 'debug output'],
        example: `name = "Mithun"\nsolved = 3\nprint(f"{name} solved {solved} problems")`, challenge: 'Create summary with the exact text "Mithun solved 5 problems".', starterCode: `name = "Mithun"\nproblems = 5\nsummary = ""\nprint(summary)`, tests: `assert summary == "Mithun solved 5 problems"`, solution: `name = "Mithun"\nproblems = 5\nsummary = f"{name} solved {problems} problems"\nprint(summary)`,
        quiz: quiz('Which prefix creates an f-string?', ['r', 'f', 'b'], 1, 'Prefix a string literal with f to evaluate expressions inside braces.'),
      },
    ],
  },
  {
    id: 'types-operators', title: 'Types and Operators', description: 'Learn numeric, boolean, None, comparison, membership, and conversion behavior.', outcome: 'Predict expression results and choose types deliberately.', lessons: [
      {
        id: 'numbers-arithmetic', title: 'Numbers and Arithmetic', summary: 'Use integers, floats, division, floor division, modulo, and powers.', why: 'Modulo, integer division, and bounds appear constantly in array and digit problems.', concepts: ['int', 'float', '/', '//', '%', '**'], example: `value = 17\nprint(value // 5)  # 3\nprint(value % 5)   # 2`, challenge: 'Set quotient and remainder for 29 divided by 6.', starterCode: `value = 29\ndivisor = 6\nquotient = 0\nremainder = 0`, tests: `assert quotient == 4\nassert remainder == 5`, solution: `value = 29\ndivisor = 6\nquotient = value // divisor\nremainder = value % divisor`,
        quiz: quiz('What is 17 // 5?', ['3', '3.4', '2'], 0, '// performs floor division.'),
      },
      {
        id: 'booleans-comparisons', title: 'Booleans and Comparisons', summary: 'Build conditions from comparison and logical operators.', why: 'Every branch, loop condition, and invariant depends on a correct boolean expression.', concepts: ['bool', '==', '!=', '<=', 'and', 'or', 'not'], example: `age = 20\nhas_id = True\ncan_enter = age >= 18 and has_id`, challenge: 'Set is_valid true only when value is between 10 and 20 inclusive and is even.', starterCode: `value = 14\nis_valid = False`, tests: `assert is_valid is True`, solution: `value = 14\nis_valid = 10 <= value <= 20 and value % 2 == 0`,
        quiz: quiz('Which expression checks an inclusive range?', ['10 < x < 20', '10 <= x <= 20', 'x in 10..20'], 1, 'Python supports chained comparisons with inclusive <= boundaries.'),
      },
      {
        id: 'conversion-none', title: 'Conversion and None', summary: 'Convert types explicitly and use None for absence.', why: 'LeetCode inputs have known types, but helper functions often need a safe “not found” result.', concepts: ['int()', 'str()', 'float()', 'None', 'is None'], example: `text = "42"\nvalue = int(text)\nmissing = None\nprint(value, missing is None)`, challenge: 'Convert raw to an integer and set fallback to None.', starterCode: `raw = "105"\nnumber = 0\nfallback = "missing"`, tests: `assert number == 105\nassert fallback is None`, solution: `raw = "105"\nnumber = int(raw)\nfallback = None`,
        quiz: quiz('How should you compare a value with None?', ['value == 0', 'value is None', 'None(value)'], 1, 'None is a singleton and is conventionally checked with is None.'),
      },
      {
        id: 'membership-identity', title: 'Membership and Identity', summary: 'Separate equality, identity, and membership.', why: 'Fast `in` checks are central to sets and dictionaries; confusing `is` with `==` causes subtle bugs.', concepts: ['in', 'not in', 'is', '=='], example: `seen = {2, 4, 6}\nprint(4 in seen)\nprint(5 not in seen)`, challenge: 'Set contains_target using membership in values.', starterCode: `values = {3, 7, 11}\ntarget = 7\ncontains_target = False`, tests: `assert contains_target is True`, solution: `values = {3, 7, 11}\ntarget = 7\ncontains_target = target in values`,
        quiz: quiz('What does `x in a_set` test?', ['Object identity', 'Membership', 'Sorting order'], 1, 'The in operator asks whether an equal key/value is present.'),
      },
    ] },
  {
    id: 'strings', title: 'String Mastery', description: 'Index, slice, normalize, split, join, format, and convert characters.', outcome: 'Handle interview string problems without syntax friction.', lessons: [
      {
        id: 'string-index-slice', title: 'Indexing and Slicing', summary: 'Read characters and substrings using positive and negative boundaries.', why: 'Two-pointer and substring problems rely on exact indices and half-open ranges.', concepts: ['text[index]', 'text[start:end]', 'negative index', 'immutability'], example: `text = "python"\nprint(text[0], text[-1])\nprint(text[1:4])`, challenge: 'Set middle to "yth" and reversed_text to "nohtyp".', starterCode: `text = "python"\nmiddle = ""\nreversed_text = ""`, tests: `assert middle == "yth"\nassert reversed_text == "nohtyp"`, solution: `text = "python"\nmiddle = text[1:4]\nreversed_text = text[::-1]`, labSceneId: 'python-sequences',
        quiz: quiz('Is the end index included in text[start:end]?', ['Yes', 'No', 'Only for strings'], 1, 'Python slices are half-open: start is included and end is excluded.'),
      },
      {
        id: 'string-methods', title: 'Normalize, Split, and Join', summary: 'Use common string methods without hiding the algorithm.', why: 'Tokenization and normalization are useful preprocessing steps for many string problems.', concepts: ['lower()', 'strip()', 'split()', 'join()', 'isalnum()'], example: `words = "  Learn Python Well  ".strip().lower().split()\nslug = "-".join(words)`, challenge: 'Normalize raw into the exact slug "dsa-patterns-python".', starterCode: `raw = "  DSA Patterns Python  "\nslug = ""`, tests: `assert slug == "dsa-patterns-python"`, solution: `raw = "  DSA Patterns Python  "\nslug = "-".join(raw.strip().lower().split())`,
        quiz: quiz('What does separator.join(words) return?', ['A new combined string', 'The original list', 'A generator'], 0, 'join creates a new string with the separator between items.'),
      },
      {
        id: 'string-formatting', title: 'Formatting and Parsing', summary: 'Build readable strings and parse structured text.', why: 'Interview debugging becomes easier when state is printed clearly and predictably.', concepts: ['f-string expressions', 'format specifier', 'split once', 'unpacking'], example: `left, right = "12:35".split(":")\nminutes = int(left) * 60 + int(right)`, challenge: 'Parse coordinate into integer x and y.', starterCode: `coordinate = "14,-3"\nx = 0\ny = 0`, tests: `assert x == 14\nassert y == -3`, solution: `coordinate = "14,-3"\nx_text, y_text = coordinate.split(",")\nx = int(x_text)\ny = int(y_text)`,
        quiz: quiz('What does tuple unpacking require?', ['Matching the number of values and names', 'Only integer values', 'A class definition'], 0, 'Unpacking assigns each produced item to a corresponding target name.'),
      },
      {
        id: 'ord-chr', title: 'Characters with ord and chr', summary: 'Move between characters and Unicode code points.', why: '`ord` and `chr` simplify alphabet indexing, Caesar shifts, frequency arrays, and trie encodings.', concepts: ['ord()', 'chr()', 'ASCII/Unicode', 'alphabet offset'], example: `index = ord("c") - ord("a")\nletter = chr(ord("a") + 5)`, challenge: 'Implement shift_letter for lowercase English letters with wraparound.', starterCode: `def shift_letter(letter: str, amount: int) -> str:\n    return ""`, tests: `assert shift_letter("a", 2) == "c"\nassert shift_letter("z", 1) == "a"`, solution: `def shift_letter(letter: str, amount: int) -> str:\n    index = ord(letter) - ord("a")\n    return chr(ord("a") + (index + amount) % 26)`, labSceneId: 'python-characters',
        quiz: quiz('What does ord("a") return?', ['The character a', 'An integer code point', 'A one-item list'], 1, 'ord converts one character to its integer Unicode code point.'),
      },
    ] },
  {
    id: 'control-flow', title: 'Control Flow', description: 'Make decisions and repeat work with precise loop invariants.', outcome: 'Trace branches and loops without guessing.', lessons: [
      {
        id: 'if-elif-else', title: 'if / elif / else', summary: 'Choose exactly one branch from ordered conditions.', why: 'Boundary conditions and case analysis are at the center of algorithm correctness.', concepts: ['if', 'elif', 'else', 'indentation'], example: `if value < 0:\n    label = "negative"\nelif value == 0:\n    label = "zero"\nelse:\n    label = "positive"`, challenge: 'Set label for value using negative, zero, or positive.', starterCode: `value = -4\nlabel = "unknown"`, tests: `assert label == "negative"`, solution: `value = -4\nif value < 0:\n    label = "negative"\nelif value == 0:\n    label = "zero"\nelse:\n    label = "positive"`, labSceneId: 'python-control-flow',
        quiz: quiz('What controls a Python block?', ['Braces only', 'Indentation after a colon', 'Semicolons'], 1, 'A colon starts the block and consistent indentation defines its statements.'),
      },
      {
        id: 'for-range', title: 'for and range', summary: 'Iterate over values or a controlled integer sequence.', why: 'Most O(n) array algorithms are one deliberate scan.', concepts: ['for', 'range()', 'accumulator', 'iteration variable'], example: `total = 0\nfor value in [2, 4, 6]:\n    total += value`, challenge: 'Compute the sum of even numbers from 1 through 10 inclusive.', starterCode: `total = 0\n# Write the loop.`, tests: `assert total == 30`, solution: `total = 0\nfor value in range(1, 11):\n    if value % 2 == 0:\n        total += value`, labSceneId: 'python-control-flow',
        quiz: quiz('What values does range(1, 5) produce?', ['1, 2, 3, 4', '1, 2, 3, 4, 5', '0, 1, 2, 3, 4'], 0, 'range excludes its stop boundary.'),
      },
      {
        id: 'while-loop', title: 'while Loops', summary: 'Repeat until a state condition becomes false.', why: 'Pointers, binary search, digit processing, and heap repair often have state-driven iteration counts.', concepts: ['while', 'progress', 'termination', 'digit extraction'], example: `digits = 0\nvalue = 1205\nwhile value:\n    digits += 1\n    value //= 10`, challenge: 'Compute the sum of digits in 5072.', starterCode: `value = 5072\ndigit_sum = 0`, tests: `assert digit_sum == 14`, solution: `value = 5072\ndigit_sum = 0\nwhile value:\n    digit_sum += value % 10\n    value //= 10`, labSceneId: 'python-control-flow',
        quiz: quiz('What must every while loop establish?', ['Progress toward termination', 'A sorted list', 'A class instance'], 0, 'Without progress toward a false condition, the loop can run forever.'),
      },
      {
        id: 'break-continue', title: 'break and continue', summary: 'Stop a loop early or skip one iteration intentionally.', why: 'Early exits improve clarity and sometimes runtime, but careless skipping can violate invariants.', concepts: ['break', 'continue', 'early return', 'loop else'], example: `for value in values:\n    if value < 0:\n        continue\n    if value == target:\n        break`, challenge: 'Find the first positive number divisible by 7.', starterCode: `values = [-7, 5, 14, 21]\nanswer = None`, tests: `assert answer == 14`, solution: `values = [-7, 5, 14, 21]\nanswer = None\nfor value in values:\n    if value <= 0:\n        continue\n    if value % 7 == 0:\n        answer = value\n        break`,
        quiz: quiz('What does continue do?', ['Ends the function', 'Skips to the next loop iteration', 'Repeats the current statement'], 1, 'continue skips the rest of the current loop body.'),
      },
    ] },
  {
    id: 'functions', title: 'Functions', description: 'Design reusable contracts with parameters, return values, scope, and callable tools.', outcome: 'Write small functions whose purpose and state are easy to test.', lessons: [
      {
        id: 'def-return', title: 'Define and Return', summary: 'Turn a computation into a named input/output contract.', why: 'LeetCode solutions and recursive reasoning both depend on clear function contracts.', concepts: ['def', 'parameter', 'return', 'call'], example: `def square(value: int) -> int:\n    return value * value\n\nresult = square(6)`, challenge: 'Implement add so it returns the sum of two integers.', starterCode: `def add(left: int, right: int) -> int:\n    pass`, tests: `assert add(2, 3) == 5\nassert add(-4, 1) == -3`, solution: `def add(left: int, right: int) -> int:\n    return left + right`, labSceneId: 'python-functions',
        quiz: quiz('What happens when execution reaches return?', ['The function ends and sends a value back', 'A loop always begins', 'All variables become global'], 0, 'return immediately ends that function call and provides its result.'),
      },
      {
        id: 'parameters-defaults', title: 'Parameters and Defaults', summary: 'Use positional, keyword, and safe default arguments.', why: 'Helper APIs become easier to read when optional behavior is explicit.', concepts: ['positional argument', 'keyword argument', 'default parameter', 'mutable default trap'], example: `def power(value: int, exponent: int = 2) -> int:\n    return value ** exponent`, challenge: 'Implement clamp with default lower 0 and upper 100.', starterCode: `def clamp(value: int, lower: int = 0, upper: int = 100) -> int:\n    pass`, tests: `assert clamp(120) == 100\nassert clamp(-2) == 0\nassert clamp(5, 3, 4) == 4`, solution: `def clamp(value: int, lower: int = 0, upper: int = 100) -> int:\n    return max(lower, min(value, upper))`,
        quiz: quiz('Why avoid a list as a default parameter?', ['The same mutable list is reused across calls', 'Lists cannot be parameters', 'It makes code asynchronous'], 0, 'Default objects are created once when the function is defined.'),
      },
      {
        id: 'scope-pure-functions', title: 'Scope and Pure Functions', summary: 'Separate local state from outer state and avoid surprising mutation.', why: 'Local, explicit state is easier to reason about, test, and explain in interviews.', concepts: ['local scope', 'global', 'nonlocal', 'pure function'], example: `offset = 3\ndef shifted(value: int) -> int:\n    result = value + offset\n    return result`, challenge: 'Implement incremented without mutating the input list.', starterCode: `def incremented(values: list[int]) -> list[int]:\n    pass`, tests: `original = [1, 2, 3]\nassert incremented(original) == [2, 3, 4]\nassert original == [1, 2, 3]`, solution: `def incremented(values: list[int]) -> list[int]:\n    return [value + 1 for value in values]`, labSceneId: 'python-references',
        quiz: quiz('What makes a function easier to test?', ['Hidden global mutation', 'Explicit inputs and returned outputs', 'Random print statements'], 1, 'Explicit contracts minimize hidden dependencies.'),
      },
      {
        id: 'lambda-callables', title: 'lambda and Callable Keys', summary: 'Use small callables where a named function would add noise.', why: 'Sorting and grouping frequently need a key transformation.', concepts: ['lambda', 'callable', 'key=', 'first-class function'], example: `pairs = [("b", 2), ("a", 3), ("c", 1)]\nordered = sorted(pairs, key=lambda pair: pair[1])`, challenge: 'Sort records by descending score, then ascending name.', starterCode: `records = [("Mia", 8), ("Ari", 8), ("Zoe", 5)]\nordered = []`, tests: `assert ordered == [("Ari", 8), ("Mia", 8), ("Zoe", 5)]`, solution: `records = [("Mia", 8), ("Ari", 8), ("Zoe", 5)]\nordered = sorted(records, key=lambda item: (-item[1], item[0]))`, labSceneId: 'python-iteration-pipeline',
        quiz: quiz('What should a sorting key return?', ['The transformed comparison key', 'Always True', 'A print statement'], 0, 'Each item is ordered by the value returned from the key callable.'),
      },
    ] },
  {
    id: 'collections', title: 'Core Collections', description: 'Master lists, tuples, dictionaries, sets, copying, and comprehensions.', outcome: 'Choose data structures from required operations instead of habit.', lessons: [
      {
        id: 'lists-mutability', title: 'Lists and Mutation', summary: 'Append, pop, index, slice, and copy mutable sequences.', why: 'Arrays are the foundation of most interview problems, and aliasing determines correctness.', concepts: ['append', 'pop', 'slice', 'copy', 'alias'], example: `values = [1, 2]\nvalues.append(3)\nlast = values.pop()\nclone = values.copy()`, challenge: 'Rotate [1,2,3,4] left by one without changing original.', starterCode: `original = [1, 2, 3, 4]\nrotated = []`, tests: `assert rotated == [2, 3, 4, 1]\nassert original == [1, 2, 3, 4]`, solution: `original = [1, 2, 3, 4]\nrotated = original[1:] + original[:1]`, labSceneId: 'python-sequences',
        quiz: quiz('What is the cost of list.pop(0)?', ['O(1)', 'O(log n)', 'O(n) because remaining items shift'], 2, 'Removing the first list item shifts every later element.'),
      },
      {
        id: 'tuples-unpacking', title: 'Tuples and Unpacking', summary: 'Represent fixed records and assign multiple values safely.', why: 'Coordinates, heap entries, edges, and state tuples appear throughout DSA.', concepts: ['tuple', 'unpacking', 'swap', 'immutable record'], example: `point = (4, -2)\nx, y = point\nleft, right = right, left`, challenge: 'Unpack edge and create reversed_edge.', starterCode: `edge = (3, 9)\nsource = 0\ntarget = 0\nreversed_edge = ()`, tests: `assert source == 3\nassert target == 9\nassert reversed_edge == (9, 3)`, solution: `edge = (3, 9)\nsource, target = edge\nreversed_edge = (target, source)`,
        quiz: quiz('Can a tuple element be reassigned?', ['Yes, always', 'No, tuples are immutable', 'Only in a loop'], 1, 'The tuple structure cannot be mutated after creation.'),
      },
      {
        id: 'dictionary-basics', title: 'Dictionaries', summary: 'Map unique hashable keys to associated values.', why: 'Dictionaries remove repeated lookup work in frequency, complement, memo, and graph problems.', concepts: ['dict', 'key/value', 'get()', 'items()', 'hashable key'], example: `frequency: dict[str, int] = {}\nfor character in "data":\n    frequency[character] = frequency.get(character, 0) + 1`, challenge: 'Build exact word frequencies.', starterCode: `words = ["tree", "graph", "tree", "dp"]\nfrequency = {}`, tests: `assert frequency == {"tree": 2, "graph": 1, "dp": 1}`, solution: `words = ["tree", "graph", "tree", "dp"]\nfrequency = {}\nfor word in words:\n    frequency[word] = frequency.get(word, 0) + 1`, labSceneId: 'hash-map-buckets',
        quiz: quiz('What does mapping.get(key, 0) provide?', ['A safe default when key is absent', 'A sorted dictionary', 'The key index'], 0, 'get returns the mapped value or the supplied default.'),
      },
      {
        id: 'sets', title: 'Sets', summary: 'Store unique values for fast membership and set algebra.', why: 'Duplicate detection and visited-state tracking should not use repeated list scans.', concepts: ['set', 'add', 'remove/discard', 'intersection', 'difference'], example: `left = {1, 2, 3}\nright = {2, 3, 4}\ncommon = left & right`, challenge: 'Create sorted unique_common from both lists.', starterCode: `left = [1, 2, 2, 4]\nright = [2, 3, 4, 4]\nunique_common = []`, tests: `assert unique_common == [2, 4]`, solution: `left = [1, 2, 2, 4]\nright = [2, 3, 4, 4]\nunique_common = sorted(set(left) & set(right))`, labSceneId: 'python-collections',
        quiz: quiz('Why is a set useful for visited nodes?', ['Average O(1) membership', 'It preserves duplicates', 'It sorts graph edges'], 0, 'A set avoids revisiting known states with average constant-time membership.'),
      },
    ] },
  {
    id: 'pythonic-iteration', title: 'Pythonic Iteration', description: 'Use comprehensions, enumerate, zip, map, filter, sorted, iterators, and generators deliberately.', outcome: 'Write concise iteration without hiding the algorithm.', lessons: [
      {
        id: 'comprehensions', title: 'Comprehensions', summary: 'Build lists, sets, and dictionaries from readable transformations.', why: 'Comprehensions are excellent for simple one-pass transformations but poor for complex state machines.', concepts: ['list comprehension', 'set comprehension', 'dict comprehension', 'condition'], example: `squares = [value * value for value in range(6)]\neven = {value for value in range(10) if value % 2 == 0}`, challenge: 'Create a dictionary mapping even numbers 0..8 to their squares.', starterCode: `even_squares = {}`, tests: `assert even_squares == {0: 0, 2: 4, 4: 16, 6: 36, 8: 64}`, solution: `even_squares = {value: value * value for value in range(9) if value % 2 == 0}`,
        quiz: quiz('When should you avoid a comprehension?', ['When transformation is simple', 'When complex side effects and state obscure meaning', 'When creating a list'], 1, 'Use an explicit loop when the state transition needs explanation.'),
      },
      {
        id: 'enumerate-zip', title: 'enumerate and zip', summary: 'Pair values with indices or parallel values without manual counters.', why: 'These tools reduce indexing mistakes in array and string code.', concepts: ['enumerate', 'zip', 'parallel iteration', 'tuple unpacking'], example: `for index, value in enumerate(values):\n    print(index, value)\nfor left, right in zip(a, b):\n    print(left, right)`, challenge: 'Build indexed_pairs by pairing each word with its index.', starterCode: `words = ["hash", "tree", "graph"]\nindexed_pairs = []`, tests: `assert indexed_pairs == [(0, "hash"), (1, "tree"), (2, "graph")]`, solution: `words = ["hash", "tree", "graph"]\nindexed_pairs = list(enumerate(words))`, labSceneId: 'python-iteration-pipeline',
        quiz: quiz('What happens when zip inputs have different lengths?', ['It stops at the shortest input', 'It pads with None automatically', 'It raises SyntaxError'], 0, 'Built-in zip stops when the shortest iterable is exhausted.'),
      },
      {
        id: 'map-filter', title: 'map and filter', summary: 'Apply transformations lazily and retain values by a predicate.', why: '`map` is useful to recognize, though comprehensions are often clearer in interviews.', concepts: ['map()', 'filter()', 'lazy iterator', 'callable'], example: `numbers = list(map(int, ["2", "4", "8"]))\neven = list(filter(lambda value: value % 2 == 0, numbers))`, challenge: 'Normalize words with map, then keep words of length at least four.', starterCode: `words = ["  DP", " Graph ", "BFS", " Tree "]\nnormalized = []\nlong_words = []`, tests: `assert normalized == ["dp", "graph", "bfs", "tree"]\nassert long_words == ["graph", "tree"]`, solution: `words = ["  DP", " Graph ", "BFS", " Tree "]\nnormalized = list(map(lambda word: word.strip().lower(), words))\nlong_words = list(filter(lambda word: len(word) >= 4, normalized))`, labSceneId: 'python-iteration-pipeline',
        quiz: quiz('What does map return in Python 3?', ['A lazy iterator', 'Always a list', 'A dictionary'], 0, 'Wrap map in list only when you actually need all results materialized.'),
      },
      {
        id: 'sorted-key', title: 'sorted, min, and max with key', summary: 'Order or select objects by a derived comparison key.', why: 'Intervals, heaps, greedy problems, and grouped records depend on correct keys.', concepts: ['sorted()', 'list.sort()', 'key=', 'reverse=', 'min/max key'], example: `words = ["aaa", "b", "cc"]\nordered = sorted(words, key=len)\nlongest = max(words, key=len)`, challenge: 'Sort intervals by end ascending, then start ascending.', starterCode: `intervals = [(3, 5), (1, 5), (2, 4)]\nordered = []`, tests: `assert ordered == [(2, 4), (1, 5), (3, 5)]`, solution: `intervals = [(3, 5), (1, 5), (2, 4)]\nordered = sorted(intervals, key=lambda interval: (interval[1], interval[0]))`, labSceneId: 'timsort',
        quiz: quiz('Does sorted mutate its input?', ['Yes', 'No, it returns a new list', 'Only for tuples'], 1, 'sorted returns a new list; list.sort mutates the list and returns None.'),
      },
    ] },
  {
    id: 'oop', title: 'Classes and Objects', description: 'Understand objects, self, constructors, methods, properties, inheritance, and dataclasses.', outcome: 'Implement LeetCode design questions and custom nodes confidently.', lessons: [
      {
        id: 'class-object', title: 'Class and Object', summary: 'Define a reusable type and create independent instances.', why: 'Linked-list nodes, trees, tries, caches, and design problems are all object models.', concepts: ['class', 'object', 'attribute', 'instance'], example: `class CounterBox:\n    value = 0\n\nfirst = CounterBox()\nfirst.value = 3`, challenge: 'Define Box and create one instance with value 7.', starterCode: `class Box:\n    pass\n\nbox = Box()`, tests: `assert box.value == 7`, solution: `class Box:\n    pass\n\nbox = Box()\nbox.value = 7`, labSceneId: 'python-class-object',
        quiz: quiz('What is an object?', ['An instance of a class', 'Only a function', 'A syntax error'], 0, 'A class defines behavior/structure; each object is an instance.'),
      },
      {
        id: 'init-self', title: '__init__ and self', summary: 'Initialize per-instance state and access it through self.', why: 'Correct instance ownership prevents every node or cache from sharing accidental state.', concepts: ['__init__', 'self', 'instance attribute', 'constructor call'], example: `class Point:\n    def __init__(self, x: int, y: int):\n        self.x = x\n        self.y = y`, challenge: 'Implement Point so distance_squared returns x² + y².', starterCode: `class Point:\n    def __init__(self, x: int, y: int):\n        pass\n\n    def distance_squared(self) -> int:\n        pass`, tests: `point = Point(3, 4)\nassert point.distance_squared() == 25`, solution: `class Point:\n    def __init__(self, x: int, y: int):\n        self.x = x\n        self.y = y\n\n    def distance_squared(self) -> int:\n        return self.x * self.x + self.y * self.y`, labSceneId: 'python-class-object',
        quiz: quiz('What does self refer to?', ['The current instance receiving the method call', 'The class file', 'A global variable'], 0, 'Python passes the current instance as the first method argument.'),
      },
      {
        id: 'methods-properties', title: 'Methods and Properties', summary: 'Keep behavior near the state it validates or transforms.', why: 'Encapsulation makes design-question invariants easier to preserve.', concepts: ['instance method', '@property', 'encapsulation', 'invariant'], example: `class Rectangle:\n    def __init__(self, width, height):\n        self.width = width\n        self.height = height\n\n    @property\n    def area(self):\n        return self.width * self.height`, challenge: 'Implement StackBox push, pop, and size property.', starterCode: `class StackBox:\n    def __init__(self):\n        self.items = []\n\n    def push(self, value):\n        pass\n\n    def pop(self):\n        pass\n\n    @property\n    def size(self):\n        pass`, tests: `stack = StackBox()\nstack.push(3)\nstack.push(8)\nassert stack.size == 2\nassert stack.pop() == 8`, solution: `class StackBox:\n    def __init__(self):\n        self.items = []\n\n    def push(self, value):\n        self.items.append(value)\n\n    def pop(self):\n        return self.items.pop()\n\n    @property\n    def size(self):\n        return len(self.items)`, labSceneId: 'stack-lifo',
        quiz: quiz('How is a property accessed?', ['Like an attribute without parentheses', 'Only with class.property()', 'With import'], 0, '@property exposes method-computed data through attribute syntax.'),
      },
      {
        id: 'dataclass-inheritance', title: 'Dataclasses and Inheritance', summary: 'Remove node boilerplate and understand shared versus specialized behavior.', why: 'Dataclasses are useful for local models; inheritance is useful to recognize but rarely needed in DSA solutions.', concepts: ['@dataclass', 'inheritance', 'super()', 'representation'], example: `from dataclasses import dataclass\n\n@dataclass\nclass Node:\n    value: int\n    next: "Node | None" = None`, challenge: 'Create a dataclass Edge with source, target, and weight defaulting to 1.', starterCode: `from dataclasses import dataclass\n\n# Define Edge here.`, tests: `edge = Edge("A", "B")\nassert edge.source == "A"\nassert edge.target == "B"\nassert edge.weight == 1`, solution: `from dataclasses import dataclass\n\n@dataclass\nclass Edge:\n    source: str\n    target: str\n    weight: int = 1`, labSceneId: 'python-class-object',
        quiz: quiz('What does @dataclass generate by default?', ['Helpful init and representation methods', 'A graph traversal', 'Only a global variable'], 0, 'Dataclasses generate common data-container methods from annotated fields.'),
      },
    ] },
  {
    id: 'quality', title: 'Errors, Tests, and Types', description: 'Handle failure deliberately and make contracts executable.', outcome: 'Debug and validate code instead of relying on hope.', lessons: [
      {
        id: 'exceptions', title: 'Exceptions', summary: 'Catch expected failures narrowly and preserve unexpected failures.', why: 'Robust helpers distinguish invalid input from algorithm mistakes.', concepts: ['try', 'except', 'raise', 'finally'], example: `try:\n    value = int(raw)\nexcept ValueError:\n    value = None`, challenge: 'Implement safe_int returning None for invalid integer text.', starterCode: `def safe_int(text: str):\n    pass`, tests: `assert safe_int("42") == 42\nassert safe_int("no") is None`, solution: `def safe_int(text: str):\n    try:\n        return int(text)\n    except ValueError:\n        return None`,
        quiz: quiz('Should except catch every exception blindly?', ['Yes', 'No, catch expected exception types', 'Only in loops'], 1, 'Broad catching can hide real bugs such as NameError or TypeError.'),
      },
      {
        id: 'assertions', title: 'Assertions and Examples', summary: 'Turn expected behavior into executable checks.', why: 'Small tests expose edge cases before a judge or interviewer does.', concepts: ['assert', 'test case', 'expected result', 'edge case'], example: `def double(value):\n    return value * 2\n\nassert double(3) == 6\nassert double(0) == 0`, challenge: 'Implement is_palindrome and preserve all assertions.', starterCode: `def is_palindrome(text: str) -> bool:\n    pass\n\nassert is_palindrome("racecar")\nassert is_palindrome("")`, tests: `assert is_palindrome("abc") is False`, solution: `def is_palindrome(text: str) -> bool:\n    return text == text[::-1]\n\nassert is_palindrome("racecar")\nassert is_palindrome("")`,
        quiz: quiz('What happens when assert condition is false?', ['AssertionError is raised', 'The value is sorted', 'Nothing'], 0, 'An assertion makes a violated expectation visible immediately.'),
      },
      {
        id: 'type-hints', title: 'Type Hints', summary: 'Document expected inputs and outputs without changing runtime semantics.', why: 'Types clarify function contracts and catch wrong assumptions before interviews.', concepts: ['annotation', 'list[int]', 'dict[str, int]', 'optional value'], example: `def frequency(values: list[int]) -> dict[int, int]:\n    counts: dict[int, int] = {}\n    return counts`, challenge: 'Add a working typed function first_or_none.', starterCode: `def first_or_none(values: list[int]) -> int | None:\n    pass`, tests: `assert first_or_none([7, 8]) == 7\nassert first_or_none([]) is None`, solution: `def first_or_none(values: list[int]) -> int | None:\n    return values[0] if values else None`,
        quiz: quiz('Do type hints automatically enforce values at runtime?', ['Always', 'No, tools analyze them but normal Python does not enforce them', 'Only lists'], 1, 'Annotations document contracts and support tooling; Python remains dynamically typed.'),
      },
      {
        id: 'manual-tracing', title: 'Manual Tracing', summary: 'Record changing state in a trace instead of guessing.', why: 'Tracing pointers, stacks, queues, and DP values is the fastest way to locate invariant breaks.', concepts: ['trace table', 'state snapshot', 'dry run', 'invariant'], example: `trace = []\ntotal = 0\nfor value in [2, 5, 1]:\n    total += value\n    trace.append((value, total))`, challenge: 'Return a running-sum trace of (value, total) pairs.', starterCode: `def running_trace(values: list[int]):\n    pass`, tests: `assert running_trace([3, -1, 4]) == [(3, 3), (-1, 2), (4, 6)]`, solution: `def running_trace(values: list[int]):\n    trace = []\n    total = 0\n    for value in values:\n        total += value\n        trace.append((value, total))\n    return trace`, labSceneId: 'prefix-sum',
        quiz: quiz('What should a useful trace contain?', ['Only final output', 'The state that changes each step', 'Unrelated print messages'], 1, 'Record the state tied to the invariant at every meaningful transition.'),
      },
    ] },
  {
    id: 'dsa-toolkit', title: 'DSA Standard Library', description: 'Master the Python tools that remove boilerplate in interview solutions.', outcome: 'Reach for Counter, defaultdict, deque, heapq, and bisect with full complexity awareness.', lessons: [
      {
        id: 'counter', title: 'collections.Counter', summary: 'Count hashable items and query common frequencies.', why: 'Counter makes anagram, frequency, and Top-K setup explicit.', concepts: ['Counter', 'most_common', 'subtract', 'multiset'], example: `from collections import Counter\ncounts = Counter("banana")\nprint(counts["a"])`, challenge: 'Return the most frequent word; ties use lexicographically smaller word.', starterCode: `from collections import Counter\n\ndef most_frequent(words: list[str]) -> str:\n    pass`, tests: `assert most_frequent(["b", "a", "b", "a"]) == "a"\nassert most_frequent(["tree", "tree", "graph"]) == "tree"`, solution: `from collections import Counter\n\ndef most_frequent(words: list[str]) -> str:\n    counts = Counter(words)\n    return min(counts, key=lambda word: (-counts[word], word))`, labSceneId: 'hash-map-buckets',
        quiz: quiz('What does Counter return for a missing key?', ['0', 'None', 'KeyError'], 0, 'Counter treats missing counts as zero.'),
      },
      {
        id: 'defaultdict', title: 'collections.defaultdict', summary: 'Create missing values from a factory automatically.', why: 'Graph adjacency lists, grouping, and frequency maps become concise without repeated key checks.', concepts: ['defaultdict', 'default factory', 'grouping', 'adjacency list'], example: `from collections import defaultdict\ngroups = defaultdict(list)\nfor key, value in pairs:\n    groups[key].append(value)`, challenge: 'Group words by their first letter.', starterCode: `from collections import defaultdict\n\ndef group_by_first(words: list[str]):\n    pass`, tests: `result = group_by_first(["apple", "ant", "bat"])\nassert dict(result) == {"a": ["apple", "ant"], "b": ["bat"]}`, solution: `from collections import defaultdict\n\ndef group_by_first(words: list[str]):\n    groups = defaultdict(list)\n    for word in words:\n        groups[word[0]].append(word)\n    return groups`, labSceneId: 'hash-map-buckets',
        quiz: quiz('What does defaultdict(list) create for a missing key?', ['A new empty list', 'The key string', 'None only'], 0, 'The factory list is called to create a fresh list for each missing key.'),
      },
      {
        id: 'deque', title: 'collections.deque', summary: 'Append and remove efficiently at both ends.', why: 'BFS must use O(1) popleft rather than O(n) list.pop(0).', concepts: ['deque', 'append', 'appendleft', 'popleft'], example: `from collections import deque\nqueue = deque([start])\nnode = queue.popleft()`, challenge: 'Process queue operations and return removal order.', starterCode: `from collections import deque\n\ndef process(values: list[int]) -> list[int]:\n    pass`, tests: `assert process([3, 5, 7]) == [3, 5, 7]`, solution: `from collections import deque\n\ndef process(values: list[int]) -> list[int]:\n    queue = deque(values)\n    order = []\n    while queue:\n        order.append(queue.popleft())\n    return order`, labSceneId: 'queue-fifo',
        quiz: quiz('What is deque.popleft average complexity?', ['O(1)', 'O(n)', 'O(n log n)'], 0, 'Deque is designed for efficient operations at both ends.'),
      },
      {
        id: 'heapq', title: 'heapq', summary: 'Maintain a min-heap and bounded Top-K frontier.', why: 'Priority queues power Top-K, merging, scheduling, and Dijkstra.', concepts: ['heapify', 'heappush', 'heappop', 'min-heap', 'negation'], example: `import heapq\nheap = [5, 2, 8]\nheapq.heapify(heap)\nsmallest = heapq.heappop(heap)`, challenge: 'Return the kth largest using a size-k min-heap.', starterCode: `import heapq\n\ndef kth_largest(values: list[int], k: int) -> int:\n    pass`, tests: `assert kth_largest([3, 2, 1, 5, 6, 4], 2) == 5`, solution: `import heapq\n\ndef kth_largest(values: list[int], k: int) -> int:\n    heap = []\n    for value in values:\n        heapq.heappush(heap, value)\n        if len(heap) > k:\n            heapq.heappop(heap)\n    return heap[0]`, labSceneId: 'heap-priority-queue',
        quiz: quiz('What is heap[0] after heapify?', ['The minimum value', 'The maximum value', 'The median'], 0, 'Python heapq implements a min-heap.'),
      },
    ] },
  {
    id: 'power-tools', title: 'Interview Power Tools', description: 'Use bisect, caching, itertools, math, copying, and generators correctly.', outcome: 'Recognize high-value standard-library tools without overusing clever tricks.', lessons: [
      {
        id: 'bisect', title: 'bisect', summary: 'Find insertion and boundary positions in sorted lists.', why: 'Lower/upper-bound operations appear in binary-search and subsequence problems.', concepts: ['bisect_left', 'bisect_right', 'insort', 'sorted precondition'], example: `import bisect\nposition = bisect.bisect_left([1, 3, 3, 8], 3)`, challenge: 'Return first index where target can be inserted without breaking order.', starterCode: `import bisect\n\ndef lower_bound(values: list[int], target: int) -> int:\n    pass`, tests: `assert lower_bound([1, 3, 3, 8], 3) == 1\nassert lower_bound([1, 3, 3, 8], 5) == 3`, solution: `import bisect\n\ndef lower_bound(values: list[int], target: int) -> int:\n    return bisect.bisect_left(values, target)`, labSceneId: 'binary-search',
        quiz: quiz('What precondition does bisect require?', ['The list is sorted by the same ordering', 'The list is a set', 'All values are strings'], 0, 'Bisect’s boundary guarantee depends on sorted input.'),
      },
      {
        id: 'functools-cache', title: 'functools.cache', summary: 'Memoize recursive states with a decorator.', why: 'Caching turns repeated exponential subproblems into one computation per distinct state.', concepts: ['@cache', 'memoization', 'hashable arguments', 'state'], example: `from functools import cache\n\n@cache\ndef fib(n: int) -> int:\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 2)`, challenge: 'Implement cached ways to climb n steps using 1 or 2.', starterCode: `from functools import cache\n\n@cache\ndef ways(n: int) -> int:\n    pass`, tests: `assert ways(1) == 1\nassert ways(5) == 8\nassert ways(20) == 10946`, solution: `from functools import cache\n\n@cache\ndef ways(n: int) -> int:\n    if n <= 2:\n        return n\n    return ways(n - 1) + ways(n - 2)`, labSceneId: 'recursion-call-stack',
        quiz: quiz('What must cached function arguments be?', ['Hashable', 'Always lists', 'Printed first'], 0, 'The cache uses arguments as dictionary-like keys.'),
      },
      {
        id: 'itertools', title: 'itertools', summary: 'Generate combinations, permutations, products, and accumulated states.', why: 'These tools are useful for validation and small search spaces, but should not replace understanding backtracking.', concepts: ['combinations', 'permutations', 'product', 'accumulate'], example: `from itertools import combinations\npairs = list(combinations([1, 2, 3], 2))`, challenge: 'Generate all length-2 ordered arrangements of A, B, C.', starterCode: `from itertools import permutations\n\narrangements = []`, tests: `assert arrangements == [("A", "B"), ("A", "C"), ("B", "A"), ("B", "C"), ("C", "A"), ("C", "B")]`, solution: `from itertools import permutations\n\narrangements = list(permutations(["A", "B", "C"], 2))`, labSceneId: 'backtracking-tree',
        quiz: quiz('How many full permutations of n distinct values exist?', ['n', 'n²', 'n!'], 2, 'Every position multiplies the remaining choices, producing n factorial.'),
      },
      {
        id: 'math-tools', title: 'math Tools', summary: 'Use gcd, lcm, ceil, floor, inf, and integer-safe operations.', why: 'Number theory, bounds, and sentinel values appear throughout interview problems.', concepts: ['math.gcd', 'math.lcm', 'ceil', 'floor', 'inf'], example: `import math\ncommon = math.gcd(18, 24)\npositive_infinity = math.inf`, challenge: 'Return the smallest positive common multiple.', starterCode: `import math\n\ndef least_common(left: int, right: int) -> int:\n    pass`, tests: `assert least_common(6, 8) == 24\nassert least_common(7, 5) == 35`, solution: `import math\n\ndef least_common(left: int, right: int) -> int:\n    return math.lcm(left, right)`,
        quiz: quiz('What is math.inf useful for?', ['An initial best/minimum sentinel', 'Creating a list', 'Hash collisions'], 0, 'Infinity is a clear initial bound when every real candidate should be smaller.'),
      },
    ] },
  {
    id: 'interview-python', title: 'Interview-Ready Python', description: 'Combine references, recursion, generators, complexity, and pattern templates.', outcome: 'Implement standard interview structures without language-level hesitation.', lessons: [
      {
        id: 'copying-mutable-defaults', title: 'Copying and Mutation Traps', summary: 'Understand shallow copies, nested aliases, and mutable defaults.', why: 'Many “algorithm” bugs are actually Python reference bugs.', concepts: ['alias', 'shallow copy', 'deepcopy', 'mutable default'], example: `matrix = [[0] * 3 for _ in range(3)]  # independent rows\nbad = [[0] * 3] * 3                 # aliased rows`, challenge: 'Build a 3×3 zero matrix with independent rows, then set center to 1.', starterCode: `matrix = []\n# Build safely and update the center.`, tests: `assert matrix == [[0, 0, 0], [0, 1, 0], [0, 0, 0]]\nassert len({id(row) for row in matrix}) == 3`, solution: `matrix = [[0] * 3 for _ in range(3)]\nmatrix[1][1] = 1`, labSceneId: 'python-references',
        quiz: quiz('Why is [[0] * 3] * 3 dangerous?', ['All rows reference the same inner list', 'It creates tuples', 'It is too slow'], 0, 'Multiplication repeats references to one inner list rather than constructing independent rows.'),
      },
      {
        id: 'recursion-contract', title: 'Recursion Contracts', summary: 'Define state, base case, progress, and returned meaning.', why: 'Trees, DFS, backtracking, and memoized DP become manageable only with a precise call contract.', concepts: ['base case', 'recursive state', 'progress', 'return contract'], example: `def nested_sum(value):\n    if isinstance(value, int):\n        return value\n    return sum(nested_sum(item) for item in value)`, challenge: 'Recursively sum a nested list of integers.', starterCode: `def nested_sum(value):\n    pass`, tests: `assert nested_sum([1, [2, [3]], 4]) == 10\nassert nested_sum(5) == 5`, solution: `def nested_sum(value):\n    if isinstance(value, int):\n        return value\n    return sum(nested_sum(item) for item in value)`, labSceneId: 'recursion-call-stack',
        quiz: quiz('What should one recursive call promise?', ['One precise result for its state', 'Every global answer at once', 'No return value ever'], 0, 'A clear contract lets the caller trust and combine smaller results.'),
      },
      {
        id: 'generators', title: 'Generators and yield', summary: 'Produce values lazily while preserving suspended function state.', why: 'Generators explain iteration deeply and avoid materializing large sequences.', concepts: ['yield', 'generator', 'lazy evaluation', 'next()'], example: `def countdown(start):\n    while start > 0:\n        yield start\n        start -= 1`, challenge: 'Yield all even numbers from 0 through limit inclusive.', starterCode: `def evens(limit: int):\n    pass`, tests: `assert list(evens(7)) == [0, 2, 4, 6]\nassert list(evens(0)) == [0]`, solution: `def evens(limit: int):\n    for value in range(0, limit + 1, 2):\n        yield value`, labSceneId: 'python-iteration-pipeline',
        quiz: quiz('What does yield do?', ['Returns one value and permanently ends', 'Produces a value and suspends state for the next iteration', 'Sorts the generator'], 1, 'A generator resumes immediately after its last yield.'),
      },
      {
        id: 'pattern-template', title: 'Interview Pattern Template', summary: 'Combine a pattern invariant with clean Python state and edge handling.', why: 'The goal is not memorizing code; it is expressing a derived invariant reliably.', concepts: ['sliding window', 'dictionary state', 'while repair', 'complexity'], example: `left = 0\nstate = {}\nfor right, value in enumerate(values):\n    add(value, state)\n    while not valid(state):\n        remove(values[left], state)\n        left += 1`, challenge: 'Return the longest substring with no repeated characters.', starterCode: `def longest_unique(text: str) -> int:\n    pass`, tests: `assert longest_unique("abcabcbb") == 3\nassert longest_unique("bbbbb") == 1\nassert longest_unique("") == 0`, solution: `def longest_unique(text: str) -> int:\n    window = set()\n    left = 0\n    best = 0\n    for right, character in enumerate(text):\n        while character in window:\n            window.remove(text[left])\n            left += 1\n        window.add(character)\n        best = max(best, right - left + 1)\n    return best`, labSceneId: 'sliding-window',
        quiz: quiz('Why does window repair use while rather than if?', ['Multiple removals may be required to restore validity', 'Python requires while after for', 'It sorts the string'], 0, 'One removal may not be enough to restore the invariant.'),
      },
    ] },
]

export const PYTHON_LESSONS = PYTHON_MODULES.flatMap((module, moduleIndex) =>
  module.lessons.map((lesson, lessonIndex) => ({ ...lesson, moduleId: module.id, order: moduleIndex * 4 + lessonIndex + 1 })),
)

export const PYTHON_LESSON_BY_ID = new Map(PYTHON_LESSONS.map((lesson) => [lesson.id, lesson]))

export function getNextPythonLesson(lessonId: string) {
  const index = PYTHON_LESSONS.findIndex((lesson) => lesson.id === lessonId)
  return index >= 0 ? PYTHON_LESSONS[index + 1] ?? null : PYTHON_LESSONS[0]
}

export function getPreviousPythonLesson(lessonId: string) {
  const index = PYTHON_LESSONS.findIndex((lesson) => lesson.id === lessonId)
  return index > 0 ? PYTHON_LESSONS[index - 1] : null
}