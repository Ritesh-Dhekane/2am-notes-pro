// The admin portal (admins only, see App.jsx): who uses the app and what they open. Each page loads
// on its own; the backend checks the admin again on every request (apps-script/Admin.js).

import { RefreshCw } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { callApi } from '../../lib/api.js'
import { friendlyError } from '../../lib/errorMessages.js'
import NotFound from '../NotFound.jsx'

const Overview = lazy(() => import('./Overview.jsx'))
const Students = lazy(() => import('./Students.jsx'))
const Student = lazy(() => import('./Student.jsx'))

const TABS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/students', label: 'Students' },
]

// Rebuilds the backend's file listings now instead of waiting for the hourly refresh.
function RefreshLibrary() {
  const { user } = useAuth()
  const [status, setStatus] = useState({ busy: false, text: '' })

  async function refresh() {
    setStatus({ busy: true, text: 'Refreshing the library. This can take a minute…' })
    try {
      const { result } = await callApi('adminRefreshLibrary', { idToken: user.idToken })
      setStatus({
        busy: false,
        text: `Library refreshed: ${result.semesters} semesters, ${result.subjects} subjects, ${result.files} files (${result.seconds} s).`,
      })
    } catch (err) {
      setStatus({ busy: false, text: friendlyError(err.message) })
    }
  }

  return (
    <div className="flex min-w-0 flex-col items-start gap-1 sm:ml-auto sm:items-end">
      <button type="button" className="btn-secondary" onClick={refresh} disabled={status.busy}>
        <RefreshCw className={`size-4 ${status.busy ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh library
      </button>
      <p className="max-w-sm text-caption text-ink-2 sm:text-right" role="status">
        {status.text}
      </p>
    </div>
  )
}

function AdminNav() {
  return (
    <nav aria-label="Admin" className="mb-6 flex flex-wrap items-start gap-2">
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
      <RefreshLibrary />
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
          <Route path="students/:email" element={<Student />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  )
}
