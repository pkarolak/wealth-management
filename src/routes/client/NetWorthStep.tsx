import { Check, FileUp, Link2, Loader2, PenLine, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { AskAdvisorButton, AssetLiabilityList, DocumentDropzone, NetWorthSummary } from '../../components/patterns'
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

function ActionTile({ icon, title, body, onClick, active }: { icon: ReactNode; title: string; body: string; onClick: () => void; active?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex items-start gap-3 rounded-[22px] p-3 text-left transition-colors', active ? 'bg-surface shadow-float' : 'bg-surface/70 hover:bg-surface')}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-muted text-ink-2">{icon}</span>
      <span className="flex flex-col gap-0.5 pt-0.5">
        <span className="text-[15px] text-ink">{title}</span>
        <span className="text-[13px] leading-snug text-ink-3">{body}</span>
      </span>
    </button>
  )
}

export function NetWorthStep({ c, nav }: { c: ClientCase; nav: StepNav }) {
  const { upsertItem, removeItem, setSectionProgress } = useStore.getState()
  const [linkOpen, setLinkOpen] = useState(false)
  const [linking, setLinking] = useState<string>()
  const [linked, setLinked] = useState<string[]>([])
  const [upload, setUpload] = useState(c.documents.length > 0)
  const [item, setItem] = useState<ItemDraft>()
  const [est, setEst] = useState<Estimate>()
  const [estimating, setEstimating] = useState(false)
  const totals = netWorth(c)
  const drafts = c.items.filter((i) => i.draft).length

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
      <StepHeader c={c} sectionId="networth" aside={<AskAdvisorButton anchor={{ sectionId: 'networth' }} title="What you own and owe" />} />

      <div className="grid items-start gap-8 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-8">
          <div className="grid gap-2 sm:grid-cols-3">
            <ActionTile icon={<Link2 className="size-[18px]" />} title="Link an account" body="Balances update on their own" onClick={() => setLinkOpen(true)} />
            <ActionTile icon={<FileUp className="size-[18px]" />} title="Upload statements" body="We read the numbers" onClick={() => setUpload((u) => !u)} active={upload} />
            <ActionTile icon={<PenLine className="size-[18px]" />} title="Add manually" body="Property, art, loans…" onClick={() => openItem({ side: 'asset', category: 'realEstate' })} />
          </div>

          {upload && <DocumentDropzone onProcess={(kind, name) => processDocument(c.id, c.clientId, kind, name)} done={c.documents.map((d) => ({ name: d.name, extracted: d.extracted }))} />}

          {drafts > 0 && (
            <p className="inline-flex items-center gap-2 text-[14px] text-ai">
              <Sparkles className="size-4" /> You mentioned {drafts} {drafts === 1 ? 'account' : 'accounts'} in your intro. Add a balance, link or upload to fill them in.
            </p>
          )}

          <section className="flex flex-col gap-3">
            <h2 className="px-3 text-[15px] font-medium text-ink">What you own</h2>
            <AssetLiabilityList items={c.items} side="asset" onSelect={(i) => openItem(i)} onAdd={(cat) => openItem({ side: 'asset', category: cat })} />
            {!c.items.some((i) => i.side === 'asset') && <p className="px-3 text-[14px] text-ink-4">Nothing yet. Link, upload or add your first account.</p>}
          </section>
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-3">
              <h2 className="text-[15px] font-medium text-ink">What you owe</h2>
              <button type="button" onClick={() => openItem({ side: 'liability', category: 'mortgage' })} className="text-[13px] text-ink-3 hover:text-ink">
                + Add a debt
              </button>
            </div>
            <AssetLiabilityList items={c.items} side="liability" onSelect={(i) => openItem(i)} />
            {!c.items.some((i) => i.side === 'liability') && <p className="px-3 text-[14px] text-ink-4">No debts added.</p>}
          </section>
        </div>

        <aside className="order-first 2xl:sticky 2xl:top-24 2xl:order-last">
          <NetWorthSummary totals={totals} items={c.items} pending={drafts} />
        </aside>
      </div>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen} title="Link an account" description="A secure, read-only connection. We can see balances, never move money." width="md">
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
                <span className="flex size-10 items-center justify-center rounded-control text-[15px] font-semibold text-white" style={{ background: inst.color }}>
                  {inst.name[0]}
                </span>
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
            {item.category === 'realEstate' && <Checkbox checked={!!item.primaryResidence} onChange={(v) => setItem({ ...item, primaryResidence: v })} label="This is where I live" description="Your home is shown separately in some regulatory checks." />}
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
        hint={drafts ? `${drafts} still without a balance. You can leave them for the meeting.` : undefined}
        onNext={() => {
          setSectionProgress(c.id, 'networth', c.items.some((i) => !i.draft) ? 'done' : 'progress', c.clientId)
          nav.next()
        }}
      />
    </div>
  )
}
