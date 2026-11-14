import { ArrowUpRight, Columns2, FastForward, LayoutGrid, RotateCcw } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { toast } from '../components/primitives'
import { cn } from '../lib/cn'
import { resetDemo, useStore } from '../store/caseStore'
import { seedHalfway } from '../store/demo'
import { latestCase, overallProgress } from '../store/selectors'

/** Prototype tooling, deliberately outside the product's visual language. */
const mono = 'font-mono text-[12px] tracking-wide'

const steps = [
  ['WM', 'Emily adds Daniel as a new client and AI polishes her invite email.'],
  ['WM', 'She copies the private link and sends it.'],
  ['Client', 'Daniel opens the link, talks for 30 seconds and AI drafts half the form.'],
  ['Client', 'He scans his license, links accounts and drops in statements; net worth builds itself.'],
  ['Both', 'He asks Emily a question on a field; she replies from her side, live in the other tab.'],
  ['WM', 'Emily reviews section by section, then opens the meeting brief.'],
]

function Tool({ children, onClick, disabled, primary, icon }: { children: ReactNode; onClick?: () => void; disabled?: boolean; primary?: boolean; icon?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-[8px] px-3 transition-colors disabled:cursor-not-allowed disabled:opacity-35',
        mono,
        primary ? 'bg-white text-[#141414] hover:bg-white/85' : 'border border-white/15 text-white/80 hover:border-white/35 hover:text-white',
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function Panel({ label, title, meta, children }: { label: string; title: string; meta: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 rounded-[16px] border border-white/10 bg-white/[0.03] p-2">
      <div className="flex flex-col gap-3 p-4 pb-0">
        <span className={cn(mono, 'text-white/40 uppercase')}>{label}</span>
        <span className="text-[20px] text-white">{title}</span>
        <span className={cn(mono, 'text-white/45')}>{meta}</span>
      </div>
      <div className="flex gap-2 p-2 pt-0">{children}</div>
    </div>
  )
}

export function DemoHome() {
  const c = useStore((s) => latestCase(s.cases))
  const [busy, setBusy] = useState(false)
  const clientUrl = c ? `/c/${c.token}` : undefined
  const wmUrl = c ? `/wm/c/${c.id}` : '/wm'
  const p = c ? overallProgress(c) : undefined

  return (
    <div className="min-h-screen bg-[#141414] text-white [background-image:radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px]">
      <div className="mx-auto flex max-w-4xl flex-col gap-12 px-8 py-12">
        <header className="flex items-center gap-3">
          <span className={cn(mono, 'rounded-[6px] bg-white/10 px-2 py-1 text-white/70 uppercase')}>Prototype</span>
          <span className={cn(mono, 'text-white/40')}>CIF onboarding · local only · state lives in this browser</span>
          <Link to="/gallery" className={cn(mono, 'ml-auto inline-flex items-center gap-1.5 text-white/50 hover:text-white')}>
            <LayoutGrid className="size-3.5" /> Components
          </Link>
        </header>

        <div className="flex flex-col gap-3">
          <h1 className="max-w-2xl text-[36px] leading-tight font-medium tracking-tight">Demo control panel</h1>
          <p className="max-w-xl text-[15px] text-white/55">Open the two sides in separate tabs and place them next to each other. Every change syncs between tabs instantly, no server involved.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Panel label="Side A" title="Wealth Manager" meta="Emily Parker · creates, reviews, prepares">
            <Tool primary icon={<ArrowUpRight className="size-3.5" />} onClick={() => window.open(wmUrl, 'wm')}>
              Open
            </Tool>
            <Tool icon={<ArrowUpRight className="size-3.5" />} onClick={() => window.open('/wm/new?demo=1', 'wm')}>
              New client, prefilled
            </Tool>
          </Panel>
          <Panel label="Side B" title="Client" meta={c ? `${c.firstName} ${c.lastName} · /c/${c.token}` : 'No client yet. Create one as Emily first.'}>
            <Tool primary disabled={!clientUrl} icon={<ArrowUpRight className="size-3.5" />} onClick={() => clientUrl && window.open(clientUrl, 'client')}>
              Open
            </Tool>
          </Panel>
        </div>

        <div className="flex flex-col gap-4 rounded-[16px] border border-white/10 p-6">
          <div className={cn(mono, 'flex flex-wrap items-center gap-x-6 gap-y-2 text-white/45')}>
            <span>STATE</span>
            <span>
              case <span className="text-white/85">{c ? `${c.firstName} ${c.lastName}` : '—'}</span>
            </span>
            <span>
              stage <span className="text-white/85">{c?.stage ?? '—'}</span>
            </span>
            <span>
              progress <span className="text-white/85">{p ? `${Math.round(p.ratio * 100)}%` : '—'}</span>
            </span>
            <span>
              threads <span className="text-white/85">{c?.threads.length ?? 0}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tool
              disabled={!c}
              icon={<Columns2 className="size-3.5" />}
              onClick={() => {
                window.open(wmUrl, 'wm')
                if (clientUrl) window.open(clientUrl, 'client')
              }}
            >
              Open both tabs
            </Tool>
            <Tool
              disabled={busy}
              icon={<FastForward className="size-3.5" />}
              onClick={async () => {
                setBusy(true)
                resetDemo()
                await seedHalfway()
                setBusy(false)
                toast('Jumped to halfway', { description: 'Daniel has finished the first three sections and asked a question.', tone: 'success' })
              }}
            >
              {busy ? 'Preparing…' : 'Jump to halfway'}
            </Tool>
            <Tool
              icon={<RotateCcw className="size-3.5" />}
              onClick={() => {
                resetDemo()
                toast('Demo reset', { description: 'All tabs start fresh.' })
              }}
            >
              Reset
            </Tool>
          </div>
        </div>

        <section className="flex flex-col gap-4">
          <span className={cn(mono, 'text-white/40 uppercase')}>Script</span>
          <ol className="flex flex-col">
            {steps.map(([who, what], i) => (
              <li key={i} className="grid grid-cols-[32px_64px_1fr] items-baseline gap-3 border-t border-white/10 py-3.5 last:border-b">
                <span className={cn(mono, 'text-white/35')}>{String(i + 1).padStart(2, '0')}</span>
                <span className={cn(mono, 'text-white/50')}>{who}</span>
                <span className="text-[14px] text-white/80">{what}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}
