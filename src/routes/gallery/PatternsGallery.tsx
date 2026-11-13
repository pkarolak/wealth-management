import { useEffect, useState } from 'react'
import { AccountTile, ActivityFeed, AskAdvisorButton, CaseProvider, CommentThread, DocumentDropzone, EmailPreview, FieldRow, GoalCard, KanbanColumn, NetWorthSummary, PresenceLabel, ProgressRail, SourceTag, SuggestionDiff, TaskStack, VoiceInput } from '../../components/patterns'
import { Button, Card } from '../../components/primitives'
import { fieldById } from '../../schema/onboarding'
import { extractDocument, introTranscript, inviteDraft, wait } from '../../services/ai'
import { useStore } from '../../store/caseStore'
import { useCase } from '../../store/hooks'
import { ADVISOR_ID, demoNewClient } from '../../store/seed'
import { netWorth } from '../../store/selectors'
import type { NWItem } from '../../store/types'
import { GallerySection, Specimen } from './Gallery'

const GALLERY_TOKEN = 'gallery'

/** A case with one field in every collaboration state, so the patterns render against real store data. */
function ensureGalleryCase(): string {
  const st = useStore.getState()
  const existing = Object.values(st.cases).find((c) => c.token === GALLERY_TOKEN)
  if (existing) return existing.id
  const c = st.createCase({ ...demoNewClient })
  const now = Date.now()
  useStore.setState((s) => ({
    cases: {
      ...s.cases,
      [c.id]: {
        ...s.cases[c.id],
        token: GALLERY_TOKEN,
        fields: {
          ...s.cases[c.id].fields,
          jobTitle: { suggestion: { value: 'Product Director', by: 'ai', authorId: 'ai', sourceLabel: 'From your intro', confidence: 'high', createdAt: now } },
          employer: { value: 'Lumen Health', source: 'client', status: 'answered', suggestion: { value: 'Lumen Health, Inc.', by: 'advisor', authorId: ADVISOR_ID, note: 'Using the legal name from your pay stub.', createdAt: now } },
          dob: { value: '1985-03-14', source: 'id', status: 'confirmed' },
          phone: { value: '(512) 555-0199', source: 'client', status: 'needs_review' },
          ssn: { deferred: true },
          incomeSources: { value: ['salary', 'equity'], source: 'ai', status: 'answered' },
        },
        threads: [
          {
            id: 'thr_gallery',
            anchor: { sectionId: 'work', fieldId: 'employer' },
            title: 'Employer',
            resolved: false,
            createdAt: now - 3600_000,
            readAt: {},
            messages: [
              { id: 'm1', authorId: c.clientId, body: 'Should this be my current employer or the one with my old 401(k)?', ts: now - 3600_000 },
              { id: 'm2', authorId: ADVISOR_ID, body: 'Your current one, Daniel. We’ll list the old 401(k) under what you own. @Mike can you check the rollover forms?', ts: now - 1800_000 },
            ],
          },
        ],
      },
    },
  }))
  return c.id
}

const sampleItems: NWItem[] = [
  { id: 'i1', side: 'asset', category: 'investment', name: 'Brokerage account', institution: 'Vanguard', value: 412_380, source: 'document', confidence: 'exact', liquid: true, updatedAt: 0 },
  { id: 'i2', side: 'asset', category: 'cash', name: 'Savings', institution: 'Chase', value: 65_200, source: 'linked', confidence: 'exact', liquid: true, updatedAt: 0 },
  { id: 'i3', side: 'asset', category: 'realEstate', name: 'Family home', value: 1_180_000, source: 'estimate', confidence: 'estimate', primaryResidence: true, updatedAt: 0 },
  { id: 'i4', side: 'asset', category: 'retirement', name: '401(k) from previous employer', source: 'ai', confidence: 'rough', draft: true, sourceLabel: 'From your intro', updatedAt: 0 },
  { id: 'i5', side: 'liability', category: 'mortgage', name: 'Home mortgage', institution: 'Chase', value: 512_400, rate: 3.1, source: 'document', confidence: 'exact', updatedAt: 0 },
]

const stack = ['Read your Vanguard statement', 'Matched 3 holdings', 'Estimating your home value', 'Checking the mortgage balance', 'Drafting your goals', 'Preparing a summary for Emily']

export function PatternsGallery() {
  const [caseId, setCaseId] = useState<string>()
  const [active, setActive] = useState(2)
  const people = useStore((s) => s.people)
  useEffect(() => setCaseId(ensureGalleryCase()), [])
  const c = useCase(caseId)
  if (!c || !caseId) return null
  const totals = netWorth({ ...c, items: sampleItems })
  const draft = inviteDraft('Daniel', 'Emily')

  return (
    <CaseProvider caseId={caseId} viewerId={c.clientId} mode="client">
      <GallerySection id="patterns" title="Patterns">
        <Specimen label="Field states: AI suggestion, Wealth Manager change, confirmed, needs review, deferred, chips" className="[&>div:last-child]:grid [&>div:last-child]:grid-cols-1 [&>div:last-child]:gap-5 sm:[&>div:last-child]:grid-cols-2">
          {['jobTitle', 'employer', 'dob', 'phone', 'ssn', 'citizenship', 'incomeSources'].map((id) => (
            <div key={id} className={id === 'incomeSources' || id === 'employer' ? 'sm:col-span-2' : undefined}>
              <FieldRow def={fieldById[id]} />
            </div>
          ))}
        </Specimen>

        <div className="grid gap-4 lg:grid-cols-2">
          <Specimen label="Suggestion diff (AI rewrite)">
            <SuggestionDiff className="w-full" by="ai" sourceLabel="Polished by AI" from="hey daniel pls fill this before our mtg" to="Hi Daniel, could you fill this in before our meeting?" onAccept={() => {}} onReject={() => {}} rejectLabel="Undo" feedback />
          </Specimen>
          <Specimen label="Source tags and presence">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-4">
                <SourceTag kind="ai" label="From your intro" />
                <SourceTag kind="id" />
                <SourceTag kind="document" />
                <SourceTag kind="linked" />
                <SourceTag kind="advisor" />
                <SourceTag kind="confirmed" label="Confirmed by Emily" />
              </div>
              <div className="flex flex-wrap gap-3">
                <PresenceLabel person={people[ADVISOR_ID]} tone="blue" />
                <PresenceLabel person={people.mike} tone="pink" />
              </div>
            </div>
          </Specimen>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Specimen label="Comment thread">
            <div className="w-full">
              <CommentThread thread={c.threads[0]} />
            </div>
          </Specimen>
          <Specimen label="Ask your Wealth Manager (popover)">
            <AskAdvisorButton anchor={{ sectionId: 'about', fieldId: 'citizenship' }} title="Citizenship" />
            <AskAdvisorButton anchor={{ sectionId: 'work', fieldId: 'employer' }} title="Employer" />
          </Specimen>
        </div>

        <Card tone="muted" padding="lg" inner={22} className="flex flex-col items-center gap-4">
          <span className="self-start text-[12px] text-ink-4">Voice intro</span>
          <VoiceInput className="w-full max-w-xl" transcript={introTranscript} onSubmit={() => {}} />
        </Card>

        <Specimen label="Document dropzone" className="[&>div:last-child]:block">
          <DocumentDropzone
            onProcess={async (kind) => {
              const r = await extractDocument(kind)
              return r.extracted
            }}
          />
        </Specimen>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <NetWorthSummary totals={totals} items={sampleItems} pending={1} />
          <div className="flex flex-col gap-1.5">
            {sampleItems.map((i) => (
              <AccountTile key={i.id} item={i} onClick={() => {}} />
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <GoalCard goal={{ id: 'g1', kind: 'retirement', title: 'Retire at 60', targetYear: 2045, amount: 4_500_000, priority: 'high' }} onClick={() => {}} />
          <GoalCard goal={{ id: 'g2', kind: 'education', title: 'College for two kids', targetYear: 2035, amount: 420_000, priority: 'high' }} onClick={() => {}} />
          <GoalCard goal={{ id: 'g3', kind: 'home', title: 'Lake house', targetYear: 2031, amount: 650_000, priority: 'medium', draft: true, sourceLabel: 'From your intro' }} onAccept={() => {}} onRemove={() => {}} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <Card tone="muted" padding="sm" inner={10}>
            <ProgressRail
              active="networth"
              items={[
                { id: 'about', title: 'About you', state: 'done' },
                { id: 'work', title: 'Work & income', state: 'done' },
                { id: 'goals', title: 'Your goals', state: 'done' },
                { id: 'networth', title: 'What you own and owe', state: 'progress', count: 1 },
                { id: 'risk', title: 'Risk', state: 'idle', meta: '2 min' },
                { id: 'estate', title: 'Family & protection', state: 'idle', optional: true },
                { id: 'required', title: 'Required questions', state: 'idle', meta: '2 min' },
              ]}
            />
          </Card>
          <Card tone="muted" padding="lg" inner={16} className="flex flex-col items-center gap-6 py-10">
            <TaskStack items={stack.map((s, i) => ({ id: String(i), label: s, meta: i === 3 ? '2 of 3' : undefined }))} active={active} />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setActive((a) => Math.max(0, a - 1))}>
                Previous
              </Button>
              <Button size="sm" variant="secondary" onClick={async () => (await wait(0), setActive((a) => Math.min(stack.length - 1, a + 1)))}>
                Next
              </Button>
            </div>
          </Card>
        </div>

        <Card tone="muted" padding="lg" inner={16} className="grid gap-4 sm:grid-cols-3">
          <KanbanColumn
            title="Waiting on Daniel"
            cards={[
              { id: 'k1', title: 'Upload latest 401(k) statement', status: 'waiting' },
              { id: 'k2', title: 'Social Security number', status: 'waiting', meta: 'Moved to the meeting' },
            ]}
          />
          <KanbanColumn
            title="In progress"
            cards={[
              { id: 'k3', title: 'What you own and owe', status: 'progress', meta: '5 of 6 accounts' },
              { id: 'k4', title: 'Risk questions', status: 'progress' },
            ]}
          />
          <KanbanColumn
            title="Ready to review"
            cards={[
              { id: 'k5', title: 'About you', status: 'done' },
              { id: 'k6', title: 'Work & income', status: 'done' },
              { id: 'k7', title: 'Your goals', status: 'done' },
            ]}
          />
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <EmailPreview from={people[ADVISOR_ID]} to={[{ id: 'd', name: 'Daniel Tan', role: 'client' }, people.mike]} rough={draft.rough} body={draft.polished} feedback />
          <Specimen label="Activity feed" className="[&>div:last-child]:block">
            <ActivityFeed items={c.activity.length > 1 ? c.activity : [...c.activity, { id: 'a2', ts: Date.now() - 7200_000, actorId: ADVISOR_ID, kind: 'invited', text: 'Sent the onboarding link to Daniel', email: { fromId: ADVISOR_ID, to: ['Daniel Tan'], subject: 'Before we meet', body: draft.polished } }]} people={people} />
          </Specimen>
        </div>
      </GallerySection>
    </CaseProvider>
  )
}
