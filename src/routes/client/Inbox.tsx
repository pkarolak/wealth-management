import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, FileUp, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { CommentThread } from '../../components/patterns'
import { Avatar, Button, toast } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { documentKinds } from '../../services/ai'
import { useStore } from '../../store/caseStore'
import { anchorLabel, isUnread } from '../../store/selectors'
import type { ClientCase } from '../../store/types'
import { guessDocKind, processDocument } from './actions'

/** Things the Wealth Manager is waiting on or said, pinned above the current step. */
export function Inbox({ c }: { c: ClientCase }) {
  const people = useStore((s) => s.people)
  const markRead = useStore((s) => s.markRead)
  const [openThread, setOpenThread] = useState<string>()
  const [busy, setBusy] = useState<string>()
  const advisor = people[c.advisorId]
  const first = advisor.name.split(' ')[0]
  const requests = c.requests.filter((r) => r.status === 'open')
  const replies = c.threads.filter((t) => !t.resolved && (isUnread(t, c.clientId) || t.id === openThread))
  if (!requests.length && !replies.length) return null

  return (
    <div className="mb-8 flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {requests.map((r) => {
          const kind = guessDocKind(r.title)
          const file = documentKinds.find((d) => d.kind === kind)?.file ?? 'Statement.pdf'
          return (
            <motion.div key={r.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 rounded-[18px] bg-surface p-2 pl-3 shadow-soft">
              <Avatar name={advisor.name} src={advisor.avatar} size="sm" />
              <div className="flex min-w-0 flex-1 flex-col py-1">
                <span className="text-[14px] text-ink">
                  {first} asked for <span className="font-medium">{r.title.toLowerCase()}</span>
                </span>
                {r.detail && <span className="truncate text-[13px] text-ink-3">{r.detail}</span>}
              </div>
              <Button
                size="md"
                variant="secondary"
                leading={<FileUp className="size-4" />}
                disabled={busy === r.id}
                onClick={async () => {
                  setBusy(r.id)
                  await processDocument(c.id, c.clientId, kind, file)
                  setBusy(undefined)
                  toast('Uploaded', { description: `${first} has been notified.`, tone: 'success' })
                }}
              >
                {busy === r.id ? 'Reading…' : 'Upload'}
              </Button>
            </motion.div>
          )
        })}
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
