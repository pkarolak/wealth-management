import { ArrowRight, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, Card, ChipGroup, Input, Label, Segmented, Switch, Textarea } from '../../components/primitives'
import { accountTypeOptions, sectionById, type SectionId } from '../../schema/onboarding'
import { useStore } from '../../store/caseStore'
import { demoNewClient } from '../../store/seed'
import { PageHeader } from './WMLayout'

type Form = typeof demoNewClient & { household: 'individual' | 'joint'; optionalSections: SectionId[] }

const empty: Form = { firstName: '', lastName: '', email: '', phone: '', household: 'individual', accountTypes: [], optionalSections: [], note: '' }

export function CreateClient() {
  const navigate = useNavigate()
  const createCase = useStore((s) => s.createCase)
  const [f, setF] = useState<Form>(empty)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }))
  const valid = f.firstName && f.lastName && /\S+@\S+\.\S+/.test(f.email)

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="New client"
        title="Who are we onboarding?"
        actions={
          <Button variant="ghost" leading={<Wand2 className="size-4" />} onClick={() => setF({ ...demoNewClient })}>
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
              <Label hint="Decides which custodian questions we ask">Account types</Label>
              <ChipGroup value={f.accountTypes} onChange={(v) => set('accountTypes', v)} options={accountTypeOptions} />
            </div>
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
              Cancel
            </Button>
            <Button
              disabled={!valid}
              trailing={<ArrowRight className="size-4" />}
              onClick={() => {
                const c = createCase(f)
                navigate(`/wm/c/${c.id}/invite`)
              }}
            >
              Create and write invite
            </Button>
          </div>
        </Card>

        <aside className="flex flex-col gap-3 text-[14px] text-ink-3">
          <Card tone="muted" padding="lg" inner={0} className="flex flex-col gap-3 leading-relaxed">
            <span className="font-medium text-ink">What happens next</span>
            <p>We create a private link for the client. They can fill it in on their own time, by voice or by uploading statements.</p>
            <p>You’ll see their progress live, can answer questions right on a field, and get a meeting brief once they sign.</p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
