import { CalendarDays, Home, LayoutGrid, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, Outlet, useMatch } from 'react-router'
import { LogoMark } from '../../components/shell/Brand'
import { Avatar, Tooltip } from '../../components/primitives'
import { cn } from '../../lib/cn'
import { usePublishPresence } from '../../store/hooks'
import { ADVISOR_ID, staff } from '../../store/seed'

const nav = [
  { to: '/wm', icon: <Home className="size-[18px]" />, label: 'Overview', end: true },
  { to: '/wm/new', icon: <Users className="size-[18px]" />, label: 'New client' },
  { to: '/wm#calendar', icon: <CalendarDays className="size-[18px]" />, label: 'Calendar' },
  { to: '/gallery', icon: <LayoutGrid className="size-[18px]" />, label: 'Components' },
]

/** Wealth Manager shell: slim icon rail, canvas content. */
export function WMLayout() {
  const emily = staff.find((s) => s.id === ADVISOR_ID)!
  const caseMatch = useMatch('/wm/c/:caseId/*')
  // Case pages publish their own, more specific presence (which field Emily is looking at).
  usePublishPresence(caseMatch ? undefined : { personId: ADVISOR_ID, view: 'advisor' })

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-[72px] shrink-0 flex-col items-center gap-2 border-r border-line bg-canvas py-5">
        <LogoMark size={40} className="mb-4" />
        {nav.map((n) => (
          <Tooltip key={n.label} content={n.label} side="right">
            <NavLink
              to={n.to}
              end={n.end}
              className={({ isActive }) => cn('flex size-11 items-center justify-center rounded-control transition-colors', isActive && !n.to.includes('#') ? 'bg-surface text-ink shadow-soft' : 'text-ink-3 hover:bg-surface/70 hover:text-ink')}
            >
              {n.icon}
            </NavLink>
          </Tooltip>
        ))}
        <div className="mt-auto">
          <Tooltip content={`${emily.name} · ${emily.title}`} side="right">
            <span>
              <Avatar name={emily.name} src={emily.avatar} size="lg" />
            </span>
          </Tooltip>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}

/** Page header shared by Wealth Manager screens. */
export function PageHeader({ title, eyebrow, actions, children }: { title: ReactNode; eyebrow?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 px-10 pt-10 pb-6">
      {eyebrow && <div className="text-[13px] text-ink-3">{eyebrow}</div>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[44px] text-ink">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  )
}
