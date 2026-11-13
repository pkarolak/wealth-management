// Scripted AI. Every function is deterministic so the demo always plays the same way;
// swap the bodies for real model calls without touching callers.
import type { NWCategory, SectionId } from '../schema/onboarding'
import type { ClientCase, Confidence, Goal, NWItem } from '../store/types'

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export type FieldDraft = { value: unknown; sourceLabel: string; confidence: Confidence }
export type IntroResult = {
  fields: Record<string, FieldDraft>
  goals: Omit<Goal, 'id'>[]
  items: Omit<NWItem, 'id' | 'updatedAt'>[]
  summary: { label: string; count: number; sectionId: SectionId }[]
}

export const introTranscript =
  "Hi, I'm Daniel. I'm forty-one and I work as a product director at Lumen Health here in Austin. I'm married to Grace and we have two kids, nine and six. We'd love to retire around sixty, cover the kids' college, and maybe buy a lake house in the next five years. I have a 401k from my old job, a bunch of RSUs, a brokerage account at Vanguard, some savings at Chase — and we still have the mortgage on the house."

const INTRO = 'From your intro'

export async function extractIntro(_text: string): Promise<IntroResult> {
  await wait(1400)
  const year = new Date().getFullYear()
  const fields: Record<string, FieldDraft> = {
    employmentStatus: { value: 'employed', sourceLabel: INTRO, confidence: 'high' },
    occupation: { value: 'Executive / senior management', sourceLabel: INTRO, confidence: 'medium' },
    jobTitle: { value: 'Product Director', sourceLabel: INTRO, confidence: 'high' },
    employer: { value: 'Lumen Health', sourceLabel: INTRO, confidence: 'high' },
    maritalStatus: { value: 'married', sourceLabel: INTRO, confidence: 'high' },
    spouseName: { value: 'Grace Tan', sourceLabel: INTRO, confidence: 'medium' },
    dependents: { value: '2', sourceLabel: INTRO, confidence: 'high' },
    city: { value: 'Austin', sourceLabel: INTRO, confidence: 'high' },
    state: { value: 'Texas', sourceLabel: INTRO, confidence: 'high' },
    incomeSources: { value: ['salary', 'equity'], sourceLabel: INTRO, confidence: 'medium' },
  }
  const goals: Omit<Goal, 'id'>[] = [
    { kind: 'retirement', title: 'Retire at 60', targetYear: year + 19, amount: 4_500_000, priority: 'high', draft: true, sourceLabel: INTRO, note: 'Amount is a starting estimate — adjust freely.' },
    { kind: 'education', title: 'College for two kids', targetYear: year + 9, amount: 420_000, priority: 'high', draft: true, sourceLabel: INTRO },
    { kind: 'home', title: 'Lake house', targetYear: year + 5, amount: 650_000, priority: 'medium', draft: true, sourceLabel: INTRO },
  ]
  const items: Omit<NWItem, 'id' | 'updatedAt'>[] = [
    { side: 'asset', category: 'retirement', name: '401(k) from previous employer', source: 'ai', confidence: 'rough', draft: true, sourceLabel: INTRO },
    { side: 'asset', category: 'equityComp', name: 'Lumen Health RSUs', institution: 'Lumen Health', source: 'ai', confidence: 'rough', draft: true, sourceLabel: INTRO },
    { side: 'asset', category: 'investment', name: 'Brokerage account', institution: 'Vanguard', source: 'ai', confidence: 'rough', draft: true, sourceLabel: INTRO, liquid: true },
    { side: 'asset', category: 'cash', name: 'Savings', institution: 'Chase', source: 'ai', confidence: 'rough', draft: true, sourceLabel: INTRO, liquid: true },
    { side: 'asset', category: 'realEstate', name: 'Family home', source: 'ai', confidence: 'rough', draft: true, sourceLabel: INTRO, primaryResidence: true },
    { side: 'liability', category: 'mortgage', name: 'Home mortgage', source: 'ai', confidence: 'rough', draft: true, sourceLabel: INTRO },
  ]
  return {
    fields,
    goals,
    items,
    summary: [
      { label: 'details about you and your family', count: 4, sectionId: 'about' },
      { label: 'work details', count: 5, sectionId: 'work' },
      { label: 'goals', count: goals.length, sectionId: 'goals' },
      { label: 'accounts and debts to fill in', count: items.length, sectionId: 'networth' },
    ],
  }
}

export async function scanId(): Promise<Record<string, FieldDraft>> {
  await wait(1600)
  const s = 'From your license'
  return {
    firstName: { value: 'Daniel', sourceLabel: s, confidence: 'high' },
    middleName: { value: 'Wei', sourceLabel: s, confidence: 'high' },
    lastName: { value: 'Tan', sourceLabel: s, confidence: 'high' },
    dob: { value: '1985-03-14', sourceLabel: s, confidence: 'high' },
    street: { value: '2417 Barton Hills Dr', sourceLabel: s, confidence: 'high' },
    city: { value: 'Austin', sourceLabel: s, confidence: 'high' },
    state: { value: 'Texas', sourceLabel: s, confidence: 'high' },
    zip: { value: '78704', sourceLabel: s, confidence: 'high' },
    citizenship: { value: 'us', sourceLabel: s, confidence: 'medium' },
  }
}

export type DocKind = 'brokerage' | 'retirement' | 'mortgage' | 'tax' | 'equity' | 'paystub'

export const documentKinds: { kind: DocKind; label: string; file: string; hint: string }[] = [
  { kind: 'brokerage', label: 'Brokerage statement', file: 'Vanguard_Statement_Oct2026.pdf', hint: 'Balances, holdings, cost basis' },
  { kind: 'retirement', label: '401(k) statement', file: 'Fidelity_NetBenefits_Q3.pdf', hint: 'Balance and contributions' },
  { kind: 'equity', label: 'Stock plan statement', file: 'Shareworks_Lumen_RSU.pdf', hint: 'Grants and vesting' },
  { kind: 'mortgage', label: 'Mortgage statement', file: 'Chase_Mortgage_Oct.pdf', hint: 'Balance and rate' },
  { kind: 'tax', label: '2025 tax return', file: '2025_Form1040.pdf', hint: 'Income, filing status, dependents' },
  { kind: 'paystub', label: 'Recent pay stub', file: 'Lumen_Paystub_Oct31.pdf', hint: 'Employer and salary' },
]

export type ExtractResult = {
  items: { match?: NWCategory; item: Omit<NWItem, 'id' | 'updatedAt'> }[]
  fields: Record<string, FieldDraft>
  extracted: string[]
}

export async function extractDocument(kind: DocKind): Promise<ExtractResult> {
  await wait(1800)
  const label = documentKinds.find((d) => d.kind === kind)?.label ?? 'document'
  const src = `From your ${label.toLowerCase()}`
  switch (kind) {
    case 'brokerage':
      return {
        items: [{ match: 'investment', item: { side: 'asset', category: 'investment', name: 'Brokerage account', institution: 'Vanguard', value: 412_380, source: 'document', confidence: 'exact', liquid: true, detail: '62% VTI · 23% VXUS · 15% BND · cost basis $298,100', sourceLabel: src } }],
        fields: {},
        extracted: ['Balance $412,380', '3 holdings', 'Cost basis $298,100'],
      }
    case 'retirement':
      return {
        items: [{ match: 'retirement', item: { side: 'asset', category: 'retirement', name: '401(k) from previous employer', institution: 'Fidelity', value: 286_900, source: 'document', confidence: 'exact', detail: 'Target date 2045 fund · eligible for rollover', sourceLabel: src } }],
        fields: {},
        extracted: ['Balance $286,900', 'Rollover eligible'],
      }
    case 'equity':
      return {
        items: [{ match: 'equityComp', item: { side: 'asset', category: 'equityComp', name: 'Lumen Health RSUs', institution: 'Shareworks', value: 538_000, source: 'document', confidence: 'estimate', detail: '4,120 vested + 6,800 unvested shares at $49.30 · next vest Feb 2027', sourceLabel: src } }],
        fields: {},
        extracted: ['10,920 shares', 'Next vest Feb 2027', 'Concentration: 22% of assets'],
      }
    case 'mortgage':
      return {
        items: [{ match: 'mortgage', item: { side: 'liability', category: 'mortgage', name: 'Home mortgage', institution: 'Chase', value: 512_400, rate: 3.1, source: 'document', confidence: 'exact', detail: '30-year fixed · $3,240/month · ends 2049', sourceLabel: src } }],
        fields: {},
        extracted: ['Balance $512,400', '3.1% fixed', '$3,240 / month'],
      }
    case 'tax':
      return {
        items: [],
        fields: {
          annualIncome: { value: '300-500', sourceLabel: src, confidence: 'high' },
          incomeSources: { value: ['salary', 'bonus', 'equity', 'investments'], sourceLabel: src, confidence: 'high' },
          maritalStatus: { value: 'married', sourceLabel: src, confidence: 'high' },
          dependents: { value: '2', sourceLabel: src, confidence: 'high' },
        },
        extracted: ['AGI $341,200', 'Married filing jointly', '2 dependents', '$3,000 loss carryforward'],
      }
    case 'paystub':
      return {
        items: [],
        fields: {
          employer: { value: 'Lumen Health, Inc.', sourceLabel: src, confidence: 'high' },
          employerAddress: { value: '500 W 2nd St, Austin, TX 78701', sourceLabel: src, confidence: 'high' },
          jobTitle: { value: 'Product Director', sourceLabel: src, confidence: 'high' },
        },
        extracted: ['Lumen Health, Inc.', 'Base $228,000 / year'],
      }
  }
}

export const institutions = [
  { id: 'chase', name: 'Chase', kind: 'Bank', color: '#117ACA', logo: '/logos/chase.jpg' },
  { id: 'vanguard', name: 'Vanguard', kind: 'Brokerage', color: '#96151D', logo: '/logos/vanguard.svg' },
  { id: 'fidelity', name: 'Fidelity NetBenefits', kind: '401(k)', color: '#368727', logo: '/logos/fidelity.png' },
  { id: 'coinbase', name: 'Coinbase', kind: 'Crypto', color: '#0052FF', logo: '/logos/coinbase.png' },
  { id: 'schwab', name: 'Charles Schwab', kind: 'Brokerage', color: '#00A0DF', logo: '/logos/schwab.png' },
  { id: 'amex', name: 'American Express', kind: 'Credit card', color: '#2E77BB', logo: '/logos/amex.png' },
]

export async function linkInstitution(id: string): Promise<{ match?: NWCategory; item: Omit<NWItem, 'id' | 'updatedAt'> }[]> {
  await wait(1500)
  const src = 'Linked account'
  const map: Record<string, { match?: NWCategory; item: Omit<NWItem, 'id' | 'updatedAt'> }[]> = {
    chase: [
      { match: 'cash', item: { side: 'asset', category: 'cash', name: 'Savings', institution: 'Chase', value: 65_200, source: 'linked', confidence: 'exact', liquid: true, sourceLabel: src } },
      { item: { side: 'asset', category: 'cash', name: 'Checking', institution: 'Chase', value: 18_450, source: 'linked', confidence: 'exact', liquid: true, sourceLabel: src } },
    ],
    vanguard: [{ match: 'investment', item: { side: 'asset', category: 'investment', name: 'Brokerage account', institution: 'Vanguard', value: 414_020, source: 'linked', confidence: 'exact', liquid: true, detail: 'Updated today', sourceLabel: src } }],
    fidelity: [{ match: 'retirement', item: { side: 'asset', category: 'retirement', name: '401(k) from previous employer', institution: 'Fidelity', value: 287_310, source: 'linked', confidence: 'exact', sourceLabel: src } }],
    coinbase: [{ item: { side: 'asset', category: 'crypto', name: 'Crypto wallet', institution: 'Coinbase', value: 23_400, source: 'linked', confidence: 'exact', liquid: true, detail: '0.21 BTC · 2.4 ETH', sourceLabel: src } }],
    schwab: [{ item: { side: 'asset', category: 'investment', name: 'Individual brokerage', institution: 'Charles Schwab', value: 58_900, source: 'linked', confidence: 'exact', liquid: true, sourceLabel: src } }],
    amex: [{ item: { side: 'liability', category: 'creditCard', name: 'Platinum card', institution: 'American Express', value: 4_870, rate: 0, source: 'linked', confidence: 'exact', detail: 'Paid in full monthly', sourceLabel: src } }],
  }
  return map[id] ?? []
}

export type Estimate = { value: number; low: number; high: number; basis: string }

export async function estimateValue(category: NWCategory, input: string): Promise<Estimate | undefined> {
  await wait(1100)
  const q = input.toLowerCase()
  if (category === 'realEstate') return { value: 1_180_000, low: 1_090_000, high: 1_260_000, basis: `Based on 14 recent sales near ${input || 'your address'}` }
  if (category === 'collectible') {
    if (q.includes('rolex') || q.includes('watch')) return { value: 14_500, low: 12_800, high: 16_900, basis: 'Recent sales of similar watches on secondary markets' }
    return { value: 8_000, low: 4_000, high: 15_000, basis: 'Wide range — an appraisal would narrow this down' }
  }
  if (category === 'crypto') return { value: 23_400, low: 21_000, high: 25_800, basis: 'Current market prices' }
  if (category === 'business') return { value: 350_000, low: 200_000, high: 600_000, basis: 'Rough multiple of revenue — we’ll refine this together' }
  return undefined
}

export const glossary: Record<string, { title: string; body: string }> = {
  ssn: { title: 'Why we need your SSN', body: 'Federal rules require every brokerage to verify who you are, and the IRS needs it for tax forms. It’s encrypted and only the last four digits are ever shown. If you’d rather, Emily can collect it on a call.' },
  residency: { title: 'Citizenship', body: 'This decides which tax form applies to you — a W-9 for U.S. persons, a W-8BEN for everyone else.' },
  ranges: { title: 'Why a range is fine', body: 'Regulators only need a range to check your investments fit your situation. If you upload a tax return, we’ll use the exact numbers for planning.' },
  liquidity: { title: 'What counts as liquid', body: 'Money you could get to within a few days without a big penalty: cash, brokerage accounts, most crypto. Retirement accounts, property and private companies usually aren’t.' },
  trust: { title: 'Living trust', body: 'A legal document that holds your assets and passes them on without going through probate court. Not everyone needs one.' },
  poa: { title: 'Power of attorney', body: 'Names someone who can make financial (or medical) decisions for you if you can’t.' },
  finra: { title: 'Why we ask', body: 'If you work in the securities industry, your employer has to approve this account and may receive copies of your statements. It’s FINRA Rule 3210.' },
  insider: { title: 'Why we ask', body: 'Company insiders face special rules about when they can sell their company’s stock (SEC Rule 144). Knowing this helps us plan around trading windows.' },
  pep: { title: 'Politically exposed person', body: 'A senior official in a foreign government, military, judiciary or state-owned company — or their close family. Anti-money-laundering rules require extra checks. Almost everyone answers no.' },
  sourceOfFunds: { title: 'Source of funds', body: 'Anti-money-laundering rules ask where the money originally came from. Pick everything that applies.' },
  trustedContact: { title: 'Emergency contact', body: 'Someone we can reach if we can’t reach you, or if we’re worried about your wellbeing or possible fraud. They can’t see your accounts or make trades. You can skip this.' },
  w9: { title: 'Tax certification (W-9)', body: 'The IRS requires you to confirm your taxpayer ID is correct. It replaces filling in a separate W-9 form.' },
  backupWithholding: { title: 'Backup withholding', body: 'Rare. Only check this if the IRS sent you a letter saying they’ll withhold tax from your investment income.' },
  netWorth: { title: 'Net worth', body: 'Everything you own minus everything you owe. Regulators also look at it without your home, and at how much is liquid.' },
  rsu: { title: 'RSUs', body: 'Restricted stock units — shares your employer grants you that become yours on a schedule (vesting). They’re taxed as income when they vest.' },
  objective: { title: 'Investment objective', body: 'The overall aim for your money — from protecting it to growing it as much as possible. Your answers above suggest one; you can change it.' },
}

export async function explain(key: string) {
  await wait(450)
  return glossary[key] ?? { title: 'Explanation', body: 'Ask Emily — she’ll explain it in your meeting.' }
}

export function inviteDraft(clientFirst: string, advisorFirst: string) {
  return {
    rough: `hey ${clientFirst.toLowerCase()} pls fill this before our mtg, takes 15 min. lmk if q's`,
    polished: `Hi ${clientFirst},\n\nIt was great meeting you. Before we sit down to talk about your plan, I’d love to learn a bit more about you and your finances.\n\nThis link takes about 15–20 minutes, saves as you go, and you can come back anytime. If anything is unclear, leave me a comment right in the form and I’ll get back to you.\n\nLooking forward to it,\n${advisorFirst}`,
  }
}

export async function polishReply(text: string) {
  await wait(700)
  const t = text.trim()
  if (!t) return t
  const capital = t.charAt(0).toUpperCase() + t.slice(1)
  return capital
    .replace(/\bpls\b/gi, 'please')
    .replace(/\bthx\b/gi, 'thank you')
    .replace(/\blmk\b/gi, 'let me know')
    .replace(/\bq's\b/gi, 'questions')
    .replace(/\bmtg\b/gi, 'meeting')
    .replace(/\beow\b/gi, 'the end of the week')
    .replace(/([^.!?])$/, '$1.')
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export type Brief = { headline: string; known: string[]; missing: string[]; discuss: string[]; suggestedAgenda: string[] }

export function meetingBrief(c: ClientCase, netWorth: { total: number; liquid: number; exHome: number }, openThreads: number, deferred: string[], lowConfidence: string[]): Brief {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n)
  const equity = c.items.find((i) => i.category === 'equityComp')?.value ?? 0
  const assets = c.items.filter((i) => i.side === 'asset').reduce((a, i) => a + (i.value ?? 0), 0)
  const conc = assets ? Math.round((equity / assets) * 100) : 0
  return {
    headline: `${c.firstName} has a net worth of about ${fmt(netWorth.total)}, ${fmt(netWorth.liquid)} of it liquid. ${conc >= 15 ? `Employer stock is ${conc}% of assets — the biggest planning lever.` : ''}`,
    known: [
      `${c.goals.length} goals, the nearest in ${Math.min(...c.goals.map((g) => g.targetYear ?? 9999))}`,
      `${plural(c.items.filter((i) => i.side === 'asset').length, 'asset')} and ${plural(c.items.filter((i) => i.side === 'liability').length, 'debt')} listed`,
      `${plural(c.documents.length, 'document')} uploaded`,
    ],
    missing: [...deferred.map((d) => `${d} — deferred to the meeting`), ...lowConfidence],
    discuss: [
      ...(conc >= 15 ? ['Diversifying the RSU position ahead of the February vest'] : []),
      'Rolling the old 401(k) into the new Rollover IRA',
      ...(openThreads ? [`${openThreads} open question${openThreads > 1 ? 's' : ''} from the form`] : []),
    ],
    suggestedAgenda: ['Confirm goals and priorities (10 min)', 'Risk profile and investment objective (10 min)', 'Equity compensation and concentration (15 min)', 'Account opening and transfers (10 min)'],
  }
}
