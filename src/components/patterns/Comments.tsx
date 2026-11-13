import { ArrowUp, Check, CheckCircle2, MessageCircle, RotateCcw, Sparkles, Undo2 } from 'lucide-react'
import { Fragment, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { relativeTime } from '../../lib/format'
import { polishReply } from '../../services/ai'
import { useStore } from '../../store/caseStore'
import { anchorLabel, isUnread, threadsFor } from '../../store/selectors'
import type { Anchor, Person, Thread } from '../../store/types'
import { Avatar, CountDot, Popover, Tooltip } from '../primitives'
import { useCurrentCase } from './CaseContext'

/** Highlights @mentions in a message body. */
export function MessageBody({ body, people }: { body: string; people: Person[] }) {
  const names = people.map((p) => p.name.split(' ')[0])
  const parts = body.split(new RegExp(`(@(?:${names.join('|') || 'x^'}))\\b`, 'g'))
  return (
    <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-ink-2">
      {parts.map((p, i) => (p.startsWith('@') && names.includes(p.slice(1)) ? <span key={i} className="rounded-[4px] bg-advisor-soft px-0.5 text-advisor">{p}</span> : <Fragment key={i}>{p}</Fragment>))}
    </p>
  )
}

type ComposerProps = {
  onSend: (body: string) => void
  placeholder?: string
  people: Person[]
  autoFocus?: boolean
  /** Offer the AI polish button (advisor side). */
  polish?: boolean
  className?: string
}

/** Comment box: 18px radius = 10px send button + 8px padding. */
export function CommentComposer({ onSend, placeholder = 'Add a comment…', people, autoFocus, polish, className }: ComposerProps) {
  const [text, setText] = useState('')
  const [polished, setPolished] = useState<{ from: string; to: string }>()
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  const mention = /(?:^|\s)@(\w*)$/.exec(text)
  const matches = mention ? people.filter((p) => p.name.toLowerCase().startsWith(mention[1].toLowerCase())) : []

  const pick = (p: Person) => {
    setText((t) => t.replace(/@(\w*)$/, `@${p.name.split(' ')[0]} `))
    ref.current?.focus()
  }

  const send = () => {
    const body = text.trim()
    if (!body) return
    onSend(body)
    setText('')
    setPolished(undefined)
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (matches.length) pick(matches[0])
      else send()
    }
  }

  const doPolish = async () => {
    setBusy(true)
    const to = await polishReply(text)
    setBusy(false)
    if (to !== text) {
      setPolished({ from: text, to })
      setText(to)
    }
  }

  return (
    <div className={cn('relative', className)}>
      {polished && (
        <div className="mb-2 flex items-start gap-2 px-1 text-[13px]">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-ai" />
          <span className="flex-1 text-ink-4 line-through">{polished.from}</span>
          <button type="button" onClick={() => (setText(polished.from), setPolished(undefined))} className="inline-flex items-center gap-1 text-ink-3 hover:text-ink">
            <Undo2 className="size-3.5" />
            Undo
          </button>
        </div>
      )}
      <div className={cn('flex items-end gap-2 rounded-[18px] p-2 transition-colors', polished ? 'bg-ai-soft' : 'bg-muted focus-within:bg-sunken/70')}>
        <textarea
          ref={ref}
          rows={1}
          autoFocus={autoFocus}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (polished && e.target.value !== polished.to) setPolished(undefined)
          }}
          onKeyDown={onKey}
          placeholder={placeholder}
          className={cn('field-sizing-content max-h-40 min-h-8 flex-1 resize-none bg-transparent px-2 py-1.5 text-[14px] leading-snug outline-none placeholder:text-ink-4', polished ? 'text-ai' : 'text-ink')}
        />
        {polish && (
          <Tooltip content="Polish with AI">
            <button type="button" disabled={!text.trim() || busy} onClick={doPolish} className="flex size-8 shrink-0 items-center justify-center rounded-control text-ai transition-colors hover:bg-ai/10 disabled:opacity-40" aria-label="Polish with AI">
              <Sparkles className={cn('size-4', busy && 'animate-pulse')} />
            </button>
          </Tooltip>
        )}
        <button type="button" disabled={!text.trim()} onClick={send} className="flex size-8 shrink-0 items-center justify-center rounded-control bg-ink text-white transition-opacity disabled:opacity-25" aria-label="Send">
          <ArrowUp className="size-4" />
        </button>
      </div>
      {matches.length > 0 && (
        <div className="absolute bottom-full left-0 z-10 mb-2 flex w-56 flex-col rounded-menu border border-line bg-surface p-1 shadow-float">
          {matches.map((p) => (
            <button key={p.id} type="button" onMouseDown={(e) => (e.preventDefault(), pick(p))} className="flex items-center gap-2 rounded-control px-2 py-1.5 text-left text-[14px] hover:bg-muted">
              <Avatar name={p.name} src={p.avatar} size="sm" />
              <span className="flex-1 text-ink">{p.name}</span>
              <span className="text-[12px] text-ink-4">{p.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** One conversation: messages, resolve toggle and a reply box. */
export function CommentThread({ thread, showTitle = true, compact }: { thread: Thread; showTitle?: boolean; compact?: boolean }) {
  const { c, caseId, viewerId, mode } = useCurrentCase()
  const peopleMap = useStore((s) => s.people)
  const reply = useStore((s) => s.reply)
  const resolve = useStore((s) => s.resolveThread)
  const people = useMemo(() => (c ? [c.advisorId, c.clientId, 'mike'].map((id) => peopleMap[id]).filter(Boolean) : []), [c, peopleMap])
  return (
    <div className={cn('flex flex-col', compact ? 'gap-3' : 'gap-4')}>
      {showTitle && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] text-ink-4">On “{anchorLabel(thread.anchor, c)}”</span>
          <button type="button" onClick={() => resolve(caseId, thread.id, !thread.resolved, viewerId)} className={cn('inline-flex items-center gap-1 text-[12px] font-medium transition-colors', thread.resolved ? 'text-success' : 'text-ink-3 hover:text-ink')}>
            {thread.resolved ? <CheckCircle2 className="size-3.5" /> : <Check className="size-3.5" />}
            {thread.resolved ? 'Resolved' : 'Resolve'}
          </button>
        </div>
      )}
      {thread.messages.map((m) => {
        const author = peopleMap[m.authorId]
        return (
          <div key={m.id} className="flex gap-3">
            <Avatar name={author?.name ?? '?'} src={author?.avatar} size="sm" className="mt-0.5" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[13px] text-ink-3">
                <span className="font-medium text-ink">{author?.name ?? 'Someone'}</span> · {relativeTime(m.ts)}
              </span>
              <MessageBody body={m.body} people={people} />
            </div>
          </div>
        )
      })}
      {thread.resolved ? (
        <button type="button" onClick={() => resolve(caseId, thread.id, false, viewerId)} className="inline-flex items-center gap-1.5 self-start text-[13px] text-ink-3 hover:text-ink">
          <RotateCcw className="size-3.5" /> Reopen
        </button>
      ) : (
        <CommentComposer people={people.filter((p) => p.id !== viewerId)} placeholder="Reply…" polish={mode === 'advisor'} onSend={(body) => reply(caseId, thread.id, body, viewerId)} />
      )}
    </div>
  )
}

/** Inline "Ask Emily" affordance anchored to a field, item or section. Shows existing threads first. */
export function AskAdvisorButton({ anchor, title, open, onOpenChange, label, className, compact }: { anchor: Anchor; title?: string; open?: boolean; onOpenChange?: (o: boolean) => void; label?: ReactNode; className?: string; compact?: boolean }) {
  const { c, caseId, viewerId, mode } = useCurrentCase()
  const peopleMap = useStore((s) => s.people)
  const startThread = useStore((s) => s.startThread)
  const markRead = useStore((s) => s.markRead)
  const [innerOpen, setInnerOpen] = useState(false)
  const isOpen = open ?? innerOpen
  const setOpen = (o: boolean) => {
    onOpenChange?.(o)
    setInnerOpen(o)
    if (o && threads.length) markRead(caseId, viewerId, threads.map((t) => t.id))
  }
  if (!c) return null
  const threads = threadsFor(c, anchor)
  const unread = threads.filter((t) => isUnread(t, viewerId)).length
  const counterpart = peopleMap[mode === 'client' ? c.advisorId : c.clientId]
  const people = [peopleMap[c.advisorId], peopleMap[c.clientId], peopleMap.mike].filter((p) => p && p.id !== viewerId)
  const has = threads.length > 0
  const firstName = counterpart?.name.split(' ')[0] ?? 'your Wealth Manager'
  const askLabel = mode === 'client' ? `Ask ${firstName}` : 'Comment'
  const count = threads.reduce((a, t) => a + t.messages.length, 0)

  const popover = (
    <Popover
      open={isOpen}
      onOpenChange={setOpen}
      align="end"
      padding={16}
      inner={18}
      className="w-[380px]"
      trigger={
        <button
          type="button"
          aria-label={askLabel}
          className={cn(
            'inline-flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-control text-[13px] whitespace-nowrap transition-colors',
            compact && !has ? 'w-7' : 'px-2',
            has ? 'bg-muted text-ink-2 hover:bg-sunken' : 'text-ink-3 hover:bg-muted hover:text-ink',
            className,
          )}
        >
          <MessageCircle className="size-3.5" />
          {label ?? (has ? `${count}` : compact ? null : askLabel)}
          {unread > 0 && <CountDot count={unread} className="-mr-1" />}
        </button>
      }
    >
      <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto">
        {threads.map((t) => (
          <CommentThread key={t.id} thread={t} compact />
        ))}
        {!has && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <Avatar name={counterpart?.name ?? 'Wealth Manager'} src={counterpart?.avatar} size="md" />
              <div className="flex flex-col">
                <span className="text-[14px] font-medium text-ink">{mode === 'client' ? `Ask ${firstName}` : `Comment for ${firstName}`}</span>
                <span className="text-[12px] text-ink-3">{mode === 'client' ? 'She’ll reply here and by email. Keep going in the meantime.' : `${firstName} gets an email and sees it on this question.`}</span>
              </div>
            </div>
            <CommentComposer
              autoFocus
              people={people}
              polish={mode === 'advisor'}
              placeholder={mode === 'client' ? 'What would you like to ask?' : 'Leave a comment…'}
              onSend={(body) => startThread(caseId, anchor, title ?? anchorLabel(anchor, c), body, viewerId)}
            />
          </div>
        )}
      </div>
    </Popover>
  )
  if (!compact) return popover
  return (
    <Tooltip content={has ? `${askLabel} · ${count} ${count === 1 ? 'message' : 'messages'}` : askLabel}>
      <span className="inline-flex">{popover}</span>
    </Tooltip>
  )
}
