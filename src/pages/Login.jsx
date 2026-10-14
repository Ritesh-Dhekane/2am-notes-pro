import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import Welcome from './Welcome.jsx'

// Where protected pages send signed-out visitors (and where an expired session lands): the welcome
// page, which goes back to the page they wanted once they sign in.
export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const next = location.state?.from || '/'

  const goNext = useCallback(() => navigate(next, { replace: true }), [navigate, next])

  useEffect(() => {
    if (user) goNext()
  }, [user, goNext])

  if (user) return null
  return <Welcome onSignedIn={goNext} />
}
