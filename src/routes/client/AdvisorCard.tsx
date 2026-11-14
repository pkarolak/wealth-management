import { CalendarDays, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Avatar, Dialog } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { clock } from '../../lib/time'
import { usePresenceOf } from '../../store/hooks'
import { useStore } from '../../store/caseStore'
import { unreadCount } from '../../store/selectors'
import type { ClientCase } from '../../store/types'
import { fmtDay, Scheduler } from './Scheduler'

const action =
  'inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[10px] px-2 text-[13px] whitespace-nowrap text-ink-2 ring-1 ring-line transition-colors ring-inset hover:bg-surface hover:text-ink hover:ring-line-strong'

/** The client's reminder of who they're working with, and the two ways to reach her. */
export function AdvisorCard({ c, onMessage, className }: { c: ClientCase; onMessage: () => void; className?: string }) {
  const advisor = useStore((s) => s.people[c.advisorId])
  const here = usePresenceOf(c.advisorId, c.id)
  const [scheduling, setScheduling] = useState(false)
  if (!advisor) return null
  const first = advisor.name.split(' ')[0]

  return (
    <div className={cn('flex flex-col gap-3 border-t border-line px-1 pt-4', className)}>
      <div className="flex items-center gap-3 px-2">
        <Avatar name={advisor.name} src={advisor.avatar} size="md" online={here ? true : undefined} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[11px] text-ink-4">Your Wealth Manager</span>
          <span className="truncate text-[14px] text-ink">{advisor.name}</span>
        </div>
      </div>
      <p className="px-2 text-[12px] leading-[18px] text-ink-3">
        {c.meeting
          ? `Meeting ${fmtDay(new Date(c.meeting.at))}, ${clock(c.meeting.at, c.meeting.zone)}`
          : here
            ? `${first} is online now`
            : `Usually replies within a few hours`}
      </p>
      <div className="flex gap-1">
        <button type="button" className={action} onClick={onMessage}>
          <MessageCircle className="size-3.5" />
          Message
          {unreadCount(c, c.clientId) > 0 && <span className="size-1.5 rounded-full bg-advisor" aria-label="New reply" />}
        </button>
        <button type="button" className={action} onClick={() => setScheduling(true)}>
          <CalendarDays className="size-3.5" />
          {c.meeting ? 'Reschedule' : 'Schedule'}
        </button>
      </div>
      <Dialog open={scheduling} onOpenChange={setScheduling} width="lg" title={`Schedule a call with ${first}`} description="45 minutes, by video or at the office.">
        <Scheduler c={c} advisorName={advisor.name} bare onBooked={() => setScheduling(false)} />
      </Dialog>
    </div>
  )
}