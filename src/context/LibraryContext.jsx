import { useCallback, useEffect, useMemo, useState } from 'react'
import { buildLibrary, loadRawLibrary } from '../lib/library.js'
import { friendlyError, isSessionError } from '../lib/errorMessages.js'
import { useStudy } from '../lib/study.js'
import { useAuth } from './useAuth.js'
import { LibraryContext } from './libraryContext.js'

// Loads the chosen semester's library once and shares it with every screen. Changing electives only
// re-filters what's already loaded; changing semester loads that semester.
export function LibraryProvider({ children }) {
  const { user, logout } = useAuth()
  const { semester, electives, complete } = useStudy()
  const [state, setState] = useState({ key: null, raw: null, error: null })
  const [attempt, setAttempt] = useState(0)
  const idToken = user?.idToken
  const key = idToken && complete ? `${semester}#${attempt}` : null

  useEffect(() => {
    if (!key) return
    let cancelled = false
    loadRawLibrary(idToken, semester)
      .then((raw) => {
        if (!cancelled) setState({ key, raw, error: null })
      })
      .catch((err) => {
        if (cancelled) return
        if (isSessionError(err.message)) {
          logout('expired')
          return
        }
        setState({ key, raw: null, error: friendlyError(err.message) })
      })
    return () => {
      cancelled = true
    }
  }, [key, idToken, semester, logout])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  const library = useMemo(
    () => (state.key === key && state.raw ? buildLibrary(state.raw, { semester, electives }) : null),
    [state, key, semester, electives],
  )

  // Signed out or not set up: nothing to show. Until this semester's answer arrives: 'loading'.
  let value
  if (!key) value = { status: 'idle', library: null, error: null, retry }
  else if (state.key !== key) value = { status: 'loading', library: null, error: null, retry }
  else if (state.error) value = { status: 'error', library: null, error: state.error, retry }
  else value = { status: 'ready', library, error: null, retry }

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}
