// "Install the app" dialog, shown once a visitor has spent 10 minutes in the app (only time with the tab
// visible counts, added up across visits). "Not now" asks again after another 10 minutes on a later visit;
// "Don't remind me again" stops it for good. Never shown when installed or when the browser can't install.

import { Download, Share, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { trackEvent } from '../lib/analytics.js'
import { promptInstall, useInstallState } from '../lib/install.js'
import { Logo } from './ui.jsx'

const KEY = 'notes-pro.install-reminder'
const SHOWN_KEY = 'notes-pro.install-reminder-shown' // sessionStorage: at most once per visit
const AFTER_MS = 10 * 60 * 1000
const TICK_MS = 15 * 1000

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

function write(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    // storage blocked: the reminder just won't remember
  }
}

function shownThisVisit() {
  try {
    return sessionStorage.getItem(SHOWN_KEY) === '1'
  } catch {
    return false
  }
}

export default function InstallPrompt() {
  const state = useInstallState() // 'installed' | 'prompt' | 'ios' | 'unavailable'
  const canOffer = (state === 'prompt' || state === 'ios') && !read().never && !shownThisVisit()
  const [open, setOpen] = useState(false)
  const [never, setNever] = useState(false)
  const dialog = useRef(null)

  // Adds up visible time; opens the dialog once it passes AFTER_MS.
  useEffect(() => {
    if (!canOffer) return
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      const saved = read()
      const activeMs = (saved.activeMs || 0) + TICK_MS
      write({ ...saved, activeMs })
      if (activeMs < AFTER_MS) return
      clearInterval(timer)
      try {
        sessionStorage.setItem(SHOWN_KEY, '1')
      } catch {
        // ignore
      }
      setOpen(true)
      trackEvent('install_prompt', { action: 'shown', platform: state })
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [canOffer, state])

  useEffect(() => {
    if (open && !dialog.current.open) dialog.current.showModal()
  }, [open])

  // Closing for any reason: start counting again, or stop for good when the box is ticked.
  function close(action) {
    write(never ? { never: true } : { activeMs: 0 })
    trackEvent('install_prompt', { action: never ? `${action}_never` : action, platform: state })
    setOpen(false)
  }

  async function install() {
    close('install')
    await promptInstall()
  }

  if (!open) return null
  return (
    <dialog
      ref={dialog}
      onCancel={(e) => {
        e.preventDefault()
        close('dismiss')
      }}
      aria-labelledby="install-title"
      className="m-auto w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-line-strong bg-surface p-0 text-ink shadow-lg backdrop:bg-scrim"
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <Logo className="size-11 shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 id="install-title" className="text-heading">
              Install 2AM Notes Pro
            </h2>
            <p className="mt-1 text-label text-ink-2">
              Open it like an app, full screen, straight from your home screen.
            </p>
          </div>
          <button type="button" className="icon-btn -mt-2 -mr-2" onClick={() => close('dismiss')} aria-label="Close">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {state === 'ios' && (
          <p className="mt-4 rounded-xl bg-surface-2 px-3 py-2.5 text-label text-ink">
            In Safari, tap <Share className="inline size-4 align-text-bottom" aria-label="Share" /> then “Add to Home
            Screen”.
          </p>
        )}

        <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-label text-ink-2">
          <input type="checkbox" checked={never} onChange={(e) => setNever(e.target.checked)} className="size-4 accent-primary" />
          Don&apos;t remind me again
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => close('dismiss')}>
            {state === 'ios' ? 'Close' : 'Not now'}
          </button>
          {state === 'prompt' && (
            <button type="button" className="btn-primary" onClick={install}>
              <Download className="size-4" aria-hidden="true" /> Install
            </button>
          )}
        </div>
      </div>
    </dialog>
  )
}
