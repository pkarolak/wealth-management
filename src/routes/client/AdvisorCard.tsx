import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { AskAdvisorButton } from '../../components/patterns'
import { Avatar, Dialog } from '../../components/primitives'
import { usePresenceOf } from '../../store/hooks'
import { useStore } from '../../store/caseStore'
import type { SectionId } from '../../schema/onboarding'
import type { ClientCase } from '../../store/types'
import { fmtDay, Scheduler } from './Scheduler'

const action =
  'inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[12px] bg-muted px-3 text-[13px] whitespace-nowrap text-ink-2 transition-colors hover:bg-sunken hover:text-ink'

/** The client's reminder of who they're working with, and the two ways to reach her. */
export function AdvisorCard({ c, sectionId }: { c: ClientCase; sectionId?: SectionId }) {
  const advisor = useStore((s) => s.people[c.advisorId])
  const here = usePresenceOf(c.advisorId, c.id)
  const [scheduling, setScheduling] = useState(false)
  if (!advisor) return null
  const first = advisor.name.split(' ')[0]

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-[20px] bg-surface p-2 pt-4 shadow-soft">
      <div className="flex items-center gap-3 px-2">
        <Avatar name={advisor.name} src={advisor.avatar} size="lg" online={here ? true : undefined} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[14px] text-ink">{advisor.name}</span>
          <span className="truncate text-[12px] text-ink-3">Your Wealth Manager</span>
        </div>
      </div>
      <p className="px-2 text-[12px] leading-[18px] text-ink-4">
        {here ? `${first} is online now.` : `${first} usually replies within a few hours.`}
        {c.meeting && (
          <>
            {' '}
            Meeting {fmtDay(new Date(c.meeting.at))}, {new Date(c.meeting.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.
          </>
        )}
      </p>
      <div className="flex gap-1">
        <AskAdvisorButton anchor={{ sectionId: sectionId ?? 'about' }} title={`Message to ${first}`} label="Message" className={action} />
        <button type="button" className={action} onClick={() => setScheduling(true)}>
          <CalendarDays className="size-3.5" />
          {c.meeting ? 'Reschedule' : 'Schedule'}
        </button>
      </div>
      <Dialog open={scheduling} onOpenChange={setScheduling} width="lg" title={`Schedule a call with ${first}`} description="45 minutes, by video or at the office.">
        <Scheduler c={c} advisorName={advisor.name} advisorAvatar={advisor.avatar} bare onBooked={() => setScheduling(false)} />
      </Dialog>
    </div>
  )
}