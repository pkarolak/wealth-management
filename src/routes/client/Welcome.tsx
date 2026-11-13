import { ArrowRight, Clock, FileText, IdCard, MessageCircle, Mic } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar, Button } from '../../components/primitives'
import { useStore } from '../../store/caseStore'
import type { ClientCase } from '../../store/types'
import type { StepNav } from './ClientApp'

function Point({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-surface text-ink-2 shadow-soft">{icon}</span>
      <div className="flex flex-col gap-0.5 pt-0.5">
        <span className="text-[15px] text-ink">{title}</span>
        <span className="text-[14px] leading-snug text-ink-3">{body}</span>
      </div>
    </div>
  )
}

export function Welcome({ c, nav }: { c: ClientCase; nav: StepNav }) {
  const advisor = useStore((s) => s.people[c.advisorId])
  const first = advisor.name.split(' ')[0]
  const invite = c.activity.find((a) => a.kind === 'invited')?.email?.body
  const note = invite?.split(/\n{2,}/).slice(1, 2).join(' ') || `Before we sit down to talk about your plan, I’d love to learn a bit more about you and your finances.`
  const resuming = c.introDone || c.idScanned || Object.values(c.sectionProgress ?? {}).some(Boolean)

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <h1 className="display text-[56px] text-ink sm:text-[68px]">{resuming ? `Welcome back, ${c.firstName}.` : `Hi ${c.firstName},`}</h1>
        <div className="flex gap-4 rounded-[22px] bg-surface p-3 pr-6">
          <Avatar name={advisor.name} src={advisor.avatar} size="lg" />
          <div className="flex flex-col gap-1 py-1">
            <span className="text-[13px] text-ink-3">
              {advisor.name} · {advisor.title}
            </span>
            <p className="text-[16px] leading-relaxed text-ink-2">{note}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Point icon={<Clock className="size-[18px]" />} title="About 20 minutes" body="It saves as you go. Stop anytime and pick up from this link." />
        <Point icon={<Mic className="size-[18px]" />} title="Talk instead of typing" body="Tell us about yourself and we’ll fill in what we can. You confirm everything." />
        <Point icon={<FileText className="size-[18px]" />} title="Statements beat typing" body="Drop in a brokerage or 401(k) statement and we read the numbers for you." />
        <Point icon={<MessageCircle className="size-[18px]" />} title={`Ask ${first} anywhere`} body="Unsure about a question? Leave a comment on it. Skip anything and do it in the meeting." />
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <span className="inline-flex items-center gap-2 text-[13px] text-ink-3">
          <IdCard className="size-4" /> Helpful to have nearby: your driver’s license and recent statements
        </span>
        <Button size="lg" className="ml-auto" trailing={<ArrowRight className="size-4" />} onClick={() => (!c.consentAt ? nav.go('consent') : nav.go(c.introDone ? 'about' : 'intro'))}>
          {resuming ? 'Continue where I left off' : 'Let’s begin'}
        </Button>
      </div>
    </div>
  )
}
