// Signed-out home: what the portal is, sign-in, and a locked preview of the subjects.

import { BookOpenText, FileCheck2, Headphones, Lock, Sparkles } from 'lucide-react'
import { createElement } from 'react'
import { Link } from 'react-router-dom'
import SignInCard from '../components/SignInCard.jsx'
import { ThemeToggle } from '../components/Shell.jsx'
import { Logo, SubjectIcon } from '../components/ui.jsx'
import { subjectLook } from '../lib/subjects.js'

// Static teaser only — real subject data always needs a verified session, so guests never call the backend.
const PREVIEW = [
  { slug: 'java-programming', name: 'Java Programming', topics: 'OOP, exceptions, threads, JDBC' },
  { slug: 'machine-learning', name: 'Machine Learning', topics: 'Regression, clustering, neural nets' },
  { slug: 'software-testing', name: 'Software Testing & QA', topics: 'Black-box, white-box, automation' },
  { slug: 'optimization-techniques', name: 'Optimization Techniques', topics: 'LPP, simplex, transportation' },
]

const VALUES = [
  { icon: BookOpenText, title: 'Private notes', text: 'Unit-wise notes, written to be read in one sitting without walls of text.' },
  { icon: FileCheck2, title: 'Previous-year papers', text: 'End-semester PYQs with solutions, arranged by subject and year.' },
  { icon: Headphones, title: 'Listen to notes', text: 'Have any note read aloud at your pace while you rest your eyes.' },
]

export default function Welcome() {
  return (
    <div className="min-h-svh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
        <span className="flex items-center gap-2.5">
          <Logo className="size-8" />
          <span className="text-heading">2AM Notes Pro</span>
        </span>
        <ThemeToggle />
      </header>

      <main id="main" className="mx-auto grid max-w-6xl gap-10 px-5 pt-6 pb-16 lg:grid-cols-[1fr_420px] lg:gap-14 lg:px-8 lg:pt-12">
        <div className="flex flex-col gap-8 lg:order-1">
          <div className="text-center lg:text-left">
            <Logo className="mx-auto mb-5 size-16 lg:hidden" />
            <h1 className="text-[34px] leading-[42px] font-bold tracking-tight lg:text-[44px] lg:leading-[52px]">
              Your MCA semester, organised for late-night study.
            </h1>
            <p className="mt-3 text-[17px] leading-7 text-ink-2">
              Notes, previous-year papers and references for every subject, in one quiet place.
            </p>
            <p className="mt-4 inline-flex rounded-full border border-line bg-surface px-3 py-1 font-mono text-caption text-teal-ink">
              Quiet reading · No distractions · Listen to notes
            </p>
          </div>

          <div className="lg:hidden">
            <SignInCard />
          </div>

          <section aria-labelledby="vault">
            <div className="mb-3 flex items-center gap-2">
              <h2 id="vault" className="text-title">
                What's inside
              </h2>
              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-caption font-semibold text-primary-ink">Locked</span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {PREVIEW.map((s) => (
                <li key={s.slug}>
                  <Link
                    to="/login"
                    className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-line-strong"
                    aria-label={`${s.name} — sign in to open`}
                  >
                    <SubjectIcon look={subjectLook(s.slug, s.name)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-semibold">{s.name}</span>
                      <span className="block truncate text-label text-ink-2">{s.topics}</span>
                    </span>
                    <Lock className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="why">
            <h2 id="why" className="mb-3 flex items-center gap-2 text-title">
              <Sparkles className="size-5 text-primary-ink" aria-hidden="true" /> Built for late-night focus
            </h2>
            <ul className="grid gap-3 sm:grid-cols-3">
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

        <div className="hidden lg:order-2 lg:block">
          <div className="sticky top-8">
            <SignInCard />
          </div>
        </div>
      </main>

      <footer className="border-t border-line py-6 text-center text-caption text-ink-3">
        MCA 2024–2026 · Made for late-night learners
      </footer>
    </div>
  )
}
