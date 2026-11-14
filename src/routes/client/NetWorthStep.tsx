import { Check, Link2, Loader2, PenLine, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { AskAdvisorButton, AssetLiabilityList, DocumentDropzone, InstitutionLogo, NetWorthSummary } from '../../components/patterns'
import { Button, Checkbox, Dialog, Input, Label, MoneyInput, PercentInput, Segmented, Select, toast } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { money } from '../../lib/format'
import { assetCategories, categoryLabel, liabilityCategories, type NWCategory } from '../../schema/onboarding'
import { estimateValue, institutions, type Estimate } from '../../services/ai'
import { useStore } from '../../store/caseStore'
import { netWorth } from '../../store/selectors'
import type { ClientCase, NWItem } from '../../store/types'
import { linkAccount, processDocument } from './actions'
import type { StepNav } from './ClientApp'
import { StepFooter, StepHeader } from './StepChrome'

type ItemDraft = Partial<NWItem> & { side: 'asset' | 'liability'; category: NWCategory }

const estimable: NWCategory[] = ['realEstate', 'collectible', 'crypto', 'business']

function ActionButton({ icon, children, onClick }: { icon: ReactNode; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-10 items-center gap-2 rounded-control border border-line bg-surface px-3.5 text-[14px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink">
      {icon}
      {children}
    </button>
  )
}

export function NetWorthStep({ c, nav }: { c: ClientCase; nav: StepNav }) {
  const { upsertItem, removeItem, setSectionProgress } = useStore.getState()
  const [linkOpen, setLinkOpen] = useState(false)
  const [linking, setLinking] = useState<string>()
  const [linked, setLinked] = useState<string[]>([])
  const [item, setItem] = useState<ItemDraft>()
  const [est, setEst] = useState<Estimate>()
  const [estimating, setEstimating] = useState(false)
  const totals = netWorth(c)
  const drafts = c.items.filter((i) => i.draft || i.value === undefined).length
  const advisorFirst = useStore((s) => s.people[c.advisorId]?.name.split(' ')[0] ?? 'your Wealth Manager')

  const openItem = (i: ItemDraft) => {
    setEst(undefined)
    setItem({ confidence: 'exact', source: 'manual', ...i })
  }

  const saveItem = () => {
    if (!item) return
    const liquid = item.side === 'asset' ? assetCategories.find((a) => a.id === item.category)?.liquid : false
    upsertItem(c.id, {
      ...item,
      name: item.name || categoryLabel(item.category),
      source: est ? 'estimate' : item.source && item.source !== 'ai' ? item.source : 'manual',
      confidence: item.confidence ?? 'exact',
      liquid: item.liquid ?? liquid,
    } as NWItem)
    setItem(undefined)
  }

  return (
    <div>
      <StepHeader c={c} sectionId="networth" />

      <div className="grid items-start gap-8 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-8">
          <DocumentDropzone onProcess={(kind, name) => processDocument(c.id, c.clientId, kind, name)} done={c.documents.map((d) => ({ name: d.name, extracted: d.extracted }))} />
          <div className="-mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[13px] text-ink-3">Or</span>
            <ActionButton icon={<Link2 className="size-4" />} onClick={() => setLinkOpen(true)}>
              Link an account
            </ActionButton>
            <ActionButton icon={<PenLine className="size-4" />} onClick={() => openItem({ side: 'asset', category: 'realEstate' })}>
              Add manually
            </ActionButton>
          </div>

          {(['asset', 'liability'] as const).map((side) => (
            <section key={side} className="flex flex-col gap-3">
              <h2 className="px-2 text-[15px] font-medium text-ink">{side === 'asset' ? 'What you own' : 'What you owe'}</h2>
              {c.items.some((i) => i.side === side) ? (
                <AssetLiabilityList variant="row" items={c.items} side={side} onSelect={(i) => openItem(i)} />
              ) : (
                <p className="px-2 text-[14px] text-ink-4">{side === 'asset' ? 'Nothing yet. Link, upload or add your first account.' : 'No debts added.'}</p>
              )}
            </section>
          ))}
        </div>

        <aside className="order-first 2xl:sticky 2xl:top-24 2xl:order-last">
          <NetWorthSummary totals={totals} items={c.items} pending={drafts} />
        </aside>
      </div>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen} title="Link an account" description="Secure and read-only. We see balances, never move money." width="md">
        <div className="grid gap-2 sm:grid-cols-2">
          {institutions.map((inst) => {
            const done = linked.includes(inst.id)
            return (
              <button
                key={inst.id}
                type="button"
                disabled={!!linking || done}
                onClick={async () => {
                  setLinking(inst.id)
                  const n = await linkAccount(c.id, inst.id)
                  setLinking(undefined)
                  setLinked((l) => [...l, inst.id])
                  toast(`${inst.name} linked`, { description: `${n} ${n === 1 ? 'account' : 'accounts'} added`, tone: 'success' })
                }}
                className="flex items-center gap-3 rounded-[22px] border border-line p-3 text-left transition-colors hover:border-line-strong disabled:cursor-default"
              >
                <InstitutionLogo inst={inst} />
                <span className="flex flex-1 flex-col">
                  <span className="text-[14px] text-ink">{inst.name}</span>
                  <span className="text-[12px] text-ink-4">{inst.kind}</span>
                </span>
                {linking === inst.id && <Loader2 className="size-4 animate-spin text-ink-3" />}
                {done && <Check className="size-4 text-success" />}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-line pt-4 pl-1">
          <span className="text-[13px] text-ink-4">Don’t see yours?</span>
          <AskAdvisorButton anchor={{ sectionId: 'networth' }} title="Connecting other accounts" label={`Ask ${advisorFirst} to connect other accounts`} />
        </div>
      </Dialog>

      <Dialog
        open={!!item}
        onOpenChange={(o) => !o && setItem(undefined)}
        title={item?.id ? (item.draft ? `Add a balance for “${item.name}”` : 'Edit') : item?.side === 'liability' ? 'Add a debt' : 'Add something you own'}
        description="An estimate is fine. Tell us how sure you are."
        footer={
          <>
            {item?.id && (
              <Button
                variant="ghost"
                className="mr-auto"
                onClick={() => {
                  removeItem(c.id, item.id!)
                  setItem(undefined)
                }}
              >
                Remove
              </Button>
            )}
            <Button variant="ghost" onClick={() => setItem(undefined)}>
              Cancel
            </Button>
            <Button onClick={saveItem}>Save</Button>
          </>
        }
      >
        {item && (
          <div className="flex flex-col gap-4">
            {!item.id && (
              <Segmented
                value={item.side}
                onChange={(v) => setItem({ ...item, side: v as ItemDraft['side'], category: v === 'asset' ? 'realEstate' : 'mortgage' })}
                options={[
                  { value: 'asset', label: 'Something I own' },
                  { value: 'liability', label: 'Something I owe' },
                ]}
              />
            )}
            <Select
              label="Type"
              value={item.category}
              onChange={(v) => setItem({ ...item, category: v as NWCategory })}
              options={(item.side === 'asset' ? assetCategories : liabilityCategories).map((a) => ({ value: a.id, label: a.label, description: a.hint }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Name" value={item.name ?? ''} onChange={(e) => setItem({ ...item, name: e.target.value })} />
              <Input label={item.category === 'realEstate' ? 'Address' : 'Institution'} value={item.institution ?? ''} onChange={(e) => setItem({ ...item, institution: e.target.value })} />
            </div>
            <div className={cn('grid gap-3', item.side === 'liability' && 'sm:grid-cols-2')}>
              <MoneyInput label={item.side === 'liability' ? 'Balance owed' : 'Current value'} value={item.value} onChange={(v) => setItem({ ...item, value: v })} />
              {item.side === 'liability' && <PercentInput label="Interest rate" value={item.rate} onChange={(v) => setItem({ ...item, rate: v })} />}
            </div>
            {estimable.includes(item.category) && (
              <div className="flex flex-col gap-2 rounded-[18px] bg-ai-soft/70 p-2">
                <div className="flex items-center gap-3 pl-2">
                  <Sparkles className="size-4 text-ai" />
                  <span className="flex-1 text-[13px] text-ink-2">{est ? est.basis : 'Not sure what it’s worth? We can estimate it.'}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={estimating}
                    onClick={async () => {
                      setEstimating(true)
                      const e = await estimateValue(item.category, item.institution || item.name || '')
                      setEstimating(false)
                      if (e) {
                        setEst(e)
                        setItem((x) => x && { ...x, value: e.value, confidence: 'estimate', detail: e.basis })
                      }
                    }}
                  >
                    {estimating ? 'Estimating…' : est ? 'Re-estimate' : 'Estimate it'}
                  </Button>
                </div>
                {est && (
                  <div className="flex justify-between px-2 pb-1 text-[12px] text-ink-3">
                    <span>Range {money(est.low)} – {money(est.high)}</span>
                    <span className="text-ai">Using {money(est.value)}</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              <Label>How sure are you?</Label>
              <Segmented
                value={item.confidence}
                onChange={(v) => setItem({ ...item, confidence: v as NWItem['confidence'] })}
                options={[
                  { value: 'exact', label: 'Exact' },
                  { value: 'estimate', label: 'Good estimate' },
                  { value: 'rough', label: 'Rough guess' },
                ]}
              />
            </div>
            {item.category === 'realEstate' && <Checkbox checked={!!item.primaryResidence} onChange={(v) => setItem({ ...item, primaryResidence: v })} label="This is where I live" description="Some rules, like accredited-investor status, leave out your primary home." />}
            {item.id && (
              <div className="flex justify-end">
                <AskAdvisorButton anchor={{ sectionId: 'networth', itemId: item.id }} title={item.name} />
              </div>
            )}
          </div>
        )}
      </Dialog>

      <StepFooter
        onBack={nav.back}
        hint={drafts ? `${drafts} still need a balance, or leave them for the meeting.` : undefined}
        onNext={() => {
          setSectionProgress(c.id, 'networth', c.items.some((i) => !i.draft) ? 'done' : 'progress', c.clientId)
          nav.next()
        }}
      />
    </div>
  )
}
