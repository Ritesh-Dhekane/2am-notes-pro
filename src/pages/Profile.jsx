// Profile & Settings: the Google account, theme, reading typography and read-aloud defaults.
// Everything saves straight away, on this device.

import { AudioLines, Check, Download, LogOut, Palette, Play, RotateCcw, Share, ShieldCheck, Smartphone, Type } from 'lucide-react'
import { SettingsSection, Segmented, Switch } from '../components/Settings.jsx'
import { Avatar, Card } from '../components/ui.jsx'
import { useAuth } from '../context/useAuth.js'
import { useLibrary } from '../context/libraryContext.js'
import { isDemo } from '../lib/demoMode.js'
import { promptInstall, useInstallState } from '../lib/install.js'
import { englishVoices, pickVoice, speechSupported, useVoices } from '../lib/narrator.js'
import {
  FONT_SIZES,
  LINE_HEIGHTS,
  RATES,
  READING_FONTS,
  readingStyleFrom,
  resetReadingPrefs,
  setPrefs,
  THEMES,
  usePrefs,
} from '../lib/prefs.js'
import { useBookmarks, useHistory } from '../lib/store.js'

const SPACING_NAMES = { 1.6: 'Compact', 1.75: 'Cozy', 2: 'Relaxed' }
const FONT_PREVIEW = { serif: 'var(--font-serif)', sans: 'var(--font-sans)', mono: 'var(--font-mono)' }

function Account() {
  const { user } = useAuth()
  const { library } = useLibrary()
  const history = useHistory()
  const bookmarks = useBookmarks()
  const saved = Object.keys(bookmarks).filter((id) => !library || library.byId.has(id)).length
  const stats = [
    { label: 'Files opened', value: history.length },
    { label: 'Saved', value: saved },
    { label: 'Subjects', value: library ? library.subjects.length : '–' },
  ]
  return (
    <Card className="flex flex-col gap-5 p-5">
      <div className="flex items-center gap-4">
        <Avatar user={user} className="size-16" />
        <div className="min-w-0">
          <p className="truncate text-title">{user?.name}</p>
          <p className="truncate font-mono text-caption text-ink-2">{user?.email}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-caption font-medium text-teal-ink">
            <ShieldCheck className="size-4" aria-hidden="true" />
            {isDemo() ? 'Demo account (development only)' : 'Signed in with Google'}
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-surface-2 px-2 py-3 text-center">
            <dt className="text-caption text-ink-2">{s.label}</dt>
            <dd className="order-first font-mono text-title text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

function Appearance() {
  const { theme } = usePrefs()
  return (
    <SettingsSection icon={Palette} title="Theme" description="Midnight is tuned for late-night reading.">
      <fieldset>
        <legend className="sr-only">Theme</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEMES.map((t) => {
            const on = t.id === theme
            return (
              <label
                key={t.id}
                className={`relative flex cursor-pointer flex-col gap-2 rounded-xl border p-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-ink ${
                  on ? 'border-primary ring-1 ring-primary' : 'border-line hover:border-line-strong'
                }`}
              >
                <input type="radio" name="theme" value={t.id} checked={on} onChange={() => setPrefs({ theme: t.id })} className="sr-only" />
                <span data-theme={t.id} className="flex h-16 flex-col gap-1.5 rounded-lg border border-line bg-canvas p-2" aria-hidden="true">
                  <span className="h-1.5 w-8 rounded-full bg-primary" />
                  <span className="h-1.5 w-full rounded-full bg-line-strong" />
                  <span className="h-1.5 w-3/4 rounded-full bg-line-strong" />
                  <span className="mt-auto h-3 w-full rounded bg-surface-2" />
                </span>
                <span className="px-1">
                  <span className="block text-label font-semibold text-ink">{t.name}</span>
                  <span className="block text-caption text-ink-3">{t.hint}</span>
                </span>
                {on && (
                  <span className="absolute top-3 right-3 grid size-5 place-items-center rounded-full bg-primary text-on-primary" aria-hidden="true">
                    <Check className="size-3.5" />
                  </span>
                )}
              </label>
            )
          })}
        </div>
      </fieldset>
    </SettingsSection>
  )
}

function Reading() {
  const prefs = usePrefs()
  return (
    <SettingsSection icon={Type} title="Reading" description="How notes look in the reader.">
      <Segmented
        legend="Typeface"
        name="reading-font"
        value={prefs.readingFont}
        onChange={(readingFont) => setPrefs({ readingFont })}
        options={READING_FONTS.map((f) => ({ value: f.id, label: f.name, hint: f.hint, style: { fontFamily: FONT_PREVIEW[f.id] } }))}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Segmented
          legend="Text size"
          name="font-size"
          value={prefs.fontSize}
          onChange={(fontSize) => setPrefs({ fontSize })}
          options={FONT_SIZES.map((size) => ({ value: size, label: `${size}px` }))}
        />
        <Segmented
          legend="Line spacing"
          name="line-height"
          value={prefs.lineHeight}
          onChange={(lineHeight) => setPrefs({ lineHeight })}
          options={LINE_HEIGHTS.map((h) => ({ value: h, label: SPACING_NAMES[h] || h, hint: `${h}×` }))}
        />
      </div>
      <Switch
        label="Comfortable line length"
        hint="Keep lines to about 70 characters on wide screens."
        checked={prefs.measure}
        onChange={(measure) => setPrefs({ measure })}
      />
      <figure className="rounded-xl border border-line bg-code p-4">
        <figcaption className="mb-2 font-mono text-caption text-ink-3">Preview</figcaption>
        <div className="note-prose" style={readingStyleFrom(prefs)}>
          <p>
            An <strong>exception</strong> is an abnormal condition that arises while a program is running and disrupts the
            normal flow of instructions.
          </p>
        </div>
      </figure>
    </SettingsSection>
  )
}

function sample(voice, rate) {
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance('This is how your notes will sound when you listen to them.')
  if (voice) {
    utterance.voice = voice
    utterance.lang = voice.lang
  }
  utterance.rate = rate
  window.speechSynthesis.speak(utterance)
}

function Audio() {
  const prefs = usePrefs()
  const voices = useVoices()
  const english = englishVoices(voices)
  const choices = english.length ? english : voices
  const voice = pickVoice(voices, prefs.voiceURI)

  return (
    <SettingsSection icon={AudioLines} title="Read aloud" description="Defaults for listening to notes. Voices come from your device.">
      {!speechSupported ? (
        <p className="text-body text-ink-2">This browser can't read notes aloud.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor="voice" className="font-mono text-caption font-medium tracking-wide text-ink-3 uppercase">
              Voice
            </label>
            {choices.length === 0 ? (
              <p className="text-label text-ink-2">No voices found yet. Your browser may still be loading them.</p>
            ) : (
              <div className="flex gap-2">
                <select
                  id="voice"
                  value={voice?.voiceURI ?? ''}
                  onChange={(e) => setPrefs({ voiceURI: e.target.value })}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 text-body text-ink"
                >
                  {choices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
                <button type="button" className="btn-secondary shrink-0" onClick={() => sample(voice, prefs.rate)}>
                  <Play className="size-4 text-teal-ink" aria-hidden="true" /> Sample
                </button>
              </div>
            )}
          </div>
          <Segmented
            legend="Speed"
            name="rate"
            value={prefs.rate}
            onChange={(rate) => setPrefs({ rate })}
            options={RATES.map((r) => ({ value: r, label: `${r}×` }))}
          />
          <Switch
            label="Follow along"
            hint="Scroll to the sentence being read."
            checked={prefs.autoScroll}
            onChange={(autoScroll) => setPrefs({ autoScroll })}
          />
        </>
      )}
    </SettingsSection>
  )
}

function Install() {
  const state = useInstallState()
  if (state === 'unavailable') return null
  return (
    <Card className="flex items-start gap-4 p-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-ink" aria-hidden="true">
        <Smartphone className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-heading">{state === 'installed' ? 'App installed' : 'Install the app'}</h2>
        <p className="text-label text-ink-2">
          {state === 'installed' && 'You are using 2AM Notes Pro as an app.'}
          {state === 'prompt' && 'Open it from your home screen or dock, like any other app.'}
          {state === 'ios' && (
            <>
              In Safari, tap <Share className="inline size-4 align-text-bottom" aria-label="Share" /> then “Add to Home Screen”.
            </>
          )}
        </p>
        {state === 'prompt' && (
          <button type="button" className="btn-primary mt-3" onClick={promptInstall}>
            <Download className="size-4" aria-hidden="true" /> Install
          </button>
        )}
      </div>
    </Card>
  )
}

function SignOut() {
  const { user, logout } = useAuth()
  const ends = user?.expiresAt ? new Date(user.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null
  return (
    <Card className="flex flex-col gap-3 p-5">
      {ends && <p className="text-label text-ink-2">This sign-in lasts until {ends}; after that Google asks you again.</p>}
      <button
        type="button"
        onClick={() => logout()}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[color-mix(in_oklab,var(--c-danger)_40%,transparent)] px-4 text-body font-semibold text-danger hover:bg-[color-mix(in_oklab,var(--c-danger)_10%,transparent)]"
      >
        <LogOut className="size-5" aria-hidden="true" /> Sign out
      </button>
    </Card>
  )
}

export default function Profile() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-display">Profile & Settings</h1>
          <p className="mt-1 text-body text-ink-2">Changes save automatically on this device.</p>
        </div>
        <button type="button" className="btn-secondary self-start bg-surface sm:self-auto" onClick={resetReadingPrefs}>
          <RotateCcw className="size-4" aria-hidden="true" /> Reset reading defaults
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_1fr] lg:items-start">
        <div className="lg:col-start-1 lg:row-start-1">
          <Account />
        </div>
        <div className="flex min-w-0 flex-col gap-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Appearance />
          <Reading />
          <Audio />
        </div>
        <div className="flex flex-col gap-5 lg:col-start-1 lg:row-start-2">
          <Install />
          <SignOut />
        </div>
      </div>
    </div>
  )
}
