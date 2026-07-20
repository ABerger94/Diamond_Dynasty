import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Rulebook' },
  { to: '/players', label: 'Players' },
  { to: '/cards', label: 'Cards' },
  { to: '/roster', label: 'Roster Builder' },
  { to: '/scorecard', label: 'Scorecard' },
]

export default function NavBar() {
  return (
    <header className="border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <span className="flex items-center gap-2">
          <img src="/logo-mark.png" alt="" className="h-8 w-auto sm:h-9" />
          <span className="text-base font-bold tracking-tight text-sky-400 sm:text-lg">Diamond Dynasty</span>
        </span>
        <nav className="flex flex-wrap gap-1">
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
  )
}
