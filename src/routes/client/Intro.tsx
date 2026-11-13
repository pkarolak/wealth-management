import { motion } from 'motion/react'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { TaskStack, VoiceInput } from '../../components/patterns'
import { Button } from '../../components/primitives'
import { extractIntro, introTranscript, type IntroResult } from '../../services/ai'
import { useStore } from '../../store/caseStore'
import type { ClientCase } from '../../store/types'
import type { StepNav } from './ClientApp'
import { StepHeader } from './StepChrome'

const work = ['Listening back to what you said', 'Picking out your family and work details', 'Spotting your goals', 'Listing the accounts you mentioned', 'Drafting answers for you to confirm']

export function Intro({ c, nav }: { c: ClientCase; nav: StepNav }) {
  const [phase, setPhase] = useState<'input' | 'working' | 'result'>(c.introDone ? 'result' : 'input')
  const [active, setActive] = useState(0)
  const [result, setResult] = useState<IntroResult['summary']>()

  useEffect(() => {
    if (phase !== 'working') return
    const t = setInterval(() => setActive((a) => Math.min(work.length - 1, a + 1)), 420)
    return () => clearInterval(t)
  }, [phase])

  const submit = async (text: string) => {
    setPhase('working')
    setActive(0)
    const r = await extractIntro(text)
    const st = useStore.getState()
    st.applyDrafts(c.id, r.fields, 'ai', 'ai')
    r.goals.forEach((g) => st.addGoal(c.id, g))
    r.items.forEach((i) => st.upsertItem(c.id, { ...i, draft: true }, i.category === 'retirement' ? 'retirement' : undefined))
    st.setIntroDone(c.id)
    setResult(r.summary)
    setPhase('result')
  }

  const summary = result ?? [
    { label: 'details about you and your family', count: Object.values(c.fields).filter((f) => f.suggestion || f.source === 'ai').length, sectionId: 'about' as const },
    { label: 'goals', count: c.goals.length, sectionId: 'goals' as const },
    { label: 'accounts and debts to fill in', count: c.items.length, sectionId: 'networth' as const },
  ]

  return (
    <div>
      <StepHeader
        eyebrow="Getting started · 1 minute"
        title={phase === 'result' ? 'Here’s what we caught.' : 'Tell us about you, in your own words.'}
        description={
          phase === 'result'
            ? 'We’ve drafted these answers. Nothing is saved as final until you confirm it in each step.'
            : 'Your family, your work, what you’re hoping for, and roughly what you have. Thirty seconds is plenty. We’ll turn it into answers you can check.'
        }
      />
      {phase === 'input' && (
        <div className="flex flex-col gap-4">
          <VoiceInput transcript={introTranscript} onSubmit={submit} />
          <button type="button" onClick={nav.next} className="self-start text-[14px] text-ink-3 underline-offset-4 hover:text-ink hover:underline">
            Skip, I’ll fill in the form myself
          </button>
        </div>
      )}
      {phase === 'working' && (
        <div className="flex flex-col items-center gap-6 rounded-[28px] bg-muted/70 px-6 py-14">
          <TaskStack items={work.map((w, i) => ({ id: String(i), label: w, icon: i < active ? <Check className="size-4" /> : <Sparkles className="size-4" /> }))} active={active} />
        </div>
      )}
      {phase === 'result' && (
        <div className="flex flex-col gap-3">
          {summary.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-4 rounded-[22px] bg-surface p-3 pr-5">
              <span className="flex size-10 items-center justify-center rounded-control bg-ai-soft text-ai">
                <Sparkles className="size-[18px]" />
              </span>
              <span className="flex-1 text-[16px] text-ink">
                <span className="tabular font-medium">{s.count}</span> {s.label}
              </span>
            </motion.div>
          ))}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button type="button" onClick={() => setPhase('input')} className="text-[14px] text-ink-3 hover:text-ink">
              Say more
            </button>
            <Button size="lg" trailing={<ArrowRight className="size-4" />} onClick={nav.next}>
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
