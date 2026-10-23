import { useEffect, useState } from 'react'
import { loadSyllabi } from './syllabus.js'

// The syllabus list: undefined while loading, an array once loaded; `error` if it couldn't be fetched.
export function useSyllabi() {
  const [state, setState] = useState({ entries: undefined, error: null, attempt: 0 })
  useEffect(() => {
    let cancelled = false
    loadSyllabi()
      .then((entries) => !cancelled && setState((s) => ({ ...s, entries, error: null })))
      .catch(() => !cancelled && setState((s) => ({ ...s, error: 'The syllabus list could not be loaded.' })))
    return () => {
      cancelled = true
    }
  }, [state.attempt])
  return { ...state, retry: () => setState((s) => ({ ...s, error: null, attempt: s.attempt + 1 })) }
}

// The tab title while a page is open; the app's own title comes back on leaving it.
export function useDocumentTitle(title) {
  useEffect(() => {
    if (!title) return
    const before = document.title
    document.title = title
    return () => {
      document.title = before
    }
  }, [title])
}
