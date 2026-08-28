import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { renderGoogleSignInButton } from '../lib/googleIdentity.js'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const buttonRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
      return
    }
    if (!CLIENT_ID) return

    renderGoogleSignInButton({
      clientId: CLIENT_ID,
      container: buttonRef.current,
      onCredential: (credential) => {
        login(credential)
        navigate('/', { replace: true })
      },
    }).catch((err) => setError(err.message))
  }, [user, login, navigate])

  if (user) return null

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border p-6 text-center">
        <h1 className="text-xl font-semibold">2AM Notes Pro</h1>
        <p className="mt-2 text-sm text-gray-500">Sign in to access your subjects</p>

        <div className="mt-6 flex justify-center">
          {CLIENT_ID ? (
            <div ref={buttonRef} />
          ) : (
            <p className="text-xs text-red-500">
              VITE_GOOGLE_CLIENT_ID is not set. See AUTH_SETUP.md.
            </p>
          )}
        </div>

        {error && <p className="mt-4 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  )
}
