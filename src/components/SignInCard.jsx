// Google sign-in, shared by the welcome page and the sign-in page.

import { AlertTriangle, Clock, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { SIGNOUT_REASON_KEY } from '../context/authContext.js'
import { renderGoogleSignInButton } from '../lib/googleIdentity.js'
import { demoToken, isDemo } from '../lib/demoMode.js'
import { isDarkTheme, usePrefs } from '../lib/prefs.js'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function readReason() {
  try {
    return sessionStorage.getItem(SIGNOUT_REASON_KEY)
  } catch {
    return null
  }
}

export default function SignInCard({ onSignedIn }) {
  const { login } = useAuth()
  const { theme } = usePrefs()
  const buttonRef = useRef(null)
  const [error, setError] = useState(null)
  const [reason] = useState(readReason)
  const demo = isDemo()

  useEffect(() => {
    if (demo || !CLIENT_ID || !buttonRef.current) return
    const width = Math.min(400, Math.max(220, buttonRef.current.clientWidth))
    renderGoogleSignInButton({
      clientId: CLIENT_ID,
      container: buttonRef.current,
      theme: isDarkTheme(theme) ? 'filled_black' : 'outline',
      width,
      onCredential: (credential) => {
        if (!credential) {
          setError("Sign-in didn't work. Please try again.")
          return
        }
        login(credential)
        onSignedIn?.()
      },
    }).catch(() => setError("Google sign-in couldn't load. Check your connection and reload the page."))
  }, [demo, theme, login, onSignedIn])

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-1 text-heading">Sign in to open the notes</h2>
      <p className="mb-4 text-label text-ink-2">After signing in you pick your semester and electives.</p>

      {reason === 'expired' && (
        <p role="status" className="mb-4 flex items-start gap-2 rounded-xl bg-primary-soft px-3 py-2.5 text-label text-ink">
          <Clock className="mt-px size-4 shrink-0 text-primary-ink" aria-hidden="true" />
          Your session expired. Please sign in again.
        </p>
      )}

      {demo ? (
        <button
          type="button"
          className="btn-primary w-full"
          onClick={() => {
            login(demoToken())
            onSignedIn?.()
          }}
        >
          Continue with the demo account
        </button>
      ) : CLIENT_ID ? (
        // color-scheme: light keeps Google's button iframe transparent; under the dark themes the browser
        // otherwise paints it an opaque white box around the rounded button.
        <div ref={buttonRef} className="flex min-h-11 w-full justify-center" style={{ colorScheme: 'light' }} />
      ) : (
        <p className="rounded-xl bg-surface-2 px-3 py-3 text-label text-ink-2">
          Google sign-in isn't set up yet (VITE_GOOGLE_CLIENT_ID is missing).
          {import.meta.env.DEV && ' Open the app with ?demo to try it with sample data.'}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 flex items-start gap-2 text-label text-danger">
          <AlertTriangle className="mt-px size-4 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}

      <p className="mt-4 flex items-start gap-2 text-label text-ink-2">
        <ShieldCheck className="mt-px size-4 shrink-0 text-teal-ink" aria-hidden="true" />
        Only signed-in students can open the notes. Your Google account is used just to check who you are.
      </p>
    </div>
  )
}
