import { BadgeCheck, FileText, IdCard, Link2, PenLine, Sparkles, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type SourceKind = 'client' | 'ai' | 'id' | 'document' | 'linked' | 'advisor' | 'manual' | 'estimate' | 'confirmed'

const config: Record<SourceKind, { icon: ReactNode; className: string; label: string }> = {
  client: { icon: <PenLine className="size-3" />, className: 'text-ink-3', label: 'Typed by you' },
  manual: { icon: <PenLine className="size-3" />, className: 'text-ink-3', label: 'Added manually' },
  ai: { icon: <Sparkles className="size-3" />, className: 'text-ai', label: 'Suggested by AI' },
  id: { icon: <IdCard className="size-3" />, className: 'text-ai', label: 'From your ID' },
  document: { icon: <FileText className="size-3" />, className: 'text-ai', label: 'From a document' },
  linked: { icon: <Link2 className="size-3" />, className: 'text-success', label: 'Linked account' },
  estimate: { icon: <Sparkles className="size-3" />, className: 'text-ai', label: 'Estimated' },
  advisor: { icon: <UserRound className="size-3" />, className: 'text-advisor', label: 'From your Wealth Manager' },
  confirmed: { icon: <BadgeCheck className="size-3" />, className: 'text-success', label: 'Confirmed' },
}

/** Tiny provenance label: where a value came from. */
export function SourceTag({ kind, label, className }: { kind: SourceKind; label?: ReactNode; className?: string }) {
  const c = config[kind]
  return (
    <span className={cn('inline-flex items-center gap-1 text-[12px] leading-none whitespace-nowrap', c.className, className)}>
      {c.icon}
      {label ?? c.label}
    </span>
  )
}
