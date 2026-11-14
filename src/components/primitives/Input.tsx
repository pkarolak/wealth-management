import { Calendar, Sparkles } from 'lucide-react'
import { forwardRef, useEffect, useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export type FieldTone = 'default' | 'filled' | 'ai' | 'advisor' | 'warning' | 'error'

/** Nevis-style field: 1px line, ink border on focus, no halo. */
export const fieldBase =
  'w-full rounded-control border text-[15px] text-ink placeholder:text-ink-4 transition-[border-color,box-shadow,background-color] outline-none focus:border-ink focus:shadow-[0_0_0_0.5px_var(--color-ink)] disabled:bg-muted disabled:text-ink-3'

/** Border and fill live only here so a tone never competes with base classes. */
export const fieldTones: Record<FieldTone, string> = {
  default: 'border-line bg-surface hover:border-line-strong',
  filled: 'border-transparent bg-muted hover:border-line focus:bg-surface',
  ai: 'border-transparent bg-muted hover:border-line focus:bg-surface',
  advisor: 'border-advisor/35 bg-advisor-soft/50 hover:border-advisor/55',
  warning: 'border-progress/55 bg-progress-soft/60',
  error: 'border-danger/70 bg-surface hover:border-danger',
}

/** Marks an auto-filled value. Sits right after the text, so it reads as part of the answer rather than the label. */
export const AiMark = () => <Sparkles aria-hidden strokeWidth={1.5} className="size-3 shrink-0 text-ai/50" />

/** Floating label: placeholder-sized when empty, shrinks to the top-left on focus or value. */
const floatLabel = (always: boolean, hasLeading: boolean) =>
  cn(
    'pointer-events-none absolute left-4 origin-left text-ink-3 transition-all duration-150',
    hasLeading && !always && 'left-9',
    always
      ? 'top-2 text-[12px]'
      : 'top-1/2 -translate-y-1/2 text-[15px] peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[12px] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[12px]',
  )

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  leading?: ReactNode
  trailing?: ReactNode
  tone?: FieldTone
  /** Floating label inside the field. Without it the field is a compact 44px input. */
  label?: ReactNode
  /** Keep the label at the top even when empty (used when a format hint is the placeholder). */
  floatAlways?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leading, trailing, tone = 'default', label, floatAlways = false, id, placeholder, ...rest },
  ref,
) {
  const auto = useId()
  const inputId = id ?? auto
  if (!label) {
    return (
      <div className={cn('relative flex items-center', className)}>
        {leading && <span className="pointer-events-none absolute left-3.5 flex text-ink-3">{leading}</span>}
        <input ref={ref} id={inputId} placeholder={placeholder} className={cn(fieldBase, 'h-11 px-3.5', fieldTones[tone], leading && 'pl-9', trailing && 'pr-11')} {...rest} />
        {trailing && <span className="absolute right-1.5 flex items-center">{trailing}</span>}
      </div>
    )
  }
  return (
    <div className={cn('relative', className)}>
      <input
        ref={ref}
        id={inputId}
        placeholder={floatAlways ? placeholder : ' '}
        className={cn('peer', fieldBase, 'h-14 px-4 pt-5 pb-1.5 placeholder:text-ink-4', fieldTones[tone], leading && 'pl-7', trailing && 'pr-11')}
        {...rest}
      />
      {leading && <span className="pointer-events-none absolute bottom-[9px] left-4 flex text-[15px] text-ink">{leading}</span>}
      {tone === 'ai' && rest.value ? (
        <span aria-hidden className={cn('pointer-events-none absolute right-11 bottom-[9px] flex items-center gap-1.5 overflow-hidden text-[15px] peer-focus:hidden', leading ? 'left-7' : 'left-4')}>
          <span className="invisible whitespace-pre">{String(rest.value)}</span>
          <AiMark />
        </span>
      ) : null}
      <label htmlFor={inputId} className={floatLabel(floatAlways, !!leading)}>
        {label}
      </label>
      {trailing && <span className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center">{trailing}</span>}
    </div>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { tone?: FieldTone; label?: ReactNode }>(
  function Textarea({ className, tone = 'default', label, id, placeholder, ...rest }, ref) {
    const auto = useId()
    const tid = id ?? auto
    if (!label) return <textarea ref={ref} id={tid} placeholder={placeholder} className={cn(fieldBase, 'min-h-24 resize-none px-4 py-3 leading-relaxed', fieldTones[tone], className)} {...rest} />
    return (
      <div className={cn('relative', className)}>
        <textarea
          ref={ref}
          id={tid}
          placeholder={placeholder ?? ' '}
          className={cn('peer', fieldBase, 'min-h-28 resize-none px-4 pt-7 pb-3 leading-relaxed placeholder:text-transparent focus:placeholder:text-ink-4', fieldTones[tone])}
          {...rest}
        />
        <label
          htmlFor={tid}
          className="pointer-events-none absolute top-[17px] left-4 origin-left text-[15px] text-ink-3 transition-all duration-150 peer-focus:top-2 peer-focus:text-[12px] peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[12px]"
        >
          {label}
        </label>
      </div>
    )
  },
)

/** Standalone label, for groups that aren't text fields (chips, segmented, yes/no). */
export function Label({ children, hint, htmlFor }: { children: ReactNode; hint?: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline gap-2 text-[14px] text-ink-3">
      {children}
      {hint && <span className="text-[13px] text-ink-4">{hint}</span>}
    </label>
  )
}

const toDisplayDate = (iso?: string) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${m} / ${d} / ${y}` : ''
}

/** Masked MM / DD / YYYY input. Emits ISO (YYYY-MM-DD) once complete, '' otherwise. */
export function DateInput({ value, onChange, tone = 'default', id, label }: { value?: string; onChange: (iso: string) => void; tone?: FieldTone; id?: string; label?: ReactNode }) {
  const [text, setText] = useState(toDisplayDate(value))
  const [focused, setFocused] = useState(false)
  useEffect(() => setText(toDisplayDate(value)), [value])

  const handle = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean)
    setText(parts.join(' / '))
    if (digits.length === 8) {
      const iso = `${digits.slice(4, 8)}-${digits.slice(0, 2)}-${digits.slice(2, 4)}`
      if (!Number.isNaN(Date.parse(iso))) onChange(iso)
    } else if (value) onChange('')
  }

  return (
    <Input
      id={id}
      label={label}
      floatAlways={!!label && (focused || !!text)}
      inputMode="numeric"
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => handle(e.target.value)}
      placeholder="MM / DD / YYYY"
      tone={tone}
      trailing={<Calendar className="mr-2.5 size-4 text-ink-4" />}
    />
  )
}

const fmt = new Intl.NumberFormat('en-US')

/** Currency input with live thousands separators. */
export function MoneyInput({ value, onChange, tone = 'default', id, label, placeholder = '0', suffix }: { value?: number; onChange: (n: number | undefined) => void; tone?: FieldTone; id?: string; label?: ReactNode; placeholder?: string; suffix?: ReactNode }) {
  return (
    <Input
      id={id}
      label={label}
      floatAlways={!!label}
      inputMode="numeric"
      tone={tone}
      leading={<span className="text-[15px]">$</span>}
      trailing={suffix ? <span className="mr-2.5 text-[13px] text-ink-4">{suffix}</span> : undefined}
      value={value === undefined ? '' : fmt.format(value)}
      placeholder={placeholder}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '')
        onChange(digits ? Number(digits) : undefined)
      }}
      className="tabular"
    />
  )
}

/** Percent input for rates. */
export function PercentInput({ value, onChange, id, label }: { value?: number; onChange: (n: number | undefined) => void; id?: string; label?: ReactNode }) {
  const [text, setText] = useState(value === undefined ? '' : String(value))
  useEffect(() => setText(value === undefined ? '' : String(value)), [value])
  return (
    <Input
      id={id}
      label={label}
      floatAlways={!!label}
      inputMode="decimal"
      value={text}
      placeholder="0.0"
      trailing={<span className="mr-2.5 text-[14px] text-ink-3">%</span>}
      onChange={(e) => {
        const t = e.target.value.replace(/[^\d.]/g, '')
        setText(t)
        onChange(t === '' ? undefined : Number(t))
      }}
    />
  )
}
