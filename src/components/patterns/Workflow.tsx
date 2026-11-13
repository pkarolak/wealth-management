import { motion } from 'motion/react'
import { ListChecks } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { CountDot, StatusIcon, type StatusKind } from '../primitives'

// Progress rail ----------------------------------------------------------------

export type RailItem = { id: string; title: string; state: StatusKind; meta?: ReactNode; count?: number; optional?: boolean }

/** Section navigation. Rows are 10px-radius so they nest in any 4px-padded container. */
export function ProgressRail({ items, active, onSelect, className }: { items: RailItem[]; active?: string; onSelect?: (id: string) => void; className?: string }) {
  return (
    <nav className={cn('flex flex-col gap-0.5', className)}>
      {items.map((it) => {
        const on = it.id === active
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onSelect?.(it.id)}
            className={cn('flex h-11 items-center gap-3 rounded-control px-3 text-left transition-colors', on ? 'bg-surface shadow-soft' : 'hover:bg-surface/60')}
          >
            <StatusIcon status={it.state} size={18} />
            <span className={cn('flex-1 truncate text-[14px]', on ? 'font-medium text-ink' : it.state === 'done' ? 'text-ink-2' : 'text-ink-3')}>
              {it.title}
              {it.optional && <span className="ml-1.5 text-[12px] font-normal text-ink-4">Optional</span>}
            </span>
            {it.count ? <CountDot count={it.count} /> : it.meta && <span className="text-[12px] text-ink-4">{it.meta}</span>}
          </button>
        )
      })}
    </nav>
  )
}

// Task stack -------------------------------------------------------------------

export type StackItem = { id: string; label: ReactNode; meta?: ReactNode; icon?: ReactNode }

/** The reference "stack": the active task sits forward, neighbours recede. Text-only rows → 16px radius. */
export function TaskStack({ items, active, className }: { items: StackItem[]; active: number; className?: string }) {
  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      {items.map((it, i) => {
        const d = i - active
        const a = Math.abs(d)
        if (a > 3) return null
        const scale = [1, 0.92, 0.84, 0.76][a]
        const opacity = [1, 0.75, 0.45, 0.22][a]
        return (
          <motion.div
            key={it.id}
            layout
            animate={{ scale, opacity }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            style={{ zIndex: 10 - a, marginTop: i === 0 ? 0 : -6 }}
            className={cn(
              'flex w-full max-w-xl items-center gap-3 rounded-[16px] px-6 whitespace-nowrap',
              a === 0 ? 'h-[60px] bg-surface text-[18px] text-ink shadow-float' : 'h-[52px] bg-sunken/80 text-[16px] text-ink-3',
            )}
          >
            <span className="text-ink-4">{it.icon ?? <ListChecks className="size-4" />}</span>
            <span className="truncate">{it.label}</span>
            {it.meta && (
              <span className="text-ink-4">
                <span className="mx-1.5">•</span>
                {it.meta}
              </span>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// Kanban -----------------------------------------------------------------------

export type KanbanCardData = { id: string; title: ReactNode; status: StatusKind; meta?: ReactNode; onClick?: () => void }

/** Reference kanban: the first card in each column is solid, later ones fade back. */
export function KanbanColumn({ title, cards, count, className }: { title: ReactNode; cards: KanbanCardData[]; count?: number; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-3', className)}>
      <div className="flex items-baseline gap-2 px-1">
        <span className="text-[13px] text-ink-3">{title}</span>
        {count !== undefined && <span className="tabular text-[12px] text-ink-4">{count}</span>}
      </div>
      {cards.length === 0 && <div className="flex h-24 items-center justify-center rounded-[16px] border border-dashed border-line-strong text-[13px] text-ink-4">Nothing here</div>}
      {cards.map((c, i) => {
        const fade = Math.min(i, 2)
        const Comp = c.onClick ? 'button' : 'div'
        return (
          <Comp
            key={c.id}
            type={c.onClick ? 'button' : undefined}
            onClick={c.onClick}
            className={cn('flex min-h-28 flex-col gap-3 rounded-[16px] p-4 text-left transition-colors', fade === 0 ? 'bg-surface' : 'bg-surface/55', c.onClick && 'hover:bg-surface')}
          >
            <StatusIcon status={c.status} faded={fade > 0} />
            <span className={cn('text-[14px] leading-snug', ['text-ink', 'text-ink-2', 'text-ink-4'][fade])}>{c.title}</span>
            {c.meta && <span className="mt-auto text-[12px] text-ink-4">{c.meta}</span>}
          </Comp>
        )
      })}
    </div>
  )
}
