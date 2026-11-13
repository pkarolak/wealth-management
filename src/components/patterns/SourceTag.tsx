import { BadgeCheck, FileText, IdCard, Link2, PenLine, Sparkles, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { useOptionalViewer } from './CaseContext'

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

/** The same provenance, told to the Wealth Manager: the client is named, and "you" is her. */
const advisorLabel = (kind: SourceKind, client: string): string =>
  ({
    client: `Typed by ${client}`,
    manual: `Added by ${client}`,
    ai: `AI draft · approved by ${client}`,
    id: `From ${client}’s ID`,
    document: `From ${client}’s document`,
    linked: 'Linked account',
    estimate: `${client}’s estimate`,
    advisor: 'Added by you',
    confirmed: 'Confirmed by you',
  })[kind]

/** Tiny provenance label: where a value came from. Wording follows the viewer. */
export function SourceTag({ kind, label, className }: { kind: SourceKind; label?: ReactNode; className?: string }) {
  const c = config[kind]
  const viewer = useOptionalViewer()
  const client = viewer?.mode === 'advisor' ? (viewer.clientFirst ?? 'the client') : undefined
  const text = client ? (typeof label === 'string' ? label.replace(/\byour\b/gi, `${client}’s`) : (label ?? advisorLabel(kind, client))) : (label ?? c.label)
  return (
    <span className={cn('inline-flex items-center gap-1 text-[12px] leading-none whitespace-nowrap', c.className, className)}>
      {c.icon}
      {text}
    </span>
  )
}
