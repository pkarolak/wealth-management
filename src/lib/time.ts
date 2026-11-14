/** The firm's office keeps Central Time; availability is defined in it. */
export const OFFICE_ZONE = 'America/Chicago'

export const usZones = [
  { value: 'America/New_York', label: 'Eastern' },
  { value: 'America/Chicago', label: 'Central' },
  { value: 'America/Denver', label: 'Mountain' },
  { value: 'America/Los_Angeles', label: 'Pacific' },
]

export const guessZone = () => {
  const z = Intl.DateTimeFormat().resolvedOptions().timeZone
  return usZones.some((x) => x.value === z) ? z : OFFICE_ZONE
}

export const zoneLabel = (zone: string) => usZones.find((z) => z.value === zone)?.label ?? zone

export const clock = (at: number, zone = OFFICE_ZONE, withZone = true) =>
  new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: zone, ...(withZone ? { timeZoneName: 'short' } : {}) })

const zoneOffset = (at: number, zone: string) => {
  const d = new Date(at)
  return new Date(d.toLocaleString('en-US', { timeZone: zone })).getTime() - new Date(d.toLocaleString('en-US', { timeZone: 'UTC' })).getTime()
}

/** Timestamp for a wall-clock time on a calendar date in a given zone. */
export const atInZone = (date: Date, h: number, m: number, zone: string) => {
  const guess = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), h, m)
  return guess - zoneOffset(guess, zone)
}
