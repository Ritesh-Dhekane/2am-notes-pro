// Read-aloud for notes with the browser's own voices (Web Speech API). The note is split into
// sentences and spoken one at a time, which keeps pause, skip and speed changes reliable (Chrome
// cuts off long utterances, and pause/resume is flaky on Android). The sentence being read is
// highlighted with the CSS Custom Highlight API where available, otherwise its paragraph is.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { trackEvent } from './analytics.js'
import { getPrefs } from './prefs.js'

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

// ---------- Voices ----------

let voices = []
const voiceListeners = new Set()
function refreshVoices() {
  voices = window.speechSynthesis.getVoices().slice()
  voiceListeners.forEach((l) => l())
}
if (speechSupported) {
  refreshVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices)
}

export function useVoices() {
  return useSyncExternalStore(
    (listener) => {
      voiceListeners.add(listener)
      return () => voiceListeners.delete(listener)
    },
    () => voices,
    () => voices,
  )
}

// English voices first, Indian English and "natural"/neural ones preferred.
export function englishVoices(list) {
  const score = (v) =>
    (v.lang === 'en-IN' ? 4 : 0) + (/natural|neural|google|online/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1)
  return list.filter((v) => /^en(-|_|$)/i.test(v.lang)).sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))
}

export function pickVoice(list, uri) {
  return list.find((v) => v.voiceURI === uri) || englishVoices(list)[0] || list[0] || null
}

// ---------- Splitting the note into sentences ----------

const BLOCKS = 'h2, h3, p, li'

function sentencesOf(text) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?:])(?<!(?:^|\s)(?:\d{1,3}|[A-Za-z]|e\.g|i\.e|vs|etc)\.)\s+(?=[A-Z0-9"“(])/)
    .map((s) => s.trim())
    .filter((s) => /[\p{L}\p{N}]/u.test(s))
}

function segmentsIn(root) {
  const segments = []
  for (const el of root.querySelectorAll(BLOCKS)) {
    if (el.closest('.code-block, .table-wrap')) continue
    if (el.querySelector(BLOCKS)) continue // e.g. a list item holding paragraphs: read the paragraphs
    let from = 0
    const full = el.textContent
    for (const text of sentencesOf(full)) {
      const start = full.replace(/\s+/g, ' ').indexOf(text, from)
      segments.push({ el, text, start: Math.max(0, start) })
      from = Math.max(from, start + text.length)
    }
  }
  return segments
}

// A Range covering characters [start, start+length) of an element's normalised text.
function rangeFor(el, start, length) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  let pos = 0
  let startSet = false
  let prevSpace = true
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const value = node.nodeValue
    for (let i = 0; i < value.length; i++) {
      const space = /\s/.test(value[i])
      if (space && prevSpace) continue // collapsed whitespace doesn't count
      if (!startSet && pos === start) {
        range.setStart(node, i)
        startSet = true
      }
      pos++
      prevSpace = space
      if (startSet && pos === start + length) {
        range.setEnd(node, i + 1)
        return range
      }
    }
  }
  return startSet ? range : null
}

const canHighlight = typeof CSS !== 'undefined' && 'highlights' in CSS

function clearHighlight(state) {
  state.el?.classList.remove('reading-now')
  if (canHighlight) CSS.highlights.delete('narration')
}

function showHighlight(segment, autoScroll) {
  segment.el.classList.add('reading-now')
  if (canHighlight) {
    const range = rangeFor(segment.el, segment.start, segment.text.length)
    if (range) CSS.highlights.set('narration', new Highlight(range))
  }
  if (autoScroll) segment.el.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

// ---------- Playback ----------

export function useNarration(rootRef, resetKey) {
  const [status, setStatus] = useState('idle') // idle | playing | paused
  const [index, setIndex] = useState(0)
  const [total, setTotal] = useState(0)
  const [rate, setRateState] = useState(() => getPrefs().rate)
  const segmentsRef = useRef([])
  const runRef = useRef(0) // bumps on every start/stop so stale "end" events are ignored
  const shownRef = useRef({})
  const rateRef = useRef(rate)
  const speakRef = useRef(null) // lets an utterance's "end" handler start the next sentence

  const speakFrom = useCallback((i) => {
    const segments = segmentsRef.current
    const run = ++runRef.current
    window.speechSynthesis.cancel()
    clearHighlight(shownRef.current)
    if (i >= segments.length) {
      setStatus('idle')
      setIndex(0)
      return
    }
    const segment = segments[i]
    const prefs = getPrefs()
    const utterance = new SpeechSynthesisUtterance(segment.text)
    const voice = pickVoice(voices, prefs.voiceURI)
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    }
    utterance.rate = rateRef.current
    utterance.onend = () => {
      if (runRef.current === run) speakRef.current(i + 1)
    }
    utterance.onerror = (event) => {
      if (runRef.current !== run || event.error === 'interrupted' || event.error === 'canceled') return
      setStatus('idle')
    }
    shownRef.current = { el: segment.el }
    showHighlight(segment, prefs.autoScroll)
    setIndex(i)
    setStatus('playing')
    window.speechSynthesis.speak(utterance)
  }, [])
  useEffect(() => {
    speakRef.current = speakFrom
  }, [speakFrom])

  const play = useCallback(() => {
    if (!rootRef.current) return
    segmentsRef.current = segmentsIn(rootRef.current)
    trackEvent('listen_start', { sentences: segmentsRef.current.length })
    setTotal(segmentsRef.current.length)
    speakFrom(0)
  }, [rootRef, speakFrom])

  const pause = useCallback(() => {
    runRef.current++
    window.speechSynthesis.cancel()
    setStatus('paused')
  }, [])

  const resume = useCallback(() => speakFrom(index), [speakFrom, index])
  const skip = useCallback(
    (delta) => speakFrom(Math.min(segmentsRef.current.length - 1, Math.max(0, index + delta))),
    [speakFrom, index],
  )

  const stop = useCallback(() => {
    runRef.current++
    window.speechSynthesis.cancel()
    clearHighlight(shownRef.current)
    setStatus('idle')
    setIndex(0)
  }, [])

  const setRate = useCallback(
    (next) => {
      rateRef.current = next
      setRateState(next)
      if (status === 'playing') speakFrom(index) // restart the sentence at the new speed
    },
    [status, index, speakFrom],
  )

  // Leaving the note (or opening another) stops the narration.
  useEffect(() => stop, [resetKey, stop])

  return { status, index, total, rate, play, pause, resume, skip, stop, setRate }
}
