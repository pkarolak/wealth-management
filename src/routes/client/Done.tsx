import { AnimatePresence, motion } from 'motion/react'
import { clock } from '../../lib/time'
import { Building2, CalendarPlus, Check, Mail, Video } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Avatar, Button, toast } from '../../components/primitives'
import { useStore } from '../../store/caseStore'
import type { ClientCase } from '../../store/types'
import { Scheduler } from './Scheduler'

export function Done({ c }: { c: ClientCase }) {
  const advisor = useStore((s) => s.people[c.advisorId])
  const first = advisor.name.split(' ')[0]
  const [editing, setEditing] = useState(!c.meeting)
  const submitted = c.submittedAt ? new Date(c.submittedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : undefined

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col items-start gap-4">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="flex items-center gap-2 text-[13px] text-ink-3"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-success text-white">
            <Check className="size-3.5" />
          </span>
          Sent to {first}
          {submitted && <span className="text-ink-4">· {submitted}</span>}
        </motion.span>
        <h1 className="display text-[44px] leading-[1.05] text-ink">Thank you, {c.firstName}</h1>
        <p className="max-w-lg text-[16px] leading-relaxed text-ink-3">
          {c.meeting
            ? `${first} is reviewing your answers and preparing ideas for your meeting.`
            : `${first} is reviewing your answers. Pick a time to go through them. Anything you skipped is on the agenda.`}
        </p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.div key="pick" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
            <Scheduler c={c} advisorName={advisor.name} onBooked={() => setEditing(false)} onCancel={c.meeting ? () => setEditing(false) : undefined} />
          </motion.div>
        ) : (
          c.meeting && (
            <motion.div key="booked" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
              <Booked meeting={c.meeting} first={first} onChange={() => setEditing(true)} />
            </motion.div>
          )
        )}
      </AnimatePresence>

      {c.agenda?.sharedAt && (
        <section className="flex flex-col gap-4 rounded-[28px] bg-surface p-6">
          <div className="flex items-center gap-3">
            <Avatar name={advisor.name} src={advisor.avatar} size="md" />
            <div className="flex flex-col">
              <h2 className="text-[17px] text-ink">What we’ll cover</h2>
              <span className="text-[13px] text-ink-3">Agenda from {first} · {c.agenda.items.reduce((a, i) => a + i.minutes, 0)} minutes</span>
            </div>
          </div>
          <ol className="flex flex-col">
            {c.agenda.items.map((a, i) => (
              <li key={a.id} className="flex items-baseline gap-4 border-t border-line py-3 text-[15px] first:border-t-0">
                <span className="tabular w-5 text-[13px] text-ink-4">{i + 1}</span>
                <span className="flex-1 text-ink">{a.title}</span>
                <span className="tabular text-[13px] text-ink-4">{a.minutes} min</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="flex items-start gap-3 rounded-[20px] bg-muted/60 p-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-surface text-ink-3">
          <Mail className="size-4" />
        </span>
        <div className="flex min-w-0 flex-col gap-1 text-[14px] leading-relaxed">
          <span className="text-ink">
            We’ve sent a confirmation to <span className="font-medium">{c.email}</span>
          </span>
          <span className="text-ink-3">
            It has your private link to change your answers anytime. You can close this page.
          </span>
          <Link to={`/c/${c.token}?step=review`} className="mt-1 self-start text-[13px] text-ink-3 underline underline-offset-4 hover:text-ink">
            See or change my answers
          </Link>
        </div>
      </div>
    </div>
  )
}

function Booked({ meeting, first, onChange }: { meeting: { at: number; mode: 'video' | 'office'; zone?: string }; first: string; onChange: () => void }) {
  const d = new Date(meeting.at)
  const end = new Date(meeting.at + 45 * 60000)
  const t = (x: Date) => clock(x.getTime(), meeting.zone, x.getTime() !== meeting.at)
  return (
    <section className="flex flex-wrap items-center gap-4 rounded-[28px] bg-surface p-3 pr-4">
      <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-[16px] bg-muted">
        <span className="text-[11px] text-ink-3 uppercase">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
        <span className="display text-[28px] leading-none text-ink">{d.getDate()}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[16px] text-ink">Planning meeting with {first}</span>
        <span className="flex items-center gap-1.5 text-[13px] text-ink-3">
          {meeting.mode === 'video' ? <Video className="size-3.5" /> : <Building2 className="size-3.5" />}
          {t(d)} – {t(end)} · {meeting.mode === 'video' ? 'Video call' : 'At the office'}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" onClick={onChange}>
          Change
        </Button>
        <Button variant="ghost" leading={<CalendarPlus className="size-4" />} onClick={() => toast('Added to your calendar', { tone: 'success' })}>
          Add to calendar
        </Button>
      </div>
    </section>
  )
}
