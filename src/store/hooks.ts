import { useEffect, useState } from 'react'
import type { SectionId } from '../schema/onboarding'
import { useStore } from './caseStore'
import type { Presence } from './types'

export const ONLINE_WINDOW = 12_000
const HEARTBEAT = 4_000

export const useCase = (caseId?: string) => useStore((s) => (caseId ? s.cases[caseId] : undefined))

export const useCaseByToken = (token?: string) => useStore((s) => Object.values(s.cases).find((c) => c.token === token))

export const usePerson = (id?: string) => useStore((s) => (id ? s.people[id] : undefined))

/** Re-renders on an interval, for relative times and presence expiry. */
export function useNow(every = HEARTBEAT) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), every)
    return () => clearInterval(t)
  }, [every])
  return now
}

/** Publishes where this tab's person is looking, refreshed on a heartbeat while visible. */
export function usePublishPresence(p: Omit<Presence, 'ts'> | undefined) {
  const setPresence = useStore((s) => s.setPresence)
  const key = p ? `${p.personId}|${p.caseId}|${p.view}|${p.sectionId}|${p.fieldId}` : ''
  useEffect(() => {
    if (!p) return
    const beat = () => {
      if (document.visibilityState === 'visible') setPresence({ ...p, ts: Date.now() })
    }
    beat()
    const t = setInterval(beat, HEARTBEAT)
    document.addEventListener('visibilitychange', beat)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', beat)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setPresence])
}

/** Presence of someone else, or undefined when they haven't been seen recently. */
export function usePresenceOf(personId?: string, caseId?: string) {
  const now = useNow()
  const p = useStore((s) => (personId ? s.presence[personId] : undefined))
  if (!p || now - p.ts > ONLINE_WINDOW) return undefined
  if (caseId && p.caseId !== caseId) return undefined
  return p
}

export type FocusTarget = { sectionId?: SectionId; fieldId?: string }
