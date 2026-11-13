import { Reorder, useDragControls } from 'motion/react'
import { Copy, GripVertical, Minus, Plus, Send, X } from 'lucide-react'
import { useState } from 'react'
import { Button, toast } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { uid } from '../../lib/format'
import { useStore } from '../../store/caseStore'
import type { AgendaItem, ClientCase } from '../../store/types'
import { ADVISOR_ID } from '../../store/seed'

const BUDGET = 45

const ago = (ts: number) => {
  const m = Math.round((Date.now() - ts) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Reorderable, editable meeting agenda with a time budget, shareable with the client. */
export function AgendaEditor({ c, items, onChange }: { c: ClientCase; items: AgendaItem[]; onChange: (items: AgendaItem[]) => void }) {
  const share = useStore((s) => s.shareAgenda)
  const [draft, setDraft] = useState('')
  const total = items.reduce((a, i) => a + i.minutes, 0)
  const over = total > BUDGET
  const shared = c.agenda?.sharedAt
  const changed = !!shared && (c.agenda?.updatedAt ?? 0) > shared
  const update = (id: string, patch: Partial<AgendaItem>) => onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  const meeting = c.meeting && new Date(c.meeting.at)

  const add = () => {
    if (!draft.trim()) return
    onChange([...items, { id: uid('ag'), title: draft.trim(), minutes: 5 }])
    setDraft('')
  }

  const asText = () =>
    [`Planning meeting with ${c.firstName} ${c.lastName}${meeting ? ` · ${meeting.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''}`, '', ...items.map((a, i) => `${i + 1}. ${a.title} — ${a.minutes} min`)].join('\n')

  return (
    <section className="flex flex-col gap-4 rounded-[26px] bg-surface p-2 shadow-soft">
      <div className="flex flex-col gap-3 px-4 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[17px] font-medium text-ink">Agenda</h2>
          <span className="text-[12px] text-ink-4">{meeting ? meeting.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Meeting not booked yet'}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
            <span className={cn('h-full rounded-full transition-[width] duration-300', over ? 'bg-danger' : 'bg-ink')} style={{ width: `${Math.min(100, (total / BUDGET) * 100)}%` }} />
          </div>
          <span className={cn('tabular text-[12px]', over ? 'text-danger' : 'text-ink-3')}>
            {total} of {BUDGET} min{over ? ` · ${total - BUDGET} over` : total < BUDGET ? ` · ${BUDGET - total} to spare` : ''}
          </span>
        </div>
      </div>

      <Reorder.Group axis="y" values={items} onReorder={onChange} className="flex flex-col gap-1">
        {items.map((it, i) => (
          <Row key={it.id} item={it} index={i} onTitle={(title) => update(it.id, { title })} onMinutes={(minutes) => update(it.id, { minutes })} onRemove={() => onChange(items.filter((x) => x.id !== it.id))} />
        ))}
      </Reorder.Group>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
        className="flex h-11 items-center gap-2 rounded-[18px] border border-dashed border-line-strong px-3 focus-within:border-ink-4"
      >
        <Plus className="size-4 shrink-0 text-ink-4" />
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a topic" className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-4" />
        {draft && <span className="text-[11px] text-ink-4">Enter</span>}
      </form>

      <div className="flex flex-col gap-3 rounded-[18px] bg-muted/60 p-3">
        <span className="px-1 text-[12px] text-ink-3">
          {shared ? (changed ? `Changed since you shared it ${ago(shared)}` : `Shared with ${c.firstName} ${ago(shared)}`) : `${c.firstName} sees it on his page and by email once shared.`}
        </span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            leading={<Copy className="size-4" />}
            onClick={async () => {
              await navigator.clipboard?.writeText(asText()).catch(() => {})
              toast('Agenda copied', { description: 'Paste it into an email or calendar invite.' })
            }}
          >
            Copy
          </Button>
          <Button
            className="flex-1"
            leading={<Send className="size-4" />}
            disabled={!items.length || (!!shared && !changed)}
            onClick={() => {
              share(c.id, ADVISOR_ID)
              toast(changed ? 'Update sent' : 'Agenda shared', { description: `${c.firstName} can see it now.`, tone: 'success' })
            }}
          >
            {shared ? (changed ? 'Send update' : 'Shared') : `Share with ${c.firstName}`}
          </Button>
        </div>
      </div>
    </section>
  )
}

function Row({ item, index, onTitle, onMinutes, onRemove }: { item: AgendaItem; index: number; onTitle: (t: string) => void; onMinutes: (m: number) => void; onRemove: () => void }) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      className="group flex items-start gap-1 rounded-[18px] bg-surface py-1 pr-1 pl-1 hover:bg-muted/50 [&>*]:mt-0.5 [&>textarea]:mt-0"
      whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(20,20,19,0.12)' }}
    >
      <button type="button" aria-label="Drag to reorder" onPointerDown={(e) => controls.start(e)} className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-[10px] text-ink-4 opacity-40 group-hover:opacity-100 active:cursor-grabbing">
        <GripVertical className="size-4" />
      </button>
      <span className="tabular w-4 shrink-0 pt-1.5 text-[12px] leading-5 text-ink-4">{index + 1}</span>
      <textarea
        value={item.title}
        rows={1}
        onChange={(e) => onTitle(e.target.value.replace(/\n/g, ' '))}
        aria-label="Agenda item"
        className="min-w-0 flex-1 resize-none rounded-[10px] bg-transparent px-2 py-1.5 text-[14px] leading-5 text-ink outline-none [field-sizing:content] focus:bg-surface focus:ring-1 focus:ring-line-strong"
      />
      <span className="flex shrink-0 items-center self-start rounded-[10px] bg-muted">
        <button type="button" aria-label="Less time" onClick={() => onMinutes(Math.max(5, item.minutes - 5))} className="flex size-7 items-center justify-center text-ink-3 hover:text-ink">
          <Minus className="size-3" />
        </button>
        <span className="tabular w-7 text-center text-[12px] text-ink-2">{item.minutes}′</span>
        <button type="button" aria-label="More time" onClick={() => onMinutes(item.minutes + 5)} className="flex size-7 items-center justify-center text-ink-3 hover:text-ink">
          <Plus className="size-3" />
        </button>
      </span>
      <button type="button" aria-label="Remove" onClick={onRemove} className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-ink-4 opacity-0 group-hover:opacity-100 hover:text-danger focus:opacity-100">
        <X className="size-4" />
      </button>
    </Reorder.Item>
  )
}
