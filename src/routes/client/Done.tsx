import { CalendarDays, Check } from 'lucide-react'
import { Link } from 'react-router'
import { Avatar } from '../../components/primitives'
import { useStore } from '../../store/caseStore'
import type { ClientCase } from '../../store/types'

export function Done({ c }: { c: ClientCase }) {
  const advisor = useStore((s) => s.people[c.advisorId])
  const first = advisor.name.split(' ')[0]
  const meeting = new Date(Date.now() + 4 * 86400_000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div className="flex flex-col items-start gap-8">
      <span className="flex size-14 items-center justify-center rounded-full bg-ink text-white">
        <Check className="size-6" />
      </span>
      <div className="flex flex-col gap-4">
        <h1 className="display text-[56px] text-ink">Thank you, {c.firstName}.</h1>
        <p className="max-w-xl text-[17px] leading-relaxed text-ink-3">
          {first} has everything she needs to prepare. Anything you skipped is on the meeting agenda, so there’s nothing else to do for now.
        </p>
      </div>
      <div className="flex w-full max-w-xl items-center gap-4 rounded-[22px] bg-surface p-3 pr-5">
        <span className="flex size-10 items-center justify-center rounded-control bg-muted text-ink-2">
          <CalendarDays className="size-[18px]" />
        </span>
        <div className="flex flex-1 flex-col">
          <span className="text-[15px] text-ink">Planning meeting with {first}</span>
          <span className="text-[13px] text-ink-3">{meeting} · 10:00 AM · 45 minutes</span>
        </div>
        <Avatar name={advisor.name} src={advisor.avatar} size="md" />
      </div>
      <Link to={`/c/${c.token}?step=review`} className="text-[14px] text-ink-3 underline-offset-4 hover:text-ink hover:underline">
        Review my answers
      </Link>
    </div>
  )
}
