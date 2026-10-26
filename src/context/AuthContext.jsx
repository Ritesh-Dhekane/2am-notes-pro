import { useCallback, useEffect, useState } from 'react'
import { decodeJwtPayload } from '../lib/jwt.js'
import { callApi } from '../lib/api.js'
import { trackEvent } from '../lib/analytics.js'
import { clearFileCache } from '../lib/library.js'
import { syncStudy } from '../lib/study.js'
import { ADMIN_KEY, AuthContext, SIGNOUT_REASON_KEY, STORAGE_KEY } from './authContext.js'

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

// Sign-in starts with Google's ID token (about an hour), then swaps it for the backend's 7-day session.
// An expired one is dropped on load, and the sign-in page explains why instead of the first request failing.
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

// Whether the account is an admin, as the backend last said: { email, isAdmin }. Only decides whether
// the Admin link shows; every admin request is checked again on the server.
function readAdmin() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY) || 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [admin, setAdmin] = useState(readAdmin)

  const rememberAdmin = useCallback((email, isAdmin) => {
    const entry = { email, isAdmin: Boolean(isAdmin) }
    try {
      localStorage.setItem(ADMIN_KEY, JSON.stringify(entry))
    } catch {
      // storage blocked: works for this visit
    }
    setAdmin(entry)
  }, [])

  // reason: 'expired' or 'blocked' when the backend rejected the session, so the sign-in page can say so.
  const logout = useCallback((reason) => {
    setUser((current) => {
      if (current && typeof reason !== 'string') {
        callApi('logout', { idToken: current.idToken }).catch(() => {})
      }
      return null
    })
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(ADMIN_KEY)
    setAdmin(null)
    rememberReason(typeof reason === 'string' ? reason : null)
    clearFileCache()
  }, [])

  const login = useCallback((idToken) => {
    localStorage.setItem(STORAGE_KEY, idToken)
    rememberReason(null)
    const signedIn = userFromToken(idToken)
    setUser(signedIn)
    // Logs the sign-in and returns the 7-day session. Best effort: sign-in never waits on the backend,
    // and without a session the Google token keeps working until it expires.
    callApi('login', { idToken })
      .then(({ session, isAdmin }) => {
        if (localStorage.getItem(STORAGE_KEY) !== idToken) return // signed out meanwhile
        rememberAdmin(signedIn.email, isAdmin)
        if (!session) return
        localStorage.setItem(STORAGE_KEY, session)
        setUser(userFromToken(session))
      })
      .catch((err) => {
        // A blocked account is signed straight out, to the blocked notice.
        if (err.message === 'access_blocked' && localStorage.getItem(STORAGE_KEY) === idToken) logout('blocked')
      })
    trackEvent('login', { method: 'google' })
  }, [rememberAdmin, logout])

  // Each session picks up the semester and electives saved with the account (see lib/study.js).
  const idToken = user?.idToken
  useEffect(() => {
    if (idToken) syncStudy(idToken)
  }, [idToken])

  // Signed in before admin roles existed (or on a new device without the answer yet): ask once.
  const email = user?.email
  const known = admin?.email === email
  useEffect(() => {
    if (!idToken || known) return
    callApi('verify', { idToken })
      .then(({ isAdmin }) => localStorage.getItem(STORAGE_KEY) === idToken && rememberAdmin(email, isAdmin))
      .catch(() => {})
  }, [idToken, email, known, rememberAdmin])

  // null while unknown, then true or false.
  const isAdmin = user && known ? admin.isAdmin : null

  return <AuthContext.Provider value={{ user, login, logout, isAdmin }}>{children}</AuthContext.Provider>
}
