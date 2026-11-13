import { Plus, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { AskAdvisorButton, GoalCard, goalMeta } from '../../components/patterns'
import { Button, Chip, Dialog, Input, Label, MoneyInput, Segmented, Textarea } from '../../components/primitives'
import { useStore } from '../../store/caseStore'
import type { ClientCase, Goal, GoalKind } from '../../store/types'
import type { StepNav } from './ClientApp'
import { StepFooter, StepHeader } from './StepChrome'

type Draft = Omit<Goal, 'id'> & { id?: string }

const blank = (kind: GoalKind = 'retirement'): Draft => ({ kind, title: '', priority: 'medium' })

export function GoalsStep({ c, nav }: { c: ClientCase; nav: StepNav }) {
  const { addGoal, updateGoal, removeGoal, setSectionProgress } = useStore.getState()
  const [edit, setEdit] = useState<Draft>()
  const drafts = c.goals.filter((g) => g.draft).length

  const save = () => {
    if (!edit) return
    const { id, ...g } = edit
    if (id) updateGoal(c.id, id, { ...g, draft: false })
    else addGoal(c.id, { ...g, title: g.title || goalMeta[g.kind].label })
    setEdit(undefined)
  }

  return (
    <div>
      <StepHeader c={c} sectionId="goals" aside={<AskAdvisorButton anchor={{ sectionId: 'goals' }} title="Your goals" floating />} />

      {drafts > 0 && (
        <div className="mb-6 inline-flex items-center gap-2 text-[14px] text-ai">
          <Sparkles className="size-4" /> {drafts} goals drafted from your intro. Approve, edit or remove them.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {c.goals.map((g) => (
          <GoalCard key={g.id} goal={g} onClick={() => setEdit({ ...g })} onAccept={() => updateGoal(c.id, g.id, { draft: false })} onRemove={() => removeGoal(c.id, g.id)} />
        ))}
        <button type="button" onClick={() => setEdit(blank())} className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-[26px] border border-dashed border-line-strong text-[14px] text-ink-3 transition-colors hover:border-ink-4 hover:text-ink">
          <Plus className="size-5" />
          Add a goal
        </button>
      </div>

      <Dialog
        open={!!edit}
        onOpenChange={(o) => !o && setEdit(undefined)}
        title={edit?.id ? 'Edit goal' : 'Add a goal'}
        description="Rough numbers are fine. We’ll refine them together."
        footer={
          <>
            {edit?.id && (
              <Button
                variant="ghost"
                className="mr-auto"
                onClick={() => {
                  removeGoal(c.id, edit.id!)
                  setEdit(undefined)
                }}
              >
                Remove
              </Button>
            )}
            <Button variant="ghost" onClick={() => setEdit(undefined)}>
              Cancel
            </Button>
            <Button onClick={save}>Save goal</Button>
          </>
        }
      >
        {edit && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5">
              <Label>What kind of goal?</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(goalMeta) as GoalKind[]).map((k) => (
                  <Chip key={k} selected={edit.kind === k} onClick={() => setEdit({ ...edit, kind: k })} leading={<span className="text-ink-3">{goalMeta[k].icon}</span>}>
                    {goalMeta[k].label}
                  </Chip>
                ))}
              </div>
            </div>
            <Input label="Name it" value={edit.title} placeholder={goalMeta[edit.kind].label} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Target year"
                inputMode="numeric"
                value={edit.targetYear ?? ''}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/\D/g, '').slice(0, 4))
                  setEdit({ ...edit, targetYear: n || undefined })
                }}
              />
              <MoneyInput label="Roughly how much" value={edit.amount} onChange={(v) => setEdit({ ...edit, amount: v })} />
            </div>
            <div className="flex flex-col gap-2.5">
              <Label>How important?</Label>
              <Segmented
                value={edit.priority}
                onChange={(v) => setEdit({ ...edit, priority: v as Goal['priority'] })}
                options={[
                  { value: 'high', label: 'Top priority' },
                  { value: 'medium', label: 'Important' },
                  { value: 'low', label: 'Nice to have' },
                ]}
              />
            </div>
            <Textarea label="Anything else?" value={edit.note ?? ''} onChange={(e) => setEdit({ ...edit, note: e.target.value })} />
          </div>
        )}
      </Dialog>

      <StepFooter
        onBack={nav.back}
        hint={drafts ? 'Skipped drafts stay here as suggestions.' : c.goals.length ? undefined : 'Add at least one goal, or skip and talk about it in the meeting.'}
        nextLabel={drafts ? `Keep ${drafts} and continue` : 'Continue'}
        onNext={() => {
          if (drafts) c.goals.filter((g) => g.draft).forEach((g) => updateGoal(c.id, g.id, { draft: false }))
          setSectionProgress(c.id, 'goals', c.goals.length ? 'done' : 'progress', c.clientId)
          nav.next()
        }}
        extra={
          drafts > 0 && (
            <Button variant="ghost" size="lg" onClick={() => (setSectionProgress(c.id, 'goals', 'progress', c.clientId), nav.next())}>
              Skip for now
            </Button>
          )
        }
      />
    </div>
  )
}
