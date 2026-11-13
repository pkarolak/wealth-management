import type { NWCategory, SectionId } from '../schema/onboarding'

export type PersonRole = 'advisor' | 'assistant' | 'client'

export type Person = {
  id: string
  name: string
  role: PersonRole
  title?: string
  avatar?: string
}

export type FieldSource = 'client' | 'ai' | 'id' | 'document' | 'linked' | 'advisor'
export type FieldStatus = 'answered' | 'confirmed' | 'needs_review'
export type Confidence = 'high' | 'medium' | 'low'

export type Suggestion = {
  value: unknown
  by: 'ai' | 'advisor'
  authorId: string
  /** Where it came from, shown to the client ("From your intro", "From your driver’s license"). */
  sourceLabel?: string
  note?: string
  confidence?: Confidence
  createdAt: number
}

export type FieldState = {
  value?: unknown
  source?: FieldSource
  status?: FieldStatus
  confidence?: Confidence
  suggestion?: Suggestion
  deferred?: boolean
  updatedAt?: number
  updatedBy?: string
}

export type GoalKind = 'retirement' | 'education' | 'home' | 'purchase' | 'legacy' | 'giving' | 'other'

export type Goal = {
  id: string
  kind: GoalKind
  title: string
  targetYear?: number
  amount?: number
  priority: 'high' | 'medium' | 'low'
  note?: string
  draft?: boolean
  sourceLabel?: string
}

export type ItemSource = 'manual' | 'linked' | 'document' | 'ai' | 'estimate'
export type ItemConfidence = 'exact' | 'estimate' | 'rough'

export type NWItem = {
  id: string
  side: 'asset' | 'liability'
  category: NWCategory
  name: string
  institution?: string
  value?: number
  rate?: number
  source: ItemSource
  confidence: ItemConfidence
  primaryResidence?: boolean
  liquid?: boolean
  detail?: string
  draft?: boolean
  sourceLabel?: string
  updatedAt: number
}

export type Anchor = { sectionId: SectionId; fieldId?: string; itemId?: string; goalId?: string }

export type Message = { id: string; authorId: string; body: string; ts: number }

export type Thread = {
  id: string
  anchor: Anchor
  title: string
  messages: Message[]
  resolved: boolean
  createdAt: number
  readAt: Record<string, number>
}

export type RequestItem = {
  id: string
  kind: 'document' | 'answer'
  title: string
  detail?: string
  sectionId?: SectionId
  status: 'open' | 'done'
  createdAt: number
  createdBy: string
  fulfilledAt?: number
  fulfilledNote?: string
}

export type EmailPayload = { fromId: string; to: string[]; subject: string; body: string }

export type ActivityKind =
  | 'created'
  | 'invited'
  | 'opened'
  | 'intro'
  | 'section'
  | 'comment'
  | 'request'
  | 'request_done'
  | 'suggestion'
  | 'suggestion_accepted'
  | 'review_flag'
  | 'confirmed'
  | 'upload'
  | 'linked'
  | 'deferred'
  | 'submitted'
  | 'meeting'
  | 'agenda'
  | 'email'

export type Activity = { id: string; ts: number; actorId: string; kind: ActivityKind; text: string; email?: EmailPayload }

export type DocumentItem = { id: string; name: string; kind: string; uploadedAt: number; uploadedBy: string; extracted: string[] }

export type Stage = 'invited' | 'in_progress' | 'submitted' | 'onboarded'

export type SectionProgress = 'idle' | 'progress' | 'done'

export type AgendaItem = { id: string; title: string; minutes: number; topicId?: string }

export type ClientCase = {
  id: string
  token: string
  clientId: string
  advisorId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  household: 'individual' | 'joint'
  accountTypes: string[]
  optionalSections: SectionId[]
  note: string
  stage: Stage
  createdAt: number
  invitedAt?: number
  openedAt?: number
  submittedAt?: number
  signature?: string
  meeting?: { at: number; mode: 'video' | 'office' }
  agenda?: { items: AgendaItem[]; sharedAt?: number; updatedAt: number }
  introDone?: boolean
  idScanned?: boolean
  fields: Record<string, FieldState>
  goals: Goal[]
  items: NWItem[]
  risk: Record<string, number>
  riskConfirmed?: boolean
  threads: Thread[]
  requests: RequestItem[]
  activity: Activity[]
  documents: DocumentItem[]
  sectionProgress: Partial<Record<SectionId, SectionProgress>>
  advisorReviewed: Partial<Record<SectionId, boolean>>
}

export type Presence = { personId: string; caseId?: string; view: 'advisor' | 'client'; sectionId?: SectionId; fieldId?: string; ts: number }

export type PipelineRow = { id: string; name: string; stage: 'Prospecting' | 'Info gathering' | 'Proposals' | 'Onboarded'; aum: number; updated: string; advisorId: string }
