import { ArrowUpRight, FastForward, LayoutGrid, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Avatar, Button, Card, toast } from '../components/primitives'
import { FIRM, LogoMark } from '../components/shell/Brand'
import { resetDemo, useStore } from '../store/caseStore'
import { seedHalfway } from '../store/demo'
import { ADVISOR_ID } from '../store/seed'
import { latestCase } from '../store/selectors'

const steps = [
  ['Wealth Manager', 'Emily adds Daniel as a new client and AI polishes her invite email.'],
  ['Wealth Manager', 'She copies the private link and sends it.'],
  ['Client', 'Daniel opens the link, talks for 30 seconds and AI drafts half the form.'],
  ['Client', 'He scans his license, links accounts and drops in statements; net worth builds itself.'],
  ['Both', 'He asks Emily a question on a field; she replies and suggests a fix from her side, live in the other tab.'],
  ['Wealth Manager', 'Emily reviews section by section, then opens the meeting brief.'],
]

/** Entry point: open each side in its own tab, reset, or jump ahead. */
export function DemoHome() {
  const c = useStore((s) => latestCase(s.cases))
  const emily = useStore((s) => s.people[ADVISOR_ID])
  const [busy, setBusy] = useState(false)
  const clientUrl = c ? `/c/${c.token}` : undefined

  const openBoth = () => {
    window.open(c ? `/wm/c/${c.id}` : '/wm', 'wm')
    if (clientUrl) window.open(clientUrl, 'client')
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-8 py-14">
      <header className="flex items-center gap-3">
        <LogoMark size={40} />
        <div className="flex flex-col">
          <span className="text-[15px] font-medium text-ink">{FIRM}</span>
          <span className="text-[13px] text-ink-3">Client onboarding prototype · everything runs in this browser</span>
        </div>
        <Link to="/gallery" className="ml-auto inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink">
          <LayoutGrid className="size-3.5" /> Components
        </Link>
      </header>

      <h1 className="display max-w-3xl text-[64px] text-ink">From a first meeting to a complete client profile, without the 20-page form.</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card padding="lg" inner={10} className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Avatar name={emily.name} src={emily.avatar} size="lg" />
            <div className="flex flex-col">
              <span className="text-[16px] font-medium text-ink">Wealth Manager</span>
              <span className="text-[13px] text-ink-3">Emily Parker · creates the client, reviews, prepares</span>
            </div>
          </div>
          <Button size="lg" trailing={<ArrowUpRight className="size-4" />} onClick={() => window.open(c ? `/wm/c/${c.id}` : '/wm', 'wm')}>
            Open Wealth Manager
          </Button>
        </Card>
        <Card padding="lg" inner={10} className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Avatar name={c ? `${c.firstName} ${c.lastName}` : 'Daniel Tan'} size="lg" />
            <div className="flex flex-col">
              <span className="text-[16px] font-medium text-ink">Client</span>
              <span className="text-[13px] text-ink-3">{c ? `${c.firstName}’s private link · /c/${c.token}` : 'Available once Emily creates a client'}</span>
            </div>
          </div>
          <Button size="lg" variant="secondary" disabled={!clientUrl} trailing={<ArrowUpRight className="size-4" />} onClick={() => clientUrl && window.open(clientUrl, 'client')}>
            Open client link
          </Button>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="soft" disabled={!c} onClick={openBoth}>
          Open both tabs
        </Button>
        <Button
          variant="soft"
          leading={<FastForward className="size-4" />}
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            resetDemo()
            await seedHalfway()
            setBusy(false)
            toast('Jumped to halfway', { description: 'Daniel has finished the first three sections and asked a question.', tone: 'success' })
          }}
        >
          {busy ? 'Preparing…' : 'Jump to halfway'}
        </Button>
        <Button
          variant="ghost"
          leading={<RotateCcw className="size-4" />}
          onClick={() => {
            resetDemo()
            toast('Demo reset', { description: 'All tabs start fresh.' })
          }}
        >
          Reset
        </Button>
        <span className="ml-2 text-[13px] text-ink-4">Tip: put the two tabs side by side; changes sync live.</span>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] text-ink-3">Demo script</h2>
        <ol className="grid gap-2 md:grid-cols-2">
          {steps.map(([who, what], i) => (
            <li key={i} className="flex gap-3 rounded-[16px] bg-surface/60 p-4">
              <span className="tabular text-[13px] text-ink-4">{i + 1}</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] text-ink-4">{who}</span>
                <span className="text-[14px] text-ink-2">{what}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
