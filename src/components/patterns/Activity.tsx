import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Mail } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { relativeTime } from '../../lib/format'
import type { Activity, EmailPayload, Person } from '../../store/types'
import { Avatar, PersonChip } from '../primitives'
import { Thumbs } from './SuggestionDiff'

type EmailPreviewProps = {
  from?: Person
  to: (Person | string)[]
  subject?: string
  body: string
  /** Show the rough draft struck through above the polished body. */
  rough?: string
  feedback?: boolean
  footer?: ReactNode
  className?: string
}

/** Email card from the reference: From / To person chips, divider, body. Text-only padding 20 → 24 radius. */
export function EmailPreview({ from, to, subject, body, rough, feedback, footer, className }: EmailPreviewProps) {
  const toPeople = to.map((t) => (typeof t === 'string' ? { name: t } : t))
  const paragraphs = body.split(/\n{2,}/)
  return (
    <div className={cn('flex flex-col rounded-[24px] bg-surface p-5', className)}>
      <div className="grid grid-cols-[48px_1fr] items-center gap-x-3 gap-y-2 text-[14px] text-ink-3">
        {from && (
          <>
            <span>From</span>
            <span className="flex flex-wrap gap-2">
              <PersonChip name={from.name} src={from.avatar} size="sm" />
            </span>
          </>
        )}
        <span>To</span>
        <span className="flex flex-wrap gap-2">
          {toPeople.map((p) => (
            <PersonChip key={p.name} name={p.name} src={'avatar' in p ? p.avatar : undefined} size="sm" />
          ))}
        </span>
        {subject && (
          <>
            <span>Subject</span>
            <span className="truncate text-ink">{subject}</span>
          </>
        )}
      </div>
      <div className="my-4 h-px bg-line" />
      {rough && <p className="mb-4 text-[14px] leading-relaxed text-ink-4 line-through">{rough}</p>}
      <div className="flex flex-col gap-3 text-[14px] leading-relaxed">
        {paragraphs.map((p, i) =>
          rough ? (
            <p key={i}>
              <mark className="rounded-[3px] bg-ai-soft px-1 py-0.5 whitespace-pre-wrap text-ai [box-decoration-break:clone]">{p}</mark>
            </p>
          ) : (
            <p key={i} className="whitespace-pre-wrap text-ink-2">
              {p}
            </p>
          ),
        )}
      </div>
      {(feedback || footer) && (
        <div className="mt-4 flex items-center gap-2">
          {feedback && <Thumbs />}
          <div className="ml-auto flex gap-2">{footer}</div>
        </div>
      )}
    </div>
  )
}

/** Case timeline. Notification emails tuck under their entry and expand on click. */
export function ActivityFeed({ items, people, limit, className }: { items: Activity[]; people: Record<string, Person>; limit?: number; className?: string }) {
  const [open, setOpen] = useState<string>()
  const shown = limit ? items.slice(0, limit) : items
  return (
    <ol className={cn('flex flex-col', className)}>
      {shown.map((a, i) => {
        const actor = people[a.actorId]
        const isOpen = open === a.id
        return (
          <li key={a.id} className="relative flex gap-3 pb-4">
            {i < shown.length - 1 && <span className="absolute top-7 bottom-0 left-[11.5px] w-px bg-line" />}
            <Avatar name={actor?.name ?? 'AI'} src={actor?.avatar} size="sm" className="mt-0.5" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[14px] leading-snug text-ink-2">{a.text}</span>
              <span className="flex items-center gap-2 text-[12px] text-ink-4">
                {relativeTime(a.ts)}
                {a.email && (
                  <button type="button" onClick={() => setOpen(isOpen ? undefined : a.id)} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-ink-3 hover:text-ink">
                    <Mail className="size-3" />
                    Email sent
                    <ChevronDown className={cn('size-3 transition-transform', isOpen && 'rotate-180')} />
                  </button>
                )}
              </span>
              <AnimatePresence initial={false}>
                {isOpen && a.email && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <EmailFromPayload email={a.email} people={people} className="mt-2 border border-line" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function EmailFromPayload({ email, people, className }: { email: EmailPayload; people: Record<string, Person>; className?: string }) {
  const byName = (n: string) => Object.values(people).find((p) => p.name === n) ?? n
  return <EmailPreview from={people[email.fromId]} to={email.to.map(byName)} subject={email.subject} body={email.body} className={className} />
}
