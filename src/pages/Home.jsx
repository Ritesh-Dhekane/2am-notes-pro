import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { callApi } from '../lib/api.js'
import { trackEvent } from '../lib/analytics.js'

// Static teaser only — real subject data always requires a verified session
// (see Drive.js / DRIVE_STRUCTURE.md), so guests never trigger a backend call.
const GUEST_PREVIEW_SUBJECTS = [
  'Java Programming',
  'Software Testing',
  'Research Methodology',
  'Machine Learning',
]

export default function Home() {
  const { user, logout } = useAuth()
  const [subjects, setSubjects] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return

    let cancelled = false
    callApi('listSubjects', { idToken: user.idToken })
      .then((data) => {
        if (cancelled) return
        setSubjects(data.subjects)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setSubjects(null)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">2AM Notes Pro</h1>
        <p className="mt-2 text-sm text-gray-500">
          Private, subject-wise study material — notes, PYQs, and references.
        </p>

        <div className="mt-6 max-w-sm rounded border p-4">
          <p className="text-sm font-medium">What's inside (preview)</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-500">
            {GUEST_PREVIEW_SUBJECTS.map((name) => (
              <li key={name}>🔒 {name}</li>
            ))}
          </ul>
        </div>

        <Link
          to="/login"
          className="mt-6 inline-block rounded bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Sign in with Google for full access
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Subjects</h1>
          <p className="mt-1 text-sm text-gray-500">Signed in as {user.email}</p>
        </div>
        <button onClick={logout} className="text-sm underline">
          Log out
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      {!error && !subjects && <p className="mt-4 text-sm text-gray-500">Loading subjects…</p>}

      {subjects && subjects.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">No subjects found yet.</p>
      )}

      {subjects && subjects.length > 0 && (
        <ul className="mt-4 space-y-2">
          {subjects.map((subject) => (
            <li key={subject.slug}>
              <Link
                to={`/subject/${subject.slug}`}
                className="underline"
                onClick={() => trackEvent('subject_click', { subject: subject.slug })}
              >
                {subject.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
