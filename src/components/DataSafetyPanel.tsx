import { useRef, useState, type ChangeEvent } from 'react'
import { format } from 'date-fns'
import { Download, History, KeyRound, RotateCcw, ShieldCheck, Upload } from 'lucide-react'
import { useTracker } from '../context/useTracker'
import { listBackups, readBackup } from '../lib/backups'
import { decryptBackup, encryptBackup } from '../lib/crypto'
import { parseImportedState, serializeState } from '../lib/storage'
import type { AppState } from '../types'
import { Button, Modal } from './ui'

function downloadText(value: string, filename: string, type: string) {
  const blob = new Blob([value], { type })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export function DataSafetyPanel() {
  const { state, importState, updateSettings } = useTracker()
  const encryptedInput = useRef<HTMLInputElement>(null)
  const [cryptoMode, setCryptoMode] = useState<'export' | 'import' | null>(null)
  const [passphrase, setPassphrase] = useState('')
  const [encryptedPayload, setEncryptedPayload] = useState<string | null>(null)
  const [restoreIndex, setRestoreIndex] = useState<number | null>(null)
  const [importCandidate, setImportCandidate] = useState<AppState | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const backups = listBackups()

  async function handleCrypto() {
    setBusy(true)
    setError(null)
    try {
      if (cryptoMode === 'export') {
        const encrypted = await encryptBackup(serializeState(state), passphrase)
        downloadText(
          encrypted,
          `neetcode-250-encrypted-${new Date().toISOString().slice(0, 10)}.nc250`,
          'application/octet-stream',
        )
        setMessage('Encrypted sync file created.')
      } else if (cryptoMode === 'import' && encryptedPayload) {
        const decrypted = await decryptBackup(encryptedPayload, passphrase)
        setImportCandidate(parseImportedState(decrypted))
      }
      setCryptoMode(null)
      setPassphrase('')
      setEncryptedPayload(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Encrypted backup failed.')
    } finally {
      setBusy(false)
    }
  }

  async function readEncryptedFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setEncryptedPayload(await file.text())
    setCryptoMode('import')
    setPassphrase('')
    setError(null)
  }

  function confirmRestore() {
    if (restoreIndex === null) return
    const backup = readBackup(restoreIndex)
    if (backup) {
      importState(parseImportedState(JSON.stringify(backup)))
      setMessage('Recovery point restored.')
    }
    setRestoreIndex(null)
  }

  return (
    <section className="panel overflow-hidden">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div><h2 className="text-sm font-bold">Recovery & encrypted sync</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Local snapshots and portable AES-GCM backup files</p></div><ShieldCheck size={18} className="text-[var(--accent)]" /></header>
      <div className="p-5">
        {(message || error) && <div role="status" className={`mb-4 rounded-[6px] px-3 py-2 text-xs font-semibold ${error ? 'bg-[var(--red-soft)] text-[var(--red)]' : 'bg-[var(--accent-soft)] text-[var(--accent-strong)]'}`}>{error ?? message}</div>}
        <div className="flex flex-wrap items-end gap-2">
          <label className="mr-auto block text-[10px] font-bold uppercase text-[var(--text-faint)]">Recovery points kept<select className="input mt-2 w-32 px-3 text-sm normal-case" value={state.settings.backupRetention} onChange={(event) => updateSettings({ backupRetention: Number(event.target.value) })}>{[3, 5, 7, 10].map((value) => <option key={value}>{value}</option>)}</select></label>
          <Button variant="secondary" onClick={() => { setCryptoMode('export'); setError(null); setPassphrase('') }}><KeyRound size={15} /> Export encrypted</Button>
          <Button variant="secondary" onClick={() => encryptedInput.current?.click()}><Upload size={15} /> Import encrypted</Button>
          <input ref={encryptedInput} type="file" accept=".nc250,application/json" className="hidden" onChange={readEncryptedFile} />
        </div>
        <div className="mt-6 border-t border-[var(--border)] pt-5"><div className="mb-3 flex items-center gap-2"><History size={15} className="text-[var(--text-faint)]" /><h3 className="text-xs font-bold">Recent recovery points</h3></div>{backups.length ? <div className="divide-y divide-[var(--border)]">{backups.map((backup) => <div key={backup.index} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="text-xs font-semibold">{format(new Date(backup.savedAt), 'MMM d, h:mm a')}</p><p className="mt-1 text-[10px] text-[var(--text-faint)]">{backup.completed} completed · {backup.attempts} attempts</p></div><Button size="sm" variant="ghost" onClick={() => setRestoreIndex(backup.index)}><RotateCcw size={13} /> Restore</Button></div>)}</div> : <p className="text-xs text-[var(--text-muted)]">Recovery points appear after progress changes.</p>}</div>
        <div className="mt-5 flex items-start gap-2 rounded-[6px] bg-[var(--blue-soft)] p-3 text-xs leading-5 text-[var(--blue)]"><Download size={14} className="mt-0.5 shrink-0" />Store the encrypted file in OneDrive, Dropbox, or another synced folder. The passphrase never leaves this browser.</div>
      </div>

      <Modal open={Boolean(cryptoMode)} onClose={() => setCryptoMode(null)} title={cryptoMode === 'export' ? 'Export encrypted backup' : 'Import encrypted backup'}><div className="p-6"><div className="flex h-10 w-10 items-center justify-center rounded-[7px] bg-[var(--violet-soft)] text-[var(--violet)]"><KeyRound size={18} /></div><h2 className="mt-4 text-lg font-bold">{cryptoMode === 'export' ? 'Protect your sync file' : 'Unlock encrypted backup'}</h2><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Use at least 8 characters. This passphrase cannot be recovered.</p><label className="mt-5 block text-[10px] font-bold uppercase text-[var(--text-faint)]">Passphrase<input type="password" autoComplete="new-password" className="input mt-2 px-3 text-sm normal-case" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} /></label>{error && <p className="mt-3 text-xs font-semibold text-[var(--red)]">{error}</p>}<div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => setCryptoMode(null)}>Cancel</Button><Button disabled={busy || passphrase.length < 8} onClick={handleCrypto}>{busy ? 'Working…' : cryptoMode === 'export' ? 'Encrypt & download' : 'Decrypt & restore'}</Button></div></div></Modal>
      <Modal open={restoreIndex !== null} onClose={() => setRestoreIndex(null)} title="Restore recovery point"><div className="p-6"><div className="flex h-10 w-10 items-center justify-center rounded-[7px] bg-[var(--amber-soft)] text-[var(--amber)]"><RotateCcw size={18} /></div><h2 className="mt-4 text-lg font-bold">Replace current progress?</h2><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">The selected recovery point will replace the current local state. A new snapshot of the current state is created first.</p><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => setRestoreIndex(null)}>Cancel</Button><Button onClick={confirmRestore}>Restore point</Button></div></div></Modal>
      <Modal open={Boolean(importCandidate)} onClose={() => setImportCandidate(null)} title="Confirm encrypted import"><div className="p-6"><div className="flex h-10 w-10 items-center justify-center rounded-[7px] bg-[var(--blue-soft)] text-[var(--blue)]"><ShieldCheck size={18} /></div><h2 className="mt-4 text-lg font-bold">Replace current progress?</h2><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">The encrypted file was authenticated and validated. Importing it will replace this browser&apos;s current data.</p><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => setImportCandidate(null)}>Cancel</Button><Button onClick={() => { if (importCandidate) importState(importCandidate); setImportCandidate(null); setMessage('Encrypted backup restored.') }}>Import backup</Button></div></div></Modal>
    </section>
  )
}