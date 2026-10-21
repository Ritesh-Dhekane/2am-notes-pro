// The admin portal (admins only, see App.jsx): who uses the app and what they open. Each page loads
// on its own; the backend checks the admin again on every request (apps-script/Admin.js).

import { lazy, Suspense } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import NotFound from '../NotFound.jsx'

const Overview = lazy(() => import('./Overview.jsx'))
const Students = lazy(() => import('./Students.jsx'))

const TABS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/students', label: 'Students' },
]

function AdminNav() {
  return (
    <nav aria-label="Admin" className="mb-6 flex flex-wrap items-center gap-2">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `flex min-h-10 items-center rounded-xl px-3 text-label font-semibold ${
              isActive ? 'bg-primary-soft text-primary-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Admin() {
  return (
    <div className="min-w-0">
      <p className="font-mono text-caption text-teal-ink">Admin</p>
      <AdminNav />
      <Suspense fallback={<div className="h-40" aria-busy="true" />}>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="students" element={<Students />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  )
}
