import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { concentric, radius } from '../../tokens/tokens'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export const cardPadding: Record<CardPadding, number> = { none: 0, sm: 12, md: 16, lg: 24 }

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: 'surface' | 'muted' | 'faded' | 'outline'
  padding?: CardPadding
  /** Radius of the most-rounded element touching the card's inner edge. 0 for text-only cards. */
  inner?: number
  interactive?: boolean
}

export function Card({ tone = 'surface', padding = 'md', inner = radius.control, interactive, className, style, ...rest }: CardProps) {
  const pad = cardPadding[padding]
  return (
    <div
      className={cn(
        tone === 'surface' && 'bg-surface',
        tone === 'muted' && 'bg-muted',
        tone === 'faded' && 'bg-surface/55',
        tone === 'outline' && 'border border-line bg-surface',
        interactive && 'cursor-pointer transition-shadow hover:shadow-float',
        className,
      )}
      style={{ padding: pad, borderRadius: concentric(inner, Math.max(pad, 6)), ...style }}
      {...rest}
    />
  )
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-[15px] font-medium text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[13px] text-ink-3">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
