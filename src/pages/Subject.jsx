import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { callApi } from '../lib/api.js'
import { trackEvent } from '../lib/analytics.js'
import { friendlyError, isSessionError } from '../lib/errorMessages.js'
import FileViewer from '../components/FileViewer.jsx'

const CATEGORIES = [
  { key: 'notes', label: 'Notes' },
  { key: 'pyqs', label: 'PYQs' },
  { key: 'references', label: 'References' },
]

export default function Subject() {
  const { subjectId } = useParams()
  const { user, logout } = useAuth()
  const [category, setCategory] = useState('notes')
  const [files, setFiles] = useState(null)
  const [error, setError] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    if (!user) return

    let cancelled = false
    callApi('listFiles', { idToken: user.idToken, subjectSlug: subjectId, category })
      .then((data) => {
        if (cancelled) return
        setFiles(data.files)
        setError(null)
        setSelectedFile(null)
      })
      .catch((err) => {
        if (cancelled) return
        if (isSessionError(err.message)) {
          logout()
          return
        }
        setError(friendlyError(err.message))
        setFiles(null)
        setSelectedFile(null)
      })

    return () => {
      cancelled = true
    }
  }, [user, subjectId, category, logout])

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">{subjectId}</h1>
        <p className="mt-2 text-sm text-gray-500">
          Sign in to view notes, PYQs, and references for this subject.
        </p>
        <Link
          to="/login"
          className="mt-4 inline-block rounded bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Sign in with Google
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">{subjectId}</h1>

      <div className="mt-4 flex gap-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={category === c.key ? 'font-semibold underline' : 'text-gray-500'}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      {!error && !files && <p className="mt-4 text-sm text-gray-500">Loading files…</p>}
      {files && files.length === 0 && <p className="mt-4 text-sm text-gray-500">No files here yet.</p>}

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
        {files && files.length > 0 && (
          <ul className="space-y-2 md:col-span-1">
            {files.map((file) => (
              <li key={file.id}>
                <button
                  onClick={() => {
                    setSelectedFile(file)
                    trackEvent('file_open', { subject: subjectId, category, fileName: file.name })
                  }}
                  className={selectedFile?.id === file.id ? 'font-semibold underline' : 'underline'}
                >
                  {file.name}
                </button>
              </li>
            ))}
          </ul>
        )}

        {selectedFile && (
          <div className="md:col-span-2">
            <FileViewer
              key={selectedFile.id}
              idToken={user.idToken}
              fileId={selectedFile.id}
              onSessionExpired={logout}
            />
          </div>
        )}
      </div>
    </div>
  )
}
