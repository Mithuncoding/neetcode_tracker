import type { RoadmapProblem } from '../types'

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/https?:\/\/leetcode\.com\/problems\//g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function collectValues(value: unknown, output: string[]) {
  if (typeof value === 'string' || typeof value === 'number') {
    output.push(String(value))
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectValues(item, output))
    return
  }
  if (!value || typeof value !== 'object') return
  const record = value as Record<string, unknown>
  const likelyKeys = ['title', 'titleSlug', 'slug', 'questionTitle', 'problem', 'name', 'url']
  let found = false
  likelyKeys.forEach((key) => {
    if (key in record) {
      collectValues(record[key], output)
      found = true
    }
  })
  if (!found) Object.values(record).forEach((item) => collectValues(item, output))
}

function candidatesFromText(text: string) {
  const values: string[] = []
  try {
    collectValues(JSON.parse(text), values)
  } catch {
    values.push(...text.split(/[\n,;\t]+/))
  }
  return values.map((value) => value.trim()).filter(Boolean)
}

export function parseAcceptedProblemList(text: string, problems: RoadmapProblem[]) {
  const candidates = candidatesFromText(text)
  const aliases = problems.map((problem) => {
    const slug = problem.leetcodeUrl.match(/\/problems\/([^/]+)/)?.[1] ?? ''
    return {
      problem,
      aliases: [problem.title, slug, problem.leetcodeNumber.toString()]
        .map(normalize)
        .filter(Boolean)
        .sort((left, right) => right.length - left.length),
    }
  })
  const matched = new Set<string>()
  const unmatched: string[] = []
  for (const candidate of candidates) {
    const normalized = normalize(candidate)
    if (!normalized) continue
    const exact = aliases.find((item) => item.aliases.includes(normalized))
    const contained = exact ?? [...aliases]
      .sort((left, right) => Math.max(...right.aliases.map((alias) => alias.length)) - Math.max(...left.aliases.map((alias) => alias.length)))
      .find((item) => item.aliases.some((alias) => alias.length >= 4 && normalized.includes(alias)))
    if (contained) matched.add(contained.problem.id)
    else unmatched.push(candidate)
  }
  return {
    matchedProblemIds: [...matched],
    matchedProblems: problems.filter((problem) => matched.has(problem.id)),
    unmatched: [...new Set(unmatched)],
    inputCount: candidates.length,
    duplicateCount: Math.max(0, candidates.length - matched.size - unmatched.length),
  }
}