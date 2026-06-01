import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, ListOrdered, Trophy, Users } from 'lucide-react'
import { cn } from '../lib/utils'
import { useSeason } from '../lib/season'

const links = [
  { to: '/', label: 'Overview', icon: BarChart3 },
  { to: '/standings', label: 'Standings', icon: ListOrdered },
  { to: '/players', label: 'Players', icon: Users },
  { to: '/teams', label: 'Teams', icon: Trophy },
  { to: '/leaders', label: 'Leaders', icon: Trophy },
]

export function AppShell() {
  const { season, setSeason, options } = useSeason()

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-gray-200 bg-white p-6 lg:border-b-0 lg:border-r">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-lg font-bold text-white">
            HL
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-orange-600">HoopLab</p>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">NBA Analytics</h1>
          </div>
        </div>
        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400">Season</label>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
          >
            {options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  )
}
