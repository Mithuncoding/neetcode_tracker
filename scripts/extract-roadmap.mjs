import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const [bundlePath, outputPath = 'src/data/problems.ts'] = process.argv.slice(2)

if (!bundlePath) {
  throw new Error('Usage: node scripts/extract-roadmap.mjs <bundle-path> [output-path]')
}

const bundle = await readFile(resolve(bundlePath), 'utf8')
const objectPattern = /\{problem:"(?:\\.|[^"\\])*"[^{}]*\}/g
const sourceObjects = bundle.match(objectPattern) ?? []
const selectedObjects = sourceObjects.filter((source) =>
  source.includes('neetcode250:!0'),
)

function readString(source, field) {
  const match = source.match(
    new RegExp(`${field}:"((?:\\\\.|[^"\\\\])*)"`),
  )

  return match ? JSON.parse(`"${match[1]}"`) : null
}

const problems = selectedObjects.map((source, index) => {
  const code = readString(source, 'code')
  const title = readString(source, 'problem')
  const topic = readString(source, 'pattern')
  const difficulty = readString(source, 'difficulty')
  const leetcodeSlug = readString(source, 'link')
  const neetcodeSlug = readString(source, 'ncLink') ?? leetcodeSlug

  if (!code || !title || !topic || !difficulty || !leetcodeSlug || !neetcodeSlug) {
    throw new Error(`Incomplete roadmap entry at index ${index}`)
  }

  return {
    id: code,
    leetcodeNumber: Number.parseInt(code.split('-')[0], 10),
    title,
    neetcodeUrl: `https://neetcode.io/problems/${neetcodeSlug.replace(/\/$/, '')}/question`,
    leetcodeUrl: `https://leetcode.com/problems/${leetcodeSlug.replace(/\/$/, '')}/`,
    difficulty,
    topic,
    pattern: topic,
    recommendedOrder: index + 1,
  }
})

const topicCounts = Object.groupBy(problems, ({ topic }) => topic)
const difficultyCounts = Object.groupBy(problems, ({ difficulty }) => difficulty)
const expectedTopicCounts = {
  'Arrays & Hashing': 22,
  'Two Pointers': 13,
  'Sliding Window': 9,
  Stack: 14,
  'Binary Search': 14,
  'Linked List': 14,
  Trees: 23,
  'Heap / Priority Queue': 12,
  Backtracking: 17,
  Tries: 4,
  Graphs: 21,
  'Advanced Graphs': 10,
  '1-D Dynamic Programming': 17,
  '2-D Dynamic Programming': 16,
  Greedy: 14,
  Intervals: 7,
  'Math & Geometry': 13,
  'Bit Manipulation': 10,
}
const hasInvalidTopicCount = Object.entries(expectedTopicCounts).some(
  ([topic, count]) => topicCounts[topic]?.length !== count,
)
const hasInvalidEntry = problems.some(
  (problem) =>
    !Number.isInteger(problem.leetcodeNumber) ||
    problem.leetcodeNumber < 1 ||
    !problem.neetcodeUrl.startsWith('https://neetcode.io/problems/') ||
    !problem.leetcodeUrl.startsWith('https://leetcode.com/problems/'),
)

if (
  problems.length !== 250 ||
  new Set(problems.map(({ id }) => id)).size !== problems.length ||
  Object.keys(topicCounts).length !== 18 ||
  hasInvalidTopicCount ||
  hasInvalidEntry ||
  difficultyCounts.Easy?.length !== 60 ||
  difficultyCounts.Medium?.length !== 155 ||
  difficultyCounts.Hard?.length !== 35
) {
  throw new Error('Extracted data does not match the official roadmap totals')
}

const output = `import type { RoadmapProblem } from '../types'\nimport { getProblemPatterns } from './pattern-taxonomy'\n\nconst ROADMAP_SOURCE: Array<Omit<RoadmapProblem, 'patterns'>> = ${JSON.stringify(problems, null, 2)}\n\nexport const ROADMAP_PROBLEMS: RoadmapProblem[] = ROADMAP_SOURCE.map((problem) => ({\n  ...problem,\n  patterns: getProblemPatterns(problem),\n}))\n`
const resolvedOutput = resolve(outputPath)

await mkdir(dirname(resolvedOutput), { recursive: true })
await writeFile(resolvedOutput, output, 'utf8')
console.log(`Wrote ${problems.length} verified problems to ${resolvedOutput}`)