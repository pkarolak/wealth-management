import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'soft' | 'ai' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  leading?: ReactNode
  trailing?: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink-2 disabled:bg-ink-4',
  secondary: 'bg-surface text-ink border border-line hover:border-line-strong hover:bg-muted',
  ghost: 'text-ink-2 hover:bg-muted hover:text-ink',
  soft: 'bg-muted text-ink hover:bg-sunken',
  ai: 'bg-ai-soft text-ai hover:bg-[#d9e5f8]',
  danger: 'bg-danger-soft text-danger hover:bg-[#f4d6d3]',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-[14px] gap-2',
  lg: 'h-12 px-5 text-[16px] gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', leading, trailing, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-control font-medium whitespace-nowrap transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {leading}
      {children}
      {trailing}
    </button>
  )
})

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  variant?: 'ghost' | 'soft' | 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

const iconSizes = { sm: 'size-8', md: 'size-10', lg: 'size-12' }

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', size = 'md', className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        variant === 'ghost' && 'text-ink-3 hover:bg-muted hover:text-ink',
        variant === 'soft' && 'bg-muted text-ink-2 hover:bg-sunken',
        variant === 'primary' && 'bg-ink text-white hover:bg-ink-2',
        variant === 'secondary' && 'border border-line bg-surface text-ink-2 hover:bg-muted',
        iconSizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})
