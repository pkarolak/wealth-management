import { HelpCircle, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { glossary } from '../../services/ai'
import { Popover } from '../primitives'

/** "What's this?" — plain-language explanation, with a way to ask the advisor instead. */
export function ExplainPopover({ term, onAsk, advisorFirst = 'Emily', label, inline }: { term: string; onAsk?: () => void; advisorFirst?: string; label?: string; inline?: boolean }) {
  const [open, setOpen] = useState(false)
  const g = glossary[term]
  if (!g) return null
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      padding={16}
      inner={10}
      className="w-72"
      trigger={
        inline ? (
          <button type="button" className="text-[12px] whitespace-nowrap text-ink-3 underline decoration-line-strong underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink-3">
            {label ?? 'Why we ask'}
          </button>
        ) : label ? (
          <button type="button" className="inline-flex items-center gap-1 text-[12px] text-ink-3 transition-colors hover:text-ink">
            <HelpCircle className="size-3.5" />
            {label}
          </button>
        ) : (
          <button type="button" className="inline-flex size-5 items-center justify-center rounded-full text-ink-4 transition-colors hover:text-ink" aria-label={`Explain: ${g.title}`}>
            <HelpCircle className="size-4" />
          </button>
        )
      }
    >
      <p className="text-[14px] font-medium text-ink">{g.title}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">{g.body}</p>
      {onAsk && (
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            onAsk()
          }}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-control bg-muted text-[13px] font-medium text-ink transition-colors hover:bg-sunken"
        >
          <MessageCircle className="size-3.5" />
          Still unsure? Ask {advisorFirst}
        </button>
      )}
    </Popover>
  )
}
