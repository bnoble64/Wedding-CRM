import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import QuickAdd from './QuickAdd.jsx'

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/planning', label: 'Planning' },
  { to: '/vendors', label: 'Vendors' },
  { to: '/venues', label: 'Venues' },
  { to: '/decisions', label: 'Decisions' },
  { to: '/budget', label: 'Budget' },
  { to: '/guests', label: 'Guests' },
  { to: '/ideas', label: 'Ideas & Items' },
  { to: '/events', label: 'Events' },
  { to: '/documents', label: 'Documents' },
  { to: '/communications', label: 'Communications' },
  { to: '/settings', label: 'Settings' },
]

export default function AppLayout() {
  const [quickOpen, setQuickOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="shell">
      <aside className={'sidebar' + (navOpen ? ' open' : '')}>
        <div className="brand">
          <span className="brand-mark">B<span className="amp">&amp;</span>C</span>
          <span className="brand-text">Wedding HQ</span>
        </div>
        <nav className="nav">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
              onClick={() => setNavOpen(false)}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <button className="btn btn-ghost signout" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn only-mobile" onClick={() => setNavOpen(v => !v)} aria-label="Menu">≡</button>
          <input className="search" placeholder="Search vendors, venues, guests…" />
          <button className="btn btn-primary add" onClick={() => setQuickOpen(true)}>+ Add</button>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </div>

      {quickOpen && <QuickAdd onClose={() => setQuickOpen(false)} />}
      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} />}
    </div>
  )
}
