import { useCallback, useEffect, useState } from 'react'
import { decodeJwtPayload } from '../lib/jwt.js'
import { callApi } from '../lib/api.js'
import { trackEvent } from '../lib/analytics.js'
import { clearFileCache } from '../lib/library.js'
import { syncStudy } from '../lib/study.js'
import { AuthContext, SIGNOUT_REASON_KEY, STORAGE_KEY } from './authContext.js'

function userFromToken(idToken) {
  const payload = decodeJwtPayload(idToken)
  return {
    idToken,
    name: payload.name,
    firstName: payload.given_name || (payload.name || '').split(' ')[0],
    email: payload.email,
    picture: payload.picture || null,
    expiresAt: payload.exp ? payload.exp * 1000 : null,
  }
}

function rememberReason(reason) {
  try {
    if (reason) sessionStorage.setItem(SIGNOUT_REASON_KEY, reason)
    else sessionStorage.removeItem(SIGNOUT_REASON_KEY)
  } catch {
    // ignore
  }
}

// Google ID tokens last about an hour. An expired one is dropped on load, and the sign-in page
// explains why instead of the first request failing.
function readStoredUser() {
  const storedToken = localStorage.getItem(STORAGE_KEY)
  if (!storedToken) return null
  try {
    const user = userFromToken(storedToken)
    if (user.expiresAt && user.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY)
      rememberReason('expired')
      return null
    }
    return user
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  const login = useCallback((idToken) => {
    localStorage.setItem(STORAGE_KEY, idToken)
    rememberReason(null)
    setUser(userFromToken(idToken))
    // Best-effort access log; must never block sign-in on backend availability.
    callApi('login', { idToken }).catch(() => {})
    trackEvent('login', { method: 'google' })
  }, [])

  // reason: 'expired' when the backend rejected the session, so the sign-in page can say so.
  const logout = useCallback((reason) => {
    setUser((current) => {
      if (current && reason !== 'expired') {
        callApi('logout', { idToken: current.idToken }).catch(() => {})
      }
      return null
    })
    localStorage.removeItem(STORAGE_KEY)
    rememberReason(typeof reason === 'string' ? reason : null)
    clearFileCache()
  }, [])

  // Each session picks up the semester and electives saved with the account (see lib/study.js).
  const idToken = user?.idToken
  useEffect(() => {
    if (idToken) syncStudy(idToken)
  }, [idToken])

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}
