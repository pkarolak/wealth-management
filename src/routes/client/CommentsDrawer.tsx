import { CommentComposer, ThreadList } from '../../components/patterns'
import { Drawer } from '../../components/primitives'
import { sectionById, type SectionId } from '../../schema/onboarding'
import { useStore } from '../../store/caseStore'
import type { ClientCase } from '../../store/types'

/** The client's side of the conversation: every comment with the Wealth Manager, plus a way to ask about the current step. */
export function CommentsDrawer({
  c,
  sectionId,
  open,
  onOpenChange,
  openThread,
  onOpenThread,
}: {
  c: ClientCase
  sectionId?: SectionId
  open: boolean
  onOpenChange: (o: boolean) => void
  openThread?: string
  onOpenThread: (id?: string) => void
}) {
  const people = useStore((s) => s.people)
  const startThread = useStore((s) => s.startThread)
  const advisor = people[c.advisorId]
  const first = advisor?.name.split(' ')[0] ?? 'your Wealth Manager'
  const openCount = c.threads.filter((t) => !t.resolved).length
  const section = sectionById[sectionId ?? 'about']

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={`Messages with ${first}`}
      aside={openCount > 0 && <span className="text-[13px] text-ink-4">{openCount} open</span>}
      footer={
        <CommentComposer
          autoFocus={!c.threads.length}
          people={advisor ? [advisor] : []}
          placeholder={`Ask ${first} a question…`}
          onSend={(body) => onOpenThread(startThread(c.id, { sectionId: section.id }, section.title, body, c.clientId))}
        />
      }
    >
      <ThreadList c={c} viewerId={c.clientId} openThread={openThread} onOpenThread={onOpenThread} empty={`Nothing yet. Ask ${first} below, or use the comment button next to any field.`} />
    </Drawer>
  )
}
