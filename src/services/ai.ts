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
        extracted: ['Balance $286,900', 'Likely rollover eligible'],
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
  { id: 'fidelity', name: 'Fidelity', kind: '401(k) & brokerage', color: '#368727', logo: '/logos/fidelity.png' },
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
  ssn: { title: 'Why we need your SSN', body: 'Federal law requires every financial firm to verify who you are, and the IRS needs it for your tax forms. It’s encrypted and only the last four digits are ever shown. If you’d rather, Emily can collect it on a call.' },
  residency: { title: 'Citizenship', body: 'This decides which tax form applies to you — a W-9 for U.S. persons, a W-8BEN for everyone else.' },
  ranges: { title: 'Why a range is fine', body: 'We need a sense of your income to make sure our advice fits your situation, and a range is enough for that. If you upload a tax return, we’ll use the exact numbers for planning.' },
  liquidity: { title: 'What counts as liquid', body: 'Money you could get to within a few days without a big penalty: cash, brokerage accounts, most crypto. Retirement accounts, property and private companies usually aren’t.' },
  trust: { title: 'Living trust', body: 'A legal document that holds your assets and passes them on without going through probate court. Not everyone needs one.' },
  poa: { title: 'Power of attorney', body: 'Names someone who can make financial (or medical) decisions for you if you can’t.' },
  finra: { title: 'Why we ask', body: 'If you work in the securities industry, your employer has to approve this account in writing and may ask for copies of your statements (FINRA Rule 3210).' },
  insider: { title: 'Why we ask', body: 'Company insiders face extra SEC rules on selling their company’s stock (Rule 144) and can usually trade only in open windows. Knowing this helps us plan sales around them.' },
  pep: { title: 'Senior foreign political figure', body: 'A senior official in a foreign government, military, political party or state-owned company — or their close family and associates. Anti-money-laundering rules require extra checks. Almost everyone answers no.' },
  sourceOfFunds: { title: 'Source of funds', body: 'Anti-money-laundering rules ask where the money originally came from. Pick everything that applies.' },
  trustedContact: { title: 'Trusted contact', body: 'Someone 18 or older we may call if we can’t reach you, or if we’re worried about your health or possible financial exploitation. They can’t see your accounts or make decisions for you. It’s optional, but we recommend it.' },
  w9: { title: 'Tax certification (W-9)', body: 'The IRS requires you to confirm your taxpayer ID and U.S. status. Checking this replaces filling in a separate Form W-9.' },
  backupWithholding: { title: 'Backup withholding', body: 'Rare. Only check this if the IRS sent you a letter saying they’ll withhold tax from your investment income.' },
  netWorth: { title: 'Net worth', body: 'Everything you own minus everything you owe. Some rules, like accredited-investor status, count it without your primary home.' },
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
    polished: `Hi ${clientFirst},\n\nIt was great meeting you. Before we sit down to talk about your plan, I’d love to learn a bit more about you and your finances.\n\nThis link takes about 20 minutes, saves as you go, and you can come back anytime. If anything is unclear, leave me a comment right in the form and I’ll get back to you.\n\nI’ve also included our Form CRS, Form ADV Part 2 and privacy notice. They explain our services, fees and how we protect your information — we share them with everyone before we start working together.\n\nLooking forward to it,\n${advisorFirst}`,
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

export type TopicTag = 'Planning' | 'Open question' | 'To collect' | 'To verify'

/** A conversation worth having: what we noticed, why it matters, and how to open it. */
export type Topic = { id: string; tag: TopicTag; priority: 'high' | 'medium'; title: string; why: string; ask: string; minutes: number }

export type Brief = { headline: string; topics: Topic[]; suggestedAgenda: { title: string; minutes: number; topicId?: string }[] }

export function meetingBrief(
  c: ClientCase,
  netWorth: { total: number; liquid: number; exHome: number },
  deferred: string[],
  lowConfidence: string[],
  risk?: { label: string },
): Brief {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n)
  const equityItem = c.items.find((i) => i.category === 'equityComp' && i.value)
  const equity = equityItem?.value ?? 0
  const assets = c.items.filter((i) => i.side === 'asset').reduce((a, i) => a + (i.value ?? 0), 0)
  const conc = assets ? Math.round((equity / assets) * 100) : 0
  const oldPlan = c.items.find((i) => i.category === 'retirement' && /previous|old/i.test(i.name))
  const year = new Date().getFullYear()
  const nearGoal = [...c.goals].filter((g) => g.targetYear).sort((a, b) => (a.targetYear ?? 0) - (b.targetYear ?? 0))[0]
  const topics: Topic[] = []

  if (conc >= 15)
    topics.push({
      id: 'concentration',
      tag: 'Planning',
      priority: 'high',
      title: 'Concentration in employer stock',
      why: `${equityItem?.name ?? 'Employer stock'} is ${conc}% of assets (${fmt(equity)}).${equityItem?.detail ? ` ${equityItem.detail}.` : ''}`,
      ask: 'How do you feel about holding this much in one company? Any plans for the next vest?',
      minutes: 15,
    })
  if (oldPlan)
    topics.push({
      id: 'rollover',
      tag: 'Planning',
      priority: 'high',
      title: 'Roll over the old 401(k)',
      why: oldPlan.value ? `${fmt(oldPlan.value)}${oldPlan.institution ? ` at ${oldPlan.institution}` : ''}, still with a previous employer.` : 'Still with a previous employer. Balance not known yet.',
      ask: 'What do you like about the plan today? Compare fees, investment options and services before recommending a rollover, and document why.',
      minutes: 10,
    })
  if (nearGoal && nearGoal.targetYear && nearGoal.targetYear - year <= 5 && nearGoal.amount)
    topics.push({
      id: 'near-goal',
      tag: 'Planning',
      priority: nearGoal.amount > netWorth.liquid * 0.5 ? 'high' : 'medium',
      title: `${nearGoal.title} in ${nearGoal.targetYear - year} years`,
      why: `Needs about ${fmt(nearGoal.amount)}; ${fmt(netWorth.liquid)} is liquid today.${risk ? ` Risk profile reads “${risk.label}”.` : ''}`,
      ask: 'Should money for this goal sit apart from long-term investments?',
      minutes: 10,
    })
  for (const t of c.threads.filter((x) => !x.resolved))
    topics.push({
      id: `thread-${t.id}`,
      tag: 'Open question',
      priority: 'medium',
      title: t.title,
      why: `“${t.messages[0]?.body ?? ''}”`,
      ask: 'Answer together and close the thread.',
      minutes: 5,
    })
  if (!risk)
    topics.push({
      id: 'risk',
      tag: 'To collect',
      priority: 'medium',
      title: 'Risk questionnaire not finished',
      why: `${c.firstName} hasn’t answered the risk scenarios yet. Needed before recommending a portfolio.`,
      ask: 'Walk through the scenarios together; it takes about five minutes.',
      minutes: 5,
    })
  if (deferred.length)
    topics.push({
      id: 'deferred',
      tag: 'To collect',
      priority: 'medium',
      title: `Collect ${deferred.length === 1 ? deferred[0] : `${deferred.length} answers`} in person`,
      why: `${c.firstName} chose to give ${deferred.length === 1 ? 'this' : 'these'} in the meeting: ${deferred.join(', ')}.`,
      ask: 'Have the secure form ready to fill in together.',
      minutes: 5,
    })
  if (lowConfidence.length)
    topics.push({
      id: 'rough',
      tag: 'To verify',
      priority: 'medium',
      title: `${plural(lowConfidence.length, 'balance')} still rough`,
      why: lowConfidence.map((l) => l.split(' — ')[0]).join(', '),
      ask: 'Ask for a statement or link the account during the meeting.',
      minutes: 5,
    })

  const planning = topics.filter((t) => t.tag === 'Planning')
  return {
    headline: `Household net worth is about ${fmt(netWorth.total)}, ${fmt(netWorth.liquid)} of it liquid.${planning[0] ? ` Biggest lever: ${planning[0].title.toLowerCase()}.` : ''}`,
    topics,
    suggestedAgenda: [
      { title: 'Goals and priorities', minutes: 10 },
      ...planning.slice(0, 2).map((t) => ({ title: t.title, minutes: t.minutes, topicId: t.id })),
      { title: 'Advisory agreement and account opening', minutes: 10 },
    ],
  }
}
