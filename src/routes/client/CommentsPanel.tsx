import { useState } from 'react'
import { CommentComposer, ThreadList } from '../../components/patterns'
import { sectionById, type SectionId } from '../../schema/onboarding'
import { useStore } from '../../store/caseStore'
import type { ClientCase } from '../../store/types'

/** The client's side of the conversation: every comment with the Wealth Manager, plus a way to ask about the current step. */
export function CommentsPanel({ c, sectionId }: { c: ClientCase; sectionId?: SectionId }) {
  const people = useStore((s) => s.people)
  const startThread = useStore((s) => s.startThread)
  const [openThread, setOpenThread] = useState<string>()
  const advisor = people[c.advisorId]
  const first = advisor?.name.split(' ')[0] ?? 'your Wealth Manager'
  const open = c.threads.filter((t) => !t.resolved).length
  const section = sectionId ? sectionById[sectionId] : undefined

  return (
    <section className="flex max-h-[calc(100vh-8.5rem)] flex-col rounded-[26px] bg-surface p-2">
      <h2 className="flex items-baseline gap-2 px-3 pt-2.5 pb-1.5 text-[15px] font-medium text-ink">
        Comments
        {open > 0 && <span className="text-[13px] font-normal text-ink-4">{open} open</span>}
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ThreadList c={c} viewerId={c.clientId} openThread={openThread} onOpenThread={setOpenThread} empty={`Questions about anything? Ask ${first} here or next to any field.`} />
      </div>
      {section && (
        <div className="border-t border-line p-2 pt-3">
          <CommentComposer
            people={advisor ? [advisor] : []}
            placeholder={`Ask ${first} a question…`}
            onSend={(body) => setOpenThread(startThread(c.id, { sectionId: section.id }, section.title, body, c.clientId))}
          />
        </div>
      )}
    </section>
  )
}
