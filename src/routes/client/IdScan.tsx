import { motion } from 'motion/react'
import { ArrowRight, Camera, IdCard, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
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
      <StepHeader eyebrow="Getting started · 30 seconds" title="Scan your driver’s license." description="Your name, date of birth and address come straight from it, exactly as the custodian needs them." />
      <div className="relative flex aspect-[1.7] w-full max-w-xl flex-col items-center justify-center gap-4 overflow-hidden rounded-[28px] border border-dashed border-line-strong bg-surface/70">
        {phase === 'scanning' && <motion.span className="absolute inset-x-6 h-0.5 rounded-full bg-ai/60 shadow-[0_0_16px_var(--color-ai)]" initial={{ top: '12%' }} animate={{ top: ['12%', '88%', '12%'] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />}
        {phase !== 'done' ? (
          <>
            <IdCard className="size-12 text-ink-4" strokeWidth={1.2} />
            <span className="text-[14px] text-ink-3">{phase === 'scanning' ? 'Reading your license…' : 'Front of your license, in good light'}</span>
            <Button size="lg" leading={<Camera className="size-4" />} disabled={phase === 'scanning'} onClick={scan}>
              {phase === 'scanning' ? 'Scanning…' : 'Use camera'}
            </Button>
          </>
        ) : (
          <div className="flex w-full flex-col gap-2 p-6">
            {Object.entries(found ?? Object.fromEntries(['firstName', 'lastName', 'dob', 'street', 'city', 'zip'].map((k) => [k, { value: c.fields[k]?.value ?? c.fields[k]?.suggestion?.value, sourceLabel: '', confidence: 'high' as const }]))).map(([k, d]) => (
              <div key={k} className="flex items-center justify-between gap-4 text-[14px]">
                <span className="text-ink-3">{fieldById[k]?.label}</span>
                <span className="text-ink">{displayValue(fieldById[k], d.value)}</span>
              </div>
            ))}
            <SourceTag kind="id" label="Read from your license · you’ll confirm on the next step" className="mt-2" />
          </div>
        )}
      </div>
      <p className="mt-4 inline-flex items-center gap-2 text-[13px] text-ink-4">
        <ShieldCheck className="size-4" /> The image is used once to read the details and isn’t stored.
      </p>
      <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-6">
        <button type="button" onClick={nav.next} className="text-[14px] text-ink-3 hover:text-ink">
          {phase === 'done' ? '' : 'Skip, I’ll type it'}
        </button>
        <Button size="lg" trailing={<ArrowRight className="size-4" />} disabled={phase === 'scanning'} onClick={nav.next}>
          Continue
        </Button>
      </div>
    </div>
  )
}
