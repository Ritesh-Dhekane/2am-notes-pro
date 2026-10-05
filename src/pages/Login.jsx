import { useCallback, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import SignInCard from '../components/SignInCard.jsx'
import { ThemeToggle } from '../components/Shell.jsx'
import { Logo } from '../components/ui.jsx'
import { useAuth } from '../context/useAuth.js'

// Standalone sign-in, used when a signed-out visitor opens a protected page (or a session expired).
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

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex justify-end px-5 py-4">
        <ThemeToggle />
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-5 pb-16 sm:items-center">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-6 flex flex-col items-center gap-3 text-center">
            <Logo className="size-14" />
            <span>
              <span className="block text-display">2AM Notes Pro</span>
              <span className="text-body text-ink-2">Sign in to continue</span>
            </span>
          </Link>
          <h1 className="sr-only">Sign in</h1>
          <SignInCard onSignedIn={goNext} />
        </div>
      </main>
    </div>
  )
}
