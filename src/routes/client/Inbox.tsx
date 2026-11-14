import { AnimatePresence, motion } from 'motion/react'
import { ChevronRight, MessageCircle } from 'lucide-react'
import { useStore } from '../../store/caseStore'
import { anchorLabel, isUnread } from '../../store/selectors'
import type { ClientCase } from '../../store/types'

/** Unread replies from the Wealth Manager, pinned above the current step. Opening one takes you to the conversation. */
export function Inbox({ c, onOpen }: { c: ClientCase; onOpen: (threadId: string) => void }) {
  const people = useStore((s) => s.people)
  const replies = c.threads.filter((t) => !t.resolved && isUnread(t, c.clientId))
  if (!replies.length) return null

  return (
    <div className="mb-8 flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {replies.map((t) => {
          const last = t.messages[t.messages.length - 1]
          return (
            <motion.button
              key={t.id}
              type="button"
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              onClick={() => onOpen(t.id)}
              className="flex w-full items-center gap-3 rounded-[18px] bg-advisor-soft/60 p-3 text-left transition-colors hover:bg-advisor-soft"
            >
              <MessageCircle className="ml-1 size-4 shrink-0 text-advisor" />
              <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
                <span className="font-medium">{people[last.authorId]?.name.split(' ')[0]}</span> replied on “{anchorLabel(t.anchor, c)}”: <span className="text-ink-3">{last.body}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-ink-4" />
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
