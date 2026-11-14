import { ArrowUp, Keyboard, Mic, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/cn'

type Mode = 'idle' | 'listening' | 'review' | 'typing'

type Props = {
  /** Scripted transcript "heard" while listening. */
  transcript: string
  onSubmit: (text: string) => void
  placeholder?: string
  busy?: boolean
  className?: string
}

/** Static-looking waveform; bars animate while listening and rest otherwise. */
export function Waveform({ active, bars = 56, className }: { active: boolean; bars?: number; className?: string }) {
  const heights = useMemo(() => Array.from({ length: bars }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45)) * 0.75), [bars])
  return (
    <div className={cn('flex h-6 flex-1 items-center justify-center gap-[2px] overflow-hidden', className)} aria-hidden>
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[1.5px] shrink-0 origin-center rounded-full bg-ink-3"
          style={{
            height: `${Math.round(h * 100)}%`,
            animation: active ? `wave ${0.7 + (i % 5) * 0.12}s ease-in-out ${(i % 7) * -0.13}s infinite` : undefined,
            transform: active ? undefined : 'scaleY(0.2)',
            transition: 'transform 300ms',
          }}
        />
      ))}
    </div>
  )
}

/**
 * Voice-first answer box. Card radius 22 = 10px buttons + 12px padding.
 * Listening types the scripted transcript out; the result stays editable before sending.
 */
export function VoiceInput({ transcript, onSubmit, placeholder = 'Tap the mic and tell us about yourself…', busy, className }: Props) {
  const [mode, setMode] = useState<Mode>('idle')
  const [text, setText] = useState('')
  const timer = useRef<number>(undefined)

  useEffect(() => {
    if (mode !== 'listening') return
    const words = transcript.split(' ')
    let i = 0
    setText('')
    timer.current = window.setInterval(() => {
      i++
      setText(words.slice(0, i).join(' '))
      if (i >= words.length) {
        window.clearInterval(timer.current)
        window.setTimeout(() => setMode('review'), 500)
      }
    }, 85)
    return () => window.clearInterval(timer.current)
  }, [mode, transcript])

  const stop = () => {
    window.clearInterval(timer.current)
    setMode(text ? 'review' : 'idle')
  }

  const cancel = () => {
    window.clearInterval(timer.current)
    setText('')
    setMode('idle')
  }

  const editable = mode === 'review' || mode === 'typing'

  return (
    <div className={cn('flex flex-col gap-3 rounded-[22px] bg-surface p-3 shadow-float', className)}>
      <div className="min-h-24 px-2 pt-1.5">
        {mode === 'listening' && !text && <p className="text-[16px] text-ink-3">Listening…</p>}
        {editable ? (
          <textarea
            autoFocus={mode === 'typing'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a few sentences about you, your family, your work and what you’re hoping for…"
            className="field-sizing-content min-h-24 w-full resize-none bg-transparent text-[16px] leading-relaxed text-ink outline-none placeholder:text-ink-4"
          />
        ) : (
          text && (
            <p className="text-[16px] leading-relaxed text-ink">
              {text}
              <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-ink" />
            </p>
          )
        )}
        {mode === 'idle' && <p className="text-[16px] text-ink-4">{placeholder}</p>}
      </div>
      <div className="flex items-center gap-3">
        {mode === 'idle' ? (
          <button type="button" onClick={() => setMode('typing')} className="flex size-10 items-center justify-center rounded-control bg-muted text-ink-2 transition-colors hover:bg-sunken" aria-label="Type instead">
            <Keyboard className="size-[18px]" />
          </button>
        ) : (
          <button type="button" onClick={cancel} className="flex size-10 items-center justify-center rounded-control bg-muted text-ink-2 transition-colors hover:bg-sunken" aria-label="Start over">
            <X className="size-[18px]" />
          </button>
        )}
        {mode === 'listening' ? <Waveform active /> : <span className="flex-1" />}
        {mode === 'idle' && (
          <button type="button" onClick={() => setMode('listening')} className="flex size-10 items-center justify-center rounded-control bg-ink text-white transition-transform hover:scale-[1.03]" aria-label="Start speaking">
            <Mic className="size-[18px]" />
          </button>
        )}
        {mode === 'listening' && (
          <button type="button" onClick={stop} className="flex size-10 items-center justify-center rounded-control bg-ink text-white" aria-label="Stop">
            <span className="size-3 rounded-[3px] bg-white" />
          </button>
        )}
        {editable && (
          <button type="button" disabled={!text.trim() || busy} onClick={() => onSubmit(text.trim())} className="flex size-10 items-center justify-center rounded-control bg-ink text-white transition-opacity disabled:opacity-30" aria-label="Send">
            <ArrowUp className={cn('size-[18px]', busy && 'animate-pulse')} />
          </button>
        )}
      </div>
    </div>
  )
}
