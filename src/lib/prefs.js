// Reading and display preferences, kept in localStorage and applied to <html> right away.
// index.html applies the theme before React loads, so the first paint is already right.

import { useSyncExternalStore } from 'react'

export const PREFS_KEY = 'notes-pro.prefs'

export const THEMES = [
  { id: 'midnight', name: 'Deep Midnight', hint: 'Default night theme', canvas: '#0a0f1d' },
  { id: 'oled', name: 'OLED Black', hint: 'True black for AMOLED', canvas: '#000000' },
  { id: 'light', name: 'Paper Light', hint: 'For daytime', canvas: '#f6f7fb' },
  { id: 'sepia', name: 'Sepia', hint: 'Warm paper tone', canvas: '#f3ead6' },
]

export const READING_FONTS = [
  { id: 'serif', name: 'Literata', hint: 'Book serif' },
  { id: 'sans', name: 'Jakarta', hint: 'Clean UI' },
  { id: 'mono', name: 'JetBrains Mono', hint: 'Code mono' },
]

export const FONT_SIZES = [15, 17, 19, 21]
export const LINE_HEIGHTS = [1.6, 1.75, 2]
export const RATES = [0.75, 1, 1.25, 1.5, 2]

const DEFAULTS = {
  theme: 'midnight',
  readingFont: 'serif',
  fontSize: 17,
  lineHeight: 1.75,
  measure: true, // keep lines at about 68 characters
  voiceURI: null,
  rate: 1,
  autoScroll: true,
}

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null')
    return { ...DEFAULTS, ...(saved && typeof saved === 'object' ? saved : {}) }
  } catch {
    return { ...DEFAULTS }
  }
}

let current = read()
const listeners = new Set()

function apply(prefs) {
  const theme = THEMES.find((t) => t.id === prefs.theme) || THEMES[0]
  document.documentElement.dataset.theme = theme.id
  // The browser bar (and the installed app's title bar) matches the page.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.canvas)
}

export function getPrefs() {
  return current
}

export function setPrefs(patch) {
  current = { ...current, ...(typeof patch === 'function' ? patch(current) : patch) }
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(current))
  } catch {
    // Storage blocked: the change still applies for this visit.
  }
  apply(current)
  listeners.forEach((listener) => listener())
}

// Back to the defaults, keeping the theme and the chosen voice.
export function resetReadingPrefs() {
  setPrefs((prefs) => ({ ...DEFAULTS, theme: prefs.theme, voiceURI: prefs.voiceURI }))
}

export function usePrefs() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getPrefs,
    getPrefs,
  )
}

const FONT_FAMILY = { serif: 'var(--font-serif)', sans: 'var(--font-sans)', mono: 'var(--font-mono)' }

// CSS variables the reading view uses (see .note-prose in index.css).
export function readingStyleFrom(prefs) {
  return {
    '--reading-font': FONT_FAMILY[prefs.readingFont] || FONT_FAMILY.serif,
    '--reading-size': `${prefs.fontSize}px`,
    '--reading-leading': prefs.lineHeight,
  }
}

export function isDarkTheme(theme) {
  return theme === 'midnight' || theme === 'oled'
}

apply(current)
