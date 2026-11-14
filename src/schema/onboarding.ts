import type { Option } from '../components/primitives'

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'select'
  | 'segmented'
  | 'yesno'
  | 'chips'
  | 'checkbox'
  | 'money'
  | 'sensitive'
  | 'textarea'

export type Tier = 1 | 2 | 3
export type RequiredBy = 'custodian' | 'ria' | 'advisor'
export type Values = Record<string, unknown>

export type FieldDef = {
  id: string
  sectionId: SectionId
  group: string
  label: string
  type: FieldType
  tier: Tier
  requiredBy: RequiredBy[]
  required?: boolean
  options?: Option[]
  placeholder?: string
  /** Glossary key for the Explain popover. */
  explain?: string
  /** Plain-language reason shown under the field. */
  why?: string
  width?: 'full' | 'half' | 'third'
  showWhen?: (v: Values) => boolean
  /** Client may hand this field to the advisor or the meeting. */
  canDefer?: boolean
  /** Only answerable once this other field has a valid value; moves to the meeting with it. */
  needs?: string
}

export type SectionId = 'about' | 'work' | 'goals' | 'networth' | 'risk' | 'estate' | 'required' | 'review'

export type SectionDef = {
  id: SectionId
  title: string
  short: string
  /** Titles on the Wealth Manager side, where the subject is the client, not the reader. */
  wmTitle: string
  wmShort: string
  description: string
  minutes: number
  kind: 'form' | 'goals' | 'networth' | 'risk' | 'review'
  optional?: boolean
}

export const sections: SectionDef[] = [
  { id: 'about', title: 'About you', short: 'About you', wmTitle: 'About', wmShort: 'About', description: 'The basics we need to open your accounts.', minutes: 3, kind: 'form' },
  { id: 'work', title: 'Work & income', short: 'Work & income', wmTitle: 'Work & income', wmShort: 'Work & income', description: 'What you do and roughly what comes in.', minutes: 2, kind: 'form' },
  { id: 'goals', title: 'Your goals', short: 'Goals', wmTitle: 'Goals', wmShort: 'Goals', description: 'What you want, by when, and roughly what it costs.', minutes: 3, kind: 'goals' },
  { id: 'networth', title: 'What you own and owe', short: 'Net worth', wmTitle: 'Net worth', wmShort: 'Net worth', description: 'Add your accounts, property and debts. We do the math.', minutes: 6, kind: 'networth' },
  { id: 'risk', title: 'How you feel about risk', short: 'Risk', wmTitle: 'Risk profile', wmShort: 'Risk', description: 'A few scenarios. There are no wrong answers.', minutes: 2, kind: 'risk' },
  { id: 'estate', title: 'Family & protection', short: 'Estate', wmTitle: 'Family & protection', wmShort: 'Estate', description: 'Wills, insurance and the people who help you.', minutes: 2, kind: 'form', optional: true },
  { id: 'required', title: 'A few required questions', short: 'Required', wmTitle: 'Regulatory questions', wmShort: 'Required', description: 'Every U.S. investment firm asks these. Most people answer “no.”', minutes: 2, kind: 'form' },
  { id: 'review', title: 'Check and send', short: 'Send', wmTitle: 'Client confirmation', wmShort: 'Confirmation', description: 'One last look, then send it to your Wealth Manager.', minutes: 2, kind: 'review' },
]

export const sectionById = Object.fromEntries(sections.map((s) => [s.id, s])) as Record<SectionId, SectionDef>

export const optionalSections = sections.filter((s) => s.optional)

const yes = (id: string) => (v: Values) => v[id] === 'yes'
const not = (id: string, value: string) => (v: Values) => !!v[id] && v[id] !== value
const oneOf = (id: string, values: string[]) => (v: Values) => values.includes(String(v[id] ?? ''))
const accounts = (v: Values) => (v.__accounts as string[] | undefined) ?? []
const isJoint = (v: Values) => v.__household === 'joint' || accounts(v).includes('joint')
const hasIra = (v: Values) => accounts(v).some((a) => a.endsWith('_ira'))

/** What each account choice adds to the client's form, for Emily's preview. */
export const accountEffects = (accountTypes: string[], household: 'individual' | 'joint') => {
  const v: Values = { __accounts: accountTypes, __household: household }
  return [isJoint(v) && 'Co-owner details', hasIra(v) && 'IRA beneficiaries', accountTypes.includes('rollover_ira') && 'Old 401(k) to roll over'].filter(Boolean) as string[]
}

const states: Option[] = ['Texas', 'California', 'New York', 'Florida', 'Illinois', 'Washington', 'Massachusetts', 'Colorado', 'Other'].map((s) => ({ value: s, label: s }))

export const fields: FieldDef[] = [
  // About you
  { id: 'firstName', sectionId: 'about', group: 'Your legal name', label: 'First name', type: 'text', tier: 1, requiredBy: ['custodian'], required: true, width: 'third' },
  { id: 'middleName', sectionId: 'about', group: 'Your legal name', label: 'Middle name', type: 'text', tier: 1, requiredBy: ['custodian'], width: 'third' },
  { id: 'lastName', sectionId: 'about', group: 'Your legal name', label: 'Last name', type: 'text', tier: 1, requiredBy: ['custodian'], required: true, width: 'third' },
  { id: 'preferredName', sectionId: 'about', group: 'Your legal name', label: 'What should we call you?', type: 'text', tier: 3, requiredBy: ['advisor'], width: 'half' },
  { id: 'dob', sectionId: 'about', group: 'Birth & citizenship', label: 'Date of birth', type: 'date', tier: 1, requiredBy: ['custodian'], required: true, width: 'half', why: 'Used to verify your identity.' },
  {
    id: 'citizenship', sectionId: 'about', group: 'Birth & citizenship', label: 'Citizenship', type: 'select', tier: 1, requiredBy: ['custodian'], required: true, width: 'half', explain: 'residency',
    options: [
      { value: 'us', label: 'U.S. citizen' },
      { value: 'pr', label: 'U.S. permanent resident' },
      { value: 'npr', label: 'Living in the U.S. on a visa' },
      { value: 'nr', label: 'Living outside the U.S.' },
    ],
  },
  { id: 'citizenshipCountry', sectionId: 'about', group: 'Birth & citizenship', label: 'Country of citizenship', type: 'text', tier: 1, requiredBy: ['custodian'], required: true, width: 'half', showWhen: not('citizenship', 'us') },
  { id: 'street', sectionId: 'about', group: 'Where you live', label: 'Street address', type: 'text', tier: 1, requiredBy: ['custodian'], required: true, why: 'Where you live. No P.O. boxes.' },
  { id: 'city', sectionId: 'about', group: 'Where you live', label: 'City', type: 'text', tier: 1, requiredBy: ['custodian'], required: true, width: 'third' },
  { id: 'state', sectionId: 'about', group: 'Where you live', label: 'State', type: 'select', tier: 1, requiredBy: ['custodian'], required: true, width: 'third', options: states },
  { id: 'zip', sectionId: 'about', group: 'Where you live', label: 'ZIP', type: 'text', tier: 1, requiredBy: ['custodian'], required: true, width: 'third' },
  { id: 'mailingDifferent', sectionId: 'about', group: 'Where you live', label: 'My mailing address is different', type: 'checkbox', tier: 1, requiredBy: ['custodian'] },
  { id: 'mailingAddress', sectionId: 'about', group: 'Where you live', label: 'Mailing address', type: 'text', tier: 1, requiredBy: ['custodian'], showWhen: (v) => v.mailingDifferent === true },
  { id: 'email', sectionId: 'about', group: 'How to reach you', label: 'Email', type: 'email', tier: 1, requiredBy: ['custodian', 'ria'], required: true, width: 'half' },
  { id: 'phone', sectionId: 'about', group: 'How to reach you', label: 'Mobile phone', type: 'tel', tier: 1, requiredBy: ['custodian'], required: true, width: 'half' },
  {
    id: 'maritalStatus', sectionId: 'about', group: 'Your household', label: 'Marital status', type: 'select', tier: 2, requiredBy: ['advisor'], width: 'half',
    options: [
      { value: 'single', label: 'Single' },
      { value: 'married', label: 'Married' },
      { value: 'partner', label: 'Domestic partnership' },
      { value: 'divorced', label: 'Divorced' },
      { value: 'widowed', label: 'Widowed' },
    ],
  },
  { id: 'spouseName', sectionId: 'about', group: 'Your household', label: 'Spouse or partner’s name', type: 'text', tier: 2, requiredBy: ['advisor'], width: 'half', showWhen: oneOf('maritalStatus', ['married', 'partner']) },
  {
    id: 'dependents', sectionId: 'about', group: 'Your household', label: 'Children or other dependents', type: 'segmented', tier: 2, requiredBy: ['advisor'],
    options: ['0', '1', '2', '3', '4+'].map((n) => ({ value: n, label: n })),
  },
  { id: 'jointName', sectionId: 'about', group: 'Joint account co-owner', label: 'Full legal name', type: 'text', tier: 1, requiredBy: ['custodian'], required: true, width: 'half', showWhen: isJoint, why: 'Both owners sign for a joint account.' },
  { id: 'jointDob', sectionId: 'about', group: 'Joint account co-owner', label: 'Date of birth', type: 'date', tier: 1, requiredBy: ['custodian'], required: true, width: 'half', showWhen: isJoint },
  { id: 'jointEmail', sectionId: 'about', group: 'Joint account co-owner', label: 'Their email', type: 'email', tier: 1, requiredBy: ['custodian'], required: true, showWhen: isJoint, why: 'We send them a link to add their own ID and SSN.' },
  { id: 'ssn', sectionId: 'about', group: 'Taxpayer ID', label: 'Social Security number', type: 'sensitive', tier: 1, requiredBy: ['custodian'], required: true, explain: 'ssn', canDefer: true, why: 'Needed for tax reporting and to verify your identity. Encrypted, never shown in full.' },
  { id: 'w9Certify', sectionId: 'about', group: 'Taxpayer ID', label: 'Under penalties of perjury, I certify that my Social Security number is correct and that I’m a U.S. citizen or other U.S. person', type: 'checkbox', tier: 1, requiredBy: ['custodian'], required: true, explain: 'w9', needs: 'ssn', showWhen: (v) => !v.citizenship || oneOf('citizenship', ['us', 'pr'])(v) },
  { id: 'backupWithholding', sectionId: 'about', group: 'Taxpayer ID', label: 'The IRS has notified me that I’m subject to backup withholding', type: 'checkbox', tier: 1, requiredBy: ['custodian'], explain: 'backupWithholding', showWhen: (v) => !v.citizenship || oneOf('citizenship', ['us', 'pr'])(v) },

  // Work & income
  {
    id: 'employmentStatus', sectionId: 'work', group: 'Your work', label: 'Employment status', type: 'select', tier: 1, requiredBy: ['custodian'], required: true, width: 'half',
    options: [
      { value: 'employed', label: 'Employed' },
      { value: 'self', label: 'Self-employed' },
      { value: 'retired', label: 'Retired' },
      { value: 'homemaker', label: 'Homemaker' },
      { value: 'student', label: 'Student' },
      { value: 'none', label: 'Not employed' },
    ],
  },
  {
    id: 'occupation', sectionId: 'work', group: 'Your work', label: 'Occupation', type: 'select', tier: 1, requiredBy: ['custodian'], required: true, width: 'half', showWhen: oneOf('employmentStatus', ['employed', 'self']),
    options: ['Executive / senior management', 'Information technology', 'Medical professional', 'Legal professional', 'Financial services', 'Business owner', 'Educator', 'Consultant', 'Other professional'].map((o) => ({ value: o, label: o })),
  },
  { id: 'jobTitle', sectionId: 'work', group: 'Your work', label: 'Job title', type: 'text', tier: 2, requiredBy: ['advisor'], width: 'half', showWhen: oneOf('employmentStatus', ['employed', 'self']) },
  { id: 'employer', sectionId: 'work', group: 'Your work', label: 'Employer', type: 'text', tier: 1, requiredBy: ['custodian'], required: true, width: 'half', showWhen: oneOf('employmentStatus', ['employed', 'self']) },
  { id: 'employerAddress', sectionId: 'work', group: 'Your work', label: 'Employer address', type: 'text', tier: 1, requiredBy: ['custodian'], required: true, showWhen: oneOf('employmentStatus', ['employed', 'self']) },
  {
    id: 'annualIncome', sectionId: 'work', group: 'Your income', label: 'Household income per year', type: 'select', tier: 1, requiredBy: ['ria'], required: true, width: 'half', explain: 'ranges', why: 'A range is fine. A tax return gives us the detail later.',
    options: [
      { value: '0-100', label: 'Under $100k' },
      { value: '100-200', label: '$100k – $200k' },
      { value: '200-300', label: '$200k – $300k' },
      { value: '300-500', label: '$300k – $500k' },
      { value: '500-1000', label: '$500k – $1M' },
      { value: '1000+', label: 'Over $1M' },
    ],
  },
  {
    id: 'incomeChange', sectionId: 'work', group: 'Your income', label: 'Next few years, you expect income to…', type: 'segmented', tier: 2, requiredBy: ['advisor'],
    options: [
      { value: 'up', label: 'Grow' },
      { value: 'stable', label: 'Stay similar' },
      { value: 'down', label: 'Drop' },
      { value: 'unsure', label: 'Not sure' },
    ],
  },
  {
    id: 'incomeSources', sectionId: 'work', group: 'Your income', label: 'Where it comes from', type: 'chips', tier: 2, requiredBy: ['advisor'],
    options: [
      { value: 'salary', label: 'Salary' },
      { value: 'bonus', label: 'Bonus' },
      { value: 'equity', label: 'Stock compensation' },
      { value: 'business', label: 'Business income' },
      { value: 'rental', label: 'Rental income' },
      { value: 'pension', label: 'Pension / Social Security' },
      { value: 'investments', label: 'Investments' },
    ],
  },
  {
    id: 'annualSpending', sectionId: 'work', group: 'Your income', label: 'Roughly what you spend per year', type: 'select', tier: 2, requiredBy: ['advisor'], width: 'half', canDefer: true,
    options: [
      { value: '0-75', label: 'Under $75k' },
      { value: '75-150', label: '$75k – $150k' },
      { value: '150-250', label: '$150k – $250k' },
      { value: '250+', label: 'Over $250k' },
    ],
  },

  // Risk (questionnaire answers live in case.risk; these are the profile fields)
  {
    id: 'experience', sectionId: 'risk', group: 'Your experience', label: 'How much investing experience do you have?', type: 'select', tier: 1, requiredBy: ['ria'], required: true, width: 'half',
    options: [
      { value: 'none', label: 'None yet' },
      { value: 'limited', label: 'Limited — a 401(k) or a few funds' },
      { value: 'good', label: 'Good — I pick investments myself' },
      { value: 'extensive', label: 'Extensive — options, alternatives' },
    ],
  },
  {
    id: 'liquidityNeeds', sectionId: 'risk', group: 'Your experience', label: 'How much might you need to withdraw in the next 2 years?', type: 'select', tier: 1, requiredBy: ['ria'], required: true, width: 'half', explain: 'liquidity',
    options: [
      { value: 'none', label: 'Nothing planned' },
      { value: 'some', label: 'Some — under 10%' },
      { value: 'significant', label: 'A significant amount' },
    ],
  },

  // Estate (optional)
  { id: 'hasWill', sectionId: 'estate', group: 'Your documents', label: 'Do you have a will?', type: 'yesno', tier: 2, requiredBy: ['advisor'] },
  { id: 'hasTrust', sectionId: 'estate', group: 'Your documents', label: 'Do you have a living trust?', type: 'yesno', tier: 2, requiredBy: ['advisor'], explain: 'trust' },
  { id: 'hasPoa', sectionId: 'estate', group: 'Your documents', label: 'Do you have a power of attorney and a healthcare directive?', type: 'yesno', tier: 2, requiredBy: ['advisor'], explain: 'poa' },
  { id: 'hasLifeInsurance', sectionId: 'estate', group: 'Protection', label: 'Do you have life insurance?', type: 'yesno', tier: 2, requiredBy: ['advisor'] },
  { id: 'lifeCoverage', sectionId: 'estate', group: 'Protection', label: 'Total coverage', type: 'money', tier: 2, requiredBy: ['advisor'], width: 'half', showWhen: yes('hasLifeInsurance'), canDefer: true },
  { id: 'professionals', sectionId: 'estate', group: 'Your team', label: 'Anyone we should coordinate with? (CPA, attorney)', type: 'textarea', tier: 3, requiredBy: ['advisor'], placeholder: 'e.g. Our CPA is Ana Ruiz at Ruiz & Co.' },

  // Required
  { id: 'finraAffiliated', sectionId: 'required', group: 'Your connections', label: 'Do you or anyone in your household work for a brokerage firm, a stock exchange or FINRA?', type: 'yesno', tier: 1, requiredBy: ['custodian'], required: true, explain: 'finra' },
  { id: 'finraFirm', sectionId: 'required', group: 'Your connections', label: 'Which firm?', type: 'text', tier: 1, requiredBy: ['custodian'], required: true, showWhen: yes('finraAffiliated'), why: 'Your employer must approve the account in writing. We’ll ask their compliance team.' },
  { id: 'insider', sectionId: 'required', group: 'Your connections', label: 'Are you a director, senior officer or 10% shareholder of a publicly traded company?', type: 'yesno', tier: 1, requiredBy: ['custodian'], required: true, explain: 'insider' },
  { id: 'insiderCompany', sectionId: 'required', group: 'Your connections', label: 'Company and ticker', type: 'text', tier: 1, requiredBy: ['custodian'], required: true, showWhen: yes('insider') },
  { id: 'pep', sectionId: 'required', group: 'Your connections', label: 'Are you, or a close family member or associate, a senior political figure outside the U.S.?', type: 'yesno', tier: 1, requiredBy: ['custodian', 'ria'], required: true, explain: 'pep' },
  { id: 'pepDetails', sectionId: 'required', group: 'Your connections', label: 'Role and country', type: 'text', tier: 1, requiredBy: ['ria'], required: true, showWhen: yes('pep') },
  {
    id: 'sourceOfFunds', sectionId: 'required', group: 'About the money', label: 'Where does the money you’re investing come from?', type: 'chips', tier: 1, requiredBy: ['custodian'], required: true, explain: 'sourceOfFunds',
    options: [
      { value: 'salary', label: 'Salary & savings' },
      { value: 'gains', label: 'Investment gains' },
      { value: 'inheritance', label: 'Inheritance or gift' },
      { value: 'business', label: 'Sale of a business' },
      { value: 'property', label: 'Sale of property' },
      { value: 'other', label: 'Other' },
    ],
  },
  { id: 'trustedName', sectionId: 'required', group: 'Trusted contact', label: 'Full name', type: 'text', tier: 1, requiredBy: ['custodian'], width: 'half', explain: 'trustedContact', showWhen: (v) => v.trustedDecline !== true },
  { id: 'trustedRelationship', sectionId: 'required', group: 'Trusted contact', label: 'Relationship', type: 'text', tier: 1, requiredBy: ['custodian'], width: 'half', showWhen: (v) => v.trustedDecline !== true },
  { id: 'trustedPhone', sectionId: 'required', group: 'Trusted contact', label: 'Phone or email', type: 'text', tier: 1, requiredBy: ['custodian'], showWhen: (v) => v.trustedDecline !== true },
  { id: 'trustedDecline', sectionId: 'required', group: 'Trusted contact', label: 'I’d rather not name anyone right now', type: 'checkbox', tier: 1, requiredBy: ['custodian'] },
  { id: 'beneficiaryName', sectionId: 'required', group: 'Beneficiaries', label: 'Primary beneficiary', type: 'text', tier: 1, requiredBy: ['custodian'], required: true, width: 'half', showWhen: hasIra, why: 'An IRA passes straight to the people named here, outside your will.' },
  { id: 'beneficiaryRelationship', sectionId: 'required', group: 'Beneficiaries', label: 'Relationship', type: 'text', tier: 1, requiredBy: ['custodian'], required: true, width: 'half', showWhen: hasIra },
  { id: 'contingentBeneficiary', sectionId: 'required', group: 'Beneficiaries', label: 'Contingent beneficiary', type: 'text', tier: 2, requiredBy: ['advisor'], showWhen: hasIra, canDefer: true, why: 'Receives the IRA if your primary beneficiary can’t.' },
]

const summaryLabels: Record<string, string> = {
  preferredName: 'Goes by',
  mailingDifferent: 'Separate mailing address',
  dependents: 'Dependents',
  incomeChange: 'Income outlook',
  annualSpending: 'Yearly spending',
  incomeSources: 'Income from',
  experience: 'Experience',
  liquidityNeeds: 'Cash needs, 2 years',
  hasTrust: 'Living trust',
  hasPoa: 'Power of attorney',
  hasLifeInsurance: 'Life insurance',
  professionals: 'Other professionals',
  finraAffiliated: 'Works in finance',
  insider: 'Public company insider',
  pep: 'Political role abroad',
  sourceOfFunds: 'Source of funds',
  trustedName: 'Trusted contact',
}

/** Short label for summaries, where the full question would be too long. */
export const summaryLabel = (f: FieldDef) => summaryLabels[f.id] ?? f.label

export const fieldById = Object.fromEntries(fields.map((f) => [f.id, f])) as Record<string, FieldDef>

export const fieldsFor = (sectionId: SectionId) => fields.filter((f) => f.sectionId === sectionId)

export const groupsFor = (sectionId: SectionId) => {
  const out: { group: string; fields: FieldDef[] }[] = []
  for (const f of fieldsFor(sectionId)) {
    const g = out.find((x) => x.group === f.group)
    if (g) g.fields.push(f)
    else out.push({ group: f.group, fields: [f] })
  }
  return out
}

export const isVisible = (f: FieldDef, values: Values) => (f.showWhen ? f.showWhen(values) : true)

export const isFilled = (v: unknown) => {
  if (v === undefined || v === null || v === '') return false
  if (Array.isArray(v)) return v.length > 0
  return true
}

/** Display a stored value as text, for review screens and the advisor view. */
export const displayValue = (f: FieldDef, v: unknown): string => {
  if (!isFilled(v)) return '—'
  if (f.type === 'sensitive') return `•••-••-${String(v).slice(-4)}`
  if (f.type === 'checkbox') return v ? 'Yes' : 'No'
  if (f.type === 'yesno') return v === 'yes' ? 'Yes' : 'No'
  if (f.type === 'money') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(v))
  if (f.type === 'date') {
    const [y, m, d] = String(v).split('-')
    return `${m}/${d}/${y}`
  }
  if (f.type === 'chips' && Array.isArray(v)) return v.map((x) => f.options?.find((o) => o.value === x)?.label ?? x).join(', ')
  if (f.options) return f.options.find((o) => o.value === v)?.label ?? String(v)
  return String(v)
}

// Net worth categories ------------------------------------------------------

export type NWCategory =
  | 'investment'
  | 'retirement'
  | 'cash'
  | 'realEstate'
  | 'equityComp'
  | 'business'
  | 'collectible'
  | 'crypto'
  | 'otherAsset'
  | 'mortgage'
  | 'loan'
  | 'creditCard'
  | 'otherDebt'

export const assetCategories: { id: NWCategory; label: string; liquid: boolean; hint: string }[] = [
  { id: 'investment', label: 'Investment accounts', liquid: true, hint: 'Brokerage, stocks, bonds, funds' },
  { id: 'retirement', label: 'Retirement accounts', liquid: false, hint: '401(k), IRA, pension' },
  { id: 'cash', label: 'Cash', liquid: true, hint: 'Checking, savings, CDs' },
  { id: 'realEstate', label: 'Real estate', liquid: false, hint: 'Home, second home, rentals' },
  { id: 'equityComp', label: 'Stock compensation', liquid: false, hint: 'RSUs, options, ESPP' },
  { id: 'business', label: 'Business interests', liquid: false, hint: 'Ownership in a private company' },
  { id: 'collectible', label: 'Collectibles', liquid: false, hint: 'Art, watches, wine, cars' },
  { id: 'crypto', label: 'Crypto', liquid: true, hint: 'Bitcoin, Ethereum, others' },
  { id: 'otherAsset', label: 'Other assets', liquid: false, hint: 'Anything else of value' },
]

export const liabilityCategories: { id: NWCategory; label: string; hint: string }[] = [
  { id: 'mortgage', label: 'Mortgage', hint: 'Home loans, HELOC' },
  { id: 'loan', label: 'Loans', hint: 'Student, auto, personal' },
  { id: 'creditCard', label: 'Credit cards', hint: 'Balances you carry' },
  { id: 'otherDebt', label: 'Other debt', hint: 'Margin, family loans' },
]

export const categoryLabel = (id: NWCategory) => [...assetCategories, ...liabilityCategories].find((c) => c.id === id)?.label ?? id

export const accountTypeOptions: Option[] = [
  { value: 'individual', label: 'Individual brokerage' },
  { value: 'joint', label: 'Joint brokerage' },
  { value: 'traditional_ira', label: 'Traditional IRA' },
  { value: 'roth_ira', label: 'Roth IRA' },
  { value: 'rollover_ira', label: 'Rollover IRA' },
]
