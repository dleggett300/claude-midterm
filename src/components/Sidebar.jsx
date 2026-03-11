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
    <aside className="w-14 sm:w-56 shrink-0 bg-brand-900 text-white flex flex-col">
      <div className="px-3 sm:px-6 py-5 border-b border-brand-700 overflow-hidden">
        <span className="hidden sm:block text-lg font-bold tracking-tight">DML BizCompanion</span>
        <span className="sm:hidden text-lg font-bold">D</span>
      </div>
      <nav className="flex-1 px-1 sm:px-3 py-4 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `flex items-center justify-center sm:justify-start gap-3 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors ` +
              (isActive
                ? 'bg-brand-700 text-white'
                : 'text-brand-200 hover:bg-brand-800 hover:text-white')
            }
          >
            <span className="text-base shrink-0">{icon}</span>
            <span className="hidden sm:block">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
