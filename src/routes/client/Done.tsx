import { AnimatePresence, motion } from 'motion/react'
import { Building2, CalendarPlus, Check, Video } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Avatar, Button, toast } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { useStore } from '../../store/caseStore'
import type { ClientCase } from '../../store/types'
import { fmtDay, Scheduler } from './Scheduler'

export function Done({ c }: { c: ClientCase }) {
  const advisor = useStore((s) => s.people[c.advisorId])
  const first = advisor.name.split(' ')[0]
  const [editing, setEditing] = useState(!c.meeting)
  const submitted = c.submittedAt ? new Date(c.submittedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : undefined

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col items-start gap-6">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="flex size-14 items-center justify-center rounded-full bg-ink text-white ring-8 ring-success-soft"
        >
          <Check className="size-6" />
        </motion.span>
        <div className="flex flex-col gap-3">
          {submitted && <span className="text-[13px] text-ink-3">Signed and sent to {first} · {submitted}</span>}
          <h1 className="display text-[48px] leading-[1.05] text-ink sm:text-[56px]">Thank you, {c.firstName}.</h1>
          <p className="max-w-xl text-[17px] leading-relaxed text-ink-3">
            {first} has what she needs to prepare. Anything you skipped is on the meeting agenda — there’s nothing else to do.
          </p>
        </div>
      </div>

      <Timeline first={first} meeting={c.meeting?.at} />

      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.div key="pick" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
            <Scheduler c={c} advisorName={advisor.name} advisorAvatar={advisor.avatar} onBooked={() => setEditing(false)} onCancel={c.meeting ? () => setEditing(false) : undefined} />
          </motion.div>
        ) : (
          c.meeting && (
            <motion.div key="booked" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
              <Booked meeting={c.meeting} first={first} advisorName={advisor.name} advisorAvatar={advisor.avatar} onChange={() => setEditing(true)} />
            </motion.div>
          )
        )}
      </AnimatePresence>

      <Link to={`/c/${c.token}?step=review`} className="self-start text-[14px] text-ink-3 underline-offset-4 hover:text-ink hover:underline">
        Review my answers
      </Link>
    </div>
  )
}

function Timeline({ first, meeting }: { first: string; meeting?: number }) {
  const steps = [
    { title: 'Sent', detail: 'Today', done: true },
    { title: `${first} prepares`, detail: 'Reviews your answers, drafts ideas', done: false },
    { title: 'Planning meeting', detail: meeting ? fmtDay(new Date(meeting)) : 'Pick a time below', done: false },
  ]
  return (
    <ol className="grid grid-cols-3 gap-3">
      {steps.map((s, i) => (
        <li key={s.title} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full text-[12px]', s.done ? 'bg-ink text-white' : 'bg-surface text-ink-3 ring-1 ring-line ring-inset')}>
              {s.done ? <Check className="size-3.5" /> : i + 1}
            </span>
            {i < steps.length - 1 && <span className={cn('h-px flex-1', s.done ? 'bg-ink/40' : 'bg-line')} />}
          </div>
          <div className="flex flex-col gap-0.5 pr-4">
            <span className="text-[14px] text-ink">{s.title}</span>
            <span className="text-[13px] text-ink-4">{s.detail}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}

function Booked({ meeting, first, advisorName, advisorAvatar, onChange }: { meeting: { at: number; mode: 'video' | 'office' }; first: string; advisorName: string; advisorAvatar?: string; onChange: () => void }) {
  const d = new Date(meeting.at)
  const end = new Date(meeting.at + 45 * 60000)
  const t = (x: Date) => x.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return (
    <section className="flex flex-wrap items-center gap-5 rounded-[28px] bg-surface p-3 pr-5 shadow-soft">
      <div className="flex w-[84px] shrink-0 flex-col items-center overflow-hidden rounded-[20px] bg-muted">
        <span className="w-full bg-ink py-1 text-center text-[11px] tracking-wide text-white uppercase">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
        <span className="display py-2 text-[36px] leading-none text-ink">{d.getDate()}</span>
        <span className="pb-2 text-[11px] text-ink-3">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[13px] text-success">Booked</span>
        <span className="text-[17px] text-ink">Planning meeting with {first}</span>
        <span className="flex items-center gap-1.5 text-[13px] text-ink-3">
          {meeting.mode === 'video' ? <Video className="size-3.5" /> : <Building2 className="size-3.5" />}
          {t(d)} – {t(end)} · {meeting.mode === 'video' ? 'Video call' : 'At the office'}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Avatar name={advisorName} src={advisorAvatar} size="md" className="mr-2 hidden sm:flex" />
        <Button variant="ghost" onClick={onChange}>
          Change
        </Button>
        <Button variant="secondary" leading={<CalendarPlus className="size-4" />} onClick={() => toast('Added to your calendar', { tone: 'success' })}>
          Add to calendar
        </Button>
      </div>
    </section>
  )
}
