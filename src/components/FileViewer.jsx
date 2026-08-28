import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { callApi } from '../lib/api.js'
import { friendlyError, isSessionError } from '../lib/errorMessages.js'

export default function FileViewer({ idToken, fileId, onSessionExpired }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    callApi('getFile', { idToken, fileId })
      .then((data) => {
        if (cancelled) return
        setFile(data.file)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        if (isSessionError(err.message)) {
          onSessionExpired?.()
          return
        }
        setError(friendlyError(err.message))
        setFile(null)
      })

    return () => {
      cancelled = true
    }
  }, [idToken, fileId, onSessionExpired])

  if (error) return <p className="text-sm text-red-500">{error}</p>
  if (!file) return <p className="text-sm text-gray-500">Loading…</p>

  if (file.mimeType === 'application/pdf') {
    return (
      <iframe
        title={file.name}
        src={`data:application/pdf;base64,${file.content}`}
        className="h-[70vh] w-full rounded border"
      />
    )
  }

  if (file.encoding === 'utf8' && /\.md$/.test(file.name)) {
    return (
      <div className="rounded border p-4">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{file.content}</ReactMarkdown>
      </div>
    )
  }

  if (file.encoding === 'utf8') {
    return <pre className="whitespace-pre-wrap rounded border p-4 text-sm">{file.content}</pre>
  }

  return (
    <p className="text-sm text-gray-500">
      Preview not available for this file type ({file.mimeType}).
    </p>
  )
}
