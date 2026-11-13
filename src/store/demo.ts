import { extractDocument, extractIntro, inviteDraft, scanId } from '../services/ai'
import { useStore } from './caseStore'
import { ADVISOR_ID, demoNewClient } from './seed'

const s = () => useStore.getState()

/** Creates Daniel's case and plays the first half of his session instantly. */
export async function seedHalfway() {
  const c = s().createCase(demoNewClient)
  const id = c.id
  const draft = inviteDraft(c.firstName, 'Emily')
  s().sendInvite(id, { subject: 'Before we meet — a few questions', body: draft.polished })
  s().markOpened(id)

  const [intro, idScan, brokerage, mortgage] = await Promise.all([extractIntro(''), scanId(), extractDocument('brokerage'), extractDocument('mortgage')])

  s().applyDrafts(id, idScan, 'ai', 'ai')
  s().setIdScanned(id)
  s().applyDrafts(id, intro.fields, 'ai', 'ai')
  intro.goals.forEach((g) => s().addGoal(id, g))
  intro.items.forEach((i) => s().upsertItem(id, i))
  s().setIntroDone(id)

  s().acceptAllSuggestions(id, 'about', c.clientId)
  s().acceptAllSuggestions(id, 'work', c.clientId)
  s().setField(id, 'citizenship', 'us', c.clientId)
  s().deferField(id, 'ssn', true, c.clientId)
  s().setField(id, 'employerAddress', '500 W 2nd St, Austin, TX 78701', c.clientId)
  s().setField(id, 'annualIncome', '300-500', c.clientId)
  s().setField(id, 'incomeChange', 'up', c.clientId)
  s().setSectionProgress(id, 'about', 'done', c.clientId)
  s().setSectionProgress(id, 'work', 'done', c.clientId)

  const cur = s().cases[id]
  cur.goals.forEach((g) => s().updateGoal(id, g.id, { draft: false }))
  s().setSectionProgress(id, 'goals', 'done', c.clientId)

  for (const r of [...brokerage.items, ...mortgage.items]) s().upsertItem(id, r.item, r.match)
  s().addDocument(id, 'Vanguard_Statement_Oct2026.pdf', 'brokerage', brokerage.extracted, c.clientId)
  s().addDocument(id, 'Chase_Mortgage_Oct.pdf', 'mortgage', mortgage.extracted, c.clientId)
  const home = s().cases[id].items.find((i) => i.primaryResidence)
  if (home) s().updateItem(id, home.id, { value: 1_180_000, confidence: 'estimate', source: 'estimate', draft: false, detail: 'Based on 14 recent sales nearby' })

  const rsu = s().cases[id].items.find((i) => i.category === 'equityComp')
  s().startThread(
    id,
    { sectionId: 'networth', itemId: rsu?.id },
    rsu?.name ?? 'RSUs',
    'Should I count my unvested RSUs here, or only what has vested so far?',
    c.clientId,
  )
  s().addRequest(id, { kind: 'document', title: 'Latest 401(k) statement', detail: 'Could you upload your most recent 401(k) statement from Fidelity? It helps us plan the rollover.', sectionId: 'networth' }, ADVISOR_ID)
  return s().cases[id]
}
