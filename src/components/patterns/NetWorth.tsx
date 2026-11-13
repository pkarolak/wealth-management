import { Bitcoin, Briefcase, CreditCard, Gem, HandCoins, Home, Landmark, LineChart, Package, PiggyBank, Plus, Receipt, Sparkles, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { money, moneyCompact } from '../../lib/format'
import { assetCategories, categoryLabel, liabilityCategories, type NWCategory } from '../../schema/onboarding'
import { institutions } from '../../services/ai'
import type { NWItem } from '../../store/types'
import { chartScale } from '../../tokens/tokens'
import { SourceTag } from './SourceTag'

export const categoryIcon: Record<NWCategory, ReactNode> = {
  investment: <LineChart className="size-[18px]" />,
  retirement: <PiggyBank className="size-[18px]" />,
  cash: <Wallet className="size-[18px]" />,
  realEstate: <Home className="size-[18px]" />,
  equityComp: <Landmark className="size-[18px]" />,
  business: <Briefcase className="size-[18px]" />,
  collectible: <Gem className="size-[18px]" />,
  crypto: <Bitcoin className="size-[18px]" />,
  otherAsset: <Package className="size-[18px]" />,
  mortgage: <Home className="size-[18px]" />,
  loan: <HandCoins className="size-[18px]" />,
  creditCard: <CreditCard className="size-[18px]" />,
  otherDebt: <Receipt className="size-[18px]" />,
}

const confidenceLabel = { exact: undefined, estimate: 'Estimate', rough: 'Rough guess' } as const

/** Institution monogram when we know the brand, category icon otherwise. */
function ItemMark({ item }: { item: NWItem }) {
  const inst = institutions.find((i) => item.institution && i.name.toLowerCase().startsWith(item.institution.toLowerCase().split(' ')[0]))
  const mark = inst ? (
    <span className="flex size-10 items-center justify-center rounded-control text-[15px] font-semibold text-white" style={{ background: inst.color }}>
      {inst.name[0]}
    </span>
  ) : (
    <span className={cn('flex size-10 items-center justify-center rounded-control', item.side === 'asset' ? 'bg-muted text-ink-2' : 'bg-danger-soft/70 text-danger')}>{categoryIcon[item.category]}</span>
  )
  return (
    <span className="relative shrink-0">
      {mark}
      {item.draft && (
        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-surface text-ai shadow-soft">
          <Sparkles className="size-2.5" />
        </span>
      )}
    </span>
  )
}

/**
 * One account, property or debt. 12px padding around a 10px tile → 22px radius.
 * Draft items (mentioned in the intro, no balance yet) render dashed with a call to action.
 */
export function AccountTile({ item, onClick, aside, className, variant = 'card' }: { item: NWItem; onClick?: () => void; aside?: ReactNode; className?: string; variant?: 'card' | 'row' }) {
  const sourceKind = item.source === 'manual' ? undefined : item.source === 'ai' ? 'ai' : item.source
  const conf = confidenceLabel[item.confidence]
  const Comp = onClick ? 'button' : 'div'
  const row = variant === 'row'
  const origin = item.draft ? (item.sourceLabel ?? 'From your intro') : ({ linked: 'Linked', document: 'From statement', estimate: 'Estimated' } as Partial<Record<string, string>>)[item.source]
  const sub = [item.institution, origin, item.rate !== undefined && item.side === 'liability' ? `${item.rate}%` : undefined].filter(Boolean).join(' · ')
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 text-left transition-colors',
        row ? 'rounded-[14px] px-2 py-2 hover:bg-muted/70' : 'rounded-[22px] p-3',
        !row && (item.draft ? 'border border-dashed border-ai/35 bg-ai-soft/35 hover:bg-ai-soft/60' : 'bg-surface hover:bg-muted/60'),
        className,
      )}
    >
      <ItemMark item={item} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] text-ink">{item.name}</span>
        {row ? (
          sub && <span className="truncate text-[12px] text-ink-4">{sub}</span>
        ) : (
          <span className="flex min-w-0 items-center gap-2 text-[12px] text-ink-3">
            {item.institution && <span className="truncate">{item.institution}</span>}
            {item.draft ? <SourceTag kind="ai" label={item.sourceLabel ?? 'From your intro'} /> : sourceKind && <SourceTag kind={sourceKind} label={item.source === 'linked' ? 'Linked' : item.source === 'document' ? 'From statement' : undefined} />}
            {item.rate !== undefined && item.side === 'liability' && <span className="tabular">{item.rate}%</span>}
          </span>
        )}
      </div>
      {aside}
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        {item.value !== undefined ? (
          <span className={cn('tabular text-[15px]', item.side === 'liability' ? 'text-ink-2' : 'text-ink')}>
            {item.side === 'liability' && '−'}
            {money(item.value)}
          </span>
        ) : row ? (
          <span className="text-[13px] text-ink-3 transition-colors group-hover:text-ink">Add balance</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-ai">
            <Plus className="size-3.5" />
            Add balance
          </span>
        )}
        {conf && item.value !== undefined && <span className="text-[11px] text-ink-4">{conf}</span>}
      </div>
    </Comp>
  )
}

/** Items grouped by category with subtotals. */
export function AssetLiabilityList({ items, side, onSelect, onAdd, renderAside, variant = 'card' }: { items: NWItem[]; side: 'asset' | 'liability'; onSelect?: (item: NWItem) => void; onAdd?: (category: NWCategory) => void; renderAside?: (item: NWItem) => ReactNode; variant?: 'card' | 'row' }) {
  const cats = side === 'asset' ? assetCategories : liabilityCategories
  const mine = items.filter((i) => i.side === side)
  const groups = cats.map((c) => ({ ...c, items: mine.filter((i) => i.category === c.id) })).filter((g) => g.items.length)
  if (!groups.length) return null
  if (variant === 'row')
    return (
      <div className="flex flex-col gap-3 rounded-[22px] bg-surface p-2">
        {groups.map((g) => {
          const subtotal = g.items.reduce((a, i) => a + (i.value ?? 0), 0)
          return (
            <div key={g.id} className="flex flex-col">
              <div className="flex items-baseline justify-between px-2 pt-2 pb-1 text-[12px] text-ink-4">
                <span>{categoryLabel(g.id)}</span>
                {subtotal > 0 && <span className="tabular">{money(subtotal)}</span>}
              </div>
              {g.items.map((i) => (
                <AccountTile key={i.id} variant="row" item={i} onClick={onSelect ? () => onSelect(i) : undefined} aside={renderAside?.(i)} />
              ))}
            </div>
          )
        })}
      </div>
    )
  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => {
        const subtotal = g.items.reduce((a, i) => a + (i.value ?? 0), 0)
        return (
          <div key={g.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between px-3">
              <span className="text-[13px] text-ink-3">{categoryLabel(g.id)}</span>
              <span className="flex items-center gap-3">
                {onAdd && (
                  <button type="button" onClick={() => onAdd(g.id)} className="text-[12px] text-ink-4 hover:text-ink">
                    + Add
                  </button>
                )}
                <span className="tabular text-[13px] text-ink-3">{subtotal ? money(subtotal) : '—'}</span>
              </span>
            </div>
            {g.items.map((i) => (
              <AccountTile key={i.id} item={i} onClick={onSelect ? () => onSelect(i) : undefined} aside={renderAside?.(i)} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

type Totals = { assets: number; liabilities: number; total: number; exHome: number; liquid: number }

/** Live net worth: serif headline, composition bar and the three numbers regulators look at. */
export function NetWorthSummary({ totals, items, pending = 0, className }: { totals: Totals; items: NWItem[]; pending?: number; className?: string }) {
  const byCat = assetCategories
    .map((c, i) => ({ id: c.id, label: c.label, value: items.filter((x) => x.side === 'asset' && x.category === c.id).reduce((a, x) => a + (x.value ?? 0), 0), color: chartScale[i % chartScale.length] }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
  const sum = byCat.reduce((a, c) => a + c.value, 0)
  if (totals.assets === 0 && totals.liabilities === 0)
    return (
      <div className={cn('flex flex-col gap-2 rounded-[24px] bg-surface p-6', className)}>
        <span className="text-[13px] text-ink-3">Net worth</span>
        <span className="display text-[28px] leading-tight text-ink-3">Adds up here as you go</span>
        {pending > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-ai">
            <Sparkles className="size-3.5" />
            {pending} {pending === 1 ? 'account' : 'accounts'} from your intro {pending === 1 ? 'needs' : 'need'} a balance
          </span>
        )}
      </div>
    )
  return (
    <div className={cn('flex flex-col gap-5 rounded-[24px] bg-surface p-6', className)}>
      <div className="flex flex-col gap-1">
        <span className="text-[13px] text-ink-3">Net worth</span>
        <span className="display tabular text-[48px] text-ink">{money(totals.total)}</span>
        {pending > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-ai">
            <Sparkles className="size-3" />
            {pending} from your intro still {pending === 1 ? 'needs' : 'need'} a balance
          </span>
        )}
      </div>
      {sum > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full">
            {byCat.map((c) => (
              <span key={c.id} className="h-full transition-[flex-grow] duration-500" style={{ flexGrow: c.value, background: c.color }} title={`${c.label} ${money(c.value)}`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {byCat.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 text-[12px] text-ink-3">
                <span className="size-2 rounded-full" style={{ background: c.color }} />
                {c.label}
                <span className="tabular text-ink-4">{Math.round((c.value / sum) * 100)}%</span>
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-[13px] sm:grid-cols-4">
        <Stat label="Assets" value={moneyCompact(totals.assets)} />
        <Stat label="Debts" value={moneyCompact(totals.liabilities)} />
        <Stat label="Liquid" value={moneyCompact(totals.liquid)} />
        <Stat label="Excl. home" value={moneyCompact(totals.exHome)} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-ink-4">{label}</span>
      <span className="tabular text-[15px] text-ink">{value}</span>
    </div>
  )
}
