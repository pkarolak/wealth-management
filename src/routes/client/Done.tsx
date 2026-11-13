import { AnimatePresence, motion } from 'motion/react'
import { Building2, CalendarPlus, Check, ChevronLeft, ChevronRight, Video } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Avatar, Button, Segmented, toast } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { useStore } from '../../store/caseStore'
import type { ClientCase } from '../../store/types'

const SLOTS = ['9:00', '9:30', '10:00', '11:00', '13:00', '14:00', '15:30', '16:30']
const DAYS = 12

const fmtTime = (h: number, m: number) => new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
const fmtDay = (d: Date, long = false) => d.toLocaleDateString('en-US', long ? { weekday: 'long', month: 'long', day: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' })

/** Next weekdays starting tomorrow, with mock availability that stays stable per date. */
function useCalendar() {
  return useMemo(() => {
    const out: { date: Date; slots: { label: string; at: number; free: boolean }[] }[] = []
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    while (out.length < DAYS) {
      d.setDate(d.getDate() + 1)
      if (d.getDay() === 0 || d.getDay() === 6) continue
      const seed = d.getDate() + d.getMonth() * 31
      const full = seed % 5 === 2
      const busy = (i: number) => (Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453) % 1
      out.push({
        date: new Date(d),
        slots: SLOTS.map((s, i) => {
          const [h, m] = s.split(':').map(Number)
          const at = new Date(d).setHours(h, m)
          return { label: fmtTime(h, m), at, free: !full && Math.abs(busy(i)) > 0.4 }
        }),
      })
    }
    return out
  }, [])
}

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

function Scheduler({ c, advisorName, advisorAvatar, onBooked, onCancel }: { c: ClientCase; advisorName: string; advisorAvatar?: string; onBooked: () => void; onCancel?: () => void }) {
  const schedule = useStore((s) => s.scheduleMeeting)
  const days = useCalendar()
  const first = advisorName.split(' ')[0]
  const initialDay = Math.max(0, days.findIndex((d) => d.slots.some((s) => s.free)))
  const [dayIdx, setDayIdx] = useState(initialDay)
  const [at, setAt] = useState<number | undefined>(c.meeting?.at)
  const [mode, setMode] = useState<'video' | 'office'>(c.meeting?.mode ?? 'video')
  const strip = useRef<HTMLDivElement>(null)
  const day = days[dayIdx]
  const scroll = (dir: number) => strip.current?.scrollBy({ left: dir * 280, behavior: 'smooth' })

  return (
    <section className="flex flex-col rounded-[28px] bg-surface p-2 shadow-soft">
      <div className="flex flex-wrap items-center gap-4 p-4 pb-5">
        <Avatar name={advisorName} src={advisorAvatar} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="text-[17px] text-ink">Book your planning meeting</h2>
          <span className="text-[13px] text-ink-3">45 minutes with {advisorName} · no cost</span>
        </div>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as 'video' | 'office')}
          options={[
            { value: 'video', label: 'Video call' },
            { value: 'office', label: 'At the office' },
          ]}
        />
      </div>

      <div className="flex flex-col gap-5 rounded-[20px] bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[14px] text-ink">{day.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          <span className="flex gap-1">
            <button type="button" aria-label="Earlier" onClick={() => scroll(-1)} className="flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-surface hover:text-ink">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" aria-label="Later" onClick={() => scroll(1)} className="flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-surface hover:text-ink">
              <ChevronRight className="size-4" />
            </button>
          </span>
        </div>

        <div ref={strip} className="-mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {days.map((d, i) => {
            const free = d.slots.filter((s) => s.free).length
            const on = i === dayIdx
            return (
              <button
                key={d.date.toISOString()}
                type="button"
                disabled={!free}
                onClick={() => setDayIdx(i)}
                className={cn(
                  'flex w-[68px] shrink-0 snap-start flex-col items-center gap-0.5 rounded-[16px] py-3 transition-colors',
                  on ? 'bg-ink text-white' : 'bg-surface text-ink hover:ring-1 hover:ring-line-strong',
                  !free && 'cursor-not-allowed bg-transparent text-ink-4 hover:ring-0',
                )}
              >
                <span className={cn('text-[12px]', on ? 'text-white/70' : 'text-ink-3', !free && 'text-ink-4')}>{d.date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="display text-[24px] leading-tight">{d.date.getDate()}</span>
                <span className={cn('text-[11px]', on ? 'text-white/60' : 'text-ink-4')}>{free ? `${free} open` : 'Full'}</span>
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {day.slots.map((s) => (
            <button
              key={s.at}
              type="button"
              disabled={!s.free}
              onClick={() => setAt(s.at)}
              className={cn(
                'tabular h-11 rounded-[14px] text-[14px] transition-colors',
                at === s.at ? 'bg-ink text-white' : 'bg-surface text-ink ring-1 ring-line ring-inset hover:ring-line-strong',
                !s.free && 'cursor-not-allowed bg-transparent text-ink-4 line-through decoration-ink-4/50 ring-0 hover:ring-0',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-3 pt-4 pl-4">
        <span className="flex min-w-0 flex-1 items-center gap-2 text-[14px] text-ink-3">
          {mode === 'video' ? <Video className="size-4" /> : <Building2 className="size-4" />}
          {at ? (
            <span className="text-ink">
              {fmtDay(new Date(at), true)} · {new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          ) : (
            'Pick a time that works for you'
          )}
        </span>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          disabled={!at}
          onClick={() => {
            if (!at) return
            schedule(c.id, at, mode)
            toast('Meeting booked', { description: `${first} gets an invite right away.`, tone: 'success' })
            onBooked()
          }}
        >
          {c.meeting ? 'Move meeting' : 'Book meeting'}
        </Button>
      </div>
    </section>
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
