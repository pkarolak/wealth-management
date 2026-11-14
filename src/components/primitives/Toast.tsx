import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Info, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { create } from 'zustand'
import { uid } from '../../lib/format'

type ToastTone = 'default' | 'success' | 'ai'
type ToastItem = { id: string; title: ReactNode; description?: ReactNode; tone: ToastTone }

type ToastStore = {
  items: ToastItem[]
  push: (t: Omit<ToastItem, 'id' | 'tone'> & { tone?: ToastTone }) => void
  dismiss: (id: string) => void
}

export const useToasts = create<ToastStore>((set, get) => ({
  items: [],
  push: (t) => {
    const id = uid('toast')
    set({ items: [...get().items, { tone: 'default', ...t, id }] })
    setTimeout(() => get().dismiss(id), 3800)
  },
  dismiss: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
}))

export const toast = (title: ReactNode, opts: { description?: ReactNode; tone?: ToastTone } = {}) =>
  useToasts.getState().push({ title, ...opts })

const icons = {
  default: <Info className="size-4 text-ink-3" />,
  success: <CheckCircle2 className="size-4 text-success" />,
  ai: <Sparkles className="size-4 text-ai" />,
}

const iconTiles = { default: 'bg-muted', success: 'bg-success-soft', ai: 'bg-ai-soft' }

export function Toaster() {
  const items = useToasts((s) => s.items)
  return (
    <div className="pointer-events-none fixed bottom-28 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:right-5 sm:bottom-5 sm:left-auto sm:translate-x-0 sm:px-0">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6 }}
            className="pointer-events-auto flex items-stretch gap-3 rounded-[20px] bg-surface p-2.5 pr-5 shadow-float"
          >
            {/* Tile stretches to the text height (min 40px) so the 10px padding is equal on all sides. */}
            <span className={`flex aspect-square min-h-10 shrink-0 items-center justify-center self-stretch rounded-control ${iconTiles[t.tone]}`}>{icons[t.tone]}</span>
            <div className="flex flex-col justify-center">
              <span className="text-[14px] leading-5 font-medium text-ink">{t.title}</span>
              {t.description && <span className="text-[13px] leading-5 text-ink-3">{t.description}</span>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
