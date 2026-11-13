import { createContext, useContext, type ReactNode } from 'react'
import type { SectionId } from '../../schema/onboarding'
import { useCase } from '../../store/hooks'

export type ViewerMode = 'client' | 'advisor'

type Ctx = {
  caseId: string
  viewerId: string
  mode: ViewerMode
  /** Reports where the viewer is focused, for presence. */
  onFocus?: (target: { sectionId?: SectionId; fieldId?: string }) => void
}

const CaseCtx = createContext<Ctx | null>(null)

export function CaseProvider({ children, ...value }: Ctx & { children: ReactNode }) {
  return <CaseCtx.Provider value={value}>{children}</CaseCtx.Provider>
}

export function useCaseCtx() {
  const ctx = useContext(CaseCtx)
  if (!ctx) throw new Error('useCaseCtx must be used inside <CaseProvider>')
  return ctx
}

/** The current case plus viewer info. Patterns use this instead of prop-drilling the case. */
export function useCurrentCase() {
  const ctx = useCaseCtx()
  const c = useCase(ctx.caseId)
  return { ...ctx, c }
}
