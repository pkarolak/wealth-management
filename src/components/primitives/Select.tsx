import type { ReactNode } from 'react'
import * as RSelect from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'
import { AiMark, fieldTones, type FieldTone } from './Input'

export type Option = { value: string; label: string; description?: string }

type SelectProps = {
  value?: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  /** Floating label inside the trigger (same behaviour as Input). */
  label?: ReactNode
  id?: string
  tone?: FieldTone
  className?: string
  disabled?: boolean
}

/** Custom dropdown: menu radius 14 = item radius 10 + 4px padding. */
export function Select({ value, onChange, options, placeholder = 'Select…', label, id, tone = 'default', className, disabled }: SelectProps) {
  const selected = options.find((o) => o.value === value)
  return (
    <RSelect.Root value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <RSelect.Trigger
        id={id}
        className={cn(
          'group relative flex w-full items-center justify-between gap-2 rounded-control border text-left text-[15px] text-ink outline-none transition-[border-color,box-shadow,background-color]',
          'focus:border-ink focus:shadow-[0_0_0_0.5px_var(--color-ink)] data-[state=open]:border-ink data-[state=open]:shadow-[0_0_0_0.5px_var(--color-ink)]',
          label ? 'h-14 px-4' : 'h-11 px-3.5 data-[placeholder]:text-ink-4',
          fieldTones[tone],
          className,
        )}
      >
        {label ? (
          <span className="flex min-w-0 flex-col">
            <span className={cn('text-ink-3 transition-all', selected ? 'text-[12px]' : 'text-[15px]')}>{label}</span>
            {selected && (
              <span className="flex min-w-0 items-center gap-1.5 leading-tight">
                <span className="truncate">{selected.label}</span>
                {tone === 'ai' && <AiMark />}
              </span>
            )}
            <span className="hidden">
              <RSelect.Value />
            </span>
          </span>
        ) : (
          <span className="truncate">
            <RSelect.Value placeholder={placeholder} />
          </span>
        )}
        <RSelect.Icon>
          <ChevronDown className="size-4 shrink-0 text-ink-3 transition-transform group-data-[state=open]:rotate-180" />
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-80 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-menu border border-line bg-surface p-1 shadow-float"
        >
          <RSelect.Viewport>
            {options.map((o) => (
              <RSelect.Item
                key={o.value}
                value={o.value}
                className="relative flex cursor-pointer flex-col rounded-control py-2.5 pr-9 pl-3 text-[14px] text-ink outline-none select-none data-[highlighted]:bg-muted data-[state=checked]:font-medium"
              >
                <RSelect.ItemText>{o.label}</RSelect.ItemText>
                {o.description && <span className="text-[12px] font-normal text-ink-3">{o.description}</span>}
                <RSelect.ItemIndicator className="absolute top-3 right-3">
                  <Check className="size-4" />
                </RSelect.ItemIndicator>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  )
}
