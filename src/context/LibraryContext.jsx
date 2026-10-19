import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildLibrary, loadRawLibrary } from '../lib/library.js'
import { friendlyError, isSessionError } from '../lib/errorMessages.js'
import { useStudy } from '../lib/study.js'
import { useAuth } from './useAuth.js'
import { LibraryContext } from './libraryContext.js'

// The list is checked again when the app comes back into view (or every 30 minutes while it's open)
// and is older than this. New files wait behind a "New notes added" prompt; changed files apply quietly.
const STALE_MS = 30 * 60 * 1000

// Every file in a raw library, id -> last updated.
function fileVersions(raw) {
  const files = raw.flatMap((s) => [...Object.values(s.files || {}).flat(), ...(s.syllabus ? [s.syllabus] : [])])
  return new Map(files.map((f) => [f.id, f.updated]))
}

// Loads the chosen semester's library once and shares it with every screen. Changing electives only
// re-filters what's already loaded; changing semester loads that semester.
export function LibraryProvider({ children }) {
  const { user, logout } = useAuth()
  const { semester, electives, complete } = useStudy()
  const [state, setState] = useState({ key: null, raw: null, error: null })
  const [attempt, setAttempt] = useState(0)
  const [update, setUpdate] = useState(null) // { key, raw, added }: a newer list with new files
  const loadedAt = useRef(0)
  const idToken = user?.idToken
  const key = idToken && complete ? `${semester}#${attempt}` : null

  useEffect(() => {
    if (!key) return
    let cancelled = false
    loadRawLibrary(idToken, semester)
      .then((raw) => {
        if (cancelled) return
        loadedAt.current = Date.now()
        setState({ key, raw, error: null })
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

  // Background check for new notes. Failures are ignored: the current list stays.
  const current = state.key === key ? state.raw : null
  useEffect(() => {
    if (!key || !current) return
    let busy = false
    const check = async () => {
      if (busy || document.visibilityState !== 'visible' || Date.now() - loadedAt.current < STALE_MS) return
      busy = true
      try {
        const fresh = await loadRawLibrary(idToken, semester)
        loadedAt.current = Date.now()
        const before = fileVersions(current)
        const after = fileVersions(fresh)
        const added = [...after.keys()].filter((id) => !before.has(id)).length
        const changed = after.size !== before.size || [...after].some(([id, updated]) => before.get(id) !== updated)
        if (added > 0) setUpdate({ key, raw: fresh, added })
        else if (changed) setState((s) => (s.key === key ? { ...s, raw: fresh } : s))
      } catch {
        // offline or the backend is busy: try again next time
      } finally {
        busy = false
      }
    }
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    const timer = setInterval(check, STALE_MS)
    return () => {
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
      clearInterval(timer)
    }
  }, [key, current, idToken, semester])

  const pending = update?.key === key ? update : null
  const applyUpdate = useCallback(() => {
    if (pending) setState((s) => (s.key === pending.key ? { ...s, raw: pending.raw } : s))
    setUpdate(null)
  }, [pending])
  const newNotes = pending ? pending.added : 0

  const library = useMemo(
    () => (state.key === key && state.raw ? buildLibrary(state.raw, { semester, electives }) : null),
    [state, key, semester, electives],
  )

  // Signed out or not set up: nothing to show. Until this semester's answer arrives: 'loading'.
  let value
  const extra = { retry, newNotes, applyUpdate }
  if (!key) value = { status: 'idle', library: null, error: null, ...extra }
  else if (state.key !== key) value = { status: 'loading', library: null, error: null, ...extra }
  else if (state.error) value = { status: 'error', library: null, error: state.error, ...extra }
  else value = { status: 'ready', library, error: null, ...extra }

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}
