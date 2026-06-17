import { Menu, BarChart3 } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/import', label: 'Importar CSV' },
  { to: '/metricas-info', label: 'Métricas Info' },
  { to: '/metricas-info-nuno', label: 'Métricas Info (Nuno)' },
  { to: '/configuration', label: 'Configurar Roles' },
  { to: '/nuno-scores', label: 'Nuno Scores' },
  { to: '/scouting', label: 'Scouting' },
  { to: '/scouting-nuno-scores', label: 'Scouting Nuno' },
  { to: '/similares', label: 'Jogadores Similares' },
]

/**
 * Main Navigation Component
 */
export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
      isActive
        ? 'border-violet-400 bg-violet-500/15 text-white'
        : 'border-slate-800 bg-slate-950/80 text-slate-200 hover:border-violet-500 hover:text-white'
    }`

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
              <NavLink key={item.label} to={item.to} end={item.to === '/'} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 transition hover:border-violet-500"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {isOpen && (
          <div className="lg:hidden space-y-2 border-t border-slate-800/80 py-3 pb-4">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block rounded-2xl border px-4 py-3 text-sm transition ${
                    isActive
                      ? 'border-violet-400 bg-violet-500/15 text-white'
                      : 'border-slate-800 bg-slate-950/90 text-slate-200 hover:border-violet-500 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
