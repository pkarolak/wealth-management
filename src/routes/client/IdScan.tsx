import { motion } from 'motion/react'
import { ArrowRight, Camera, IdCard, ImageUp, PencilLine, ShieldCheck } from 'lucide-react'
import { useRef, useState } from 'react'
import { SourceTag } from '../../components/patterns'
import { Button } from '../../components/primitives'
import { displayValue, fieldById } from '../../schema/onboarding'
import { scanId, type FieldDraft } from '../../services/ai'
import { useStore } from '../../store/caseStore'
import type { ClientCase } from '../../store/types'
import type { StepNav } from './ClientApp'
import { StepHeader } from './StepChrome'

export function IdScan({ c, nav }: { c: ClientCase; nav: StepNav }) {
  const applyDrafts = useStore((s) => s.applyDrafts)
  const setIdScanned = useStore((s) => s.setIdScanned)
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>(c.idScanned ? 'done' : 'idle')
  const [found, setFound] = useState<Record<string, FieldDraft>>()
  const file = useRef<HTMLInputElement>(null)

  const scan = async () => {
    setPhase('scanning')
    const r = await scanId()
    applyDrafts(c.id, r, 'ai', 'ai')
    setIdScanned(c.id)
    setFound(r)
    setPhase('done')
  }

  return (
    <div>
      <StepHeader eyebrow="Getting started · 30 seconds" title="Scan your driver’s license" description="We read your name, date of birth and address exactly as your accounts need them." />
      <div className="flex flex-col gap-4">
        <div className="relative flex min-h-64 w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-[22px] bg-surface p-3 shadow-float">
          {phase === 'scanning' && <motion.span className="absolute inset-x-6 h-0.5 rounded-full bg-ai/60 shadow-[0_0_16px_var(--color-ai)]" initial={{ top: '12%' }} animate={{ top: ['12%', '88%', '12%'] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />}
          {phase !== 'done' ? (
            <>
              <IdCard className="size-12 text-ink-4" strokeWidth={1.2} />
              <span className="text-[15px] text-ink-3">{phase === 'scanning' ? 'Reading your license…' : 'Front of your license, in good light'}</span>
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="lg" leading={<Camera className="size-4" />} disabled={phase === 'scanning'} onClick={scan}>
                  {phase === 'scanning' ? 'Scanning…' : 'Take photo'}
                </Button>
                {phase === 'idle' && (
                  <Button size="lg" variant="secondary" leading={<ImageUp className="size-4" />} onClick={() => file.current?.click()}>
                    Choose photo
                  </Button>
                )}
              </div>
              <p className="inline-flex items-center gap-1.5 text-[13px] text-ink-4">
                <ShieldCheck className="size-3.5" /> Used once to read the details, never stored.
              </p>
              <input ref={file} type="file" accept="image/*,.pdf" className="sr-only" tabIndex={-1} onChange={(e) => e.target.files?.length && scan()} />
            </>
          ) : (
            <div className="flex w-full flex-col gap-2 p-3">
              {Object.entries(found ?? Object.fromEntries(['firstName', 'lastName', 'dob', 'street', 'city', 'zip'].map((k) => [k, { value: c.fields[k]?.value ?? c.fields[k]?.suggestion?.value, sourceLabel: '', confidence: 'high' as const }]))).map(([k, d]) => (
                <div key={k} className="flex items-center justify-between gap-4 text-[15px]">
                  <span className="text-ink-3">{fieldById[k]?.label}</span>
                  <span className="text-ink">{displayValue(fieldById[k], d.value)}</span>
                </div>
              ))}
              <SourceTag kind="id" label="From your license · confirm on the next step" className="mt-2" />
            </div>
          )}
        </div>
        {phase === 'done' ? (
          <div className="mt-3 flex items-center justify-between gap-3">
            <Button variant="secondary" size="lg" leading={<Camera className="size-4" />} onClick={() => setPhase('idle')}>
              Scan again
            </Button>
            <Button size="lg" trailing={<ArrowRight className="size-4" />} onClick={nav.next}>
              Continue
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="lg" className="self-start" leading={<PencilLine className="size-4" />} disabled={phase === 'scanning'} onClick={nav.next}>
            Skip to the form
          </Button>
        )}
      </div>
    </div>
  )
}
