// Shared parts of the public SPPU syllabus pages: the page frame, Share, the SPPU credit, entry rows.

import { BookOpen, Check, ChevronRight, ExternalLink, Share2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { trackEvent } from '../lib/analytics.js'
import { notesCourseOf } from '../lib/catalog.js'
import { describeEntry, libraryUrl } from '../lib/syllabus.js'
import { ThemeToggle } from './Shell.jsx'
import { Logo, MadeBy } from './ui.jsx'

export function SyllabusFrame({ children }) {
  const { user } = useAuth()
  return (
    <div className="min-h-svh">
      <header className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <Logo className="size-8" />
          <span className="truncate text-heading">2AM Notes Pro</span>
        </Link>
        <span className="flex items-center gap-1">
          <Link to="/syllabus" className="rounded-lg px-2 py-1 text-label font-semibold text-ink-2 hover:text-ink">
            Syllabus
          </Link>
          {user && (
            <Link to="/" className="hidden rounded-lg px-2 py-1 text-label font-semibold text-ink-2 hover:text-ink sm:inline">
              My notes
            </Link>
          )}
          <ThemeToggle />
        </span>
      </header>
      <main id="main" className="mx-auto max-w-4xl px-4 pt-2 pb-16 lg:px-8">
        {children}
      </main>
      <footer className="border-t border-line px-4 py-6 text-center text-caption text-ink-3">
        Syllabi are the official PDFs of Savitribai Phule Pune University, shown here for easy reading.
        <MadeBy className="mt-1.5" />
      </footer>
    </div>
  )
}

// Web Share where the phone has it; elsewhere the link is copied.
export function ShareButton({ title, className = '' }) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = window.location.href
    trackEvent('syllabus_share')
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch (error) {
        if (error?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link', url)
    }
  }
  return (
    <button type="button" className={`btn-secondary ${className}`} onClick={share}>
      {copied ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Link copied' : 'Share'}</span>
    </button>
  )
}

// The credit every syllabus page carries: SPPU's syllabus library, never the PDF itself.
export function SourceCredit({ library, className = '' }) {
  return (
    <p className={`text-label text-ink-2 ${className}`}>
      Source:{' '}
      <a href={libraryUrl(library)} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-ink underline-offset-2 hover:underline">
        Savitribai Phule Pune University (official syllabus)
        <ExternalLink className="ml-1 inline size-3.5 align-[-2px]" aria-hidden="true" />
      </a>
    </p>
  )
}

// "Notes for this course": only for courses the app has notes for (lib/catalog.js COURSES).
export function CourseNotesLink({ programme }) {
  const course = notesCourseOf(programme)
  if (!course) return null
  return (
    <Link to="/" className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-line-strong">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-ink">
        <BookOpen className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body font-semibold text-ink">Notes for this course</span>
        <span className="block text-label text-ink-2">{course.name} notes, PYQs and solutions on 2AM Notes Pro</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
    </Link>
  )
}

export function LatestBadge() {
  return <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-caption font-semibold text-primary-ink">Latest</span>
}

export function EntryRow({ entry, latest, className, style }) {
  return (
    <li className={className} style={style}>
      <Link
        to={`/syllabus/${encodeURIComponent(entry.id)}`}
        className="flex min-h-14 items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-2"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="min-w-0 text-body font-medium text-ink">{entry.title}</span>
            {latest && <LatestBadge />}
          </span>
          <span className="block font-mono text-caption text-ink-3">
            {[describeEntry(entry), `Uploaded ${entry.uploaded}`].filter(Boolean).join(' · ')}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
      </Link>
    </li>
  )
}
