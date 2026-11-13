import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { CommentThread } from '../../components/patterns'
import { cn } from '../../lib/cn'
import { useStore } from '../../store/caseStore'
import { anchorLabel, isUnread } from '../../store/selectors'
import type { ClientCase } from '../../store/types'

/** Unread replies from the Wealth Manager, pinned above the current step. Requests live in their own step. */
export function Inbox({ c }: { c: ClientCase }) {
  const people = useStore((s) => s.people)
  const markRead = useStore((s) => s.markRead)
  const [openThread, setOpenThread] = useState<string>()
  const replies = c.threads.filter((t) => !t.resolved && (isUnread(t, c.clientId) || t.id === openThread))
  if (!replies.length) return null

  return (
    <div className="mb-8 flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {replies.map((t) => {
          const isOpen = openThread === t.id
          const last = t.messages[t.messages.length - 1]
          return (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="rounded-[18px] bg-advisor-soft/60 p-2">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-control p-1 pl-1 text-left"
                onClick={() => {
                  setOpenThread(isOpen ? undefined : t.id)
                  markRead(c.id, c.clientId, [t.id])
                }}
              >
                <MessageCircle className="ml-1 size-4 shrink-0 text-advisor" />
                <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
                  <span className="font-medium">{people[last.authorId]?.name.split(' ')[0]}</span> replied on “{anchorLabel(t.anchor, c)}”: <span className="text-ink-3">{last.body}</span>
                </span>
                <ChevronDown className={cn('size-4 shrink-0 text-ink-4 transition-transform', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <div className="mt-2 rounded-[10px] bg-surface p-4">
                  <CommentThread thread={t} />
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
