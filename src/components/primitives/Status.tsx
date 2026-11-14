import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { color } from '../../tokens/tokens'

export type StatusKind = 'waiting' | 'progress' | 'done' | 'attention' | 'idle'

/** Status glyphs from the reference kanban: a quarter pie for waiting, half for in progress, a check for done. */
export function StatusIcon({ status, size = 18, faded }: { status: StatusKind; size?: number; faded?: boolean }) {
  const r = 7
  const c = 9
  const style = { opacity: faded ? 0.5 : 1 }
  if (status === 'done') {
    return (
      <svg role="img" width={size} height={size} viewBox="0 0 18 18" style={style} aria-label="Done">
        <circle cx={c} cy={c} r={8} fill={color.ink} />
        <path d="M5.6 9.2l2.2 2.2 4.6-4.7" stroke="#fff" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (status === 'attention') {
    return (
      <svg role="img" width={size} height={size} viewBox="0 0 18 18" style={style} aria-label="Needs attention">
        <circle cx={c} cy={c} r={8} fill={color.danger} />
        <path d="M9 5v5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
        <circle cx={c} cy={12.6} r={1} fill="#fff" />
      </svg>
    )
  }
  if (status === 'idle') {
    return (
      <svg role="img" width={size} height={size} viewBox="0 0 18 18" style={style} aria-label="Not started">
        <circle cx={c} cy={c} r={r} fill="none" stroke={color.ink4} strokeWidth={1.6} strokeDasharray="2.4 2.4" />
      </svg>
    )
  }
  const tint = status === 'waiting' ? color.waiting : color.progress
  const pie = status === 'waiting' ? `M${c} ${c} L${c} ${c - 4.6} A4.6 4.6 0 1 1 ${c - 4.6} ${c} Z` : `M${c} ${c - 4.6} A4.6 4.6 0 0 1 ${c} ${c + 4.6} Z`
  return (
    <svg role="img" width={size} height={size} viewBox="0 0 18 18" style={style} aria-label={status === 'waiting' ? 'Waiting' : 'In progress'}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={tint} strokeWidth={1.8} />
      <path d={pie} fill={tint} />
    </svg>
  )
}

type BadgeTone = 'neutral' | 'ai' | 'advisor' | 'waiting' | 'progress' | 'success' | 'danger' | 'ink'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-ink-2',
  ai: 'bg-ai-soft text-ai',
  advisor: 'bg-advisor-soft text-advisor',
  waiting: 'bg-waiting-soft text-waiting',
  progress: 'bg-progress-soft text-progress-ink',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  ink: 'bg-ink text-white',
}

export function Badge({ tone = 'neutral', children, icon, className }: { tone?: BadgeTone; children: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium whitespace-nowrap', tones[tone], className)}>
      {icon}
      {children}
    </span>
  )
}

export function CountDot({ count, className }: { count: number; className?: string }) {
  if (!count) return null
  return (
    <span className={cn('inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-advisor px-1 text-[11px] font-semibold text-white', className)}>
      {count}
    </span>
  )
}

export function ProgressBar({ value, className, tone = 'ink' }: { value: number; className?: string; tone?: 'ink' | 'waiting' | 'progress' }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-sunken', className)}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', tone === 'ink' ? 'bg-ink' : tone === 'waiting' ? 'bg-waiting' : 'bg-progress')}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}
