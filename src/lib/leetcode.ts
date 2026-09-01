import { z } from 'zod'
import type { LeetCodeProfileSnapshot, RoadmapProblem } from '../types'

export const LEETCODE_USERNAME = 'Mithuncoding'
export const LEETCODE_SYNC_DATE_KEY = 'mithun-interview-studio:leetcode-sync-date'

const snapshotSchema = z.object({
  schemaVersion: z.literal(1),
  username: z.string(),
  generatedAt: z.string(),
  ranking: z.number().int().nonnegative().nullable(),
  totalSolved: z.number().int().nonnegative(),
  easySolved: z.number().int().nonnegative(),
  mediumSolved: z.number().int().nonnegative(),
  hardSolved: z.number().int().nonnegative(),
  acceptanceRate: z.number().min(0).max(100).nullable(),
  activeDays: z.number().int().nonnegative().nullable(),
  maxStreak: z.number().int().nonnegative().nullable(),
  primaryLanguage: z.string().nullable(),
  recentAccepted: z.array(z.object({
    title: z.string(),
    titleSlug: z.string(),
    timestamp: z.string(),
  })).default([]),
  source: z.string().url(),
})

export function parseLeetCodeProfile(
  input: unknown,
  problems: RoadmapProblem[],
  expectedUsername?: string,
): LeetCodeProfileSnapshot {
  const result = snapshotSchema.safeParse(input)
  if (!result.success) throw new Error('The LeetCode profile snapshot is invalid.')
  if (expectedUsername && result.data.username.toLowerCase() !== expectedUsername.toLowerCase()) {
    throw new Error(`This deployment contains a snapshot for ${result.data.username}, not ${expectedUsername}.`)
  }
  const acceptedTitles = new Set(result.data.recentAccepted.map((item) => item.title.toLowerCase()))
  const matchedProblemIds = problems
    .filter((problem) => acceptedTitles.has(problem.title.toLowerCase()))
    .map((problem) => problem.id)
  return {
    username: result.data.username,
    syncedAt: result.data.generatedAt,
    ranking: result.data.ranking,
    totalSolved: result.data.totalSolved,
    easySolved: result.data.easySolved,
    mediumSolved: result.data.mediumSolved,
    hardSolved: result.data.hardSolved,
    acceptanceRate: result.data.acceptanceRate,
    activeDays: result.data.activeDays,
    maxStreak: result.data.maxStreak,
    primaryLanguage: result.data.primaryLanguage,
    matchedProblemIds,
    source: result.data.source,
  }
}

export async function fetchLeetCodeProfile(username: string, problems: RoadmapProblem[]) {
  const basePath = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`
  const response = await fetch(`${basePath}leetcode-profile.json?refresh=${Date.now()}`, {
    cache: 'no-store',
    headers: { accept: 'application/json' },
  })
  if (!response.ok) throw new Error('No LeetCode snapshot is available in this deployment.')
  return parseLeetCodeProfile(await response.json(), problems, username)
}