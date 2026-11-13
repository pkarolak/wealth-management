import { documentKinds, extractDocument, linkInstitution, type DocKind } from '../../services/ai'
import { useStore } from '../../store/caseStore'

const s = () => useStore.getState()

/** Reads a statement, merges what it finds into the case and closes matching requests. */
export async function processDocument(caseId: string, actorId: string, kind: DocKind, fileName: string) {
  const r = await extractDocument(kind)
  for (const x of r.items) s().upsertItem(caseId, x.item, x.match)
  if (Object.keys(r.fields).length) s().applyDrafts(caseId, r.fields, 'ai', 'ai')
  s().addDocument(caseId, fileName, kind, r.extracted, actorId)
  const label = documentKinds.find((d) => d.kind === kind)?.label.toLowerCase() ?? ''
  const c = s().cases[caseId]
  for (const req of c.requests.filter((q) => q.status === 'open')) {
    const t = req.title.toLowerCase()
    if ((kind === 'retirement' && t.includes('401')) || (kind === 'tax' && t.includes('tax')) || (kind === 'equity' && (t.includes('stock') || t.includes('rsu'))) || t.includes(label)) {
      s().fulfillRequest(caseId, req.id, actorId, `Uploaded ${fileName}`)
    }
  }
  return r.extracted
}

export async function linkAccount(caseId: string, institutionId: string) {
  const found = await linkInstitution(institutionId)
  for (const x of found) s().upsertItem(caseId, x.item, x.match)
  return found.length
}

export const guessDocKind = (title: string): DocKind => {
  const t = title.toLowerCase()
  if (t.includes('401') || t.includes('ira') || t.includes('retire') || t.includes('pension')) return 'retirement'
  if (t.includes('tax')) return 'tax'
  if (t.includes('stock') || t.includes('rsu') || t.includes('equity')) return 'equity'
  if (t.includes('mortgage')) return 'mortgage'
  if (t.includes('pay')) return 'paystub'
  return 'brokerage'
}
