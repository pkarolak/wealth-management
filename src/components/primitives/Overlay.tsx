import * as RDialog from '@radix-ui/react-dialog'
import * as RPopover from '@radix-ui/react-popover'
import * as RTooltip from '@radix-ui/react-tooltip'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { concentric, radius } from '../../tokens/tokens'

export const TooltipProvider = RTooltip.Provider

/** Text-only, 8px padding, 8px radius. */
export function Tooltip({ content, children, side = 'top' }: { content: ReactNode; children: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <RTooltip.Root delayDuration={250}>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content side={side} sideOffset={6} className="z-50 max-w-64 rounded-tooltip bg-ink p-2 text-[12px] leading-snug text-white shadow-float">
          {content}
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  )
}

type PopoverProps = {
  trigger: ReactNode
  children: ReactNode
  open?: boolean
  onOpenChange?: (o: boolean) => void
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  className?: string
  /** Inner padding in px. */
  padding?: number
  /** Radius of the most-rounded child touching the edge (inputs = 10). */
  inner?: number
}

export function Popover({ trigger, children, open, onOpenChange, side = 'bottom', align = 'start', className, padding = 12, inner = radius.control }: PopoverProps) {
  return (
    <RPopover.Root open={open} onOpenChange={onOpenChange}>
      <RPopover.Trigger asChild>{trigger}</RPopover.Trigger>
      <RPopover.Portal>
        <RPopover.Content
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={16}
          style={{ padding, borderRadius: concentric(inner, padding) }}
          className={cn('z-50 w-80 border border-line bg-surface shadow-float outline-none', className)}
        >
          {children}
        </RPopover.Content>
      </RPopover.Portal>
    </RPopover.Root>
  )
}

type DialogProps = {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: 'sm' | 'md' | 'lg'
}

const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }
const DIALOG_PAD = 24

/** Content sits 24px from the edge; nested controls are 10px, so the dialog is 34px. */
export function Dialog({ open, onOpenChange, title, description, children, footer, width = 'md' }: DialogProps) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px]" />
        <RDialog.Content
          style={{ borderRadius: concentric(radius.control, DIALOG_PAD) }}
          className={cn(
            'fixed top-1/2 left-1/2 z-50 flex max-h-[88vh] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden bg-surface shadow-float outline-none',
            widths[width],
          )}
        >
          <div className="flex items-start justify-between gap-4 px-6 pt-6">
            <div>
              <RDialog.Title className="text-lg font-medium text-ink">{title}</RDialog.Title>
              {description && <RDialog.Description className="mt-1 text-[14px] text-ink-3">{description}</RDialog.Description>}
            </div>
            <RDialog.Close className="-mt-1 -mr-1 rounded-full p-2 text-ink-3 hover:bg-muted hover:text-ink" aria-label="Close">
              <X className="size-4" />
            </RDialog.Close>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  )
}
