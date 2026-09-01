const BUILT_IN_TESTS: Record<string, string> = {
  '0001-two-sum': `solution = Solution()
assert sorted(solution.twoSum([2, 7, 11, 15], 9)) == [0, 1]
assert sorted(solution.twoSum([3, 2, 4], 6)) == [1, 2]`,
  '0003-longest-substring-without-repeating-characters': `solution = Solution()
assert solution.lengthOfLongestSubstring("abcabcbb") == 3
assert solution.lengthOfLongestSubstring("bbbbb") == 1
assert solution.lengthOfLongestSubstring("") == 0`,
  '0121-best-time-to-buy-and-sell-stock': `solution = Solution()
assert solution.maxProfit([7, 1, 5, 3, 6, 4]) == 5
assert solution.maxProfit([7, 6, 4, 3, 1]) == 0`,
  '0704-binary-search': `solution = Solution()
assert solution.search([-1, 0, 3, 5, 9, 12], 9) == 4
assert solution.search([-1, 0, 3, 5, 9, 12], 2) == -1`,
  '0200-number-of-islands': `solution = Solution()
grid = [["1", "1", "0"], ["1", "0", "0"], ["0", "0", "1"]]
assert solution.numIslands(grid) == 2`,
  '0198-house-robber': `solution = Solution()
assert solution.rob([1, 2, 3, 1]) == 4
assert solution.rob([2, 7, 9, 3, 1]) == 12
assert solution.rob([]) == 0`,
}

export interface PythonRunResult {
  ok: boolean
  output: string
  usedBuiltInTests: boolean
}

interface WorkerResponse {
  id: string
  ok: boolean
  output: string
  error?: string
}

interface PendingRun {
  resolve: (result: PythonRunResult) => void
  reject: (error: Error) => void
  timeout: number
  usedBuiltInTests: boolean
}

let worker: Worker | null = null
const pending = new Map<string, PendingRun>()

function resetWorker(error: Error) {
  worker?.terminate()
  worker = null
  pending.forEach((run) => {
    window.clearTimeout(run.timeout)
    run.reject(error)
  })
  pending.clear()
}

function getWorker() {
  if (worker) return worker
  worker = new Worker(new URL('../workers/python.worker.ts', import.meta.url), { type: 'module' })
  worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
    const run = pending.get(event.data.id)
    if (!run) return
    window.clearTimeout(run.timeout)
    pending.delete(event.data.id)
    run.resolve({
      ok: event.data.ok,
      output: event.data.ok ? event.data.output : `${event.data.output}${event.data.output ? '\n' : ''}${event.data.error ?? 'Python execution failed.'}`,
      usedBuiltInTests: run.usedBuiltInTests,
    })
  })
  worker.addEventListener('error', () => resetWorker(new Error('The Python runtime worker failed to load.')))
  return worker
}

export function hasBuiltInPythonTests(problemId: string) {
  return Boolean(BUILT_IN_TESTS[problemId])
}

export function createPythonProgram(code: string, problemId: string) {
  const tests = BUILT_IN_TESTS[problemId]
  if (!tests) return code
  return `${code}\n\nprint("Running built-in learning checks...")\n${tests}\nprint("All built-in checks passed.")`
}

export function runPythonCode(code: string, problemId: string, timeoutMs = 30_000) {
  return new Promise<PythonRunResult>((resolve, reject) => {
    const id = `python-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const usedBuiltInTests = hasBuiltInPythonTests(problemId)
    const timeout = window.setTimeout(() => {
      resetWorker(new Error('Python execution exceeded the time limit. The worker was stopped.'))
    }, timeoutMs)
    pending.set(id, { resolve, reject, timeout, usedBuiltInTests })
    getWorker().postMessage({ id, code: createPythonProgram(code, problemId) })
  })
}