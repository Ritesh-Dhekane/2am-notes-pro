import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { friendlyError, isSessionError, signOutReason } from './errorMessages.js'
import { loadFile, prefetchSubject } from './library.js'
import { splitTitle } from './markdown.js'

// Loads a file's content. For notes it also splits off the note's own "# Title".
export function useFile(file) {
  const { user, logout } = useAuth()
  const [state, setState] = useState({ id: null, data: null, error: null })
  const [attempt, setAttempt] = useState(0)
  const id = file?.id
  const updated = file?.updated
  const name = file?.name
  const idToken = user?.idToken

  useEffect(() => {
    if (!id || !idToken) return
    let cancelled = false
    loadFile(idToken, id, { updated, name })
      .then((data) => {
        if (cancelled) return
        const extra = data.encoding === 'utf8' && /\.(md|markdown)$/i.test(data.name) ? splitTitle(data.content) : {}
        setState({ id, data: { ...data, body: extra.body, noteTitle: extra.title }, error: null })
      })
      .catch((err) => {
        if (cancelled) return
        if (isSessionError(err.message)) {
          logout(signOutReason(err.message))
          return
        }
        setState({ id, data: null, error: friendlyError(err.message) })
      })
    return () => {
      cancelled = true
    }
  }, [id, updated, name, idToken, attempt, logout])

  const current = state.id === id ? state : { id, data: null, error: null }
  return { ...current, loading: !current.data && !current.error, retry: () => setAttempt((n) => n + 1) }
}

// Saves the whole subject's notes and solutions in the background once it's opened.
export function usePrefetchSubject(subject) {
  const { user } = useAuth()
  const idToken = user?.idToken
  useEffect(() => {
    if (idToken && subject) prefetchSubject(idToken, subject)
  }, [idToken, subject])
}
