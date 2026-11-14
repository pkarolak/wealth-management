import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, CircleCheck } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { relativeTime } from '../../lib/format'
import { useStore } from '../../store/caseStore'
import { anchorLabel, isUnread } from '../../store/selectors'
import type { ClientCase, Thread } from '../../store/types'
import { Avatar, Switch, Tooltip } from '../primitives'
import { CommentThread } from './Comments'

/** The last word is someone else's, so the viewer owes a reply. */
const awaitingViewer = (t: Thread, viewerId: string) => !t.resolved && t.messages[t.messages.length - 1]?.authorId !== viewerId

/** Every conversation on a case as expandable rows: open ones first, then the ones waiting on the viewer, newest first. */
export function ThreadList({
  c,
  viewerId,
  openThread,
  onOpenThread,
  canResolve,
  waitingLabel,
  empty,
  onPick,
}: {
  c: ClientCase
  viewerId: string
  openThread?: string
  onOpenThread: (id?: string) => void
  canResolve?: boolean
  /** Shown on rows waiting on the viewer, e.g. "needs reply". */
  waitingLabel?: string
  empty: ReactNode
  /** Return true when the pick was handled elsewhere (e.g. by jumping to the field), so the row doesn't expand. */
  onPick?: (t: Thread) => boolean | void
}) {
  const people = useStore((s) => s.people)
  const markRead = useStore((s) => s.markRead)
  const resolve = useStore((s) => s.resolveThread)
  const [hideResolved, setHideResolved] = useState(true)
  const sorted = [...c.threads].sort(
    (a, b) => Number(a.resolved) - Number(b.resolved) || Number(awaitingViewer(b, viewerId)) - Number(awaitingViewer(a, viewerId)) || (b.messages.at(-1)?.ts ?? 0) - (a.messages.at(-1)?.ts ?? 0),
  )
  const resolvedCount = sorted.filter((t) => t.resolved).length
  const shown = hideResolved ? sorted.filter((t) => !t.resolved) : sorted

  return (
    <div className="flex flex-col gap-1">
      {resolvedCount > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-[12px] text-ink-4">{resolvedCount} resolved</span>
          <Switch checked={hideResolved} onChange={setHideResolved} label={<span className="text-[13px] text-ink-3">Hide resolved</span>} />
        </div>
      )}
      {shown.length === 0 && <p className="px-3 py-4 text-[14px] text-ink-4">{empty}</p>}
      <AnimatePresence initial={false}>
        {shown.map((t) => {
          const last = t.messages[t.messages.length - 1]
          const isOpen = openThread === t.id
          const where = anchorLabel(t.anchor, c)
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              className={cn('group/row relative rounded-[18px] transition-colors', isOpen ? 'bg-muted/60' : 'hover:bg-muted/40')}
            >
              <button
                type="button"
                onClick={() => {
                  markRead(c.id, viewerId, [t.id])
                  if (!isOpen && onPick?.(t)) return
                  onOpenThread(isOpen ? undefined : t.id)
                }}
                className={cn('flex w-full items-start gap-3 p-3 text-left', canResolve ? 'pr-[72px]' : 'pr-10', t.resolved && 'opacity-60')}
              >
                <Avatar name={people[last.authorId]?.name ?? ''} src={people[last.authorId]?.avatar} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14px] text-ink">{t.title}</span>
                    {isUnread(t, viewerId) && <span className="size-1.5 shrink-0 rounded-full bg-advisor" />}
                  </span>
                  {!isOpen && <span className="truncate text-[13px] text-ink-3">{last.body}</span>}
                  <span className="text-[12px] text-ink-4">
                    {where !== t.title && `${where} · `}
                    {relativeTime(last.ts)}
                    {t.resolved ? ' · resolved' : waitingLabel && awaitingViewer(t, viewerId) && <span className="text-advisor"> · {waitingLabel}</span>}
                  </span>
                </span>
              </button>
              <span className="absolute top-2.5 right-2.5 flex items-center">
                {canResolve && (
                  <Tooltip content={t.resolved ? 'Reopen' : 'Resolve'}>
                    <button
                      type="button"
                      aria-label={t.resolved ? 'Reopen comment' : 'Resolve comment'}
                      onClick={() => {
                        resolve(c.id, t.id, !t.resolved, viewerId)
                        if (!t.resolved && isOpen) onOpenThread(undefined)
                      }}
                      className={cn(
                        'flex size-7 items-center justify-center rounded-full transition-colors',
                        t.resolved ? 'bg-success-soft text-success' : 'text-ink-4 hover:bg-success-soft hover:text-success',
                      )}
                    >
                      <CircleCheck className="size-4" />
                    </button>
                  </Tooltip>
                )}
                <ChevronDown className={cn('pointer-events-none mx-1.5 mt-1.5 size-4 text-ink-4 transition-transform', canResolve && 'mt-0', isOpen && 'rotate-180')} />
              </span>
              {isOpen && (
                <div className="px-3 pb-3">
                  <div className="rounded-[14px] bg-surface p-3">
                    <CommentThread thread={t} showTitle={false} compact />
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
