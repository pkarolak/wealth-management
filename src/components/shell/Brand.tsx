import { cn } from '../../lib/cn'

export const FIRM = 'Parker & Lane Wealth'

/** Serif N mark in a soft circle, after the Nevis assistant avatar. */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-sunken font-serif text-ink', className)} style={{ width: size, height: size, fontSize: size * 0.56 }}>
      N
    </span>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={30} />
      <span className="text-[15px] font-medium tracking-tight text-ink">{FIRM}</span>
    </span>
  )
}
