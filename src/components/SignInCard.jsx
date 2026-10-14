// Google sign-in, shared by the welcome page and the sign-in page.

import { AlertTriangle, Clock, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { SIGNOUT_REASON_KEY } from '../context/authContext.js'
import { renderGoogleSignInButton } from '../lib/googleIdentity.js'
import { demoToken, isDemo } from '../lib/demoMode.js'
import { isDarkTheme, usePrefs } from '../lib/prefs.js'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Agreeing to the usage note is required to sign in; it's remembered on this device.
const CONSENT_KEY = 'notes-pro.consent'

function readConsent() {
  try {
    return Boolean(localStorage.getItem(CONSENT_KEY))
  } catch {
    return false
  }
}

function saveConsent(agreed) {
  try {
    if (agreed) localStorage.setItem(CONSENT_KEY, new Date().toISOString())
    else localStorage.removeItem(CONSENT_KEY)
  } catch {
    // storage blocked: asked again next time
  }
}

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
  const [agreed, setAgreed] = useState(readConsent)
  const demo = isDemo()

  // The Google button is only drawn once the student has agreed to the note below it.
  useEffect(() => {
    if (demo || !CLIENT_ID || !agreed || !buttonRef.current) return
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
  }, [demo, agreed, theme, login, onSignedIn])

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
          disabled={!agreed}
          onClick={() => {
            login(demoToken())
            onSignedIn?.()
          }}
        >
          Continue with the demo account
        </button>
      ) : CLIENT_ID && agreed ? (
        // color-scheme: light keeps Google's button iframe transparent; under the dark themes the browser
        // otherwise paints it an opaque white box around the rounded button.
        <div ref={buttonRef} className="flex min-h-11 w-full justify-center" style={{ colorScheme: 'light' }} />
      ) : CLIENT_ID ? (
        <button
          type="button"
          disabled
          aria-describedby="consent-hint"
          className="flex min-h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-full border border-line bg-surface-2 text-body font-medium text-ink-2"
        >
          <span className="grid size-6 place-items-center rounded-full bg-surface font-bold text-ink-3" aria-hidden="true">
            G
          </span>
          Sign in with Google
        </button>
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

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface-2 p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary-ink">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => {
            setAgreed(e.target.checked)
            saveConsent(e.target.checked)
          }}
          className="mt-0.5 size-5 shrink-0 accent-[var(--c-primary)]"
        />
        <span className="text-label text-ink">
          I agree that 2AM Notes Pro records how it's used: <strong>anonymous usage statistics</strong> with Google
          Analytics, and a <strong>sign-in log</strong> with my name, email, device and browser, and the files I open.
        </span>
      </label>
      {!agreed && (
        <p id="consent-hint" className="mt-2 text-caption text-ink-2">
          Tick the box to sign in.
        </p>
      )}

      <p className="mt-3 flex items-start gap-2 text-caption text-ink-2">
        <ShieldCheck className="mt-px size-4 shrink-0 text-teal-ink" aria-hidden="true" />
        Only signed-in students can open the notes. The log is private to the portal's owner.
      </p>
    </div>
  )
}
