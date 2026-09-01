import { useRef, useState, type ChangeEvent } from 'react'
import { AlertTriangle, Check, Download, FileSpreadsheet, Moon, RotateCcw, Sun, Upload } from 'lucide-react'
import { Button, Modal, PageHeader } from '../components/ui'
import { DataSafetyPanel } from '../components/DataSafetyPanel'
import { useTracker } from '../context/useTracker'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { parseImportedState, serializeState } from '../lib/storage'
import type { AppState, ThemePreference } from '../types'

const TOPICS = [...new Set(ROADMAP_PROBLEMS.map((problem) => problem.topic))]
type ResetKind = 'all' | 'progress' | 'analytics'

export function SettingsPage() {
  const { state, updateSettings, importState, resetAll, resetProgress, resetAnalytics } = useTracker()
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [resetKind, setResetKind] = useState<ResetKind | null>(null)
  const [importCandidate, setImportCandidate] = useState<AppState | null>(null)
  const [exportingExcel, setExportingExcel] = useState(false)

  async function exportExcelTracker() {
    setExportingExcel(true)
    setMessage(null)
    try {
      const { downloadTrackerWorkbook } = await import('../lib/excel-export')
      await downloadTrackerWorkbook(state)
      setMessage({ tone: 'success', text: 'Excel tracker downloaded.' })
    } catch {
      setMessage({ tone: 'error', text: 'Could not create the Excel tracker.' })
    } finally {
      setExportingExcel(false)
    }
  }

  function exportBackup() {
    const blob = new Blob([serializeState(state)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `neetcode-250-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(link.href)
    setMessage({ tone: 'success', text: 'Backup exported.' })
  }

  async function readImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      setImportCandidate(parseImportedState(await file.text()))
      setMessage(null)
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'Import failed.' })
    }
  }

  function updateInterval(index: number, value: number) {
    const intervals = [...state.settings.revisionIntervals]
    intervals[index] = Math.max(1, Math.min(365, value || 1))
    updateSettings({ revisionIntervals: intervals })
  }

  function confirmReset() {
    if (resetKind === 'all') resetAll()
    if (resetKind === 'progress') resetProgress()
    if (resetKind === 'analytics') resetAnalytics()
    setResetKind(null)
    setMessage({ tone: 'success', text: 'Selected data was reset.' })
  }

  return (
    <div className="page-content max-w-5xl">
      <PageHeader title="Settings" description="Preferences, revision cadence, and local data" />
      {message && <div className={`mb-4 flex items-center gap-2 rounded-[6px] border px-4 py-3 text-xs font-semibold ${message.tone === 'success' ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--red)] bg-[var(--red-soft)] text-[var(--red)]'}`}>{message.tone === 'success' ? <Check size={15} /> : <AlertTriangle size={15} />}{message.text}</div>}
      <div className="space-y-4">
        <section className="panel overflow-hidden"><header className="border-b border-[var(--border)] px-5 py-4"><h2 className="text-sm font-bold">Preferences</h2></header><div className="divide-y divide-[var(--border)] px-5">
          <div className="grid gap-3 py-5 sm:grid-cols-[1fr_240px] sm:items-center"><div><label htmlFor="daily-goal" className="text-sm font-semibold">Daily problem goal</label><p className="mt-1 text-xs text-[var(--text-muted)]">Used for today&apos;s target and consistency score.</p></div><input id="daily-goal" type="number" min={1} max={25} className="input px-3 text-sm" value={state.settings.dailyGoal} onChange={(event) => updateSettings({ dailyGoal: Math.max(1, Math.min(25, Number(event.target.value) || 1)) })} /></div>
          <div className="grid gap-3 py-5 sm:grid-cols-[1fr_240px] sm:items-center"><div><label htmlFor="active-topic" className="text-sm font-semibold">Current active topic</label><p className="mt-1 text-xs text-[var(--text-muted)]">Prioritized by daily recommendations.</p></div><select id="active-topic" className="input px-3 text-sm" value={state.settings.activeTopic} onChange={(event) => updateSettings({ activeTopic: event.target.value })}>{TOPICS.map((topic) => <option key={topic}>{topic}</option>)}</select></div>
          <div className="grid gap-3 py-5 sm:grid-cols-[1fr_240px] sm:items-center"><div><span className="text-sm font-semibold">Theme</span><p className="mt-1 text-xs text-[var(--text-muted)]">Saved on this device.</p></div><div className="grid grid-cols-3 rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface-raised)] p-1">{([{ value: 'light', label: 'Light', icon: Sun }, { value: 'dark', label: 'Dark', icon: Moon }, { value: 'system', label: 'Auto', icon: RotateCcw }] as Array<{ value: ThemePreference; label: string; icon: typeof Sun }>).map(({ value, label, icon: Icon }) => <button key={value} type="button" aria-pressed={state.settings.theme === value} onClick={() => updateSettings({ theme: value })} className={`flex h-8 items-center justify-center gap-1 rounded-[4px] text-[10px] font-bold ${state.settings.theme === value ? 'bg-[var(--surface)] text-[var(--accent)] shadow-sm' : 'text-[var(--text-muted)]'}`}><Icon size={13} />{label}</button>)}</div></div>
          <div className="flex items-center justify-between gap-4 py-5"><div><label htmlFor="auto-timer" className="text-sm font-semibold">Start timer automatically</label><p className="mt-1 text-xs text-[var(--text-muted)]">Applies when a focus problem begins.</p></div><input id="auto-timer" type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={state.settings.autoStartTimer} onChange={(event) => updateSettings({ autoStartTimer: event.target.checked })} /></div>
        </div></section>

        <section className="panel overflow-hidden"><header className="border-b border-[var(--border)] px-5 py-4"><h2 className="text-sm font-bold">Revision intelligence</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Adaptive mode calibrates intervals from recall quality, ease, and lapses</p></header><div className="p-5"><div className="grid grid-cols-2 gap-2">{(['adaptive', 'fixed'] as const).map((mode) => <button key={mode} type="button" aria-pressed={state.settings.revisionMode === mode} onClick={() => updateSettings({ revisionMode: mode })} className={`rounded-[6px] border p-4 text-left ${state.settings.revisionMode === mode ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)]'}`}><span className="text-sm font-bold capitalize">{mode}</span><span className="mt-1 block text-[10px] text-[var(--text-muted)]">{mode === 'adaptive' ? 'Learns from successful recall and overconfidence.' : 'Uses the intervals configured below.'}</span></button>)}</div><div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{state.settings.revisionIntervals.map((days, index) => <label key={index} className="text-[10px] font-bold uppercase text-[var(--text-faint)]">Revision {index + 1}<div className="relative mt-2"><input type="number" min={1} max={365} className="input px-3 pr-9 text-sm" value={days} onChange={(event) => updateInterval(index, Number(event.target.value))} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] normal-case text-[var(--text-faint)]">days</span></div></label>)}</div></div></section>

        <DataSafetyPanel />

        <section className="panel overflow-hidden"><header className="border-b border-[var(--border)] px-5 py-4"><h2 className="text-sm font-bold">Data</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Stored locally in this browser</p></header><div className="p-5"><div className="flex flex-wrap gap-2"><Button onClick={exportExcelTracker} disabled={exportingExcel}><FileSpreadsheet size={15} /> {exportingExcel ? 'Creating Excel...' : 'Download Excel tracker'}</Button><Button variant="secondary" onClick={exportBackup}><Download size={15} /> Export backup</Button><Button variant="secondary" onClick={() => inputRef.current?.click()}><Upload size={15} /> Import backup</Button><input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={readImport} /></div><div className="mt-6 border-t border-[var(--border)] pt-5"><h3 className="text-xs font-bold uppercase text-[var(--red)]">Reset options</h3><div className="mt-3 flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={() => setResetKind('analytics')}>Reset analytics only</Button><Button variant="ghost" size="sm" onClick={() => setResetKind('progress')}>Reset problem progress</Button><Button variant="danger" size="sm" onClick={() => setResetKind('all')}>Reset all data</Button></div></div></div></section>
      </div>

      <Modal open={Boolean(resetKind)} onClose={() => setResetKind(null)} title="Confirm reset"><div className="p-6"><div className="flex h-10 w-10 items-center justify-center rounded-[7px] bg-[var(--red-soft)] text-[var(--red)]"><AlertTriangle size={19} /></div><h2 className="mt-4 text-lg font-bold">Confirm data reset</h2><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">This action cannot be undone. Export a backup first if this data may be needed later.</p><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => setResetKind(null)}>Cancel</Button><Button variant="danger" onClick={confirmReset}>Reset data</Button></div></div></Modal>
      <Modal open={Boolean(importCandidate)} onClose={() => setImportCandidate(null)} title="Confirm import"><div className="p-6"><div className="flex h-10 w-10 items-center justify-center rounded-[7px] bg-[var(--blue-soft)] text-[var(--blue)]"><Upload size={19} /></div><h2 className="mt-4 text-lg font-bold">Replace local data?</h2><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">The backup passed validation. Importing it will replace the progress currently stored in this browser.</p><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => setImportCandidate(null)}>Cancel</Button><Button onClick={() => { if (importCandidate) importState(importCandidate); setImportCandidate(null); setMessage({ tone: 'success', text: 'Backup imported.' }) }}>Import backup</Button></div></div></Modal>
    </div>
  )
}