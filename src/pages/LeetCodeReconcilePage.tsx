import { useState } from 'react'
import {
  ArrowLeft,
  Check,
  ExternalLink,
  FileInput,
  ShieldCheck,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, DifficultyBadge, EmptyState, PageHeader } from '../components/ui'
import { useTracker } from '../context/useTracker'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { parseAcceptedProblemList } from '../lib/leetcode-import'

export function LeetCodeReconcilePage() {
  const { state, mergeLeetCodeMatches } = useTracker()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [applied, setApplied] = useState(false)
  const parsed = text.trim() ? parseAcceptedProblemList(text, ROADMAP_PROBLEMS) : null
  const existing = new Set(state.mentor.leetcodeProfile?.matchedProblemIds ?? [])
  const newMatches = parsed?.matchedProblems.filter((problem) => !existing.has(problem.id)) ?? []

  return (
    <div className="page-content">
      <PageHeader title="Reconcile LeetCode history" description="Match a copied accepted-problem list to the local roadmap without claiming independent mastery." actions={<Button variant="secondary" onClick={() => navigate('/mentor')}><ArrowLeft size={15} /> Mentor</Button>} />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <section className="panel overflow-hidden"><header className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4"><FileInput size={17} className="text-[var(--blue)]" /><div><h2 className="text-sm font-bold">Paste accepted problems</h2><p className="mt-0.5 text-[10px] text-[var(--text-faint)]">Titles, slugs, LeetCode URLs, CSV-like rows, or JSON</p></div></header><div className="p-5"><textarea aria-label="Accepted problem list" value={text} onChange={(event) => { setText(event.target.value); setApplied(false) }} className="input min-h-72 resize-y px-3 py-3 font-mono text-xs leading-6" placeholder={'Two Sum\nlongest-substring-without-repeating-characters\nhttps://leetcode.com/problems/number-of-islands/'} />{parsed && <div className="mt-4 grid grid-cols-3 gap-3"><div><p className="metric-number text-xl font-extrabold">{parsed.matchedProblems.length}</p><p className="text-[9px] font-bold uppercase text-[var(--text-faint)]">Matched</p></div><div><p className="metric-number text-xl font-extrabold">{newMatches.length}</p><p className="text-[9px] font-bold uppercase text-[var(--text-faint)]">New</p></div><div><p className="metric-number text-xl font-extrabold">{parsed.unmatched.length}</p><p className="text-[9px] font-bold uppercase text-[var(--text-faint)]">Unmatched</p></div></div>}<Button className="mt-5 w-full" disabled={!parsed?.matchedProblemIds.length || applied} onClick={() => { if (parsed) mergeLeetCodeMatches(parsed.matchedProblemIds); setApplied(true) }}><Check size={15} /> {applied ? 'History reconciled' : `Add ${newMatches.length} new roadmap matches`}</Button><p className="mt-3 text-[10px] leading-4 text-[var(--text-faint)]">This updates exposure coverage only. It creates no solve attempts and does not raise mastery or readiness.</p></div></section>
        <aside className="space-y-4"><section className="panel p-5"><div className="flex items-center gap-2"><ShieldCheck size={17} className="text-[var(--accent)]" /><h2 className="text-sm font-bold">Why paste is needed</h2></div><p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">LeetCode publicly exposes aggregate counts and recent accepted submissions, but not a reliable cross-origin complete accepted list for another static site. This importer keeps your credentials out of the app.</p><a href="https://leetcode.com/submissions/" target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[var(--accent)]">Open LeetCode submissions <ExternalLink size={13} /></a></section>{parsed ? <section className="panel overflow-hidden"><header className="border-b border-[var(--border)] px-5 py-4"><h2 className="text-sm font-bold">Match preview</h2></header>{parsed.matchedProblems.length ? <div className="max-h-80 divide-y divide-[var(--border)] overflow-y-auto">{parsed.matchedProblems.map((problem) => <div key={problem.id} className="flex items-center gap-3 px-5 py-3"><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{problem.title}</p><p className="mt-0.5 font-mono text-[9px] text-[var(--text-faint)]">#{problem.leetcodeNumber}</p></div><DifficultyBadge difficulty={problem.difficulty} />{existing.has(problem.id) && <Badge tone="neutral">Existing</Badge>}</div>)}</div> : <EmptyState title="No roadmap matches" description="Try one title or LeetCode slug per line." />}{parsed.unmatched.length > 0 && <div className="border-t border-[var(--border)] bg-[var(--amber-soft)] p-4"><p className="text-[10px] font-bold uppercase text-[var(--amber)]">Unmatched</p><p className="mt-2 text-[10px] leading-4 text-[var(--text-muted)]">{parsed.unmatched.slice(0, 8).join(' · ')}</p></div>}</section> : <section className="panel"><EmptyState icon={FileInput} title="Waiting for a list" description="Paste accepted titles to preview exact local matches before applying anything." /></section>}</aside>
      </div>
    </div>
  )
}