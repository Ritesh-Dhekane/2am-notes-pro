// Loading admin data and formatting it, shared by the admin pages.

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import { callApi } from '../../lib/api.js'
import { friendlyError, isSessionError, signOutReason } from '../../lib/errorMessages.js'

// Calls an admin action and keeps the last answer while a new one loads (paging, filters).
// reload() asks again with `fresh: true`, which skips the backend's cache.
export function useAdmin(action, params = {}) {
  const { user, logout } = useAuth()
  const idToken = user?.idToken
  const query = JSON.stringify(params)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ key: null, data: null, error: null })
  const key = `${action}#${query}#${attempt}`

  useEffect(() => {
    if (!idToken) return
    let cancelled = false
    callApi(action, { idToken, ...JSON.parse(query), ...(attempt ? { fresh: true } : {}) })
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((err) => {
        if (cancelled) return
        if (isSessionError(err.message)) logout(signOutReason(err.message))
        else setState((s) => ({ key, data: s.data, error: friendlyError(err.message) }))
      })
    return () => {
      cancelled = true
    }
  }, [action, query, attempt, key, idToken, logout])

  return { data: state.data, error: state.key === key ? state.error : null, loading: state.key !== key, reload: () => setAttempt((n) => n + 1) }
}

// For admin actions that change something (dismiss a flag, block, hide a subject): run(action, params)
// resolves to the answer, or null after showing the error in `error`.
export function useAdminAction() {
  const { user, logout } = useAuth()
  const idToken = user?.idToken
  const [state, setState] = useState({ busy: false, error: null })
  const run = useCallback(
    async (action, params = {}) => {
      setState({ busy: true, error: null })
      try {
        const data = await callApi(action, { idToken, ...params })
        setState({ busy: false, error: null })
        return data
      } catch (err) {
        if (isSessionError(err.message)) logout(signOutReason(err.message))
        else setState({ busy: false, error: friendlyError(err.message) })
        return null
      }
    },
    [idToken, logout],
  )
  return [run, state]
}

// The rules in apps-script/Flags.js.
export const FLAG_RULES = {
  burst: 'Burst of opens',
  bulk: 'Bulk opening',
  devices: 'Many devices',
  automation: 'Automation',
  timing: 'Regular timing',
}

// "MCA-Sem-III" -> "MCA Sem III".
export function semesterLabel(id) {
  return String(id || '').replace(/-/g, ' ')
}

function istDate(text) {
  return new Date(`${String(text).replace(' ', 'T')}+05:30`)
}

// IST time text "2026-10-21 09:30:00" -> "21 Oct, 9:30 am" in the viewer's own time.
export function formatTime(text) {
  if (!text) return '–'
  const date = istDate(text)
  if (Number.isNaN(date.getTime())) return text
  return date.toLocaleString([], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export function daysSince(text) {
  const ms = istDate(text).getTime()
  return text && !Number.isNaN(ms) ? Math.floor((Date.now() - ms) / 86400000) : null
}

export function studentPath(email) {
  return `/admin/students/${encodeURIComponent(email)}`
}
