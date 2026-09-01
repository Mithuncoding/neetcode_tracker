import { useEffect, useState } from 'react'
import { Award, BarChart3, BookOpenCheck, Box, BrainCircuit, BriefcaseBusiness, CalendarDays, CalendarRange, CheckCircle2, Clock3, Code2, Command, Crosshair, Focus, LayoutDashboard, ListChecks, Menu, Search, Settings, Shapes, Undo2, X, type LucideIcon } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate, type NavigateFunction } from 'react-router-dom'
import { useTracker } from '../context/useTracker'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { PYTHON_LESSONS } from '../data/python-course'
import { getProblemProgress, getRecommendations } from '../lib/analytics'
import { getMentorReadiness } from '../lib/mentor'
import { cn } from '../lib/utils'
import { ProblemPanel } from './ProblemPanel'
import { IconButton, Notice } from './ui'
import { useDialogFocus } from '../hooks/useDialogFocus'

interface NavigationItem {
  to: string
  label: string
  icon: LucideIcon
  shortcut?: string
}

const NAVIGATION_SECTIONS: Array<{ label: string; items: NavigationItem[] }> = [
  { label: 'Train', items: [
    { to: '/', label: 'Today', icon: LayoutDashboard, shortcut: 'D' },
    { to: '/focus', label: 'LeetCode session', icon: Focus, shortcut: 'F' },
    { to: '/mentor/recognition', label: 'Pattern sprint', icon: Crosshair },
    { to: '/revision', label: 'Recall queue', icon: Clock3, shortcut: 'R' },
  ] },
  { label: 'Learn', items: [
    { to: '/mentor/python', label: 'Python mastery', icon: Code2, shortcut: 'P' },
    { to: '/mentor/curriculum', label: 'Pattern library', icon: BookOpenCheck },
    { to: '/mentor/lab', label: 'Visual lab', icon: Box, shortcut: 'V' },
    { to: '/mentor', label: 'Coach', icon: BrainCircuit, shortcut: 'M' },
  ] },
  { label: 'Practice & progress', items: [
    { to: '/problems', label: 'Problem library', icon: ListChecks },
    { to: '/topics', label: 'Skill map', icon: Shapes },
    { to: '/plan', label: 'Training plan', icon: CalendarRange },
    { to: '/interview', label: 'Mock interview', icon: BriefcaseBusiness },
    { to: '/analytics', label: 'Evidence', icon: BarChart3 },
    { to: '/calendar', label: 'History', icon: CalendarDays },
    { to: '/achievements', label: 'Milestones', icon: Award },
  ] },
]

const NAVIGATION = NAVIGATION_SECTIONS.flatMap((section) => section.items)

export interface WorkspaceOutletContext {
  openProblem: (problemId: string, start?: boolean) => void
}

function goToShortcut(key: string, navigate: NavigateFunction) {
  if (key === 'd') navigate('/')
  if (key === 'm') navigate('/mentor')
  if (key === 'p') navigate('/mentor/python')
  if (key === 'v') navigate('/mentor/lab')
  if (key === 'r') navigate('/revision')
  if (key === 'f') navigate('/focus')
}

export function AppShell() {
  const { state, startTimer, recoveredFromBackup, storageHealthy, canUndo, undoLabel, undo, dismissUndo } = useTracker()
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [currentTime] = useState(() => Date.now())
  const searchDialogRef = useDialogFocus(searchOpen, () => setSearchOpen(false))
  const mobileMenuRef = useDialogFocus(mobileMenuOpen, () => setMobileMenuOpen(false))
  const readiness = getMentorReadiness(state, ROADMAP_PROBLEMS)
  const pythonCompleted = PYTHON_LESSONS.filter((lesson) => state.mentor.pythonCourse[lesson.id]?.completedAt).length
  const due = Object.values(state.progress).filter((progress) => progress.nextRevisionAt && Date.parse(progress.nextRevisionAt) <= currentTime).length
  const openProblem = (problemId: string, start = false) => {
    setSelectedProblemId(problemId)
    if (start) startTimer(problemId)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setMobileMenuOpen(false)
        setSelectedProblemId(null)
        return
      }
      if (typing) return
      if (event.key === '/') {
        event.preventDefault()
        setSearchOpen(true)
      } else if (event.key.toLowerCase() === 'n') {
        const next = getRecommendations(state, ROADMAP_PROBLEMS, 1)[0]
        if (next) setSelectedProblemId(next.problem.id)
      } else {
        goToShortcut(event.key.toLowerCase(), navigate)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate, state])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  const normalizedQuery = query.trim().toLowerCase()
  const searchResults = normalizedQuery
    ? ROADMAP_PROBLEMS.filter((problem) => `${problem.title} ${problem.topic} ${problem.patterns.join(' ')} ${problem.leetcodeNumber} ${getProblemProgress(state, problem.id).notes}`.toLowerCase().includes(normalizedQuery)).slice(0, 8)
    : getRecommendations(state, ROADMAP_PROBLEMS, 6).map(({ problem }) => problem)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="flex h-[76px] items-center gap-3 border-b border-[var(--sidebar-border)] px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[7px] bg-[var(--accent)] text-[var(--accent-contrast)]"><Crosshair size={20} strokeWidth={2.3} /></div>
          <div><p className="text-sm font-extrabold leading-tight text-[var(--sidebar-text)]">Mithun&apos;s</p><p className="mt-0.5 text-[10px] font-bold uppercase text-[var(--sidebar-muted)]">Interview Studio</p></div>
        </div>
        <div className="px-3 py-3"><button type="button" onClick={() => setSearchOpen(true)} className="flex h-10 w-full items-center gap-2 rounded-[6px] border border-[var(--sidebar-border)] bg-[var(--sidebar-raised)] px-3 text-xs font-semibold text-[var(--sidebar-muted)] hover:border-[var(--sidebar-muted)] hover:text-[var(--sidebar-text)]"><Search size={15} /><span className="flex-1 text-left">Search workspace</span><kbd className="rounded border border-[var(--sidebar-border)] px-1.5 py-0.5 font-mono text-[9px]">/</kbd></button></div>
        <nav className="flex-1 overflow-y-auto px-3 pb-3" aria-label="Main navigation">
          {NAVIGATION_SECTIONS.map((section) => <section key={section.label} className="mt-3 first:mt-0"><p className="mb-1.5 px-3 text-[9px] font-extrabold uppercase text-[var(--sidebar-muted)]">{section.label}</p><div className="space-y-0.5">{section.items.map(({ to, label, icon: Icon, shortcut }) => (
            <NavLink key={to} to={to} end={to === '/' || to === '/mentor'} className={({ isActive }) => cn('flex h-9 items-center gap-3 rounded-[6px] px-3 text-xs font-semibold transition-colors', isActive ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-active-text)]' : 'text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-raised)] hover:text-[var(--sidebar-text)]')}>
              <Icon size={16} strokeWidth={1.8} /><span className="flex-1">{label}</span>{label === 'Recall queue' && due > 0 && <span className="metric-number rounded-full bg-[var(--red)] px-1.5 py-0.5 text-[9px] font-bold text-white">{due}</span>}{label === 'Python mastery' && <span className="metric-number text-[9px] text-[var(--sidebar-muted)]">{pythonCompleted}/48</span>}{shortcut && label !== 'Python mastery' && <span className="font-mono text-[9px] text-[var(--sidebar-muted)]">{shortcut}</span>}
            </NavLink>
          ))}</div></section>)}
        </nav>
        <div className="border-t border-[var(--sidebar-border)] p-3">
          <div className="rounded-[7px] border border-[var(--sidebar-border)] bg-[var(--sidebar-raised)] p-3"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--blue)] text-xs font-extrabold text-white">M</div><div className="min-w-0"><p className="truncate text-xs font-bold text-[var(--sidebar-text)]">{state.mentor.displayName}</p><p className="truncate text-[9px] text-[var(--sidebar-muted)]">Recognition · Recall · Python</p></div></div><span className="metric-number text-xs font-extrabold text-[var(--sidebar-active-text)]">{readiness.score}%</span></div><div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--sidebar-border)]"><div className="h-full bg-[var(--accent)]" style={{ width: `${readiness.score}%` }} /></div></div>
          <NavLink to="/settings" className="mt-2 flex h-8 items-center gap-2 rounded-[5px] px-2 text-[10px] font-bold text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-border)] hover:text-[var(--sidebar-text)]"><Settings size={14} /> Studio settings</NavLink>
        </div>
      </aside>
      <main className="min-w-0">
        {(recoveredFromBackup || !storageHealthy) && <Notice tone={storageHealthy ? 'warning' : 'danger'}>{storageHealthy ? 'The primary save was invalid, so your latest valid backup was restored.' : 'Progress could not be saved. Export a backup before closing this tab.'}</Notice>}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] px-4 text-[var(--sidebar-text)] backdrop-blur-md min-[901px]:hidden"><div className="flex items-center gap-2 text-sm font-extrabold"><Crosshair size={18} className="text-[var(--sidebar-active-text)]" /> Interview Studio</div><div className="flex gap-1"><IconButton icon={Search} label="Search problems" onClick={() => setSearchOpen(true)} className="border-[var(--sidebar-border)] bg-[var(--sidebar-raised)] text-[var(--sidebar-muted)]" /><IconButton icon={Menu} label="Open workspace menu" onClick={() => setMobileMenuOpen(true)} className="border-[var(--sidebar-border)] bg-[var(--sidebar-raised)] text-[var(--sidebar-muted)]" /></div></header>
        <Outlet context={{ openProblem } satisfies WorkspaceOutletContext} />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-[68px] grid-cols-5 border-t border-[var(--border)] bg-[var(--surface)] px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md min-[901px]:hidden" aria-label="Mobile navigation">
        {[
          { to: '/', label: 'Today', icon: LayoutDashboard, badge: 0 },
          { to: '/mentor/recognition', label: 'Patterns', icon: Crosshair, badge: 0 },
          { to: '/focus', label: 'Focus', icon: Focus, badge: 0 },
          { to: '/mentor/python', label: 'Python', icon: Code2, badge: 0 },
        ].map(({ to, label, icon: Icon, badge }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cn('relative flex flex-col items-center justify-center gap-1 rounded-[8px] text-[9px] font-bold transition-colors active:scale-95', isActive ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]')}>{({ isActive }) => (<><span className={cn('absolute top-1.5 h-1 w-1 rounded-full bg-[var(--accent)] transition-opacity', isActive ? 'opacity-100' : 'opacity-0')} /><span className="relative"><Icon size={19} strokeWidth={1.8} />{badge > 0 && <span className="metric-number absolute -right-2.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--red)] px-1 text-[8px] font-bold text-white">{badge}</span>}</span>{label}</>)}</NavLink>)}
        <button type="button" onClick={() => setMobileMenuOpen(true)} className="flex flex-col items-center justify-center gap-1 text-[var(--text-faint)] transition-colors active:scale-95"><Menu size={19} strokeWidth={1.8} /><span className="text-[9px] font-bold leading-none">More</span></button>
      </nav>
      {searchOpen && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-start justify-center bg-black/35 px-4 pt-[10vh] backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && setSearchOpen(false)}>
          <section ref={searchDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Search problems" className="modal-panel panel w-full max-w-xl overflow-hidden shadow-[var(--shadow)]">
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4"><Search size={18} className="text-[var(--text-faint)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-14 flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-faint)]" placeholder="Search problems, topics, or notes" /><IconButton icon={X} label="Close search" onClick={() => setSearchOpen(false)} className="border-transparent" /></div>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {!normalizedQuery && <p className="px-3 py-2 text-[10px] font-bold uppercase text-[var(--text-faint)]">Recommended next</p>}
              {searchResults.map((problem) => {
                const progress = getProblemProgress(state, problem.id)
                return <button key={problem.id} type="button" onClick={() => { openProblem(problem.id); setSearchOpen(false); setQuery('') }} className="flex w-full items-center gap-3 rounded-[6px] px-3 py-3 text-left hover:bg-[var(--surface-muted)]"><CheckCircle2 size={16} className={progress.solvedAt ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]'} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{problem.title}</p><p className="mt-0.5 truncate text-[10px] text-[var(--text-faint)]">#{problem.leetcodeNumber} · {problem.patterns[0]}</p></div><span className="text-[10px] font-bold text-[var(--text-faint)]">{problem.difficulty}</span></button>
              })}
              {!searchResults.length && <p className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">No matching problems</p>}
            </div>
            <footer className="flex items-center gap-2 border-t border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-[9px] font-semibold text-[var(--text-faint)]"><Command size={12} /> Search also includes your personal notes</footer>
          </section>
        </div>
      )}
      {mobileMenuOpen && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] min-[901px]:hidden" onMouseDown={(event) => event.target === event.currentTarget && setMobileMenuOpen(false)}><aside ref={mobileMenuRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Workspace menu" className="drawer absolute inset-y-0 right-0 flex w-[min(88vw,360px)] flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]"><header className="flex h-16 items-center justify-between border-b border-[var(--border)] px-5"><div><p className="text-sm font-extrabold">Interview Studio</p><p className="text-[10px] text-[var(--text-faint)]">Your complete training workspace</p></div><IconButton icon={X} label="Close workspace menu" onClick={() => setMobileMenuOpen(false)} /></header><nav className="flex-1 space-y-1 overflow-y-auto p-3">{[
        ...NAVIGATION,
        { to: '/settings', label: 'Studio settings', icon: Settings },
      ].map(({ to, label, icon: Icon }) => <NavLink key={`mobile-${to}`} to={to} end={to === '/'} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => cn('flex h-11 items-center gap-3 rounded-[6px] px-3 text-sm font-semibold', isActive ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)]')}><Icon size={18} /><span className="flex-1">{label}</span>{label === 'Recall queue' && due > 0 && <span className="rounded-full bg-[var(--red)] px-2 py-0.5 text-[9px] font-bold text-white">{due}</span>}</NavLink>)}</nav><footer className="border-t border-[var(--border)] p-5"><div className="mb-2 flex justify-between text-[10px] font-bold uppercase text-[var(--text-faint)]"><span>Interview readiness</span><span>{readiness.score}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]"><div className="h-full bg-[var(--accent)]" style={{ width: `${readiness.score}%` }} /></div></footer></aside></div>}
      <ProblemPanel key={selectedProblemId ?? 'closed'} problemId={selectedProblemId} onClose={() => setSelectedProblemId(null)} />
      {canUndo && <div role="status" aria-live="polite" className="fixed bottom-20 right-4 z-50 flex max-w-sm items-center gap-3 rounded-[7px] border border-[var(--border-strong)] bg-[var(--text)] px-4 py-3 text-xs font-semibold text-[var(--surface)] shadow-[var(--shadow)] min-[901px]:bottom-5"><CheckCircle2 size={16} className="shrink-0 text-[var(--accent)]" /><span className="min-w-0 flex-1 truncate">{undoLabel}</span><button type="button" onClick={undo} className="flex items-center gap-1 font-bold text-[var(--accent-strong)]"><Undo2 size={14} /> Undo</button><button type="button" aria-label="Dismiss undo" onClick={dismissUndo}><X size={14} /></button></div>}
    </div>
  )
}