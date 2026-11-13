import { isFilled, type FieldDef } from './onboarding'

const yearsSince = (iso: string) => {
  const d = new Date(iso)
  const now = new Date()
  return now.getFullYear() - d.getFullYear() - (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0)
}

/** Format checks for what the custodian will reject. Empty values are never errors here. */
export function fieldError(def: FieldDef, value: unknown): string | undefined {
  if (!isFilled(value) || typeof value !== 'string') return undefined
  const v = value.trim()
  const digits = v.replace(/\D/g, '')
  if (def.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Check the email address.'
  if (def.type === 'tel' && digits.length !== 10) return 'Enter a 10-digit U.S. phone number.'
  if (def.type === 'sensitive' && digits.length !== 9) return 'A Social Security number has 9 digits.'
  if (def.type === 'sensitive' && (/^(000|666|9)/.test(digits) || digits.slice(3, 5) === '00' || digits.slice(5) === '0000')) return 'This isn’t a valid Social Security number.'
  if (def.id === 'zip' && !/^\d{5}(-\d{4})?$/.test(v)) return 'Enter a 5-digit ZIP code.'
  if (def.id === 'street' && /\bp\.?\s?o\.?\s*box\b/i.test(v)) return 'Use where you live. P.O. boxes go in the mailing address.'
  if (def.type === 'date' && def.id.toLowerCase().includes('dob')) {
    const age = yearsSince(v)
    if (age < 0 || age > 110) return 'Check the year.'
    if (age < 18) return 'Account owners need to be 18 or older.'
  }
  return undefined
}

/** Keeps typing within the shape of the field, so most errors never happen. */
export const maskValue = (def: FieldDef, raw: string) => {
  if (def.id === 'zip') {
    const d = raw.replace(/\D/g, '').slice(0, 9)
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
  }
  return raw
}
