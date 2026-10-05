// The student's semester and electives, chosen after first sign-in and editable in Settings.
// Saved with their Google account on the backend (so it follows them to any device) and kept in this
// browser too, so the app can start without waiting. The newer of the two wins.

import { useSyncExternalStore } from 'react'
import { callApi } from './api.js'
import { isSetupComplete, semesterById } from './catalog.js'

const KEY = 'notes-pro.study'
const EMPTY = { semester: null, electives: {}, updatedAt: null }

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (saved && typeof saved === 'object') return { ...EMPTY, ...saved, electives: { ...(saved.electives || {}) } }
  } catch {
    // fall through
  }
  return EMPTY
}

let current = read()
let syncing = false // true while the saved choice is being fetched after sign-in
let syncedToken = null // the session whose saved choice has been checked
let snapshot = { ...current, syncing, syncedToken }
const listeners = new Set()

function publish() {
  snapshot = { ...current, syncing, syncedToken }
  listeners.forEach((l) => l())
}

function store(next) {
  current = next
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // storage blocked: works for this visit
  }
  publish()
}

export function getStudy() {
  return current
}

// Saves a new choice here and with the student's account.
export function setStudy(choice, idToken) {
  store({ semester: choice.semester, electives: choice.electives, updatedAt: new Date().toISOString() })
  if (idToken) callApi('saveStudy', { idToken, study: current }).catch(() => {}) // kept locally either way
}

// After sign-in (or on start with a session): fetch the saved choice and use it if it's newer.
export async function syncStudy(idToken) {
  syncing = true
  publish()
  try {
    const { study } = await callApi('getStudy', { idToken })
    const local = current
    const remoteNewer = study && (!local.updatedAt || (study.updatedAt && study.updatedAt > local.updatedAt))
    if (study && (remoteNewer || !isSetupComplete(semesterById(local.semester), local.electives))) {
      store({ semester: study.semester, electives: study.electives || {}, updatedAt: study.updatedAt || null })
    } else if (!study && isSetupComplete(semesterById(local.semester), local.electives)) {
      // Chosen on this device before it was saved with the account: save it now.
      callApi('saveStudy', { idToken, study: local }).catch(() => {})
    }
  } catch {
    // Backend unreachable or older: the choice on this device still works.
  } finally {
    syncing = false
    syncedToken = idToken
    publish()
  }
}

export function useStudy() {
  const study = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => snapshot,
    () => snapshot,
  )
  const semester = semesterById(study.semester)
  return { ...study, semesterInfo: semester, complete: isSetupComplete(semester, study.electives) }
}
