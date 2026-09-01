import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, RefreshCw, Unplug } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTracker } from '../context/useTracker'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { fetchLeetCodeProfile, LEETCODE_USERNAME } from '../lib/leetcode'
import { cn } from '../lib/utils'
import { Badge, Button } from './ui'

export function LeetCodeProfilePanel({ className }: { className?: string }) {
  const { state, saveLeetCodeProfile } = useTracker()
  const navigate = useNavigate()
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const profile = state.mentor.leetcodeProfile

  const syncProfile = async () => {
    setSyncing(true)
    setError(null)
    try {
      saveLeetCodeProfile(await fetchLeetCodeProfile(LEETCODE_USERNAME, ROADMAP_PROBLEMS))
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'LeetCode sync failed.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <article className={cn('panel overflow-hidden', className)}>
      <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div><div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">LeetCode · {LEETCODE_USERNAME}</p><Badge tone="green">Daily auto-sync</Badge></div><h2 className="mt-2 text-base font-bold">Public practice pulse</h2></div>
        <Button size="sm" variant="secondary" onClick={syncProfile} disabled={syncing}><RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing' : 'Sync now'}</Button>
      </header>

      {profile ? <>
        <div className="p-5">
          <div className="flex items-end justify-between gap-4"><div><p className="metric-number text-4xl font-extrabold">{profile.totalSolved}</p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--text-faint)]">Public accepted</p></div><div className="text-right"><p className="metric-number text-sm font-bold">{profile.ranking ? `#${profile.ranking.toLocaleString()}` : '-'}</p><p className="mt-1 text-[9px] font-bold uppercase text-[var(--text-faint)]">Global rank</p></div></div>
          <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-[6px] border border-[var(--border)] bg-[var(--border)]">{[
            ['Easy', profile.easySolved, 'text-[var(--green-strong)]'],
            ['Medium', profile.mediumSolved, 'text-[var(--amber)]'],
            ['Hard', profile.hardSolved, 'text-[var(--red)]'],
          ].map(([label, value, color]) => <div key={label} className="bg-[var(--surface-raised)] p-3 text-center"><p className={cn('metric-number text-lg font-extrabold', color as string)}>{value}</p><p className="mt-0.5 text-[9px] font-bold uppercase text-[var(--text-faint)]">{label}</p></div>)}</div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-[var(--text-muted)]"><span>Language <strong className="text-[var(--text)]">{profile.primaryLanguage?.replace('3', '') ?? 'Unknown'}</strong></span><span>Max streak <strong className="text-[var(--text)]">{profile.maxStreak ?? '-'}</strong></span><span>Acceptance <strong className="text-[var(--text)]">{profile.acceptanceRate === null ? '-' : `${profile.acceptanceRate}%`}</strong></span></div>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--surface-raised)] px-5 py-3"><p className="text-[9px] text-[var(--text-faint)]">Snapshot refreshed {formatDistanceToNow(new Date(profile.syncedAt), { addSuffix: true })}. Solves show exposure, not mastery.</p><div className="flex items-center gap-3"><button type="button" onClick={() => navigate('/mentor/leetcode')} className="text-[10px] font-bold text-[var(--accent)]">Reconcile history</button><a href={profile.source} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-[var(--blue)]">Open profile <ExternalLink size={11} /></a></div></footer>
      </> : <div className="p-5"><div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[var(--surface-muted)] text-[var(--text-faint)]"><Unplug size={18} /></div><p className="mt-4 text-sm font-bold">Connect the bundled profile snapshot</p><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">GitHub refreshes the public profile daily. Sync it here to see practice exposure beside measured in-app mastery.</p><Button className="mt-4" size="sm" onClick={syncProfile} disabled={syncing}><RefreshCw size={14} /> Sync LeetCode</Button></div>}
      {error && <p role="alert" className="border-t border-[var(--red)] bg-[var(--red-soft)] px-5 py-3 text-xs text-[var(--red)]">{error}</p>}
    </article>
  )
}