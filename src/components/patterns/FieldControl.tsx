import { Eye, EyeOff, Lock } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { FieldDef } from '../../schema/onboarding'
import { Checkbox, ChipGroup, DateInput, Input, Label, MoneyInput, Segmented, Select, Textarea, YesNo, type FieldTone } from '../primitives'

type Props = {
  def: FieldDef
  value: unknown
  onChange: (v: unknown) => void
  tone?: FieldTone
  /** Rendered next to the label for controls whose label sits outside (chips, yes/no). */
  labelAside?: ReactNode
}

/** Controls whose label sits above them rather than floating inside. */
export const hasOuterLabel = (def: FieldDef) => ['yesno', 'chips', 'segmented'].includes(def.type)

/** Renders the right primitive for a schema field. */
export function FieldControl({ def, value, onChange, tone = 'default', labelAside }: Props) {
  const id = `f-${def.id}`
  const str = typeof value === 'string' ? value : value === undefined || value === null ? '' : String(value)

  const outer = (control: ReactNode) => (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-1.5">
        <Label>{def.label}</Label>
        {labelAside}
      </div>
      {control}
    </div>
  )

  switch (def.type) {
    case 'select':
      return <Select id={id} label={def.label} value={str} onChange={onChange} options={def.options ?? []} tone={tone} />
    case 'date':
      return <DateInput id={id} label={def.label} value={str} onChange={onChange} tone={tone} />
    case 'money':
      return <MoneyInput id={id} label={def.label} value={typeof value === 'number' ? value : undefined} onChange={onChange} tone={tone} />
    case 'textarea':
      return <Textarea id={id} label={def.label} placeholder={def.placeholder} value={str} onChange={(e) => onChange(e.target.value)} tone={tone} />
    case 'checkbox':
      return <Checkbox checked={value === true} onChange={onChange} label={def.label} />
    case 'yesno':
      return outer(<YesNo value={str} onChange={onChange} />)
    case 'segmented':
      return outer(<Segmented value={str} onChange={onChange} options={def.options ?? []} />)
    case 'chips':
      return outer(<ChipGroup value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} options={def.options ?? []} />)
    case 'sensitive':
      return <SensitiveInput id={id} label={def.label} value={str} onChange={onChange} tone={tone} />
    default:
      return (
        <Input
          id={id}
          label={def.label}
          type={def.type === 'email' ? 'email' : def.type === 'tel' ? 'tel' : 'text'}
          value={str}
          onChange={(e) => onChange(def.type === 'tel' ? formatPhone(e.target.value) : e.target.value)}
          tone={tone}
          autoComplete="off"
        />
      )
  }
}

const formatPhone = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 10)
  if (d.length < 4) return d
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

/** SSN: masked to the last four unless revealed; formats as you type. */
function SensitiveInput({ id, label, value, onChange, tone }: { id: string; label: string; value: string; onChange: (v: string) => void; tone: FieldTone }) {
  const [reveal, setReveal] = useState(false)
  const digits = value.replace(/\D/g, '')
  const formatted = [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 9)].filter(Boolean).join('-')
  const masked = digits.length === 9 && !reveal ? `•••-••-${digits.slice(5)}` : formatted
  return (
    <Input
      id={id}
      label={label}
      value={masked}
      inputMode="numeric"
      tone={tone}
      autoComplete="off"
      onFocus={() => digits.length === 9 && setReveal(true)}
      onBlur={() => setReveal(false)}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 9))}
      trailing={
        <span className="mr-1 flex items-center gap-0.5 text-ink-4">
          <Lock className="size-3.5" />
          <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => setReveal((r) => !r)} className="flex size-8 items-center justify-center rounded-full hover:text-ink" aria-label={reveal ? 'Hide' : 'Show'}>
            {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </span>
      }
    />
  )
}
