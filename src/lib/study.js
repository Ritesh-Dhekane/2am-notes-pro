// The student's semester and electives, chosen after first sign-in and editable in Settings.
// Kept in this browser, like the other preferences.

import { useSyncExternalStore } from 'react'
import { isSetupComplete, semesterById } from './catalog.js'

const KEY = 'notes-pro.study'
const EMPTY = { semester: null, electives: {} }

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
const listeners = new Set()

export function getStudy() {
  return current
}

export function setStudy(patch) {
  current = { ...current, ...(typeof patch === 'function' ? patch(current) : patch) }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // storage blocked: works for this visit
  }
  listeners.forEach((l) => l())
}

export function useStudy() {
  const study = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getStudy,
    getStudy,
  )
  const semester = semesterById(study.semester)
  return { ...study, semesterInfo: semester, complete: isSetupComplete(semester, study.electives) }
}
