import { Award, Check, LockKeyhole, Trophy } from 'lucide-react'
import { format } from 'date-fns'
import { PageHeader, ProgressBar } from '../components/ui'
import { useTracker } from '../context/useTracker'
import { percent } from '../lib/utils'

export function AchievementsPage() {
  const { state } = useTracker()
  const unlocked = state.achievements.filter((achievement) => achievement.unlockedAt)
  return (
    <div className="page-content">
      <PageHeader title="Achievements" description={`${unlocked.length} of ${state.achievements.length} unlocked`} />
      <section className="panel mb-4 flex flex-col gap-6 p-6 sm:flex-row sm:items-center"><div className="flex h-14 w-14 items-center justify-center rounded-[7px] bg-[var(--amber-soft)] text-[var(--amber)]"><Trophy size={25} /></div><div className="flex-1"><div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-bold">Milestone progress</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Earned through consistent practice</p></div><span className="metric-number text-2xl font-extrabold">{percent(unlocked.length, state.achievements.length)}%</span></div><ProgressBar value={percent(unlocked.length, state.achievements.length)} className="mt-4" /></div></section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {state.achievements.map((achievement) => {
          const earned = Boolean(achievement.unlockedAt)
          return <article key={achievement.id} className={`panel flex min-h-32 items-start gap-4 p-5 ${earned ? '' : 'opacity-60'}`}><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[7px] ${earned ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-[var(--surface-muted)] text-[var(--text-faint)]'}`}>{earned ? <Award size={19} /> : <LockKeyhole size={17} />}</div><div><div className="flex items-center gap-2"><h2 className="text-sm font-bold">{achievement.title}</h2>{earned && <Check size={14} className="text-[var(--accent)]" />}</div><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{achievement.description}</p><p className="mt-3 text-[10px] font-bold uppercase text-[var(--text-faint)]">{achievement.unlockedAt ? `Unlocked ${format(new Date(achievement.unlockedAt), 'MMM d, yyyy')}` : 'Locked'}</p></div></article>
        })}
      </section>
    </div>
  )
}