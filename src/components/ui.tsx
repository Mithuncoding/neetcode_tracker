import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { AlertCircle, Check, Inbox, type LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'
import { STATUS_LABELS } from '../lib/status'
import type { Difficulty, ProblemStatus } from '../types'
import { useDialogFocus } from '../hooks/useDialogFocus'

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <button
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-[6px] border font-semibold transition-all active:translate-y-px active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0 disabled:active:scale-100',
        variant === 'primary' && 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--button-shadow)] hover:border-[var(--accent-strong)] hover:bg-[var(--accent-strong)]',
        variant === 'secondary' && 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]',
        variant === 'ghost' && 'border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]',
        variant === 'danger' && 'border-[var(--red)] bg-[var(--red)] text-white shadow-[0_1px_2px_rgba(184,67,67,0.25)] hover:brightness-90 hover:shadow-[0_3px_10px_rgba(184,67,67,0.28)]',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-5 text-sm',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function IconButton({
  icon: Icon,
  label,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-90 disabled:opacity-40 disabled:active:scale-100',
        className,
      )}
      {...props}
    >
      <Icon size={17} strokeWidth={1.8} />
    </button>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'amber' | 'blue' | 'red' | 'violet' }) {
  const tones = {
    neutral: 'bg-[var(--surface-muted)] text-[var(--text-muted)]',
    green: 'bg-[var(--green-soft)] text-[var(--green-strong)]',
    amber: 'bg-[var(--amber-soft)] text-[var(--amber)]',
    blue: 'bg-[var(--blue-soft)] text-[var(--blue)]',
    red: 'bg-[var(--red-soft)] text-[var(--red)]',
    violet: 'bg-[var(--violet-soft)] text-[var(--violet)]',
  }
  return <span className={cn('inline-flex h-6 items-center whitespace-nowrap rounded-[4px] px-2 text-[11px] font-bold', tones[tone])}>{children}</span>
}

export function StatusBadge({ status }: { status: ProblemStatus }) {
  const tone = status === 'mastered' || status === 'solved'
    ? 'green'
    : status === 'attempting'
      ? 'blue'
      : status === 'needs-revision'
        ? 'red'
        : status === 'solved-with-hint' || status === 'solved-after-solution'
          ? 'amber'
          : 'neutral'
  return <Badge tone={tone}>{STATUS_LABELS[status]}</Badge>
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <Badge tone={difficulty === 'Easy' ? 'green' : difficulty === 'Medium' ? 'amber' : 'red'}>{difficulty}</Badge>
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]', className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-normal text-[var(--text)]">{title}</h1>
        {description && <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function EmptyState({ title, description, icon: Icon = Inbox, action }: { title: string; description: string; icon?: LucideIcon; action?: ReactNode }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[7px] bg-[var(--surface-muted)] text-[var(--text-muted)]"><Icon size={20} /></div>
      <h3 className="text-sm font-bold text-[var(--text)]">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--text-muted)]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Notice({ children, tone = 'warning' }: { children: ReactNode; tone?: 'warning' | 'danger' | 'success' }) {
  const Icon = tone === 'success' ? Check : AlertCircle
  return (
    <div className={cn(
      'flex items-start gap-3 border-b px-4 py-3 text-xs font-medium',
      tone === 'warning' && 'border-[var(--amber)] bg-[var(--amber-soft)] text-[var(--amber)]',
      tone === 'danger' && 'border-[var(--red)] bg-[var(--red-soft)] text-[var(--red)]',
      tone === 'success' && 'border-[var(--green)] bg-[var(--green-soft)] text-[var(--green-strong)]',
    )}>
      <Icon className="mt-0.5 shrink-0" size={15} />
      {children}
    </div>
  )
}

export function Modal({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string }) {
  const dialogRef = useDialogFocus(open, onClose)
  if (!open) return null
  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={cn('modal-panel panel max-h-[88vh] w-full max-w-lg overflow-auto shadow-[var(--shadow)]', className)}>{children}</section>
    </div>
  )
}