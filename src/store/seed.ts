import type { Person, PipelineRow } from './types'

export const ADVISOR_ID = 'emily'
export const ASSISTANT_ID = 'mike'

export const staff: Person[] = [
  { id: ADVISOR_ID, name: 'Emily Parker', role: 'advisor', title: 'Wealth Manager', avatar: '/avatars/emily.jpg' },
  { id: ASSISTANT_ID, name: 'Mike Whiteaker', role: 'assistant', title: 'Client associate', avatar: '/avatars/mike.jpg' },
]

export const pipeline: PipelineRow[] = [
  { id: 'p1', name: 'David & Elizabeth Thompson', stage: 'Proposals', aum: 4_850_000, updated: '2h ago', advisorId: ADVISOR_ID },
  { id: 'p2', name: 'Priya Raman', stage: 'Info gathering', aum: 1_240_000, updated: 'Yesterday', advisorId: ADVISOR_ID },
  { id: 'p3', name: 'Marcus Oyelaran', stage: 'Prospecting', aum: 2_100_000, updated: '3d ago', advisorId: ADVISOR_ID },
  { id: 'p4', name: 'The Lindqvist Family Trust', stage: 'Onboarded', aum: 12_400_000, updated: 'Last week', advisorId: ADVISOR_ID },
  { id: 'p5', name: 'Sofia Alvarez', stage: 'Info gathering', aum: 890_000, updated: '4d ago', advisorId: ADVISOR_ID },
]

export const pipelineCounts = { Prospecting: 132, 'Info gathering': 93, Proposals: 79, Onboarded: 64 }

/** Defaults the advisor's "new client" form starts from in the demo. */
export const demoNewClient = {
  firstName: 'Daniel',
  lastName: 'Tan',
  email: 'daniel.tan@gmail.com',
  phone: '(512) 555-0148',
  household: 'individual' as const,
  accountTypes: ['individual', 'rollover_ira'],
  optionalSections: ['estate' as const],
  note: 'Met Daniel at the Austin founders breakfast. Recently promoted, lots of RSUs, wants a plan for college and retirement.',
}
