import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const username = process.env.LEETCODE_USERNAME?.trim() || 'Mithuncoding'
const optional = process.argv.includes('--optional')
const outputPath = resolve('public', 'leetcode-profile.json')
const query = `
  query userProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile { ranking realName }
      submitStats {
        acSubmissionNum { difficulty count submissions }
        totalSubmissionNum { difficulty count submissions }
      }
      userCalendar { streak totalActiveDays }
      languageProblemCount { languageName problemsSolved }
    }
    recentAcSubmissionList(username: $username, limit: 100) {
      title
      titleSlug
      timestamp
    }
  }
`

function countFor(items, difficulty, field = 'count') {
  return items?.find((item) => item.difficulty === difficulty)?.[field] ?? 0
}

async function sync() {
  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      referer: `https://leetcode.com/u/${username}/`,
      'user-agent': 'neetcode-tracker-profile-sync/1.0',
    },
    body: JSON.stringify({ query, variables: { username } }),
  })
  if (!response.ok) throw new Error(`LeetCode returned HTTP ${response.status}.`)
  const payload = await response.json()
  if (payload.errors?.length) throw new Error(payload.errors[0].message)
  const user = payload.data?.matchedUser
  if (!user) throw new Error(`LeetCode user "${username}" was not found.`)

  const accepted = user.submitStats?.acSubmissionNum ?? []
  const submitted = user.submitStats?.totalSubmissionNum ?? []
  const acceptedSubmissions = countFor(accepted, 'All', 'submissions')
  const totalSubmissions = countFor(submitted, 'All', 'submissions')
  const language = [...(user.languageProblemCount ?? [])]
    .sort((left, right) => right.problemsSolved - left.problemsSolved)[0]?.languageName ?? null
  const snapshot = {
    schemaVersion: 1,
    username: user.username,
    generatedAt: new Date().toISOString(),
    ranking: user.profile?.ranking ?? null,
    totalSolved: countFor(accepted, 'All'),
    easySolved: countFor(accepted, 'Easy'),
    mediumSolved: countFor(accepted, 'Medium'),
    hardSolved: countFor(accepted, 'Hard'),
    acceptanceRate: totalSubmissions
      ? Math.round((acceptedSubmissions / totalSubmissions) * 10_000) / 100
      : null,
    activeDays: user.userCalendar?.totalActiveDays ?? null,
    maxStreak: user.userCalendar?.streak ?? null,
    primaryLanguage: language,
    recentAccepted: payload.data?.recentAcSubmissionList ?? [],
    source: `https://leetcode.com/u/${user.username}/`,
  }
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
  console.log(`Synced ${snapshot.totalSolved} solved problems for ${snapshot.username}.`)
}

try {
  await sync()
} catch (error) {
  if (!optional) throw error
  try {
    await readFile(outputPath, 'utf8')
    console.warn(`LeetCode sync skipped: ${error.message} Using the existing snapshot.`)
  } catch {
    console.warn(`LeetCode sync skipped: ${error.message} No snapshot is available.`)
  }
}