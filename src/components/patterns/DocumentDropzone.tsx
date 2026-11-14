import { AnimatePresence, motion } from 'motion/react'
import { Check, FileText, Sparkles, UploadCloud } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { cn } from '../../lib/cn'
import { documentKinds, type DocKind } from '../../services/ai'
import { Dialog, ProgressBar } from '../primitives'

type Job = { id: string; name: string; kind: DocKind; phase: 'uploading' | 'reading' | 'done'; extracted: string[] }

const guessKind = (name: string): DocKind => {
  const n = name.toLowerCase()
  if (n.includes('401') || n.includes('fidelity') || n.includes('ira')) return 'retirement'
  if (n.includes('mortgage') || n.includes('loan')) return 'mortgage'
  if (n.includes('1040') || n.includes('tax')) return 'tax'
  if (n.includes('rsu') || n.includes('equity') || n.includes('shareworks') || n.includes('carta')) return 'equity'
  if (n.includes('pay')) return 'paystub'
  return 'brokerage'
}

type Props = {
  /** Runs extraction and applies results; resolves with short labels of what was found. */
  onProcess: (kind: DocKind, fileName: string) => Promise<string[]>
  /** Sample files offered as one-click "uploads". */
  samples?: DocKind[]
  done?: { name: string; extracted: string[] }[]
  className?: string
}

/** Drop or pick statements; each moves through uploading → reading → extracted. Same 22 = 10 + 12 geometry as DocRow (11px padding + 1px dashed border). */
export function DocumentDropzone({ onProcess, samples = ['brokerage', 'retirement', 'equity', 'mortgage', 'tax'], done = [], className }: Props) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [over, setOver] = useState(false)
  const [picking, setPicking] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const run = async (name: string, kind: DocKind) => {
    const id = `${name}-${Date.now()}`
    setJobs((j) => [{ id, name, kind, phase: 'uploading', extracted: [] }, ...j])
    await new Promise((r) => setTimeout(r, 700))
    setJobs((j) => j.map((x) => (x.id === id ? { ...x, phase: 'reading' } : x)))
    const extracted = await onProcess(kind, name)
    setJobs((j) => j.map((x) => (x.id === id ? { ...x, phase: 'done', extracted } : x)))
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    for (const f of Array.from(e.dataTransfer.files)) run(f.name, guessKind(f.name))
  }

  const usedNames = new Set([...jobs.map((j) => j.name), ...done.map((d) => d.name)])
  const remaining = documentKinds.filter((d) => samples.includes(d.kind) && !usedNames.has(d.file))
  const finished = done.filter((d) => !jobs.some((j) => j.name === d.name))

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        onDragOver={(e) => (e.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn('flex flex-col gap-3 rounded-[22px] border border-dashed p-[11px] transition-colors', over ? 'border-ink bg-muted' : 'border-line-strong bg-surface/60')}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-muted text-ink-2">
            <UploadCloud className="size-[18px]" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[14px] font-medium text-ink">Drop statements here</span>
            <span className="text-[13px] text-ink-3">We read the numbers for you. Files are encrypted and shared only with your Wealth Manager’s team.</span>
          </div>
          <button type="button" onClick={() => (remaining.length ? setPicking(true) : input.current?.click())} className="h-10 shrink-0 rounded-control border border-line bg-surface px-4 text-[14px] font-medium text-ink hover:border-line-strong">
            Browse
          </button>
          <input ref={input} type="file" multiple className="hidden" onChange={(e) => Array.from(e.target.files ?? []).forEach((f) => run(f.name, guessKind(f.name)))} />
        </div>
      </div>

      <Dialog open={picking} onOpenChange={setPicking} title="Choose statements" description="Recent files on this device.">
        <div className="flex flex-col gap-1">
          {remaining.map((d) => (
            <button
              key={d.kind}
              type="button"
              onClick={() => {
                setPicking(false)
                run(d.file, d.kind)
              }}
              className="flex items-center gap-3 rounded-[14px] p-2 text-left transition-colors hover:bg-muted"
            >
              <FileText className="size-4 shrink-0 text-ink-3" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[14px] text-ink">{d.file}</span>
                <span className="text-[12px] text-ink-3">{d.label}</span>
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setPicking(false)
              input.current?.click()
            }}
            className="mt-2 self-start text-[13px] text-ink-3 underline decoration-line-strong underline-offset-[3px] hover:text-ink"
          >
            Another file…
          </button>
        </div>
      </Dialog>

      <AnimatePresence initial={false}>
        {jobs.map((j) => (
          <motion.div key={j.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <DocRow name={j.name} phase={j.phase} extracted={j.extracted} />
          </motion.div>
        ))}
      </AnimatePresence>
      {finished.map((d) => (
        <DocRow key={d.name} name={d.name} phase="done" extracted={d.extracted} />
      ))}
    </div>
  )
}

/** One uploaded file. 12px padding around a 10px-radius icon tile → 22. */
export function DocRow({ name, phase, extracted }: { name: string; phase: Job['phase']; extracted: string[] }) {
  return (
    <div className="flex items-start gap-3 rounded-[22px] bg-surface p-3">
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-control', phase === 'done' ? 'bg-success-soft text-success' : 'bg-ai-soft text-ai')}>
        {phase === 'done' ? <Check className="size-[18px]" /> : phase === 'reading' ? <Sparkles className="size-[18px] animate-pulse" /> : <FileText className="size-[18px]" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-[14px] font-medium text-ink">{name}</span>
          <span className="shrink-0 text-[12px] text-ink-4">{phase === 'uploading' ? 'Uploading…' : phase === 'reading' ? 'Reading…' : 'Done'}</span>
        </div>
        {phase === 'uploading' && <ProgressBar value={70} tone="waiting" className="h-1" />}
        {phase === 'reading' && (
          <div className="flex gap-1.5">
            <span className="shimmer h-5 w-24 rounded-full" />
            <span className="shimmer h-5 w-16 rounded-full" />
            <span className="shimmer h-5 w-20 rounded-full" />
          </div>
        )}
        {phase === 'done' && (
          <div className="flex flex-wrap gap-1.5">
            {extracted.map((x) => (
              <span key={x} className="inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-[12px] text-ink-2">
                {x}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
