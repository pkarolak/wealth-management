import { Bitcoin, Briefcase, CreditCard, Gem, HandCoins, Home, Landmark, LineChart, Package, PiggyBank, Plus, Receipt, Sparkles, Wallet } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { money, moneyCompact } from '../../lib/format'
import { assetCategories, categoryLabel, liabilityCategories, type NWCategory } from '../../schema/onboarding'
import { institutions } from '../../services/ai'
import type { NWItem } from '../../store/types'
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

/** Fixed per category so a slice keeps its color as balances change. Muted, but distinct in hue and value. */
export const categoryColor: Record<string, string> = {
  investment: '#2E3A4B',
  realEstate: '#C8A27C',
  retirement: '#6F8C79',
  equityComp: '#8A6A8C',
  cash: '#9DB4C6',
  crypto: '#C9963F',
  business: '#7D8A57',
  collectible: '#B5806F',
  otherAsset: '#BDB5AA',
}

const confidenceLabel = { exact: undefined, estimate: 'Estimate', rough: 'Rough guess' } as const

/** Institution monogram when we know the brand, category icon otherwise. */
export function InstitutionLogo({ inst, className }: { inst: (typeof institutions)[number]; className?: string }) {
  return (
    <span className={cn('relative flex size-10 shrink-0 overflow-hidden rounded-control bg-surface', className)}>
      <img src={inst.logo} alt="" className="size-full object-cover" />
      <span className="absolute inset-0 rounded-control ring-1 ring-black/[0.06] ring-inset" />
    </span>
  )
}

function ItemMark({ item }: { item: NWItem }) {
  const inst = institutions.find((i) => item.institution && i.name.toLowerCase().startsWith(item.institution.toLowerCase().split(' ')[0]))
  const mark = inst ? (
    <InstitutionLogo inst={inst} />
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
        row ? cn('rounded-[14px] px-2 py-2', item.draft ? 'ring-1 ring-ai/35 ring-inset hover:bg-muted/70' : 'hover:bg-muted/70') : 'rounded-[22px] p-3',
        !row && (item.draft ? 'border border-ai/40 bg-surface hover:bg-muted/60' : 'bg-surface hover:bg-muted/60'),
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
          <span className="inline-flex h-7 items-center gap-1 rounded-full bg-surface px-2.5 text-[13px] text-ai shadow-soft ring-1 ring-ai/20 ring-inset">
            <Plus className="size-3.5" />
            Add balance
          </span>
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
/** `breakdownOnly` drops the headline and stat tiles where the page already shows them. */
export function NetWorthSummary({ totals, items, pending = 0, breakdownOnly, className }: { totals: Totals; items: NWItem[]; pending?: number; breakdownOnly?: boolean; className?: string }) {
  const [focus, setFocus] = useState<NWCategory>()
  const byCat = assetCategories
    .map((c) => ({ id: c.id, label: c.label, value: items.filter((x) => x.side === 'asset' && x.category === c.id).reduce((a, x) => a + (x.value ?? 0), 0), color: categoryColor[c.id] }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
  const sum = byCat.reduce((a, c) => a + c.value, 0)
  const debtUnknown = totals.liabilities === 0 && items.some((x) => x.side === 'liability' && x.value === undefined)
  const dim = (id: NWCategory) => (focus && focus !== id ? 'opacity-30' : 'opacity-100')
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
    <div className={cn('@container flex flex-col gap-6 rounded-[24px] bg-surface p-6', className)}>
      <div className={cn('flex flex-col gap-1.5', breakdownOnly && 'hidden')}>
        <span className="text-[13px] text-ink-3">{pending > 0 ? 'Net worth so far' : 'Net worth'}</span>
        <span className="display tabular text-[44px] leading-none text-ink">{money(totals.total)}</span>
        {pending > 0 && (
          <span className="mt-1 text-[13px] text-ink-3">
            Not counting {pending} {pending === 1 ? 'item' : 'items'} without a balance yet
          </span>
        )}
      </div>
      {sum > 0 && (
        <div className="flex flex-col gap-4" onMouseLeave={() => setFocus(undefined)}>
          <div className="flex h-3 w-full gap-[3px]">
            {byCat.map((c) => (
              <span
                key={c.id}
                onMouseEnter={() => setFocus(c.id)}
                className={cn('h-full min-w-1.5 rounded-full transition-[flex-grow,opacity] duration-300', dim(c.id))}
                style={{ flexGrow: c.value, background: c.color }}
              />
            ))}
          </div>
          <ul className="-mx-2 grid grid-cols-1 @md:grid-cols-2 @md:gap-x-4">
            {byCat.map((c) => (
              <li
                key={c.id}
                onMouseEnter={() => setFocus(c.id)}
                className={cn('flex h-8 items-center gap-2.5 rounded-[10px] px-2 text-[13px] transition-[opacity,background-color] duration-300', dim(c.id), focus === c.id && 'bg-muted/70')}
              >
                <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: c.color }} />
                <span className="min-w-0 flex-1 truncate text-ink-2">{c.label}</span>
                <span className="tabular text-ink">{moneyCompact(c.value)}</span>
                <span className="tabular w-9 text-right text-ink-4">{Math.round((c.value / sum) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className={cn('grid grid-cols-2 gap-2 @lg:grid-cols-4', breakdownOnly && 'hidden')}>
        <Stat label="Assets" value={moneyCompact(totals.assets)} />
        <Stat label="Debts" value={debtUnknown ? 'Balance needed' : moneyCompact(totals.liabilities)} tone={debtUnknown ? 'muted' : 'danger'} />
        <Stat label="Liquid" value={moneyCompact(totals.liquid)} />
        <Stat label="Without home" value={moneyCompact(totals.exHome)} />
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'danger' | 'muted' }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[14px] bg-muted/60 px-3.5 py-3">
      <span className="text-[12px] text-ink-3">{label}</span>
      <span className={cn('tabular text-[16px]', tone === 'danger' ? 'text-danger' : tone === 'muted' ? 'text-[14px] text-ink-3' : 'text-ink')}>{tone === 'danger' && value !== '$0' ? `−${value}` : value}</span>
    </div>
  )
}
