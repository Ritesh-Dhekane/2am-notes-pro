import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { friendlyError, isSessionError } from './errorMessages.js'
import { loadFile } from './library.js'
import { splitTitle } from './markdown.js'

// Loads a file's content. For notes it also splits off the note's own "# Title".
export function useFile(file) {
  const { user, logout } = useAuth()
  const [state, setState] = useState({ id: null, data: null, error: null })
  const [attempt, setAttempt] = useState(0)
  const id = file?.id
  const idToken = user?.idToken

  useEffect(() => {
    if (!id || !idToken) return
    let cancelled = false
    loadFile(idToken, id)
      .then((data) => {
        if (cancelled) return
        const extra = data.encoding === 'utf8' && /\.(md|markdown)$/i.test(data.name) ? splitTitle(data.content) : {}
        setState({ id, data: { ...data, body: extra.body, noteTitle: extra.title }, error: null })
      })
      .catch((err) => {
        if (cancelled) return
        if (isSessionError(err.message)) {
          logout('expired')
          return
        }
        setState({ id, data: null, error: friendlyError(err.message) })
      })
    return () => {
      cancelled = true
    }
  }, [id, idToken, attempt, logout])

  const current = state.id === id ? state : { id, data: null, error: null }
  return { ...current, loading: !current.data && !current.error, retry: () => setAttempt((n) => n + 1) }
}
