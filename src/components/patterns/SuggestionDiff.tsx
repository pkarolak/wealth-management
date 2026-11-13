import { Check, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Avatar, Button } from '../primitives'

type Props = {
  from?: ReactNode
  to: ReactNode
  by: 'ai' | 'advisor'
  authorName?: string
  authorAvatar?: string
  sourceLabel?: string
  note?: string
  onAccept?: () => void
  onReject?: () => void
  acceptLabel?: string
  rejectLabel?: string
  /** Show the thumbs feedback pill (AI rewrites). */
  feedback?: boolean
  className?: string
}

const tone = {
  ai: { mark: 'bg-ai-soft text-ai', text: 'text-ai' },
  advisor: { mark: 'bg-advisor-soft text-advisor', text: 'text-advisor' },
}

/** Old value struck through, new value highlighted. Blue for AI, pink for the advisor. */
export function SuggestionDiff({ from, to, by, authorName, authorAvatar, sourceLabel, note, onAccept, onReject, acceptLabel = 'Approve', rejectLabel = 'Keep mine', feedback, className }: Props) {
  const t = tone[by]
  return (
    <div className={cn('flex flex-col gap-3 rounded-[22px] border border-line bg-surface p-3', className)}>
      <div className="flex items-center gap-2 px-1 pt-0.5">
        {by === 'ai' ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-ai-soft text-ai">
            <Sparkles className="size-3" />
          </span>
        ) : (
          <Avatar name={authorName ?? 'Wealth Manager'} src={authorAvatar} size="xs" />
        )}
        <span className={cn('text-[13px] font-medium', t.text)}>{by === 'ai' ? sourceLabel ?? 'Suggested by AI' : `${authorName?.split(' ')[0] ?? 'Your Wealth Manager'} suggested a change`}</span>
      </div>
      <div className="flex flex-col gap-1.5 px-1 text-[15px] leading-relaxed">
        {from !== undefined && from !== '' && <span className="text-ink-3 line-through decoration-ink-4">{from}</span>}
        <span>
          <mark className={cn('rounded-[4px] px-1 py-0.5 [box-decoration-break:clone]', t.mark)}>{to}</mark>
        </span>
        {note && <p className="mt-1 text-[13px] leading-snug text-ink-3">“{note}”</p>}
      </div>
      {(onAccept || onReject || feedback) && (
        <div className="flex items-center gap-2">
          {onAccept && (
            <Button size="sm" variant="primary" leading={<Check className="size-3.5" />} onClick={onAccept}>
              {acceptLabel}
            </Button>
          )}
          {onReject && (
            <Button size="sm" variant="ghost" onClick={onReject}>
              {rejectLabel}
            </Button>
          )}
          {feedback && <Thumbs className="ml-auto" />}
        </div>
      )}
    </div>
  )
}

/** Thumbs up / down pill for rating AI output. */
export function Thumbs({ className }: { className?: string }) {
  const [v, setV] = useState<'up' | 'down'>()
  const btn = (k: 'up' | 'down', icon: ReactNode) => (
    <button
      type="button"
      onClick={() => setV(v === k ? undefined : k)}
      aria-pressed={v === k}
      aria-label={k === 'up' ? 'Good suggestion' : 'Bad suggestion'}
      className={cn('flex size-8 items-center justify-center rounded-control transition-colors', v === k ? 'bg-muted text-ink' : 'text-ink-3 hover:bg-muted hover:text-ink')}
    >
      {icon}
    </button>
  )
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded-[14px] bg-surface p-1 shadow-float', className)}>
      {btn('up', <ThumbsUp className="size-4" />)}
      {btn('down', <ThumbsDown className="size-4" />)}
    </span>
  )
}
