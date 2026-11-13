import { motion } from 'motion/react'
import { cn } from '../../lib/cn'
import { fieldById, sectionById } from '../../schema/onboarding'
import { usePresenceOf } from '../../store/hooks'
import type { Person } from '../../store/types'
import { Avatar, Tooltip } from '../primitives'

export type PresenceTone = 'blue' | 'pink'

/** Ring colour for whatever the person is focused on; the tag itself stays neutral. */
export const presenceRing: Record<PresenceTone, string> = {
  blue: 'ring-ai/30',
  pink: 'ring-advisor/30',
}

/** Name tag like a multiplayer cursor label. 4px padding around a 20px avatar → 14px radius. */
const tones: Record<PresenceTone, { pill: string; avatar: { bg: string; fg: string } }> = {
  blue: { pill: 'bg-ai-soft text-ai ring-ai/15', avatar: { bg: 'var(--color-surface)', fg: 'var(--color-ai)' } },
  pink: { pill: 'bg-advisor-soft text-advisor ring-advisor/15', avatar: { bg: 'var(--color-surface)', fg: 'var(--color-advisor)' } },
}

/** One hue per tag: soft tinted pill, accent name, white avatar with accent initials. */
export function PresenceLabel({ person, tone = 'blue', detail, className }: { person: Pick<Person, 'name' | 'avatar'>; tone?: PresenceTone; detail?: string; className?: string }) {
  const t = tones[tone]
  return (
    <motion.span
      initial={{ opacity: 0, y: 2, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn('inline-flex h-7 items-center gap-1.5 rounded-[14px] p-1 pr-2.5 text-[13px] font-medium whitespace-nowrap shadow-soft ring-1 ring-inset', t.pill, className)}
    >
      <Avatar name={person.name} src={person.avatar} size="xs" tint={t.avatar} />
      {person.name.split(' ')[0]}
      {detail && <span className="font-normal opacity-70">{detail}</span>}
    </motion.span>
  )
}

/** "Emily is here" status for headers: live dot plus where they are. */
/** Lightweight header chip: avatar with a live dot and a first name; details in the tooltip. */
export function PresenceChip({ person, caseId, className }: { person?: Person; caseId: string; className?: string }) {
  const p = usePresenceOf(person?.id, caseId)
  if (!person) return null
  const first = person.name.split(' ')[0]
  const where = p?.fieldId ? fieldById[p.fieldId]?.label : p?.sectionId ? sectionById[p.sectionId]?.title : undefined
  return (
    <Tooltip content={`${person.name}${person.title ? ` · ${person.title}` : ''} — ${p ? `here now${where ? `, on ${where}` : ''}` : 'away'}`} side="bottom">
      <span className={cn('inline-flex items-center gap-2 rounded-full p-0.5 pr-3 text-[13px] text-ink-2', className)}>
        <Avatar name={person.name} src={person.avatar} size="sm" online={p ? true : undefined} />
        {first}
      </span>
    </Tooltip>
  )
}

export function PresenceStatus({ person, caseId, className }: { person?: Person; caseId: string; className?: string }) {
  const p = usePresenceOf(person?.id, caseId)
  if (!person) return null
  const where = p?.fieldId ? fieldById[p.fieldId]?.label : p?.sectionId ? sectionById[p.sectionId]?.title : undefined
  return (
    <span className={cn('inline-flex items-center gap-2 text-[13px]', p ? 'text-ink-2' : 'text-ink-4', className)}>
      <span className="relative flex size-2">
        {p && <span className="absolute inset-0 animate-ping rounded-full bg-success/60" />}
        <span className={cn('relative size-2 rounded-full', p ? 'bg-success' : 'bg-ink-4/60')} />
      </span>
      {p ? (
        <span>
          {person.name.split(' ')[0]} is here{where && <span className="text-ink-4"> · {where}</span>}
        </span>
      ) : (
        <span>{person.name.split(' ')[0]} is away</span>
      )}
    </span>
  )
}
