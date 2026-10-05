// Small localStorage-backed stores for bookmarks, reading history and recent searches. Values are
// per browser; nothing here is sent to the backend.

import { useSyncExternalStore } from 'react'

function createStore(key, initial) {
  let value = initial
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null')
    if (saved !== null) value = saved
  } catch {
    // keep the initial value
  }
  const listeners = new Set()
  return {
    get: () => value,
    set(update) {
      value = typeof update === 'function' ? update(value) : update
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // storage blocked: still works for this visit
      }
      listeners.forEach((l) => l())
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

function useStore(store) {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

// ---------- Bookmarks: { [fileId]: { fileId, subject, savedAt } } ----------

const bookmarks = createStore('notes-pro.bookmarks', {})

export function useBookmarks() {
  return useStore(bookmarks)
}

export function toggleBookmark(file) {
  bookmarks.set((all) => {
    const next = { ...all }
    if (next[file.id]) delete next[file.id]
    else next[file.id] = { fileId: file.id, subject: file.subject, savedAt: new Date().toISOString() }
    return next
  })
}

// ---------- Reading history: newest first, { fileId, subject, openedAt, progress (0..1) } ----------

const history = createStore('notes-pro.history', [])
const HISTORY_SIZE = 30

export function useHistory() {
  return useStore(history)
}

export function recordOpen(file) {
  history.set((list) => {
    const previous = list.find((h) => h.fileId === file.id)
    const entry = {
      fileId: file.id,
      subject: file.subject,
      openedAt: new Date().toISOString(),
      progress: previous?.progress ?? 0,
    }
    return [entry, ...list.filter((h) => h.fileId !== file.id)].slice(0, HISTORY_SIZE)
  })
}

export function recordProgress(fileId, progress) {
  history.set((list) =>
    list.map((h) => (h.fileId === fileId ? { ...h, progress: Math.max(h.progress, progress) } : h)),
  )
}

// ---------- Recent searches ----------

const searches = createStore('notes-pro.searches', [])

export function useRecentSearches() {
  return useStore(searches)
}

export function rememberSearch(query) {
  const q = query.trim()
  if (q.length < 2) return
  searches.set((list) => [q, ...list.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, 8))
}

export function clearSearches() {
  searches.set([])
}
