// Signed-out home: what the portal is, everything it holds for each semester (subjects with counts,
// all locked), and sign-in. Counts come from the backend's public catalog; if it can't be reached,
// the subjects still show from the built-in catalog, without counts.

import { BookOpenText, FileCheck2, Headphones, Lock, Sparkles } from 'lucide-react'
import { createElement, useEffect, useState } from 'react'
import SignInCard from '../components/SignInCard.jsx'
import { ThemeToggle } from '../components/Shell.jsx'
import { Logo, SubjectIcon } from '../components/ui.jsx'
import { SEMESTERS } from '../lib/catalog.js'
import { loadCatalog } from '../lib/library.js'
import { subjectLook } from '../lib/subjects.js'

const VALUES = [
  {
    icon: BookOpenText,
    title: 'Unit-wise notes',
    text: 'Notes, syllabus and references for every subject, arranged unit by unit.',
  },
  {
    icon: FileCheck2,
    title: 'Previous-year papers',
    text: 'End-semester PYQs with solutions, arranged by subject and year.',
  },
  {
    icon: Headphones,
    title: 'Listen to notes',
    text: 'Have any note read aloud at your pace while you rest your eyes.',
  },
]

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

// Sections for one semester: core subjects, then each elective group, then anything the catalog
// doesn't list yet. `found` maps slug → the backend's entry (with counts), when available.
function sectionsFor(semester, found) {
  const listed = new Set([...semester.core, ...semester.groups.flatMap((g) => g.options)])
  const extra = found ? [...found.keys()].filter((slug) => !listed.has(slug)) : []
  return [
    { id: 'core', label: 'Core subjects', slugs: [...semester.core, ...extra] },
    ...semester.groups.map((g) => ({
      id: g.id,
      label: g.label,
      note: g.pick === 'one' ? 'choose one' : `choose ${g.pick}`,
      slugs: g.options,
    })),
  ]
}

function SubjectTile({ slug, entry, onSignIn }) {
  const look = subjectLook(slug, entry?.name || slug)
  const counts = entry?.counts
  const detail = counts
    ? [
        counts.notes && plural(counts.notes, 'note'),
        counts.pyqs && plural(counts.pyqs, 'PYQ'),
        counts.references && plural(counts.references, 'reference'),
        entry.hasSyllabus && 'syllabus',
      ]
        .filter(Boolean)
        .join(' · ') || 'Coming soon'
    : look.about
  return (
    <li>
      <button
        type="button"
        onClick={onSignIn}
        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left transition-colors hover:border-line-strong"
        aria-label={`${look.name}: ${detail}. Sign in to open.`}
      >
        <SubjectIcon look={look} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-semibold">{look.name}</span>
          <span className="block truncate text-label text-ink-2">{detail}</span>
        </span>
        <Lock className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
      </button>
    </li>
  )
}

export default function Welcome({ onSignedIn }) {
  const [catalog, setCatalog] = useState(null) // Map semesterId → Map slug → entry, or null
  const [active, setActive] = useState(SEMESTERS[SEMESTERS.length - 1].id)

  useEffect(() => {
    let cancelled = false
    loadCatalog()
      .then((semesters) => {
        if (cancelled) return
        setCatalog(new Map(semesters.map((s) => [s.id, new Map(s.subjects.map((x) => [x.slug, x]))])))
      })
      .catch(() => {}) // no backend yet: the built-in list still shows
    return () => {
      cancelled = true
    }
  }, [])

  const semester = SEMESTERS.find((s) => s.id === active)
  const found = catalog?.get(active) || null

  function focusSignIn() {
    const card = document.getElementById('sign-in')
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    card?.querySelector('button, [tabindex]')?.focus({ preventScroll: true })
  }

  return (
    <div className="min-h-svh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
        <span className="flex items-center gap-2.5">
          <Logo className="size-8" />
          <span className="text-heading">2AM Notes Pro</span>
        </span>
        <ThemeToggle />
      </header>

      {/* One sign-in card: after the intro on phones, in a sticky column beside everything on desktop. */}
      <main
        id="main"
        className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 pt-6 pb-16 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:px-8 lg:pt-12"
      >
        <div className="text-center lg:col-start-1 lg:row-start-1 lg:text-left">
          <Logo className="mx-auto mb-5 size-16 lg:hidden" />
          <h1 className="text-[34px] leading-[42px] font-bold tracking-tight lg:text-[44px] lg:leading-[52px]">
            Your MCA semester, organised for late-night study.
          </h1>
          <p className="mt-3 text-[17px] leading-7 text-ink-2">
            Notes, previous-year papers, syllabus and references for every subject, in one quiet place.
          </p>
        </div>

        <div id="sign-in" className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="lg:sticky lg:top-8">
            <SignInCard onSignedIn={onSignedIn} />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-8 lg:col-start-1 lg:row-start-2">
          <section aria-labelledby="inside">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 id="inside" className="text-title">
                What's inside
              </h2>
              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-caption font-semibold text-primary-ink">
                Sign in to open
              </span>
            </div>

            <div
              role="tablist"
              aria-label="Semester"
              className="mb-4 inline-flex rounded-xl border border-line bg-surface p-1"
            >
              {SEMESTERS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  id={`tab-${s.id}`}
                  aria-selected={s.id === active}
                  aria-controls="semester-panel"
                  onClick={() => setActive(s.id)}
                  className={`min-h-10 rounded-lg px-4 text-label font-semibold transition-colors ${
                    s.id === active ? 'bg-primary text-on-primary' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div id="semester-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="flex flex-col gap-5">
              {sectionsFor(semester, found).map((section) => (
                <div key={section.id}>
                  <h3 className="mb-2 flex items-baseline gap-2 text-heading">
                    {section.label}
                    {section.note && (
                      <span className="font-mono text-caption font-normal text-ink-3">{section.note}</span>
                    )}
                  </h3>
                  <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {section.slugs.map((slug) => (
                      <SubjectTile key={slug} slug={slug} entry={found?.get(slug)} onSignIn={focusSignIn} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="why">
            <h2 id="why" className="mb-3 flex items-center gap-2 text-title">
              <Sparkles className="size-5 text-primary-ink" aria-hidden="true" /> Built for late-night focus
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {VALUES.map((v) => (
                <li key={v.title} className="rounded-2xl border border-line bg-surface p-4">
                  <span className="mb-3 grid size-10 place-items-center rounded-xl bg-primary-soft text-primary-ink">
                    {createElement(v.icon, { className: 'size-5', 'aria-hidden': true })}
                  </span>
                  <p className="text-body font-semibold">{v.title}</p>
                  <p className="mt-1 text-label leading-5 text-ink-2">{v.text}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <footer className="border-t border-line py-6 text-center text-caption text-ink-3">
        MCA · Savitribai Phule Pune University · Made for late-night learners
      </footer>
    </div>
  )
}
