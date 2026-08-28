import { useState } from 'react'
import { decodeJwtPayload } from '../lib/jwt.js'
import { callApi } from '../lib/api.js'
import { trackEvent } from '../lib/analytics.js'
import { AuthContext, STORAGE_KEY } from './authContext.js'

function userFromToken(idToken) {
  const payload = decodeJwtPayload(idToken)
  return {
    idToken,
    name: payload.name,
    email: payload.email,
    picture: payload.picture,
  }
}

function readStoredUser() {
  const storedToken = localStorage.getItem(STORAGE_KEY)
  if (!storedToken) return null
  try {
    return userFromToken(storedToken)
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  function login(idToken) {
    localStorage.setItem(STORAGE_KEY, idToken)
    setUser(userFromToken(idToken))
    // Best-effort access log; must never block sign-in on backend availability.
    callApi('login', { idToken }).catch(() => {})
    trackEvent('login', { method: 'google' })
  }

  function logout() {
    if (user) {
      callApi('logout', { idToken: user.idToken }).catch(() => {})
    }
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
