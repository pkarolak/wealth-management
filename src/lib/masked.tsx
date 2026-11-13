import type { ReactNode } from 'react'

/** Bullets sit on the x-height; lift them to the digits' optical center so masked values read as one line. */
export function withBullets(text: string): ReactNode {
  if (!text.includes('•')) return text
  return text.split(/(•[•-]*)/).map((part, i) =>
    part.startsWith('•') ? (
      <span key={i} className="relative -top-[0.1em] tracking-[0.08em]">
        {part}
      </span>
    ) : (
      part
    ),
  )
}
