import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/format'
import { fieldById, sectionById, type SectionId } from '../schema/onboarding'
import type { FieldDraft } from '../services/ai'
import { ADVISOR_ID, staff } from './seed'
import type {
  AgendaItem,
  Activity,
  ActivityKind,
  Anchor,
  ClientCase,
  EmailPayload,
  FieldSource,
  Goal,
  NWItem,
  Person,
  Presence,
  RequestItem,
  SectionProgress,
  Thread,
} from './types'

type NewCaseInput = Pick<ClientCase, 'firstName' | 'lastName' | 'email' | 'phone' | 'household' | 'accountTypes' | 'optionalSections' | 'note'>

type State = {
  cases: Record<string, ClientCase>
  people: Record<string, Person>
  presence: Record<string, Presence>
  /** Bumped on every write so other tabs can tell newer state from older. */
  rev: number
}

type Actions = {
  createCase: (input: NewCaseInput) => ClientCase
  sendInvite: (caseId: string, email: { subject: string; body: string }) => void
  markOpened: (caseId: string) => void
  setIntroDone: (caseId: string) => void
  setIdScanned: (caseId: string) => void

  setField: (caseId: string, fieldId: string, value: unknown, actorId: string, source?: FieldSource) => void
  applyDrafts: (caseId: string, drafts: Record<string, FieldDraft>, by: 'ai' | 'advisor', authorId: string) => number
  acceptSuggestion: (caseId: string, fieldId: string, actorId: string) => void
  rejectSuggestion: (caseId: string, fieldId: string, actorId: string) => void
  acceptAllSuggestions: (caseId: string, sectionId: SectionId, actorId: string) => void
  suggestChange: (caseId: string, fieldId: string, value: unknown, note: string, advisorId: string) => void
  confirmField: (caseId: string, fieldId: string, advisorId: string) => void
  confirmSection: (caseId: string, sectionId: SectionId, fieldIds: string[], advisorId: string) => void
  deferField: (caseId: string, fieldId: string, deferred: boolean, actorId: string) => void

  addGoal: (caseId: string, goal: Omit<Goal, 'id'>) => void
  updateGoal: (caseId: string, goalId: string, patch: Partial<Goal>) => void
  removeGoal: (caseId: string, goalId: string) => void

  upsertItem: (caseId: string, item: Omit<NWItem, 'id' | 'updatedAt'> & { id?: string }, matchDraftCategory?: string) => string
  updateItem: (caseId: string, itemId: string, patch: Partial<NWItem>) => void
  removeItem: (caseId: string, itemId: string) => void

  setRisk: (caseId: string, questionId: string, optionIndex: number) => void
  confirmRisk: (caseId: string, actorId: string) => void

  addDocument: (caseId: string, name: string, kind: string, extracted: string[], actorId: string) => void

  startThread: (caseId: string, anchor: Anchor, title: string, body: string, authorId: string) => string
  reply: (caseId: string, threadId: string, body: string, authorId: string) => void
  resolveThread: (caseId: string, threadId: string, resolved: boolean, actorId: string) => void
  markRead: (caseId: string, personId: string, threadIds?: string[]) => void

  addRequest: (caseId: string, req: Pick<RequestItem, 'kind' | 'title' | 'detail' | 'sectionId'>, advisorId: string) => void
  fulfillRequest: (caseId: string, requestId: string, actorId: string, note?: string) => void

  setSectionProgress: (caseId: string, sectionId: SectionId, progress: SectionProgress, actorId: string) => void
  markSectionReviewed: (caseId: string, sectionId: SectionId, reviewed: boolean) => void
  submit: (caseId: string, signature: string) => void
  scheduleMeeting: (caseId: string, at: number, mode: 'video' | 'office') => void
  setAgenda: (caseId: string, items: AgendaItem[]) => void
  shareAgenda: (caseId: string, actorId: string) => void

  setPresence: (p: Presence) => void
  clearPresence: (personId: string) => void
  reset: () => void
}

export type Store = State & Actions

const initialState = (): State => ({
  cases: {},
  people: Object.fromEntries(staff.map((p) => [p.id, p])),
  presence: {},
  rev: 0,
})

const now = () => Date.now()

const clientEmail = (c: ClientCase) => `${c.firstName} ${c.lastName}`

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      /** Immutable update of one case, plus an activity entry. */
      const patchCase = (caseId: string, fn: (c: ClientCase) => ClientCase, activity?: { actorId: string; kind: ActivityKind; text: string; email?: EmailPayload }) => {
        set((s) => {
          const c = s.cases[caseId]
          if (!c) return s
          let next = fn(c)
          if (activity) {
            const entry: Activity = { id: uid('act'), ts: now(), ...activity }
            next = { ...next, activity: [entry, ...next.activity].slice(0, 200) }
          }
          return { cases: { ...s.cases, [caseId]: next }, rev: s.rev + 1 }
        })
      }

      const personName = (id: string) => get().people[id]?.name ?? 'Someone'
      const isClient = (id: string) => get().people[id]?.role === 'client'

      const touchSection = (c: ClientCase, sectionId: SectionId): ClientCase =>
        c.sectionProgress[sectionId] === 'done' || c.sectionProgress[sectionId] === 'progress'
          ? c
          : { ...c, sectionProgress: { ...c.sectionProgress, [sectionId]: 'progress' } }

      return {
        ...initialState(),

        createCase: (input) => {
          const id = uid('case')
          const clientId = `client_${id}`
          const token = `${input.firstName.toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`
          const c: ClientCase = {
            id,
            token,
            clientId,
            advisorId: ADVISOR_ID,
            ...input,
            stage: 'invited',
            createdAt: now(),
            fields: {
              firstName: { value: input.firstName, source: 'advisor', status: 'answered', updatedAt: now(), updatedBy: ADVISOR_ID },
              lastName: { value: input.lastName, source: 'advisor', status: 'answered', updatedAt: now(), updatedBy: ADVISOR_ID },
              email: { value: input.email, source: 'advisor', status: 'answered', updatedAt: now(), updatedBy: ADVISOR_ID },
              ...(input.phone ? { phone: { value: input.phone, source: 'advisor' as const, status: 'answered' as const, updatedAt: now(), updatedBy: ADVISOR_ID } } : {}),
            },
            goals: [],
            items: [],
            risk: {},
            threads: [],
            requests: [],
            activity: [{ id: uid('act'), ts: now(), actorId: ADVISOR_ID, kind: 'created', text: `Created ${input.firstName}’s onboarding` }],
            documents: [],
            sectionProgress: {},
            advisorReviewed: {},
          }
          set((s) => ({
            cases: { ...s.cases, [id]: c },
            people: { ...s.people, [clientId]: { id: clientId, name: `${input.firstName} ${input.lastName}`, role: 'client', title: 'Client' } },
            rev: s.rev + 1,
          }))
          return c
        },

        sendInvite: (caseId, email) => {
          const c = get().cases[caseId]
          if (!c) return
          patchCase(caseId, (x) => ({ ...x, invitedAt: now() }), {
            actorId: c.advisorId,
            kind: 'invited',
            text: `Sent the onboarding link to ${c.firstName}`,
            email: { fromId: c.advisorId, to: [clientEmail(c)], subject: email.subject, body: email.body },
          })
        },

        markOpened: (caseId) => {
          const c = get().cases[caseId]
          if (!c || c.openedAt) return
          patchCase(caseId, (x) => ({ ...x, openedAt: now(), stage: 'in_progress' }), { actorId: c.clientId, kind: 'opened', text: `${c.firstName} opened the link` })
        },

        setIntroDone: (caseId) => {
          const c = get().cases[caseId]
          if (!c) return
          patchCase(caseId, (x) => ({ ...x, introDone: true }), { actorId: c.clientId, kind: 'intro', text: `${c.firstName} told us about themselves — AI drafted answers to confirm` })
        },

        setIdScanned: (caseId) => {
          const c = get().cases[caseId]
          if (!c) return
          patchCase(caseId, (x) => ({ ...x, idScanned: true }), { actorId: c.clientId, kind: 'upload', text: `${c.firstName} scanned their driver’s license` })
        },

        setField: (caseId, fieldId, value, actorId, source = 'client') => {
          const def = fieldById[fieldId]
          const before = get().cases[caseId]?.fields[fieldId]
          const flag = isClient(actorId) && before?.status === 'confirmed'
          patchCase(
            caseId,
            (c) => {
              const prev = c.fields[fieldId] ?? {}
              const next = touchSection(c, def?.sectionId ?? 'about')
              return {
                ...next,
                fields: {
                  ...next.fields,
                  [fieldId]: { ...prev, value, source, status: flag ? 'needs_review' : prev.status === 'needs_review' ? 'needs_review' : 'answered', suggestion: undefined, deferred: false, updatedAt: now(), updatedBy: actorId },
                },
              }
            },
            flag ? { actorId, kind: 'review_flag', text: `${personName(actorId).split(' ')[0]} changed “${def?.label ?? fieldId}” after you confirmed it` } : undefined,
          )
        },

        applyDrafts: (caseId, drafts, by, authorId) => {
          let applied = 0
          patchCase(caseId, (c) => {
            const fields = { ...c.fields }
            let sp = { ...c.sectionProgress }
            for (const [fid, d] of Object.entries(drafts)) {
              const cur = fields[fid]
              const empty = cur?.value === undefined || cur?.value === '' || (Array.isArray(cur?.value) && cur.value.length === 0)
              const sameAsCurrent = JSON.stringify(cur?.value) === JSON.stringify(d.value)
              if (!empty && (sameAsCurrent || by === 'ai')) continue
              applied++
              fields[fid] = { ...cur, suggestion: { value: d.value, by, authorId, sourceLabel: d.sourceLabel, confidence: d.confidence, createdAt: now() } }
              const sid = fieldById[fid]?.sectionId
              if (sid && !sp[sid]) sp = { ...sp, [sid]: 'progress' }
            }
            return { ...c, fields, sectionProgress: sp }
          })
          return applied
        },

        acceptSuggestion: (caseId, fieldId, actorId) => {
          const c = get().cases[caseId]
          const s = c?.fields[fieldId]?.suggestion
          if (!c || !s) return
          const fromAdvisor = s.by === 'advisor'
          patchCase(
            caseId,
            (x) => ({
              ...x,
              fields: {
                ...x.fields,
                [fieldId]: { ...x.fields[fieldId], value: s.value, source: fromAdvisor ? 'advisor' : s.sourceLabel?.includes('license') ? 'id' : s.sourceLabel?.startsWith('From your') && !s.sourceLabel.includes('intro') ? 'document' : 'ai', status: fromAdvisor ? 'confirmed' : 'answered', confidence: s.confidence, suggestion: undefined, updatedAt: now(), updatedBy: actorId },
              },
            }),
            fromAdvisor ? { actorId, kind: 'suggestion_accepted', text: `${c.firstName} accepted ${personName(s.authorId).split(' ')[0]}’s change to “${fieldById[fieldId]?.label}”` } : undefined,
          )
        },

        rejectSuggestion: (caseId, fieldId, actorId) => {
          const c = get().cases[caseId]
          const s = c?.fields[fieldId]?.suggestion
          if (!c || !s) return
          patchCase(
            caseId,
            (x) => ({ ...x, fields: { ...x.fields, [fieldId]: { ...x.fields[fieldId], suggestion: undefined } } }),
            s.by === 'advisor' ? { actorId, kind: 'suggestion', text: `${c.firstName} kept their answer for “${fieldById[fieldId]?.label}”` } : undefined,
          )
        },

        acceptAllSuggestions: (caseId, sectionId, actorId) => {
          const c = get().cases[caseId]
          if (!c) return
          const ids = Object.entries(c.fields)
            .filter(([fid, f]) => f.suggestion && fieldById[fid]?.sectionId === sectionId)
            .map(([fid]) => fid)
          ids.forEach((fid) => get().acceptSuggestion(caseId, fid, actorId))
        },

        suggestChange: (caseId, fieldId, value, note, advisorId) => {
          const c = get().cases[caseId]
          if (!c) return
          const label = fieldById[fieldId]?.label ?? fieldId
          patchCase(
            caseId,
            (x) => ({ ...x, fields: { ...x.fields, [fieldId]: { ...x.fields[fieldId], suggestion: { value, by: 'advisor', authorId: advisorId, note, sourceLabel: `Suggested by ${personName(advisorId).split(' ')[0]}`, createdAt: now() } } } }),
            {
              actorId: advisorId,
              kind: 'suggestion',
              text: `Suggested a change to “${label}”`,
              email: { fromId: advisorId, to: [clientEmail(c)], subject: `${personName(advisorId).split(' ')[0]} suggested a change`, body: `Hi ${c.firstName},\n\nI suggested a small change to “${label}”${note ? `: ${note}` : '.'}\n\nYou can accept or keep your answer in the form.` },
            },
          )
        },

        confirmField: (caseId, fieldId, advisorId) => {
          patchCase(caseId, (x) => ({ ...x, fields: { ...x.fields, [fieldId]: { ...x.fields[fieldId], status: 'confirmed', updatedBy: x.fields[fieldId]?.updatedBy ?? advisorId } } }))
        },

        confirmSection: (caseId, sectionId, fieldIds, advisorId) => {
          patchCase(
            caseId,
            (x) => {
              const fields = { ...x.fields }
              for (const fid of fieldIds) if (fields[fid]?.value !== undefined && !fields[fid]?.suggestion) fields[fid] = { ...fields[fid], status: 'confirmed' }
              return { ...x, fields, advisorReviewed: { ...x.advisorReviewed, [sectionId]: true } }
            },
            { actorId: advisorId, kind: 'confirmed', text: `Reviewed “${sectionById[sectionId].wmTitle}”` },
          )
        },

        deferField: (caseId, fieldId, deferred, actorId) => {
          const label = fieldById[fieldId]?.label ?? fieldId
          patchCase(caseId, (x) => ({ ...x, fields: { ...x.fields, [fieldId]: { ...x.fields[fieldId], deferred } } }), deferred ? { actorId, kind: 'deferred', text: `Moved “${label}” to the meeting agenda` } : undefined)
        },

        addGoal: (caseId, goal) => patchCase(caseId, (c) => touchSection({ ...c, goals: [...c.goals, { ...goal, id: uid('goal') }] }, 'goals')),
        updateGoal: (caseId, goalId, patch) => patchCase(caseId, (c) => ({ ...c, goals: c.goals.map((g) => (g.id === goalId ? { ...g, ...patch } : g)) })),
        removeGoal: (caseId, goalId) => patchCase(caseId, (c) => ({ ...c, goals: c.goals.filter((g) => g.id !== goalId) })),

        upsertItem: (caseId, item, matchDraftCategory) => {
          let id = item.id ?? uid('item')
          patchCase(caseId, (c) => {
            const draft = matchDraftCategory ? c.items.find((i) => i.draft && i.category === matchDraftCategory) : undefined
            if (draft) id = draft.id
            const existing = c.items.find((i) => i.id === id)
            const next: NWItem = { ...(existing ?? {}), ...item, id, draft: item.draft ?? false, updatedAt: now() } as NWItem
            const items = existing ? c.items.map((i) => (i.id === id ? next : i)) : [...c.items, next]
            return touchSection({ ...c, items }, 'networth')
          })
          return id
        },
        updateItem: (caseId, itemId, patch) => patchCase(caseId, (c) => ({ ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, ...patch, updatedAt: now() } : i)) })),
        removeItem: (caseId, itemId) => patchCase(caseId, (c) => ({ ...c, items: c.items.filter((i) => i.id !== itemId) })),

        setRisk: (caseId, qid, idx) => patchCase(caseId, (c) => touchSection({ ...c, risk: { ...c.risk, [qid]: idx }, riskConfirmed: false }, 'risk')),
        confirmRisk: (caseId) => patchCase(caseId, (c) => ({ ...c, riskConfirmed: true })),

        addDocument: (caseId, name, kind, extracted, actorId) =>
          patchCase(caseId, (c) => ({ ...c, documents: [{ id: uid('doc'), name, kind, uploadedAt: now(), uploadedBy: actorId, extracted }, ...c.documents.filter((d) => d.name !== name)] }), {
            actorId,
            kind: 'upload',
            text: `Uploaded ${name}`,
          }),

        startThread: (caseId, anchor, title, body, authorId) => {
          const c = get().cases[caseId]
          const id = uid('thr')
          if (!c) return id
          const thread: Thread = { id, anchor, title, messages: [{ id: uid('msg'), authorId, body, ts: now() }], resolved: false, createdAt: now(), readAt: { [authorId]: now() } }
          const fromClient = isClient(authorId)
          const advisor = get().people[c.advisorId]
          patchCase(caseId, (x) => ({ ...x, threads: [thread, ...x.threads] }), {
            actorId: authorId,
            kind: 'comment',
            text: fromClient ? `${c.firstName} asked about “${title}”` : `Asked ${c.firstName} about “${title}”`,
            email: fromClient
              ? { fromId: authorId, to: [advisor?.name ?? 'Wealth Manager'], subject: `${c.firstName} has a question about “${title}”`, body }
              : { fromId: authorId, to: [clientEmail(c)], subject: `${personName(authorId).split(' ')[0]} left you a comment`, body },
          })
          return id
        },

        reply: (caseId, threadId, body, authorId) => {
          const c = get().cases[caseId]
          const t = c?.threads.find((x) => x.id === threadId)
          if (!c || !t) return
          const fromClient = isClient(authorId)
          patchCase(
            caseId,
            (x) => ({ ...x, threads: x.threads.map((th) => (th.id === threadId ? { ...th, resolved: false, messages: [...th.messages, { id: uid('msg'), authorId, body, ts: now() }], readAt: { ...th.readAt, [authorId]: now() } } : th)) }),
            {
              actorId: authorId,
              kind: 'comment',
              text: `${fromClient ? c.firstName : personName(authorId).split(' ')[0]} replied on “${t.title}”`,
              email: fromClient ? undefined : { fromId: authorId, to: [clientEmail(c)], subject: `New reply on “${t.title}”`, body },
            },
          )
        },

        resolveThread: (caseId, threadId, resolved, actorId) => {
          const t = get().cases[caseId]?.threads.find((x) => x.id === threadId)
          patchCase(caseId, (x) => ({ ...x, threads: x.threads.map((th) => (th.id === threadId ? { ...th, resolved } : th)) }), resolved && t ? { actorId, kind: 'comment', text: `Resolved “${t.title}”` } : undefined)
        },

        markRead: (caseId, personId, threadIds) => {
          const c = get().cases[caseId]
          if (!c) return
          const needs = c.threads.some((t) => (!threadIds || threadIds.includes(t.id)) && t.messages.some((m) => m.authorId !== personId && m.ts > (t.readAt[personId] ?? 0)))
          if (!needs) return
          patchCase(caseId, (x) => ({ ...x, threads: x.threads.map((t) => (!threadIds || threadIds.includes(t.id) ? { ...t, readAt: { ...t.readAt, [personId]: now() } } : t)) }))
        },

        addRequest: (caseId, req, advisorId) => {
          const c = get().cases[caseId]
          if (!c) return
          patchCase(caseId, (x) => ({ ...x, requests: [{ id: uid('req'), ...req, status: 'open', createdAt: now(), createdBy: advisorId }, ...x.requests] }), {
            actorId: advisorId,
            kind: 'request',
            text: `Requested: ${req.title}`,
            email: { fromId: advisorId, to: [clientEmail(c)], subject: `Quick request: ${req.title}`, body: `Hi ${c.firstName},\n\n${req.detail || `Could you add “${req.title}” in the form when you get a moment?`}\n\nThank you!` },
          })
        },

        fulfillRequest: (caseId, requestId, actorId, note) => {
          const c = get().cases[caseId]
          const r = c?.requests.find((x) => x.id === requestId)
          if (!c || !r || r.status === 'done') return
          patchCase(caseId, (x) => ({ ...x, requests: x.requests.map((q) => (q.id === requestId ? { ...q, status: 'done', fulfilledAt: now(), fulfilledNote: note } : q)) }), { actorId, kind: 'request_done', text: `${c.firstName} completed “${r.title}”` })
        },

        setSectionProgress: (caseId, sectionId, progress, actorId) => {
          const c = get().cases[caseId]
          if (!c || c.sectionProgress[sectionId] === progress) return
          patchCase(caseId, (x) => ({ ...x, sectionProgress: { ...x.sectionProgress, [sectionId]: progress } }), progress === 'done' ? { actorId, kind: 'section', text: `${c.firstName} finished “${sectionById[sectionId].wmTitle}”` } : undefined)
        },

        markSectionReviewed: (caseId, sectionId, reviewed) => patchCase(caseId, (x) => ({ ...x, advisorReviewed: { ...x.advisorReviewed, [sectionId]: reviewed } })),

        submit: (caseId, signature) => {
          const c = get().cases[caseId]
          if (!c) return
          const advisor = get().people[c.advisorId]
          patchCase(caseId, (x) => ({ ...x, stage: 'submitted', submittedAt: now(), signature, sectionProgress: { ...x.sectionProgress, review: 'done' } }), {
            actorId: c.clientId,
            kind: 'submitted',
            text: `${c.firstName} signed and submitted`,
            email: { fromId: c.clientId, to: [advisor?.name ?? 'Wealth Manager'], subject: `${c.firstName} ${c.lastName} completed onboarding`, body: `${c.firstName} signed and submitted the onboarding form. Your meeting brief is ready.` },
          })
        },

        scheduleMeeting: (caseId, at, mode) => {
          const c = get().cases[caseId]
          if (!c) return
          const when = new Date(at).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
          const where = mode === 'video' ? 'video call' : 'at the office'
          patchCase(caseId, (x) => ({ ...x, meeting: { at, mode } }), {
            actorId: c.clientId,
            kind: 'meeting',
            text: `${c.firstName} ${c.meeting ? 'moved' : 'booked'} the planning meeting: ${when}, ${where}`,
            email: { fromId: c.clientId, to: [get().people[c.advisorId]?.name ?? 'Wealth Manager'], subject: `Planning meeting with ${c.firstName} ${c.lastName}`, body: `${c.firstName} booked ${when} (${where}, 45 minutes).` },
          })
        },

        setAgenda: (caseId, items) => patchCase(caseId, (x) => ({ ...x, agenda: { ...x.agenda, items, updatedAt: now() } })),

        shareAgenda: (caseId, actorId) => {
          const c = get().cases[caseId]
          if (!c?.agenda) return
          const lines = c.agenda.items.map((a, i) => `${i + 1}. ${a.title} (${a.minutes} min)`).join('\n')
          const first = personName(actorId).split(' ')[0]
          patchCase(caseId, (x) => ({ ...x, agenda: x.agenda && { ...x.agenda, sharedAt: now() } }), {
            actorId,
            kind: 'agenda',
            text: `${c.agenda.sharedAt ? 'Sent an updated' : 'Shared the'} meeting agenda with ${c.firstName}`,
            email: { fromId: actorId, to: [clientEmail(c)], subject: 'Agenda for our planning meeting', body: `Hi ${c.firstName},\n\nHere’s what I’d like us to cover:\n\n${lines}\n\nReply if there’s anything you’d like to add.\n\n${first}` },
          })
        },

        setPresence: (p) => set((s) => ({ presence: { ...s.presence, [p.personId]: p } })),
        clearPresence: (personId) =>
          set((s) => {
            const presence = { ...s.presence }
            delete presence[personId]
            return { presence }
          }),

        reset: () => set({ ...initialState(), rev: get().rev + 1 }),
      }
    },
    {
      name: 'nevis-onboarding-v1',
      partialize: (s) => ({ cases: s.cases, people: s.people, rev: s.rev }),
    },
  ),
)

// Cross-tab sync ---------------------------------------------------------------
// Each write is broadcast; other tabs apply it if it's newer. Presence is broadcast
// separately and never persisted, so a closed tab simply goes stale.

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('nevis-onboarding') : undefined
let applyingRemote = false

if (channel) {
  useStore.subscribe((s, prev) => {
    if (applyingRemote) return
    if (s.rev !== prev.rev || s.cases !== prev.cases || s.people !== prev.people) {
      channel.postMessage({ type: 'state', rev: s.rev, cases: s.cases, people: s.people })
    }
    if (s.presence !== prev.presence) channel.postMessage({ type: 'presence', presence: s.presence })
  })

  channel.onmessage = (e: MessageEvent) => {
    const msg = e.data
    applyingRemote = true
    try {
      if (msg.type === 'state') {
        const cur = useStore.getState()
        if (msg.rev >= cur.rev || msg.rev < cur.rev - 1000) useStore.setState({ cases: msg.cases, people: msg.people, rev: msg.rev })
      } else if (msg.type === 'presence') {
        useStore.setState((s) => ({ presence: { ...s.presence, ...msg.presence } }))
      } else if (msg.type === 'reset') {
        useStore.setState({ ...initialState(), rev: msg.rev })
      }
    } finally {
      applyingRemote = false
    }
  }
}

export const resetDemo = () => {
  useStore.getState().reset()
  channel?.postMessage({ type: 'reset', rev: useStore.getState().rev })
  localStorage.removeItem('nevis-onboarding-v1')
}
