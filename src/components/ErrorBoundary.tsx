import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, Download, RefreshCw } from 'lucide-react'
import { BACKUP_KEY, STORAGE_KEY } from '../lib/storage'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Tracker render failure', error, info.componentStack)
  }

  private exportRecovery = () => {
    const value = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(BACKUP_KEY)
    if (!value) return
    const blob = new Blob([value], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `neetcode-250-emergency-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-5">
        <section className="panel w-full max-w-lg p-7 shadow-[var(--shadow)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-[7px] bg-[var(--red-soft)] text-[var(--red)]"><AlertTriangle size={20} /></div>
          <h1 className="mt-5 text-xl font-extrabold">The tracker hit an unexpected error</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Your progress remains in local storage. Export an emergency copy, then reload the application.</p>
          <pre className="mt-5 max-h-28 overflow-auto rounded-[6px] bg-[var(--surface-muted)] p-3 font-mono text-[10px] text-[var(--text-muted)]">{this.state.error.message}</pre>
          <div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" onClick={this.exportRecovery} className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[var(--border-strong)] px-4 text-sm font-bold"><Download size={15} /> Export recovery</button><button type="button" onClick={() => location.reload()} className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-bold text-white"><RefreshCw size={15} /> Reload</button></div>
        </section>
      </main>
    )
  }
}