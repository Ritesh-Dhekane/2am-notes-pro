// "Install app": Chrome/Edge/Android offer a prompt (beforeinstallprompt), which has to be caught
// as soon as the page loads, so this module is imported from main.jsx. iPhones and iPads have no
// prompt; there the app is added from the Share menu.

import { useSyncExternalStore } from 'react'

let deferred = null
let installed = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
const listeners = new Set()
const notify = () => listeners.forEach((l) => l())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred = event
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    installed = true
    notify()
  })
}

const isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

// 'installed' | 'prompt' (we can show the browser's install dialog) | 'ios' | 'unavailable'
function getState() {
  if (installed) return 'installed'
  if (deferred) return 'prompt'
  if (isIos) return 'ios'
  return 'unavailable'
}

export function useInstallState() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getState,
    getState,
  )
}

export async function promptInstall() {
  if (!deferred) return
  const event = deferred
  deferred = null
  notify()
  await event.prompt()
}
