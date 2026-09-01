interface PyodideRuntime {
  runPythonAsync: (code: string, options?: { globals?: unknown }) => Promise<unknown>
  setStdout: (options: { batched: (value: string) => void }) => void
  setStderr: (options: { batched: (value: string) => void }) => void
  toPy: (value: unknown) => { destroy?: () => void }
}

interface PyodideModule {
  loadPyodide: (options: { indexURL: string }) => Promise<PyodideRuntime>
}

interface RunRequest {
  id: string
  code: string
}

const PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/v0.28.2/full/'
let runtimePromise: Promise<PyodideRuntime> | null = null

async function getRuntime() {
  if (!runtimePromise) {
    runtimePromise = import(/* @vite-ignore */ `${PYODIDE_BASE}pyodide.mjs`)
      .then((module) => (module as unknown as PyodideModule).loadPyodide({ indexURL: PYODIDE_BASE }))
  }
  return runtimePromise
}

self.addEventListener('message', async (event: MessageEvent<RunRequest>) => {
  const output: string[] = []
  try {
    const runtime = await getRuntime()
    runtime.setStdout({ batched: (value) => output.push(value) })
    runtime.setStderr({ batched: (value) => output.push(value) })
    const globals = runtime.toPy({})
    const result = await runtime.runPythonAsync(event.data.code, { globals })
    globals.destroy?.()
    const resultText = result === undefined || result === null ? '' : String(result)
    self.postMessage({
      id: event.data.id,
      ok: true,
      output: [...output, resultText].filter(Boolean).join('\n') || 'Program completed with no output.',
    })
  } catch (error) {
    self.postMessage({
      id: event.data.id,
      ok: false,
      output: output.join('\n'),
      error: error instanceof Error ? error.message : String(error),
    })
  }
})