// Docked audio bar for read-aloud: play/pause, sentence back/forward, speed, stop.

import { AudioLines, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react'
import { pickVoice, useVoices } from '../lib/narrator.js'
import { RATES, usePrefs } from '../lib/prefs.js'

export default function ListenBar({ narration, title }) {
  const { voiceURI } = usePrefs()
  const voices = useVoices()
  const voice = pickVoice(voices, voiceURI)
  const { status, index, total, rate } = narration
  const playing = status === 'playing'
  const progress = total ? (index + (playing ? 0.5 : 0)) / total : 0

  if (status === 'idle') return null

  return (
    <>
      {/* Room at the end of the page so the docked bar never covers the last lines. */}
      <div className="h-24" aria-hidden="true" />
      <div
        role="region"
        aria-label="Read aloud"
        className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-xl rounded-3xl border border-line-strong bg-surface-2 p-2 shadow-float lg:bottom-6 lg:left-[calc(16rem+1.5rem)]"
      >
        <div className="flex items-center gap-1">
          <span
            className="hidden size-10 shrink-0 place-items-center rounded-full bg-teal/15 text-teal-ink sm:grid"
            aria-hidden="true"
          >
            <AudioLines className="size-5" />
          </span>
          <span className="min-w-0 flex-1 px-2">
            <span className="block truncate text-label font-semibold text-ink">{title}</span>
            <span className="block truncate font-mono text-caption text-ink-3">
              {rate}× · {voice ? voice.name.replace(/^Microsoft |^Google /, '') : 'Default voice'} ·{' '}
              {Math.min(index + 1, total)}/{total}
            </span>
          </span>
          <button type="button" className="icon-btn" onClick={() => narration.skip(-1)} aria-label="Previous sentence">
            <SkipBack className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={playing ? narration.pause : narration.resume}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-on-primary"
            aria-label={playing ? 'Pause' : 'Resume'}
          >
            {playing ? <Pause className="size-5" aria-hidden="true" /> : <Play className="size-5" aria-hidden="true" />}
          </button>
          <button type="button" className="icon-btn" onClick={() => narration.skip(1)} aria-label="Next sentence">
            <SkipForward className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="h-11 min-w-12 rounded-xl px-2 font-mono text-label font-semibold text-teal-ink hover:bg-surface"
            onClick={() => narration.setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])}
            aria-label={`Speed ${rate}×, change speed`}
          >
            {rate}×
          </button>
          <button type="button" className="icon-btn" onClick={narration.stop} aria-label="Stop reading aloud">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="mx-3 mt-1.5 mb-0.5 h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <div
            className="h-full rounded-full bg-teal transition-[width] duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </>
  )
}
