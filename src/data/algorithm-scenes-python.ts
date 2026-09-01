import type { AlgorithmSceneDefinition, SceneEntityState } from './algorithm-scenes'
import { edge, entity, frame } from './algorithm-scenes-extra'

type Position = [number, number, number]

const pipelinePositions: Position[] = [[-4, 0, 0], [-2, 0.7, 0], [0, 0, 0], [2, 0.7, 0], [4, 0, 0]]

function executionScene(): AlgorithmSceneDefinition {
  const labels = ['source.py', 'parser', 'bytecode', 'Python VM', 'output']
  const connections: Array<[number, number]> = [[0, 1], [1, 2], [2, 3], [3, 4]]
  return { id: 'python-execution', title: 'How Python Executes', category: 'Python Core', level: 'Foundation', summary: 'Follow source text through parsing, bytecode, virtual-machine execution, and output.', mentalModel: 'Your code is translated into instructions, then the Python virtual machine executes those instructions in order.', useWhen: ['Understanding syntax errors', 'Reading tracebacks', 'Reasoning about statement order'], pitfalls: ['Treating source lines as magic', 'Ignoring the first traceback location'], complexity: { best: 'Program-dependent', average: 'Program-dependent', worst: 'Program-dependent', space: 'Program-dependent' }, frames: labels.map((label, active) => frame(active === 0 ? 'Write source code' : `Enter ${label}`, active === 0 ? 'A .py file begins as plain text containing Python grammar.' : active === 1 ? 'The parser checks grammar before any statement can execute.' : active === 2 ? 'Valid syntax becomes compact bytecode instructions.' : active === 3 ? 'The Python virtual machine evaluates instructions and manages objects.' : 'print sends the final text to standard output.', 'Each stage must succeed before the next stage receives valid input.', active === 0 ? 'print("Hello, LeetCode!")' : active === 1 ? '# parse grammar' : active === 2 ? 'LOAD_NAME; CALL; POP_TOP' : active === 3 ? '# execute instructions' : 'Hello, LeetCode!', labels.map((item, index) => entity(`node-${index}`, item, pipelinePositions[index], index < active ? 'visited' : index === active ? active === labels.length - 1 ? 'done' : 'active' : 'muted', 'cube', [1.35, 0.72, 1])), connections.map(([from, to]) => edge(`node-${from}`, `node-${to}`, true, from < active ? 'visited' : from === active - 1 ? 'active' : 'muted')), [0, 3.7, 12])) }
}

function referenceScene(): AlgorithmSceneDefinition {
  const positions: Position[] = [[-3, 1.4, 0], [-3, -0.8, 0], [1, 1.4, 0], [3.2, 1.4, 0], [2.1, -1, 0]]
  const names = ['name: a', 'name: b', 'list [1,2]', 'int 7', 'list [1,2,3]']
  return { id: 'python-references', title: 'Names, Objects, and Mutation', category: 'Python Core', level: 'Foundation', summary: 'See variables as names pointing to objects and distinguish rebinding from mutation.', mentalModel: 'Names are sticky notes attached to objects; assignment moves a note, while mutation changes the object itself.', useWhen: ['List aliasing', 'Graph adjacency mutation', 'Copying matrices', 'Class attributes'], pitfalls: ['Assuming assignment copies', 'Using repeated inner-list references'], complexity: { best: 'O(1) binding', average: 'Operation-dependent', worst: 'Operation-dependent', space: 'Object-dependent' }, frames: [
    frame('Bind a to one list', 'Assignment attaches name a to a mutable list object.', 'A name refers to an object; it does not contain the object.', 'a = [1, 2]', names.map((label, index) => entity(`ref-${index}`, label, positions[index], index === 0 || index === 2 ? 'active' : 'muted', index < 2 ? 'tile' : 'sphere', index < 2 ? [1.3, 1, 0.8] : [1, 1, 1])), [edge('ref-0', 'ref-2', true, 'active')]),
    frame('Bind b to the same list', 'b = a creates another reference to the existing list, not a copy.', 'Both names now reach the exact same mutable object.', 'b = a', names.map((label, index) => entity(`ref-${index}`, label, positions[index], index <= 2 ? 'active' : 'muted', index < 2 ? 'tile' : 'sphere', index < 2 ? [1.3, 1, 0.8] : [1, 1, 1])), [edge('ref-0', 'ref-2', true), edge('ref-1', 'ref-2', true, 'active')]),
    frame('Mutate through b', 'Appending through b changes the shared object, so a observes the same mutation.', 'Mutation preserves references while changing object state.', 'b.append(3)', [entity('ref-0', names[0], positions[0], 'visited', 'tile', [1.3, 1, 0.8]), entity('ref-1', names[1], positions[1], 'active', 'tile', [1.3, 1, 0.8]), entity('ref-4', names[4], positions[4], 'done')], [edge('ref-0', 'ref-4', true), edge('ref-1', 'ref-4', true, 'active')]),
    frame('Rebind a to integer 7', 'Reassignment moves only name a; b still points to the list.', 'Rebinding one name does not mutate the old object or move other names.', 'a = 7', [entity('ref-0', names[0], positions[0], 'active', 'tile', [1.3, 1, 0.8]), entity('ref-1', names[1], positions[1], 'visited', 'tile', [1.3, 1, 0.8]), entity('ref-3', names[3], positions[3], 'done'), entity('ref-4', names[4], positions[4], 'visited')], [edge('ref-0', 'ref-3', true, 'active'), edge('ref-1', 'ref-4', true)]),
  ] }
}

function typesScene(): AlgorithmSceneDefinition {
  const values = [['42', 'int'], ['3.14', 'float'], ['True', 'bool'], ['"DSA"', 'str'], ['None', 'NoneType']]
  const positions: Position[] = [[-3.6, 0.6, 0], [-1.8, -0.4, 0], [0, 0.6, 0], [1.8, -0.4, 0], [3.6, 0.6, 0]]
  return { id: 'python-types', title: 'Python Runtime Types', category: 'Python Core', level: 'Foundation', summary: 'Inspect values as objects carrying both type identity and data.', mentalModel: 'Python names do not declare storage types; each runtime object knows its own type and behavior.', useWhen: ['Choosing operations', 'Converting input', 'Checking None', 'Understanding booleans'], pitfalls: ['Mixing strings and integers', 'Using type checks when polymorphism is clearer'], complexity: { best: 'O(1) type lookup', average: 'Conversion-dependent', worst: 'Conversion-dependent', space: 'Value-dependent' }, frames: values.map(([value, type], active) => frame(`Inspect ${value}`, `${value} is an object whose runtime type is ${type}. Its type determines supported operations.`, 'An operation is valid only when the participating object types define its behavior.', `type(${value}) is ${type}`, values.map(([itemValue, itemType], index) => entity(`type-${index}`, `${itemValue}\n${itemType}`, positions[index], index === active ? 'active' : index < active ? 'visited' : 'idle', 'sphere', [1, 1, 1])), [], [0, 3.8, 11])) }
}

function sequenceScene(): AlgorithmSceneDefinition {
  const values = ['p', 'y', 't', 'h', 'o', 'n']
  const row = (states: Record<number, SceneEntityState>) => values.map((value, index) => entity(`char-${index}`, `${index}:${value}`, [(index - 2.5) * 1.2, 0, 0], states[index] ?? 'idle', 'cube', [0.82, 0.82, 0.82]))
  return { id: 'python-sequences', title: 'Sequence Memory and Slices', category: 'Python Core', level: 'Foundation', summary: 'Visualize indexing, negative indices, half-open slices, and copied subsequences.', mentalModel: 'A sequence is an ordered row of positions; a slice selects boundaries and creates a new sequence.', useWhen: ['Arrays and strings', 'Two pointers', 'Substrings', 'Copying'], pitfalls: ['Including the stop boundary', 'Hidden O(n) slicing inside loops'], complexity: { best: 'O(1) index', average: 'O(k) slice', worst: 'O(k) slice', space: 'O(k) slice copy' }, frames: [
    frame('Index position 2', 'Positive index 2 selects the third element t.', 'Sequence indexing is zero-based and direct.', 'text[2] == "t"', row({ 2: 'active' })),
    frame('Use negative index -1', 'Negative index -1 counts backward and selects the last element n.', 'For length n, index -1 corresponds to n - 1.', 'text[-1] == "n"', row({ 5: 'active' })),
    frame('Slice [1:4]', 'Start 1 is included; stop 4 is excluded, producing yth.', 'Python slices are half-open ranges [start, stop).', 'text[1:4] == "yth"', row({ 1: 'done', 2: 'done', 3: 'done', 4: 'muted', 5: 'muted' })),
    frame('Reverse with [::-1]', 'A negative step walks every position from right to left and creates a new string.', 'Strings are immutable; slicing returns another string object.', 'text[::-1] == "nohtyp"', row({ 0: 'done', 1: 'done', 2: 'done', 3: 'done', 4: 'done', 5: 'done' }).reverse()),
  ] }
}

function characterScene(): AlgorithmSceneDefinition {
  const letters = ['a', 'b', 'c', 'd', 'e', 'f']
  const make = (active: number, shifted = -1) => letters.map((letter, index) => entity(`letter-${index}`, `${letter}:${ordValues[index]}`, [(index - 2.5) * 1.25, index === shifted ? 0.7 : 0, 0], index === active ? 'active' : index === shifted ? 'done' : 'idle', 'cube', [0.85, 0.85, 0.85]))
  const ordValues = [97, 98, 99, 100, 101, 102]
  return { id: 'python-characters', title: 'ord, chr, and Alphabet Indices', category: 'Python Core', level: 'Core', summary: 'Convert characters to integer code points and back for compact alphabet arithmetic.', mentalModel: 'Each character has a numbered address; subtract the address of a to get a zero-based alphabet index.', useWhen: ['Frequency arrays', 'Caesar shifts', 'Tries', 'Character ranges'], pitfalls: ['Calling ord on more than one character', 'Forgetting modulo wraparound'], complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' }, frames: [
    frame('Convert c with ord', 'ord("c") returns code point 99.', 'ord maps exactly one character to one integer.', 'ord("c") == 99', make(2)),
    frame('Create alphabet index', 'Subtract ord("a") = 97, so c has zero-based index 2.', 'Relative code-point differences preserve lowercase English alphabet order.', 'ord("c") - ord("a") == 2', make(0, 2)),
    frame('Shift by three', 'Add 3 to index 2 and convert code point 102 back to f.', 'Modulo 26 keeps shifted indices inside the lowercase alphabet.', 'chr(ord("a") + (2 + 3) % 26) == "f"', make(2, 5)),
  ] }
}

function controlFlowScene(): AlgorithmSceneDefinition {
  const labels = ['start', 'value < 0?', 'value == 0?', 'negative', 'zero', 'positive', 'end']
  const positions: Position[] = [[-4, 1.2, 0], [-2, 1.2, 0], [0, 1.2, 0], [-1.4, -1.2, 0], [0.4, -1.2, 0], [2.2, -1.2, 0], [4, 0, 0]]
  const connections: Array<[number, number]> = [[0, 1], [1, 3], [1, 2], [2, 4], [2, 5], [3, 6], [4, 6], [5, 6]]
  const path = [0, 1, 2, 5, 6]
  return { id: 'python-control-flow', title: 'Branches and Loops', category: 'Python Core', level: 'Foundation', summary: 'Follow conditions as control chooses branches and loops repeat state transitions.', mentalModel: 'Program execution follows one corridor at a time; conditions decide the next corridor.', useWhen: ['if/elif/else', 'Loop invariants', 'Early exits'], pitfalls: ['Overlapping conditions in the wrong order', 'Loops without progress'], complexity: { best: 'Path-dependent', average: 'Iteration-dependent', worst: 'Iteration-dependent', space: 'Usually O(1)' }, frames: path.map((active, step) => frame(step === 0 ? 'Enter the program' : step === path.length - 1 ? 'Join at the end' : `Evaluate ${labels[active]}`, active === 1 ? 'For value 7, the negative condition is false, so control follows the next test.' : active === 2 ? 'The zero condition is also false, so the final else branch is selected.' : active === 5 ? 'Only the positive branch executes and assigns the label.' : 'Execution advances through exactly one selected path.', 'At one moment, execution is located at one statement; unchosen branches do not run.', active === 1 ? 'if value < 0:' : active === 2 ? 'elif value == 0:' : active === 5 ? 'else: label = "positive"' : '# next statement', labels.map((label, index) => entity(`node-${index}`, label, positions[index], path.slice(0, step).includes(index) ? 'visited' : index === active ? 'active' : 'muted', 'cube', [1.25, 0.65, 0.9])), connections.map(([from, to]) => edge(`node-${from}`, `node-${to}`, true, path.slice(1, step + 1).some((node, index) => path[index] === from && node === to) ? 'active' : 'muted')), [0, 4.2, 12])) }
}

function functionScene(): AlgorithmSceneDefinition {
  const frames = (depth: number, returning = false) => Array.from({ length: depth }, (_, index) => entity(`call-${index}`, index === 0 ? 'main()' : index === 1 ? 'square(4)' : 'multiply(4,4)', [0, -1.1 + index * 1.25, 0], index === depth - 1 ? returning ? 'done' : 'active' : 'candidate', 'cube', [2.5, 0.72, 1.1]))
  return { id: 'python-functions', title: 'Function Call Frames', category: 'Python Core', level: 'Core', summary: 'See parameters, local variables, return addresses, and values across nested calls.', mentalModel: 'Each call receives a private desk for local names and waits until the called desk returns a result.', useWhen: ['Functions', 'Recursion', 'Scope', 'Debugging tracebacks'], pitfalls: ['Forgetting return', 'Confusing local and global names'], complexity: { best: 'Function-dependent', average: 'Function-dependent', worst: 'Function-dependent', space: 'O(call depth)' }, frames: [
    frame('main calls square(4)', 'A new function frame receives parameter value = 4.', 'Every call owns its local parameter bindings.', 'result = square(4)', frames(2)),
    frame('square calls multiply', 'square pauses at its return address while multiply receives two arguments.', 'The caller frame remains intact until the callee returns.', 'return multiply(value, value)', frames(3)),
    frame('multiply returns 16', 'The innermost frame computes and sends 16 back to square.', 'return ends only the current function frame.', 'return left * right', frames(3, true)),
    frame('main receives result', 'Waiting frames unwind and main binds result to 16.', 'Returned values flow outward while local frames are discarded.', 'result = 16', frames(1, true)),
  ] }
}

function iterationScene(): AlgorithmSceneDefinition {
  const stages = [
    { labels: ['"  DP"', '"Graph "', '" BFS"'], title: 'Source iterable', code: 'words', narration: 'The source list can produce one value at a time.' },
    { labels: ['"dp"', '"graph"', '"bfs"'], title: 'map normalizes', code: 'map(normalize, words)', narration: 'map lazily applies the same callable to each incoming value.' },
    { labels: ['"graph"'], title: 'filter retains', code: 'filter(long_enough, normalized)', narration: 'filter yields only values whose predicate is true.' },
    { labels: ['(0,"graph")'], title: 'enumerate pairs index', code: 'enumerate(long_words)', narration: 'enumerate attaches a counter without manually mutating one.' },
  ]
  return { id: 'python-iteration-pipeline', title: 'Iterable Pipeline', category: 'Python Core', level: 'Core', summary: 'Watch iterable values flow lazily through map, filter, enumerate, and zip.', mentalModel: 'A conveyor belt transforms or selects one item only when the next stage asks for it.', useWhen: ['Simple transformations', 'Parallel iteration', 'Generators'], pitfalls: ['Forgetting map/filter are lazy', 'Using a pipeline when explicit state would be clearer'], complexity: { best: 'O(1) setup', average: 'O(n) consume', worst: 'O(n) consume', space: 'O(1) lazy' }, frames: stages.map((stage, active) => frame(stage.title, stage.narration, 'Lazy iterators compute the next output on demand rather than materializing every stage.', stage.code, stages.flatMap((candidate, stageIndex) => candidate.labels.map((label, itemIndex) => entity(`stage-${stageIndex}-${itemIndex}`, label, [(stageIndex - 1.5) * 2.5, (itemIndex - 1) * 0.9, 0], stageIndex === active ? 'active' : stageIndex < active ? 'visited' : 'muted', 'cube', [1.5, 0.58, 0.85]))), stages.slice(0, -1).map((_, index) => edge(`stage-${index}-0`, `stage-${index + 1}-0`, true, index < active ? 'visited' : index === active - 1 ? 'active' : 'muted')), [0, 4, 12])) }
}

function collectionScene(): AlgorithmSceneDefinition {
  const collections = [
    ['list', '[3,3,7]', 'ordered + mutable'],
    ['tuple', '(3,3,7)', 'ordered + immutable'],
    ['set', '{3,7}', 'unique membership'],
    ['dict', '{3:"x"}', 'key → value'],
  ]
  const positions: Position[] = [[-3, 1, 0], [-1, -0.8, 0], [1, 1, 0], [3, -0.8, 0]]
  return { id: 'python-collections', title: 'Choose a Collection', category: 'Python Core', level: 'Core', summary: 'Compare list, tuple, set, and dictionary behavior by the operations they guarantee.', mentalModel: 'Choose a container from the questions you need to ask: position, fixed record, membership, or association.', useWhen: ['Data-structure selection', 'Complexity analysis'], pitfalls: ['Using a list for repeated membership', 'Expecting set order', 'Using mutable dictionary keys'], complexity: { best: 'Operation-dependent', average: 'Operation-dependent', worst: 'Operation-dependent', space: 'O(n)' }, frames: collections.map(([name, value, property], active) => frame(`Inspect ${name}`, `${name} stores ${value}: ${property}.`, 'The correct collection is determined by required operations and invariants.', name === 'dict' ? 'value = mapping[key]' : name === 'set' ? 'present = value in seen' : name === 'list' ? 'value = items[index]' : 'x, y, z = record', collections.map(([itemName, itemValue], index) => entity(`collection-${index}`, `${itemName}\n${itemValue}`, positions[index], index === active ? 'active' : 'idle', index === 2 ? 'ring' : 'cube', [1.5, 0.82, 1])), [], [0, 4, 11])) }
}

function classScene(): AlgorithmSceneDefinition {
  const positions: Position[] = [[0, 2.2, 0], [-2.6, -0.3, 0], [2.6, -0.3, 0], [-2.6, -1.8, 0], [2.6, -1.8, 0]]
  const labels = ['class Point', 'point_a', 'point_b', 'x=3,y=4', 'x=1,y=2']
  return { id: 'python-class-object', title: 'Classes and Objects', category: 'Python Core', level: 'Core', summary: 'Connect one class definition to independent instances and their per-object attributes.', mentalModel: 'A class is a blueprint; each object is a separate constructed house with its own attribute values.', useWhen: ['Tree/List nodes', 'Design questions', 'Encapsulated invariants'], pitfalls: ['Class attributes shared accidentally', 'Forgetting self', 'Mutating the wrong instance'], complexity: { best: 'O(1) attribute access', average: 'O(1) attribute access', worst: 'Implementation-dependent', space: 'Per instance' }, frames: [
    frame('Define class Point', 'The class stores method behavior and describes how instances initialize.', 'Defining a class creates a class object; it does not create Point instances.', 'class Point:', [entity('node-0', labels[0], positions[0], 'active', 'cube', [2.2, 0.8, 1.1])], []),
    frame('Construct point_a', 'Calling Point(3,4) creates an instance, then __init__ binds x and y on that instance.', 'self refers to the specific object receiving the method call.', 'point_a = Point(3, 4)', [entity('node-0', labels[0], positions[0], 'visited', 'cube', [2.2, 0.8, 1.1]), entity('node-1', labels[1], positions[1], 'active'), entity('node-3', labels[3], positions[3], 'candidate', 'tile', [1.5, 1, 0.8])], [edge('node-0', 'node-1', true), edge('node-1', 'node-3', true, 'active')]),
    frame('Construct point_b', 'A second call creates another object with independent attribute values.', 'Instances share class behavior but not their normal instance attributes.', 'point_b = Point(1, 2)', labels.map((label, index) => entity(`node-${index}`, label, positions[index], index === 2 || index === 4 ? 'active' : 'visited', index === 0 ? 'cube' : index > 2 ? 'tile' : 'sphere', index === 0 ? [2.2, 0.8, 1.1] : index > 2 ? [1.5, 1, 0.8] : [1, 1, 1])), [edge('node-0', 'node-1', true), edge('node-0', 'node-2', true), edge('node-1', 'node-3', true), edge('node-2', 'node-4', true, 'active')]),
    frame('Call an instance method', 'point_a.distance_squared() receives point_a as self and reads only its attributes.', 'Method lookup comes from the class while state lookup comes from the instance.', 'point_a.distance_squared() == 25', labels.map((label, index) => entity(`node-${index}`, label, positions[index], index === 1 || index === 3 ? 'done' : 'muted', index === 0 ? 'cube' : index > 2 ? 'tile' : 'sphere', index === 0 ? [2.2, 0.8, 1.1] : index > 2 ? [1.5, 1, 0.8] : [1, 1, 1])), [edge('node-1', 'node-3', true, 'active')]),
  ] }
}

export const PYTHON_ALGORITHM_SCENES: AlgorithmSceneDefinition[] = [
  executionScene(),
  referenceScene(),
  typesScene(),
  sequenceScene(),
  characterScene(),
  controlFlowScene(),
  functionScene(),
  iterationScene(),
  collectionScene(),
  classScene(),
]