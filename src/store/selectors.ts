import { fieldById, fieldsFor, isFilled, isVisible, sections, type SectionDef, type SectionId, type Values } from '../schema/onboarding'
import { riskQuestions } from '../schema/risk'
import type { Anchor, ClientCase, SectionProgress, Thread } from './types'

/** Cases shown in the product (the component gallery keeps its own fixture case). */
export const realCases = (cases: Record<string, ClientCase>) =>
  Object.values(cases)
    .filter((c) => c.token !== 'gallery')
    .sort((a, b) => b.createdAt - a.createdAt)

export const latestCase = (cases: Record<string, ClientCase>) => realCases(cases)[0]

export const caseValues = (c: ClientCase): Values => Object.fromEntries(Object.entries(c.fields).map(([k, f]) => [k, f.value]))

export function netWorth(c: ClientCase) {
  let assets = 0
  let liabilities = 0
  let home = 0
  let homeDebt = 0
  let liquid = 0
  for (const i of c.items) {
    const v = i.value ?? 0
    if (i.side === 'asset') {
      assets += v
      if (i.primaryResidence) home += v
      if (i.liquid) liquid += v
    } else {
      liabilities += v
      if (i.category === 'mortgage') homeDebt += v
    }
  }
  const total = assets - liabilities
  // Accredited-investor convention: drop the home and the mortgage on it, up to the home's value.
  return { assets, liabilities, total, exHome: total - home + Math.min(homeDebt, home), liquid }
}

export const visibleSections = (c: ClientCase): SectionDef[] => sections.filter((s) => !s.optional || c.optionalSections.includes(s.id))

export type SectionStats = { total: number; filled: number; required: number; requiredFilled: number; suggestions: number; needsReview: number; deferred: number }

export function sectionStats(c: ClientCase, sectionId: SectionId): SectionStats {
  const values = caseValues(c)
  const s: SectionStats = { total: 0, filled: 0, required: 0, requiredFilled: 0, suggestions: 0, needsReview: 0, deferred: 0 }
  const def = sections.find((x) => x.id === sectionId)
  if (def?.kind === 'goals') {
    s.total = s.required = 1
    s.filled = s.requiredFilled = c.goals.some((g) => !g.draft) ? 1 : 0
    s.suggestions = c.goals.filter((g) => g.draft).length
    return s
  }
  if (def?.kind === 'networth') {
    const real = c.items.filter((i) => !i.draft && i.value !== undefined)
    s.total = s.required = 1
    s.filled = s.requiredFilled = real.length > 0 ? 1 : 0
    s.suggestions = c.items.filter((i) => i.draft).length
    return s
  }
  if (def?.kind === 'risk') {
    const extra = fieldsFor('risk')
    s.total = s.required = riskQuestions.length + extra.length
    const answered = riskQuestions.filter((q) => c.risk[q.id] !== undefined).length + extra.filter((f) => isFilled(values[f.id])).length
    s.filled = s.requiredFilled = answered
    return s
  }
  if (def?.kind === 'review') {
    s.total = s.required = 1
    s.filled = s.requiredFilled = c.signature ? 1 : 0
    return s
  }
  for (const f of fieldsFor(sectionId)) {
    if (!isVisible(f, values)) continue
    const st = c.fields[f.id]
    const filled = isFilled(st?.value) || !!st?.deferred
    s.total++
    if (filled) s.filled++
    if (f.required) {
      s.required++
      if (filled) s.requiredFilled++
    }
    if (st?.suggestion) s.suggestions++
    if (st?.status === 'needs_review') s.needsReview++
    if (st?.deferred) s.deferred++
  }
  return s
}

export function sectionState(c: ClientCase, sectionId: SectionId): SectionProgress {
  const explicit = c.sectionProgress[sectionId]
  if (explicit === 'done') return 'done'
  if (!c.openedAt && !explicit) return 'idle'
  const s = sectionStats(c, sectionId)
  if (explicit === 'progress' && s.requiredFilled >= s.required && s.suggestions === 0) return 'done'
  if (s.filled > 0 || s.suggestions > 0 || explicit === 'progress') return 'progress'
  return 'idle'
}

export function overallProgress(c: ClientCase) {
  const secs = visibleSections(c)
  const done = secs.filter((s) => sectionState(c, s.id) === 'done').length
  let filled = 0
  let total = 0
  for (const s of secs) {
    const st = sectionStats(c, s.id)
    filled += st.filled
    total += st.total
  }
  return { done, sections: secs.length, ratio: total ? filled / total : 0, minutesLeft: secs.filter((s) => sectionState(c, s.id) !== 'done').reduce((a, s) => a + s.minutes, 0) }
}

export const isUnread = (t: Thread, personId: string) => t.messages.some((m) => m.authorId !== personId && m.ts > (t.readAt[personId] ?? 0))

export const unreadCount = (c: ClientCase, personId: string) => c.threads.filter((t) => !t.resolved && isUnread(t, personId)).length

const sameAnchor = (a: Anchor, b: Anchor) => a.sectionId === b.sectionId && a.fieldId === b.fieldId && a.itemId === b.itemId && a.goalId === b.goalId

export const threadsFor = (c: ClientCase, anchor: Anchor) => c.threads.filter((t) => sameAnchor(t.anchor, anchor))

export const threadsInSection = (c: ClientCase, sectionId: SectionId) => c.threads.filter((t) => t.anchor.sectionId === sectionId)

export const openRequests = (c: ClientCase) => c.requests.filter((r) => r.status === 'open')

export const deferredLabels = (c: ClientCase) =>
  Object.entries(c.fields)
    .filter(([, f]) => f.deferred)
    .map(([id]) => fieldById[id]?.label ?? id)

export const roughItems = (c: ClientCase) =>
  c.items.flatMap((i) => (i.draft || i.value === undefined ? [`${i.name} — no balance yet`] : i.confidence === 'rough' ? [`${i.name} — rough estimate`] : []))

export const pendingReview = (c: ClientCase) =>
  Object.entries(c.fields)
    .filter(([, f]) => f.status === 'needs_review')
    .map(([id]) => id)

export const anchorLabel = (a: Anchor, c?: ClientCase) => {
  if (a.fieldId) return fieldById[a.fieldId]?.label ?? a.fieldId
  if (a.itemId) return c?.items.find((i) => i.id === a.itemId)?.name ?? 'Account'
  if (a.goalId) return c?.goals.find((g) => g.id === a.goalId)?.title ?? 'Goal'
  return sections.find((s) => s.id === a.sectionId)?.title ?? a.sectionId
}
