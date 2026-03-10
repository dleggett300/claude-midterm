import { NavLink } from 'react-router-dom'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '▦' },
  { to: '/income',    label: 'Income',    icon: '↑' },
  { to: '/expenses',  label: 'Expenses',  icon: '↓' },
  { to: '/receipts',  label: 'Receipts',  icon: '🗂' },
  { to: '/tasks',     label: 'Tasks',     icon: '✓' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-brand-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-brand-700">
        <span className="text-lg font-bold tracking-tight">BizTrack</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ` +
              (isActive
                ? 'bg-brand-700 text-white'
                : 'text-brand-200 hover:bg-brand-800 hover:text-white')
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
