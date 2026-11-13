import { Building2, ChevronLeft, ChevronRight, Video } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Button, Segmented, toast } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { useStore } from '../../store/caseStore'
import type { ClientCase } from '../../store/types'

const SLOTS = ['9:00', '9:30', '10:00', '11:00', '13:00', '14:00', '15:30', '16:30']
const DAYS = 12

const fmtTime = (h: number, m: number) => new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
export const fmtDay = (d: Date, long = false) => d.toLocaleDateString('en-US', long ? { weekday: 'long', month: 'long', day: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' })

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

/** Day strip + time grid. `bare` drops the card chrome and header for use inside a dialog. */
export function Scheduler({ c, advisorName, onBooked, onCancel, bare }: { c: ClientCase; advisorName: string; onBooked: () => void; onCancel?: () => void; bare?: boolean }) {
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

  const free = day.slots.filter((s) => s.free)

  return (
    <section className={cn('flex flex-col gap-6', !bare && 'rounded-[28px] bg-surface p-6')}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {!bare && (
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="text-[17px] text-ink">Book your planning meeting</h2>
            <span className="text-[13px] text-ink-3">45 minutes with {first}</span>
          </div>
        )}
        <Segmented
          size="sm"
          value={mode}
          onChange={(v) => setMode(v as 'video' | 'office')}
          options={[
            { value: 'video', label: 'Video call' },
            { value: 'office', label: 'At the office' },
          ]}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-ink-3">{day.date.toLocaleDateString('en-US', { month: 'long' })}</span>
          <span className="flex">
            <button type="button" aria-label="Earlier" onClick={() => scroll(-1)} className="flex size-7 items-center justify-center rounded-full text-ink-4 hover:bg-muted hover:text-ink">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" aria-label="Later" onClick={() => scroll(1)} className="flex size-7 items-center justify-center rounded-full text-ink-4 hover:bg-muted hover:text-ink">
              <ChevronRight className="size-4" />
            </button>
          </span>
        </div>
        <div ref={strip} className="-mx-1 flex snap-x scroll-px-1 gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
          {days.map((d, i) => {
            const open = d.slots.some((s) => s.free)
            const on = i === dayIdx
            return (
              <button
                key={d.date.toISOString()}
                type="button"
                disabled={!open}
                onClick={() => setDayIdx(i)}
                className={cn(
                  'flex w-12 shrink-0 snap-start flex-col items-center gap-0.5 rounded-[14px] py-2 transition-colors',
                  on ? 'bg-ink text-white' : open ? 'text-ink hover:bg-muted' : 'cursor-not-allowed text-ink-4/60',
                )}
              >
                <span className={cn('text-[11px]', on ? 'text-white/65' : 'text-ink-4')}>{d.date.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                <span className="tabular text-[16px]">{d.date.getDate()}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {free.map((s) => (
          <button
            key={s.at}
            type="button"
            onClick={() => setAt(s.at)}
            className={cn('tabular h-9 rounded-full px-4 text-[14px] ring-1 transition-colors ring-inset', at === s.at ? 'bg-ink text-white ring-ink' : 'text-ink ring-line hover:ring-line-strong')}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <span className="flex min-w-0 flex-1 items-center gap-2 text-[14px] text-ink-3">
          {mode === 'video' ? <Video className="size-4 shrink-0" /> : <Building2 className="size-4 shrink-0" />}
          {at ? (
            <span className="truncate text-ink">
              {fmtDay(new Date(at), true)} · {new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          ) : (
            'Pick a time'
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

