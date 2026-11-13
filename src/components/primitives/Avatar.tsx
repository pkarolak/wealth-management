import { useState } from 'react'
import { cn } from '../../lib/cn'
import { initials } from '../../lib/format'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizes: Record<Size, string> = {
  xs: 'size-5 text-[9px]',
  sm: 'size-6 text-[10px]',
  md: 'size-8 text-[12px]',
  lg: 'size-10 text-[14px]',
  xl: 'size-16 text-[20px]',
}

/** Warm, distinguishable initials backgrounds that stay inside the taupe family. */
const palette = ['#E6DCCF', '#D5E1E6', '#EAD9E2', '#DCE3D3', '#E9DDC6', '#DCD8E8']

const hash = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0)

type AvatarProps = {
  name: string
  src?: string
  size?: Size
  ring?: boolean
  online?: boolean
  className?: string
  /** Overrides the hashed initials palette (e.g. tinted presence tags). */
  tint?: { bg: string; fg: string }
}

export function Avatar({ name, src, size = 'md', ring, online, className, tint }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center overflow-hidden rounded-full font-medium text-ink-2',
          ring && 'ring-2 ring-surface',
          sizes[size],
        )}
        style={tint ? { background: tint.bg, color: tint.fg } : { background: palette[hash(name) % palette.length] }}
        title={name}
      >
        {showImage ? <img src={src} alt={name} className="size-full object-cover" onError={() => setFailed(true)} /> : initials(name)}
      </span>
      {online !== undefined && (
        <span
          className={cn(
            'absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-surface',
            online ? 'bg-success' : 'bg-ink-4',
          )}
        />
      )}
    </span>
  )
}

/** ~20% overlap: enough to read as a group while every initial stays legible. */
const overlap: Record<Size, string> = { xs: '-ml-1', sm: '-ml-1', md: '-ml-1.5', lg: '-ml-2', xl: '-ml-3' }

/**
 * Overlapping avatars. The first person sits on top; each avatar is cut out of the one behind it by a
 * 2px ring in the parent's background colour (set `--avatar-ring` on the parent, defaults to surface).
 */
export function AvatarStack({ people, size = 'sm', max = 3, className }: { people: { name: string; src?: string }[]; size?: Size; max?: number; className?: string }) {
  const shown = people.slice(0, max)
  const rest = people.length - shown.length
  const ring = 'ring-2 ring-[var(--avatar-ring,var(--color-surface))]'
  return (
    <span className={cn('inline-flex items-center', className)}>
      {shown.map((p, i) => (
        <span key={p.name} className={cn('relative inline-flex rounded-full', ring, i > 0 && overlap[size])} style={{ zIndex: shown.length - i + 1 }}>
          <Avatar name={p.name} src={p.src} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span className={cn('relative inline-flex items-center justify-center rounded-full bg-sunken font-medium text-ink-3', ring, sizes[size], overlap[size])} style={{ zIndex: 0 }}>
          +{rest}
        </span>
      )}
    </span>
  )
}

/** Name pill used in emails, comments and presence. Even padding keeps the avatar concentric with the pill. */
export function PersonChip({ name, src, size = 'md', className }: { name: string; src?: string; size?: 'sm' | 'md'; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full bg-muted', size === 'md' ? 'gap-2 p-1 pr-4' : 'gap-1.5 p-0.5 pr-2.5', className)}>
      <Avatar name={name} src={src} size={size === 'md' ? 'md' : 'sm'} />
      <span className={cn('leading-none text-ink', size === 'md' ? 'text-[14px]' : 'text-[12px]')}>{name}</span>
    </span>
  )
}
