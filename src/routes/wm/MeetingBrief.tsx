import { ArrowLeft, Printer, Sparkles } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { GoalCard, NetWorthSummary } from '../../components/patterns'
import { Button, Card, CardHeader } from '../../components/primitives'
import { scoreRisk } from '../../schema/risk'
import { meetingBrief } from '../../services/ai'
import { useCase } from '../../store/hooks'
import { deferredLabels, netWorth, roughItems } from '../../store/selectors'
import { PageHeader } from './WMLayout'

function List({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="text-[14px] text-ink-4">{empty}</p>
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5 text-[14px] leading-snug text-ink-2">
          <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-taupe-500" />
          {t}
        </li>
      ))}
    </ul>
  )
}

export function MeetingBrief() {
  const { caseId } = useParams()
  const c = useCase(caseId)
  const navigate = useNavigate()
  if (!c) return <Navigate to="/wm" replace />
  const totals = netWorth(c)
  const brief = meetingBrief(c, totals, c.threads.filter((t) => !t.resolved).length, deferredLabels(c), roughItems(c))
  const risk = scoreRisk(c.risk)

  return (
    <div className="pb-20">
      <PageHeader
        eyebrow={
          <button type="button" onClick={() => navigate(`/wm/c/${c.id}`)} className="inline-flex items-center gap-1.5 hover:text-ink">
            <ArrowLeft className="size-3.5" /> {c.firstName} {c.lastName}
          </button>
        }
        title="Meeting brief"
        actions={
          <Button variant="secondary" leading={<Printer className="size-4" />} onClick={() => window.print()}>
            Print
          </Button>
        }
      />
      <div className="grid gap-4 px-10 lg:grid-cols-3">
        <Card padding="lg" inner={0} className="flex flex-col gap-3 lg:col-span-3">
          <span className="inline-flex items-center gap-1.5 text-[13px] text-ai">
            <Sparkles className="size-3.5" /> Drafted from {c.firstName}’s answers, documents and questions
          </span>
          <p className="display max-w-4xl text-[32px] leading-tight text-ink">{brief.headline}</p>
        </Card>

        <Card padding="lg" inner={0}>
          <CardHeader title="What we know" />
          <List items={brief.known} empty="Nothing yet." />
        </Card>
        <Card padding="lg" inner={0}>
          <CardHeader title="Still missing" />
          <List items={brief.missing} empty="Nothing missing. Everything was answered." />
        </Card>
        <Card padding="lg" inner={0}>
          <CardHeader title="Worth discussing" />
          <List items={brief.discuss} empty="—" />
        </Card>

        <NetWorthSummary totals={totals} items={c.items} className="lg:col-span-2" />
        <Card padding="lg" inner={0} className="flex flex-col gap-4">
          <CardHeader title="Suggested agenda" subtitle="45 minutes" />
          <ol className="flex flex-col gap-3">
            {brief.suggestedAgenda.map((a, i) => (
              <li key={a} className="flex gap-3 text-[14px] text-ink-2">
                <span className="tabular text-ink-4">{i + 1}</span>
                {a}
              </li>
            ))}
          </ol>
          {risk && (
            <div className="mt-auto rounded-[14px] bg-muted p-4">
              <div className="text-[12px] text-ink-4">Risk profile</div>
              <div className="display text-[24px] text-ink">{risk.label}</div>
              <div className="text-[13px] text-ink-3">{risk.objective}</div>
            </div>
          )}
        </Card>

        {c.goals.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3 lg:col-span-3">
            {c.goals.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
