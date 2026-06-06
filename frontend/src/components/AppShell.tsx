import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BarChart3,
  GitCompare,
  ListOrdered,
  Moon,
  MoreHorizontal,
  Radio,
  Search,
  Sun,
  Trophy,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/utils'
import { useSeason } from '../lib/useSeason'
import { useTheme } from '../lib/useTheme'
import { useCommandPalette } from '../lib/useCommandPalette'
import { ConnectionIndicator } from './ConnectionIndicator'
import { useLiveScoreboard } from '../hooks/useLiveScoreboard'
import {
  areLiveNotificationsEnabled,
  setLiveNotificationsEnabled,
} from '../lib/favorites'
import { CommandPalette } from './CommandPalette'
import { LiveTicker } from './LiveTicker'
import { Badge } from './ui/Badge'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Overview',
  '/scoreboard': 'Scoreboard',
  '/standings': 'Standings',
  '/players': 'Players',
  '/teams': 'Teams',
  '/leaders': 'Leaders',
  '/compare': 'Compare',
}

type NavItem = { to: string; label: string; icon: typeof BarChart3; end?: boolean }

const LEAGUE_NAV: NavItem[] = [
  { to: '/', label: 'Overview', icon: BarChart3, end: true },
  { to: '/scoreboard', label: 'Scoreboard', icon: Radio },
  { to: '/standings', label: 'Standings', icon: ListOrdered },
]

const EXPLORE_NAV: NavItem[] = [
  { to: '/players', label: 'Players', icon: Users },
  { to: '/teams', label: 'Teams', icon: Trophy },
  { to: '/leaders', label: 'Leaders', icon: Trophy },
  { to: '/compare', label: 'Compare', icon: GitCompare },
]

const MOBILE_TABS: NavItem[] = [
  { to: '/', label: 'Overview', icon: BarChart3, end: true },
  { to: '/scoreboard', label: 'Scoreboard', icon: Radio },
  { to: '/standings', label: 'Standings', icon: ListOrdered },
  { to: '/players', label: 'Players', icon: Users },
]

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      {items.map(({ to, label: itemLabel, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand/10 text-brand'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive ? (
                <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-brand" />
              ) : null}
              <Icon size={16} aria-hidden />
              {itemLabel}
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}

function SeasonSelect({ className }: { className?: string }) {
  const { season, setSeason, options } = useSeason()
  return (
    <select
      value={season}
      onChange={(e) => setSeason(e.target.value)}
      aria-label="Season"
      className={cn(
        'rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand',
        className,
      )}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

export function AppShell() {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const needsLive =
    location.pathname === '/' || location.pathname.startsWith('/scoreboard')
  const { liveCount, connectionStatus, lastUpdatedAt, isToday } = useLiveScoreboard(undefined, {
    enabled: needsLive,
    enableWebSocket: needsLive,
  })
  const [notifyOn, setNotifyOn] = useState(areLiveNotificationsEnabled())
  const { open, setOpen, close } = useCommandPalette()
  const [moreOpen, setMoreOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const pageTitle =
    PAGE_TITLES[location.pathname] ??
    (location.pathname.startsWith('/teams/') ? 'Team' : location.pathname.startsWith('/games/') ? 'Game' : 'HoopLab')

  return (
    <div className="min-h-screen bg-background">
      <CommandPalette open={open} onClose={close} />

      <div className="lg:flex">
        <aside
          className={cn(
            'hidden border-r border-border bg-card lg:flex lg:flex-col lg:shrink-0',
            sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-60',
          )}
        >
          <div className={cn('flex items-center gap-3 p-5', sidebarCollapsed && 'justify-center')}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-lg font-bold text-brand-foreground">
              HL
            </div>
            {!sidebarCollapsed ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">HoopLab</p>
                <h1 className="text-sm font-semibold text-foreground">NBA Analytics</h1>
              </div>
            ) : null}
          </div>
          <nav className={cn('flex-1 space-y-6 px-3 pb-6', sidebarCollapsed && 'px-2')}>
            {!sidebarCollapsed ? (
              <>
                <NavGroup label="Home" items={LEAGUE_NAV} />
                <NavGroup label="Explore" items={EXPLORE_NAV} />
              </>
            ) : (
              <div className="space-y-2">
                {[...LEAGUE_NAV, ...EXPLORE_NAV].map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    title={label}
                    aria-label={label}
                    className={({ isActive }) =>
                      cn(
                        'flex justify-center rounded-lg p-2.5',
                        isActive ? 'bg-brand/10 text-brand' : 'text-muted-foreground hover:bg-muted',
                      )
                    }
                  >
                    <Icon size={18} />
                  </NavLink>
                ))}
              </div>
            )}
          </nav>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="m-3 hidden rounded-lg border border-border py-2 text-xs text-muted-foreground hover:bg-muted lg:block"
          >
            {sidebarCollapsed ? '→' : '← Collapse'}
          </button>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
            <div className="flex h-14 items-center gap-3 px-4 lg:px-8">
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground lg:text-base">
                {pageTitle}
              </p>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="hidden items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground sm:flex"
                aria-label="Open search"
              >
                <Search className="h-3.5 w-3.5" />
                Search
              </button>
              {isToday ? (
                <ConnectionIndicator
                  status={connectionStatus}
                  lastUpdatedAt={lastUpdatedAt}
                  showFreshness={liveCount > 0}
                />
              ) : null}
              {liveCount > 0 ? (
                <Badge variant="live" className="gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" />
                  {liveCount} live
                </Badge>
              ) : null}
              <button
                type="button"
                title="Live notifications for favorite teams"
                onClick={async () => {
                  if (!notifyOn && typeof Notification !== 'undefined') {
                    const perm = await Notification.requestPermission()
                    if (perm !== 'granted') return
                  }
                  const next = !notifyOn
                  setNotifyOn(next)
                  setLiveNotificationsEnabled(next)
                }}
                className={cn(
                  'rounded-lg px-2 py-1 text-xs font-medium',
                  notifyOn ? 'bg-brand/10 text-brand' : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {notifyOn ? 'Alerts on' : 'Alerts'}
              </button>
              <SeasonSelect className="hidden sm:block" />
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </div>
          </header>
          {needsLive ? <LiveTicker /> : null}

          <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-10">
            <Outlet />
          </main>
        </div>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Mobile navigation"
      >
        <div className="flex items-stretch justify-around">
          {MOBILE_TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[52px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium',
                  isActive ? 'text-brand' : 'text-muted-foreground',
                )
              }
            >
              <span className="relative">
                <Icon size={20} aria-hidden />
                {to === '/scoreboard' && liveCount > 0 ? (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-live px-1 text-[9px] font-bold text-white">
                    {liveCount}
                  </span>
                ) : null}
              </span>
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex min-h-[52px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground"
            aria-label="More navigation"
          >
            <MoreHorizontal size={20} />
            More
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <div
          className="fixed inset-0 z-[100] bg-foreground/40 lg:hidden"
          onClick={() => setMoreOpen(false)}
          role="presentation"
        >
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-border bg-card p-6"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">More</h2>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              <NavLink to="/teams" className="block rounded-lg px-3 py-3 hover:bg-muted" onClick={() => setMoreOpen(false)}>
                Teams
              </NavLink>
              <NavLink to="/leaders" className="block rounded-lg px-3 py-3 hover:bg-muted" onClick={() => setMoreOpen(false)}>
                Leaders
              </NavLink>
            </div>
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <label className="text-xs font-medium text-muted-foreground">Season</label>
              <SeasonSelect className="w-full" />
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm"
              >
                <Search size={16} /> Search
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
