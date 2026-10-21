// The admin portal (admins only, see App.jsx): who uses the app and what they open. Each page loads
// on its own; the backend checks the admin again on every request (apps-script/Admin.js).

import { RefreshCw } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { callApi } from '../../lib/api.js'
import { friendlyError } from '../../lib/errorMessages.js'
import NotFound from '../NotFound.jsx'
import { useAdmin } from './adminData.js'

const Overview = lazy(() => import('./Overview.jsx'))
const Students = lazy(() => import('./Students.jsx'))
const Student = lazy(() => import('./Student.jsx'))
const Flags = lazy(() => import('./Flags.jsx'))

const TABS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/students', label: 'Students' },
  { to: '/admin/flags', label: 'Flags', badge: 'flags' },
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

// `badges`: { flags: open flag count }.
function AdminNav({ badges }) {
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
          {badges[tab.badge] > 0 && (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 font-mono text-caption leading-5 text-on-primary" aria-label={`${badges[tab.badge]} open`}>
              {badges[tab.badge]}
            </span>
          )}
        </NavLink>
      ))}
      <RefreshLibrary />
    </nav>
  )
}

export default function Admin() {
  const flags = useAdmin('adminFlags', { status: 'open', badge: true })
  return (
    <div className="min-w-0">
      <p className="font-mono text-caption text-teal-ink">Admin</p>
      <AdminNav badges={{ flags: flags.data?.counts.open }} />
      <Suspense fallback={<div className="h-40" aria-busy="true" />}>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:email" element={<Student onChange={flags.reload} />} />
          <Route path="flags" element={<Flags onChange={flags.reload} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  )
}
