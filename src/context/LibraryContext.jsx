import { useCallback, useEffect, useState } from 'react'
import { loadLibrary } from '../lib/library.js'
import { friendlyError, isSessionError } from '../lib/errorMessages.js'
import { useAuth } from './useAuth.js'
import { LibraryContext } from './libraryContext.js'

// Loads the signed-in student's library once and shares it with every screen.
export function LibraryProvider({ children }) {
  const { user, logout } = useAuth()
  const [state, setState] = useState({ status: 'idle', library: null, error: null })
  const [attempt, setAttempt] = useState(0)
  const idToken = user?.idToken

  useEffect(() => {
    if (!idToken) return
    let cancelled = false
    loadLibrary(idToken)
      .then((library) => {
        if (!cancelled) setState({ status: 'ready', library, error: null })
      })
      .catch((err) => {
        if (cancelled) return
        if (isSessionError(err.message)) {
          logout('expired')
          return
        }
        setState({ status: 'error', library: null, error: friendlyError(err.message) })
      })
    return () => {
      cancelled = true
    }
  }, [idToken, attempt, logout])

  const retry = useCallback(() => {
    setState({ status: 'loading', library: null, error: null })
    setAttempt((n) => n + 1)
  }, [])

  // While signed out there is nothing to show; while the first load runs, status reads 'loading'.
  const value = !idToken
    ? { status: 'idle', library: null, error: null, retry }
    : { ...state, status: state.status === 'idle' ? 'loading' : state.status, retry }

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}
