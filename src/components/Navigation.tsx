import { Menu, BarChart3 } from 'lucide-react'
import { useState } from 'react'
import { useDataStore } from '../stores/dataStore'
import { Link } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/metricas-info', label: 'Métricas Info' },
  { to: '/scouting', label: 'Role Scores' },
  { to: '/scouting', label: 'Best XI' },
  { to: '/scouting', label: 'Moneyball' },
  { to: '/configuration', label: 'Fantasy Draft' },
  { to: '/configuration', label: 'Staff Scores' },
  { to: '/import', label: 'Tutorials' },
]

/**
 * Main Navigation Component
 */
export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const players = useDataStore((state) => state.players)
  const detectedRoles = useDataStore((state) => state.detectedRoles)

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl shadow-black/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_20px_60px_-35px_rgba(168,85,247,0.8)]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">FMDataLab</span>
              <span className="text-lg font-bold text-white">Scout Hub</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="whitespace-nowrap rounded-full border border-slate-800 bg-slate-950/80 px-4 py-2 text-sm text-slate-200 transition hover:border-violet-500 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button className="btn-secondary">Update Roles</button>
            <div className="h-11 w-11 rounded-full border border-slate-700 bg-slate-900 text-slate-100 grid place-items-center font-semibold">
              N
            </div>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 transition hover:border-violet-500"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden space-y-2 border-t border-slate-800/80 py-3 pb-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="block rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-200 transition hover:border-violet-500 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
