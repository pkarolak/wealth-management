import { Check, CornerDownRight, PencilLine } from 'lucide-react'
import { useState } from 'react'
import { AskAdvisorButton, SourceTag, type SourceKind } from '../../components/patterns'
import { Badge, Button, Input, Popover, Select, Tooltip } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { withBullets } from '../../lib/masked'
import { displayValue, isFilled, type FieldDef } from '../../schema/onboarding'
import { useStore } from '../../store/caseStore'
import type { ClientCase } from '../../store/types'

/** Wealth Manager's view of one answer: value, provenance, and confirm / suggest / comment. */
export function ReviewRow({ c, def, onHover }: { c: ClientCase; def: FieldDef; onHover?: (fieldId?: string) => void }) {
  const st = c.fields[def.id] ?? {}
  const confirm = useStore((s) => s.confirmField)
  const filled = isFilled(st.value)
  const s = st.suggestion
  const source: SourceKind | undefined = st.source && st.source !== 'client' ? st.source : filled ? 'client' : undefined

  return (
    <div
      onMouseEnter={() => onHover?.(def.id)}
      onMouseLeave={() => onHover?.(undefined)}
      className={cn('group grid grid-cols-[minmax(0,200px)_minmax(0,1fr)_auto] items-center gap-4 rounded-control px-3 py-2.5 transition-colors hover:bg-muted/70', st.status === 'needs_review' && 'bg-progress-soft/60')}
    >
      <span className="truncate text-[13px] text-ink-3" title={def.label}>
        {def.label}
        {def.required && <span className="text-ink-4"> *</span>}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        {st.deferred ? (
          <span className="text-[14px] text-ink-3 italic">Moved to the meeting</span>
        ) : (
          <span className={cn('truncate text-[14px]', filled ? 'text-ink' : 'text-ink-4')}>{filled ? withBullets(displayValue(def, st.value)) : s ? 'Not confirmed yet' : '—'}</span>
        )}
        {s && (
          <span className="flex items-center gap-1 text-[12px] text-ink-3">
            <CornerDownRight className="size-3" />
            {s.by === 'advisor' ? 'Your suggestion:' : 'AI draft:'}
            <span className={s.by === 'advisor' ? 'text-advisor' : 'text-ai'}>{displayValue(def, s.value)}</span>
            <span className="text-ink-4">· waiting for {c.firstName}</span>
          </span>
        )}
        {!s && source && filled && (st.status === 'confirmed' || !['client', 'advisor'].includes(source)) && <SourceTag kind={st.status === 'confirmed' ? 'confirmed' : source} />}
      </span>
      <span className="flex items-center gap-1">
        {st.status === 'needs_review' && <Badge tone="progress">Changed</Badge>}
        <AskAdvisorButton anchor={{ sectionId: def.sectionId, fieldId: def.id }} title={def.label} label={undefined} className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100" />
        <SuggestPopover c={c} def={def} />
        {filled && st.status !== 'confirmed' && !st.deferred && (
          <Tooltip content="Confirm">
            <button type="button" onClick={() => confirm(c.id, def.id, c.advisorId)} className="flex size-7 items-center justify-center rounded-control text-ink-3 hover:bg-surface hover:text-success" aria-label="Confirm">
              <Check className="size-4" />
            </button>
          </Tooltip>
        )}
      </span>
    </div>
  )
}

function SuggestPopover({ c, def }: { c: ClientCase; def: FieldDef }) {
  const suggest = useStore((s) => s.suggestChange)
  const [open, setOpen] = useState(false)
  const current = c.fields[def.id]?.value
  const [value, setValue] = useState<string>(typeof current === 'string' ? current : '')
  const [note, setNote] = useState('')
  if (['chips', 'checkbox', 'sensitive'].includes(def.type)) return null
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) setValue(typeof current === 'string' ? current : '')
      }}
      align="end"
      padding={16}
      className="w-80"
      trigger={
        <button type="button" className="flex size-7 items-center justify-center rounded-control text-ink-3 opacity-0 group-hover:opacity-100 hover:bg-surface hover:text-advisor data-[state=open]:opacity-100" aria-label="Suggest a change">
          <PencilLine className="size-4" />
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col">
          <span className="text-[14px] font-medium text-ink">Suggest a change</span>
          <span className="text-[12px] text-ink-3">{c.firstName} approves or keeps their answer. Nothing changes until then.</span>
        </div>
        {def.options || def.type === 'yesno' ? (
          <Select label={def.label} value={value} onChange={setValue} options={def.options ?? [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
        ) : (
          <Input label={def.label} value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
        )}
        <Input label="Why (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button
          disabled={!value || value === current}
          onClick={() => {
            suggest(c.id, def.id, value, note, c.advisorId)
            setOpen(false)
            setNote('')
          }}
        >
          Send suggestion
        </Button>
      </div>
    </Popover>
  )
}
