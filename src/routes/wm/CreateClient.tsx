import { ArrowRight, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Button, Card, ChipGroup, Input, Label, Segmented, Switch, Textarea } from '../../components/primitives'
import { accountEffects, accountTypeOptions, sectionById, type SectionId } from '../../schema/onboarding'
import { useStore } from '../../store/caseStore'
import { demoNewClient } from '../../store/seed'
import { useCase } from '../../store/hooks'
import { NewClientSteps } from './NewClientSteps'
import { PageHeader } from './WMLayout'

type Form = Omit<typeof demoNewClient, 'household' | 'optionalSections'> & { household: 'individual' | 'joint'; optionalSections: SectionId[] }

const empty: Form = { firstName: '', lastName: '', email: '', phone: '', household: 'individual', accountTypes: [], optionalSections: [], note: '' }

export function CreateClient() {
  const navigate = useNavigate()
  const createCase = useStore((s) => s.createCase)
  const updateCase = useStore((s) => s.updateCaseDetails)
  const { caseId } = useParams()
  const existing = useCase(caseId)
  const [f, setF] = useState<Form>(() =>
    existing
      ? { firstName: existing.firstName, lastName: existing.lastName, email: existing.email, phone: existing.phone ?? '', household: existing.household, accountTypes: existing.accountTypes, optionalSections: existing.optionalSections, note: existing.note }
      : empty,
  )
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }))
  const effects = accountEffects(f.accountTypes, f.household)
  const valid = f.firstName && f.lastName && /\S+@\S+\.\S+/.test(f.email)

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow={<NewClientSteps step={1} caseId={existing?.id} canAdvance={!!valid} />}
        title="Who are we onboarding?"
        actions={
          !existing && <Button variant="ghost" leading={<Wand2 className="size-4" />} onClick={() => setF({ ...demoNewClient })}>
            Fill with demo client
          </Button>
        }
      />
      <div className="grid gap-4 px-10 lg:grid-cols-[1fr_340px]">
        <Card padding="lg" inner={10} className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h3 className="text-[15px] font-medium text-ink">Contact</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="First name" value={f.firstName} onChange={(e) => set('firstName', e.target.value)} />
              <Input label="Last name" value={f.lastName} onChange={(e) => set('lastName', e.target.value)} />
              <Input label="Email" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
              <Input label="Mobile phone" type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <h3 className="text-[15px] font-medium text-ink">Accounts to open</h3>
            <div className="flex flex-col gap-2.5">
              <Label>Household</Label>
              <Segmented
                value={f.household}
                onChange={(v) => set('household', v as Form['household'])}
                options={[
                  { value: 'individual', label: 'Individual' },
                  { value: 'joint', label: 'Joint with spouse' },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2.5">
              <Label hint={f.firstName ? `${f.firstName} only sees the questions these need` : 'Clients only see the questions these need'}>Account types</Label>
              <ChipGroup value={f.accountTypes} onChange={(v) => set('accountTypes', v)} options={accountTypeOptions} />
            </div>
            {effects.length > 0 && (
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-3">
                <span className="text-ink-4">Adds to {f.firstName ? `${f.firstName}’s` : 'their'} form:</span>
                {effects.map((e) => (
                  <span key={e} className="inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-[12px] text-ink-2">
                    {e}
                  </span>
                ))}
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-[15px] font-medium text-ink">What to ask</h3>
            <Switch
              checked={f.optionalSections.includes('estate')}
              onChange={(on) => set('optionalSections', on ? ['estate'] : [])}
              label={`Include “${sectionById.estate.title}” (wills, insurance, CPA)`}
            />
            <Textarea label="Notes from your first conversation" value={f.note} onChange={(e) => set('note', e.target.value)} />
          </section>

          <div className="flex justify-end gap-2 border-t border-line pt-5">
            <Button variant="ghost" onClick={() => navigate('/wm')}>
              {existing ? 'Back to overview' : 'Cancel'}
            </Button>
            <Button
              disabled={!valid}
              trailing={<ArrowRight className="size-4" />}
              onClick={() => {
                if (existing) {
                  updateCase(existing.id, f)
                  navigate(`/wm/c/${existing.id}/invite`)
                } else navigate(`/wm/c/${createCase(f).id}/invite`)
              }}
            >
              {existing ? 'Save and continue' : 'Create and write invite'}
            </Button>
          </div>
        </Card>

        <aside className="flex flex-col gap-3 text-[14px] text-ink-3">
          <Card tone="muted" padding="lg" inner={0} className="flex flex-col gap-3 leading-relaxed">
            <span className="font-medium text-ink">What happens next</span>
            <p>We create a private link for the client. They can fill it in on their own time, by voice or by uploading statements.</p>
            <p>You’ll see their progress live, can answer questions right on a field, and get a meeting brief once they submit.</p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
