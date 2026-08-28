import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { callApi } from '../lib/api.js'

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
        <p className="text-sm text-gray-500">
          You're not signed in. <Link to="/login" className="underline">Go to login</Link>.
        </p>
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
              <Link to={`/subject/${subject.slug}`} className="underline">
                {subject.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
