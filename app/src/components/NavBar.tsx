import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Rulebook', shortLabel: 'Rules' },
  { to: '/players', label: 'Players', shortLabel: 'Players' },
  { to: '/cards', label: 'Cards', shortLabel: 'Cards' },
  { to: '/roster', label: 'Roster Builder', shortLabel: 'Roster' },
  { to: '/scorecard', label: 'Scorecard', shortLabel: 'Score' },
]

export default function NavBar() {
  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center gap-x-6 gap-y-2 px-4 py-3 sm:flex-wrap">
          <span className="flex items-center gap-2">
            <img src="/logo-mark.png" alt="" className="h-8 w-auto sm:h-9" />
            <span className="text-base font-bold tracking-tight text-sky-400 sm:text-lg">Diamond Dynasty</span>
          </span>
          {/* Desktop/tablet nav — below the sm breakpoint this moves to the fixed bottom tab bar instead. */}
          <nav className="hidden flex-wrap gap-1 sm:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-sky-500/20 text-sky-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile/PWA bottom tab bar — fixed, so it reads like a native app's tab bar once launched
          standalone from the home screen. Respects the iOS home-indicator safe area. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-800 bg-slate-900 sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex-1 py-2.5 text-center text-[11px] font-medium transition-colors ${isActive ? 'text-sky-300' : 'text-slate-400'}`
            }
          >
            {link.shortLabel}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
