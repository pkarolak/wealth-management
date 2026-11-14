import { ArrowLeft, Check, Download, Printer } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Avatar, Badge, Button, Segmented, toast } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { relativeTime } from '../../lib/format'
import { displayValue, sectionById, type RequiredBy } from '../../schema/onboarding'
import { useStore } from '../../store/caseStore'
import { useCase } from '../../store/hooks'
import { cifProgress, cifRows, type CifRow, type CifStatus } from '../../store/selectors'
import { ASSISTANT_ID } from '../../store/seed'
import { Meter } from './CaseView'
import { PageHeader } from './WMLayout'

const statusMeta: Record<CifStatus, { label: string; tone: 'success' | 'neutral' | 'ai' | 'waiting' | 'danger' | 'progress' }> = {
  verified: { label: 'Verified', tone: 'success' },
  entered: { label: 'Client entered', tone: 'neutral' },
  draft: { label: 'Draft, not confirmed', tone: 'ai' },
  deferred: { label: 'Collect in person', tone: 'waiting' },
  invalid: { label: 'Needs a fix', tone: 'danger' },
  missing: { label: 'Missing', tone: 'progress' },
}

const requiredByLabel: Record<RequiredBy, string> = { custodian: 'Custodian', ria: 'Firm', advisor: 'Planning' }

const needsAttention = (r: CifRow) => r.status !== 'verified' && r.status !== 'entered'

export function CifView() {
  const { caseId } = useParams()
  const c = useCase(caseId)
  const navigate = useNavigate()
  const people = useStore((s) => s.people)
  const assign = useStore((s) => s.assignCifGaps)
  const [filter, setFilter] = useState('all')
  if (!c) return <Navigate to="/wm" replace />

  const rows = cifRows(c)
  const progress = cifProgress(c)
  const gaps = progress.accounts.open
  const mike = people[ASSISTANT_ID]
  const assigned = c.cifAssignment
  const shown = filter === 'open' ? rows.filter(needsAttention) : rows
  const bySection = [...new Set(shown.map((r) => r.def.sectionId))].map((sid) => [sid, shown.filter((r) => r.def.sectionId === sid)] as const)

  const download = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const lines = [['Section', 'Field', 'Value', 'Status', 'Required by'], ...rows.map((r) => [sectionById[r.def.sectionId].wmTitle, r.def.label, displayValue(r.def, r.value), statusMeta[r.status].label, (r.def.requiredBy ?? []).map((x) => requiredByLabel[x]).join(' / ')])]
    const blob = new Blob([lines.map((l) => l.map(esc).join(',')).join('\n')], { type: 'text/csv' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `CIF ${c.firstName} ${c.lastName}.csv` })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="pb-20">
      <PageHeader
        eyebrow={
          <button type="button" onClick={() => navigate(`/wm/c/${c.id}`)} className="inline-flex items-center gap-1.5 hover:text-ink">
            <ArrowLeft className="size-3.5" /> {c.firstName} {c.lastName}
          </button>
        }
        title="Customer Information Form"
        actions={
          <>
            <Button variant="secondary" leading={<Printer className="size-4" />} onClick={() => window.print()}>
              Print
            </Button>
            <Button variant="secondary" leading={<Download className="size-4" />} onClick={download}>
              Download CSV
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Meter label="To open accounts" {...progress.accounts} />
          <Meter label="For planning" {...progress.planning} />
        </div>
      </PageHeader>

      <div className="flex flex-col gap-8 px-10">
        {gaps.length > 0 && mike && (
          <section className="flex flex-wrap items-center gap-4 rounded-[22px] bg-surface p-4 pl-5 print:hidden">
            <Avatar name={mike.name} src={mike.avatar} />
            <div className="flex min-w-0 flex-1 flex-col">
              {assigned ? (
                <>
                  <span className="text-[15px] text-ink">
                    {mike.name.split(' ')[0]} is chasing {assigned.fieldIds.length} open {assigned.fieldIds.length === 1 ? 'answer' : 'answers'}
                  </span>
                  <span className="text-[13px] text-ink-3">Assigned {relativeTime(assigned.at)}. {gaps.length} still open.</span>
                </>
              ) : (
                <>
                  <span className="text-[15px] text-ink">
                    {gaps.length} {gaps.length === 1 ? 'answer' : 'answers'} still needed to open accounts
                  </span>
                  <span className="truncate text-[13px] text-ink-3">
                    {gaps
                      .slice(0, 5)
                      .map((r) => r.def.label)
                      .join(', ')}
                    {gaps.length > 5 ? '…' : ''}
                  </span>
                </>
              )}
            </div>
            {assigned ? (
              <Badge tone="success" icon={<Check className="size-3.5" />}>
                Assigned
              </Badge>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  assign(c.id, mike.id, gaps.map((r) => r.def.id), c.advisorId)
                  toast(`Assigned to ${mike.name.split(' ')[0]}`, { description: 'He’ll follow up and update the form.', tone: 'success' })
                }}
              >
                Ask {mike.name.split(' ')[0]} to chase these
              </Button>
            )}
          </section>
        )}

        <Segmented
          value={filter}
          onChange={setFilter}
          className="print:hidden"
          options={[
            { value: 'all', label: `All fields · ${rows.length}` },
            { value: 'open', label: `Needs attention · ${rows.filter(needsAttention).length}` },
          ]}
        />

        {bySection.map(([sid, list]) => (
          <section key={sid} className="flex flex-col gap-3">
            <h2 className="text-[20px] font-medium text-ink">{sectionById[sid].wmTitle}</h2>
            <div className="flex flex-col divide-y divide-line rounded-[22px] bg-surface px-5">
              {list.map((r) => (
                <div key={r.def.id} className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_auto] items-center gap-4 py-3">
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[14px] text-ink-2">
                      {r.def.label}
                      {r.def.required && r.purpose === 'accounts' && <span className="text-ink-4"> *</span>}
                    </span>
                    <span className="text-[12px] text-ink-4">{(r.def.requiredBy ?? []).map((x) => requiredByLabel[x]).join(' · ')}</span>
                  </span>
                  <span className={cn('truncate text-[15px]', r.status === 'missing' ? 'text-ink-4' : 'text-ink')}>{displayValue(r.def, r.value)}</span>
                  {r.status === 'missing' ? <span className="px-2.5 text-[12px] text-ink-3">Missing</span> : <Badge tone={statusMeta[r.status].tone}>{statusMeta[r.status].label}</Badge>}
                </div>
              ))}
            </div>
          </section>
        ))}
        {!shown.length && <p className="text-[15px] text-ink-3">Every field is filled in and checked.</p>}
        <p className="text-[13px] text-ink-3">* Required to open accounts. Verified: matched an ID, statement or linked account, or confirmed by the client.</p>
      </div>
    </div>
  )
}
