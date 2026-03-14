import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const links = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
        <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v4A1.5 1.5 0 004.5 9h4A1.5 1.5 0 0010 7.5v-4A1.5 1.5 0 008.5 2h-4zm0 9A1.5 1.5 0 003 12.5v4A1.5 1.5 0 004.5 18h4a1.5 1.5 0 001.5-1.5v-4A1.5 1.5 0 008.5 11h-4zm6.5 1.5A1.5 1.5 0 0112.5 11h4a1.5 1.5 0 011.5 1.5v4a1.5 1.5 0 01-1.5 1.5h-4A1.5 1.5 0 0111 16.5v-4zm1.5-9A1.5 1.5 0 0011 3.5v4A1.5 1.5 0 0012.5 9h4A1.5 1.5 0 0018 7.5v-4A1.5 1.5 0 0016.5 2h-4z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: '/income',
    label: 'Income',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
        <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: '/expenses',
    label: 'Expenses',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
        <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: '/tasks',
    label: 'Tasks',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const { signOut } = useApp()
  const navigate = useNavigate()

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebarCollapsed') !== 'false'
  )

  function toggle() {
    setCollapsed(v => {
      const next = !v
      localStorage.setItem('sidebarCollapsed', String(next))
      return next
    })
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  // Shared class for fading label text in/out
  const labelClass = `whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-300 ${
    collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'
  }`

  return (
    <aside
      className={`hidden sm:flex flex-col shrink-0 bg-brand-900 text-white overflow-hidden transition-[width] duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Header — "D" always visible, rest of name fades in */}
      <div className="h-[60px] flex items-center px-[18px] border-b border-brand-700 overflow-hidden">
        <span className="text-lg font-bold shrink-0">D</span>
        <span className={`text-base font-bold tracking-tight ${labelClass}`}>
          ML BizCompanion
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-brand-700 text-white'
                  : 'text-brand-200 hover:bg-brand-800 hover:text-white'
              }`
            }
          >
            {icon}
            <span className={labelClass}>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom: sign out + collapse toggle */}
      <div className="px-2 py-4 border-t border-brand-700 space-y-1 overflow-hidden">
        {/* Sign out */}
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium text-brand-200 hover:bg-brand-800 hover:text-white transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
            <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z" clipRule="evenodd" />
          </svg>
          <span className={labelClass}>Sign Out</span>
        </button>

        {/* Collapse / expand toggle */}
        <button
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`w-full flex items-center px-2 py-2 rounded-lg text-brand-500 hover:bg-brand-800 hover:text-brand-300 transition-colors ${
            collapsed ? 'justify-center' : 'justify-end'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
          >
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
