import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, Mic, PencilLine, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { TaskStack, VoiceInput } from '../../components/patterns'
import { Button } from '../../components/primitives'
import { fieldById } from '../../schema/onboarding'
import { extractIntro, introTranscript, wait, type IntroResult } from '../../services/ai'
import { useStore } from '../../store/caseStore'
import type { ClientCase } from '../../store/types'
import type { StepNav } from './ClientApp'
import { StepHeader } from './StepChrome'

const pretty = (v: unknown, id: string) => (typeof v === 'string' ? (fieldById[id]?.options?.find((o) => o.value === v)?.label ?? v) : undefined)

/** Short, human summaries of what the intro picked up, per section, read from the drafts on the case. */
function heardIn(c: ClientCase): Record<string, string[]> {
  const v = (id: string) => c.fields[id]?.value ?? c.fields[id]?.suggestion?.value
  const kids = Number(v('dependents'))
  const spouse = typeof v('spouseName') === 'string' ? String(v('spouseName')).split(' ')[0] : undefined
  const marital = pretty(v('maritalStatus'), 'maritalStatus')
  const income = Array.isArray(v('incomeSources')) ? (v('incomeSources') as string[]).map((x) => pretty(x, 'incomeSources')).filter(Boolean) : []
  return {
    about: [
      marital && (spouse ? `${marital} to ${spouse}` : marital),
      kids > 0 && `${kids} ${kids === 1 ? 'child' : 'kids'}`,
      [v('city'), v('state')].filter(Boolean).join(', '),
    ].filter(Boolean) as string[],
    work: [
      [v('jobTitle'), v('employer')].filter(Boolean).join(' at '),
      income.length > 0 && `Income from ${income.join(' and ').toLowerCase()}`,
    ].filter(Boolean) as string[],
    goals: c.goals.map((g) => g.title),
    networth: c.items.map((i) => (i.institution && !i.name.includes(i.institution) ? `${i.institution} ${i.name.toLowerCase()}` : i.name)),
  }
}

const work = ['Listening back to what you said', 'Picking out your family and work details', 'Spotting your goals', 'Listing the accounts you mentioned', 'Drafting answers for you to confirm']

export function Intro({ c, nav }: { c: ClientCase; nav: StepNav }) {
  const [phase, setPhase] = useState<'input' | 'working' | 'result'>(c.introDone ? 'result' : 'input')
  const [active, setActive] = useState(0)
  const [result, setResult] = useState<IntroResult['summary']>()

  const submit = async (text: string) => {
    setPhase('working')
    setActive(0)
    const extraction = extractIntro(text)
    for (let i = 1; i < work.length; i++) {
      await wait(1050)
      setActive(i)
    }
    const r = await extraction
    await wait(900)
    setActive(work.length)
    await wait(700)
    const st = useStore.getState()
    st.applyDrafts(c.id, r.fields, 'ai', 'ai')
    r.goals.forEach((g) => st.addGoal(c.id, g))
    r.items.forEach((i) => st.upsertItem(c.id, { ...i, draft: true }, i.category === 'retirement' ? 'retirement' : undefined))
    st.setIntroDone(c.id)
    setResult(r.summary)
    setPhase('result')
  }

  const aiIn = (sid: string) => Object.entries(c.fields).filter(([k, f]) => (f.suggestion?.by === 'ai' || f.source === 'ai') && fieldById[k]?.sectionId === sid).length
  const summary = result ?? [
    { label: 'details about you and your family', count: aiIn('about'), sectionId: 'about' as const },
    { label: 'work details', count: aiIn('work'), sectionId: 'work' as const },
    { label: 'goals', count: c.goals.length, sectionId: 'goals' as const },
    { label: 'accounts and debts to fill in', count: c.items.length, sectionId: 'networth' as const },
  ]
  const heard = heardIn(c)

  return (
    <div>
      <StepHeader
        eyebrow="Getting started · about a minute"
        title={phase === 'result' ? 'Here’s what we caught.' : 'Tell us about you, in your own words.'}
        description={
          phase === 'result'
            ? 'We’ve drafted these answers. Nothing is saved as final until you confirm it in each step.'
            : 'Your family, your work, what you’re hoping for, and roughly what you have. A minute is plenty. We’ll turn it into answers you can check.'
        }
      />
      {phase === 'input' && (
        <div className="flex flex-col gap-4">
          <VoiceInput transcript={introTranscript} onSubmit={submit} />
          <Button variant="secondary" size="lg" className="self-start" leading={<PencilLine className="size-4" />} onClick={() => nav.go('about')}>
            Skip to the form
          </Button>
        </div>
      )}
      <AnimatePresence mode="wait" initial={false}>
      {phase === 'working' && (
        <motion.div key="working" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.35 } }} className="flex flex-col items-center gap-6 rounded-[28px] bg-muted/70 px-6 py-10">
          <TaskStack
            items={work.map((w, i) => ({
              id: String(i),
              label: w,
              icon: i < active ? <Check className="size-4 text-success" /> : <Sparkles className={i === active ? 'size-4 animate-pulse text-ai' : 'size-4'} />,
            }))}
            active={Math.min(active, work.length - 1)}
          />
        </motion.div>
      )}
      {phase === 'result' && (
        <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
          {summary.filter((s) => s.count > 0).map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="flex items-start gap-4 rounded-[22px] bg-surface p-3 pr-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-ai-soft text-ai">
                <Sparkles className="size-[18px]" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-2.5 pt-2">
                <span className="text-[16px] leading-6 text-ink">
                  <span className="tabular font-medium">{s.count}</span> {s.label}
                </span>
                {heard[s.sectionId]?.length > 0 && (
                  <span className="flex flex-wrap gap-1.5 pb-1">
                    {heard[s.sectionId].map((h) => (
                      <span key={h} className="inline-flex h-7 items-center rounded-full bg-muted px-3 text-[13px] text-ink-2">
                        {h}
                      </span>
                    ))}
                  </span>
                )}
              </span>
            </motion.div>
          ))}
          <div className="mt-3 flex items-center justify-between gap-3">
            <Button variant="secondary" size="lg" leading={<Mic className="size-4" />} onClick={() => setPhase('input')}>
              Add more
            </Button>
            <Button size="lg" trailing={<ArrowRight className="size-4" />} onClick={nav.next}>
              Continue
            </Button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}
