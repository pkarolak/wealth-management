import { Check, Minus } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import type { Option } from './Select'

type SegmentedProps = {
  value?: string
  onChange: (v: string) => void
  options: Option[]
  size?: 'sm' | 'md'
  className?: string
}

/** Track radius 14 = segment radius 10 + 4px padding. */
export function Segmented({ value, onChange, options, size = 'md', className }: SegmentedProps) {
  return (
    <div role="radiogroup" className={cn('inline-flex w-fit max-w-full flex-wrap gap-1 self-start rounded-menu bg-muted p-1', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-control font-medium whitespace-nowrap transition-all focus-visible:outline-2 focus-visible:outline-ink',
              size === 'sm' ? 'h-7 px-3 text-[12px]' : 'h-10 px-4 text-[14px]',
              active ? 'bg-surface text-ink shadow-soft' : 'text-ink-3 hover:text-ink',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

type ChipProps = {
  selected?: boolean
  onClick?: () => void
  children: ReactNode
  leading?: ReactNode
  className?: string
}

export function Chip({ selected, onClick, children, leading, className }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'inline-flex h-11 items-center gap-1.5 rounded-control border bg-surface px-4 text-[15px] text-ink transition-[border-color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        selected ? 'border-ink shadow-[0_0_0_0.5px_var(--color-ink)]' : 'border-line hover:border-line-strong',
        className,
      )}
    >
      {selected ? <Check className="-ml-0.5 size-4" /> : leading}
      {children}
    </button>
  )
}

export function ChipGroup({ value, onChange, options }: { value: string[]; onChange: (v: string[]) => void; options: Option[] }) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o.value} selected={value.includes(o.value)} onClick={() => toggle(o.value)}>
          {o.label}
        </Chip>
      ))}
    </div>
  )
}

/** The 20px box used by Checkbox; exported for gallery and Figma parity. */
export function CheckboxBox({ checked, indeterminate }: { checked: boolean; indeterminate?: boolean }) {
  return (
    <span
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-check border transition-colors',
        checked || indeterminate ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface group-hover:border-ink-3',
        'group-has-[:focus-visible]:ring-4 group-has-[:focus-visible]:ring-ink/10',
      )}
    >
      {indeterminate ? <Minus className="size-3.5" strokeWidth={3} /> : checked && <Check className="size-3.5" strokeWidth={3} />}
    </span>
  )
}

type CheckboxProps = {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
  description?: ReactNode
  className?: string
}

export function Checkbox({ checked, onChange, label, description, className }: CheckboxProps) {
  return (
    <label className={cn('group flex cursor-pointer items-start gap-3', className)}>
      <CheckboxBox checked={checked} />
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="flex flex-col gap-0.5">
        <span className="text-[14px] leading-5 text-ink">{label}</span>
        {description && <span className="text-[13px] leading-[18px] text-ink-3">{description}</span>}
      </span>
    </label>
  )
}

export function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
        selected ? 'border-ink bg-surface' : 'border-line-strong bg-surface group-hover:border-ink-3',
      )}
    >
      <span className={cn('size-2.5 rounded-full bg-ink transition-transform', selected ? 'scale-100' : 'scale-0')} />
    </span>
  )
}

type RadioGroupProps = {
  value?: string
  onChange: (v: string) => void
  options: Option[]
  className?: string
}

export function RadioGroup({ value, onChange, options, className }: RadioGroupProps) {
  return (
    <div role="radiogroup" className={cn('flex flex-col gap-3', className)}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} className="group flex items-start gap-3 text-left">
          <span className="mt-0.5">
            <RadioDot selected={value === o.value} />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[14px] text-ink">{o.label}</span>
            {o.description && <span className="text-[13px] text-ink-3">{o.description}</span>}
          </span>
        </button>
      ))}
    </div>
  )
}

type RadioCardProps = {
  selected: boolean
  onSelect: () => void
  title: ReactNode
  description?: ReactNode
  aside?: ReactNode
  className?: string
}

/** 16px padding, text-only content: radius = 0 + 16. */
export function RadioCard({ selected, onSelect, title, description, aside, className }: RadioCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'group flex w-full items-start gap-3 rounded-[16px] border p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        selected ? 'border-ink bg-surface shadow-soft ring-1 ring-ink' : 'border-line bg-surface hover:border-line-strong',
        className,
      )}
    >
      <span className="mt-0.5">
        <RadioDot selected={selected} />
      </span>
      <span className="flex flex-1 flex-col gap-1">
        <span className="text-[15px] font-medium text-ink">{title}</span>
        {description && <span className="text-[13px] leading-snug text-ink-3">{description}</span>}
      </span>
      {aside}
    </button>
  )
}

export function YesNo({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <Segmented
      value={value}
      onChange={onChange}
      options={[
        { value: 'no', label: 'No' },
        { value: 'yes', label: 'Yes' },
      ]}
    />
  )
}

/** Pill track (24px) with a pill thumb (20px) at 2px padding. */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-10 rounded-full p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink', checked ? 'bg-ink' : 'bg-sunken')}
      >
        <span className={cn('block size-5 rounded-full bg-surface shadow-soft transition-transform', checked && 'translate-x-4')} />
      </button>
      {label && <span className="text-[14px] text-ink">{label}</span>}
    </label>
  )
}
