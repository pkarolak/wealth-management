import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { AskAdvisorButton, FieldRow } from '../../components/patterns'
import { Button, RadioCard } from '../../components/primitives'
import { fieldsFor } from '../../schema/onboarding'
import { riskProfiles, riskQuestions, scoreRisk } from '../../schema/risk'
import { useStore } from '../../store/caseStore'
import type { ClientCase } from '../../store/types'
import type { StepNav } from './ClientApp'
import { StepFooter, StepHeader } from './StepChrome'

export function RiskStep({ c, nav }: { c: ClientCase; nav: StepNav }) {
  const { setRisk, confirmRisk, setSectionProgress } = useStore.getState()
  const score = scoreRisk(c.risk)
  const level = score ? riskProfiles.findIndex((p) => p.label === score.label) : -1

  return (
    <div>
      <StepHeader c={c} sectionId="risk" />
      <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-10">
          {riskQuestions.map((q, qi) => (
            <section key={q.id} className="flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <span className="tabular text-[13px] text-ink-4">{qi + 1}</span>
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-[17px] text-ink">{q.prompt}</h2>
                  {q.context && <span className="text-[13px] text-ink-4">{q.context}</span>}
                </div>
              </div>
              <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
                {q.options.map((o, i) => (
                  <RadioCard key={o.label} selected={c.risk[q.id] === i} onSelect={() => setRisk(c.id, q.id, i)} title={o.label} description={o.description || undefined} />
                ))}
              </div>
            </section>
          ))}
          <section className="flex flex-col gap-4">
            <h2 className="text-[15px] font-medium text-ink">Your experience</h2>
            <div className="flex flex-col gap-2">
              {fieldsFor('risk').map((f) => (
                <FieldRow key={f.id} def={f} />
              ))}
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-24">
          <div className="flex flex-col gap-4 rounded-[24px] bg-surface p-6">
            <span className="text-[13px] text-ink-3">Your profile</span>
            {score ? (
              <>
                <motion.span key={score.label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="display text-[34px] text-ink">
                  {score.label}
                </motion.span>
                <div className="flex gap-1">
                  {riskProfiles.map((p, i) => (
                    <span key={p.label} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: i <= level ? 'var(--color-ink)' : 'var(--color-sunken)' }} />
                  ))}
                </div>
                <p className="text-[14px] leading-relaxed text-ink-3">{score.description}</p>
                <p className="text-[13px] text-ink-4">
                  Objective: <span className="text-ink-2">{score.objective}</span>
                </p>
                {score.complete &&
                  (c.riskConfirmed ? (
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-success">
                      <Check className="size-4" /> Confirmed
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" leading={<Check className="size-3.5" />} onClick={() => confirmRisk(c.id, c.clientId)}>
                        Sounds like me
                      </Button>
                      <AskAdvisorButton anchor={{ sectionId: 'risk' }} title="Risk profile" label="Not quite" />
                    </div>
                  ))}
              </>
            ) : (
              <p className="text-[14px] text-ink-4">Answer a question to see where you land.</p>
            )}
          </div>
        </aside>
      </div>
      <StepFooter
        onBack={nav.back}
        onNext={() => {
          setSectionProgress(c.id, 'risk', score?.complete ? 'done' : 'progress', c.clientId)
          nav.next()
        }}
      />
    </div>
  )
}
