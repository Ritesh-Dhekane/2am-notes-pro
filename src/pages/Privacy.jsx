// Privacy policy, public (linked from the Google sign-in consent screen). Keep it in step with what the
// app really collects: apps-script/Logging.js (access log), lib/analytics.js (GA4), lib/study.js (semester
// choice), lib/phone.js and lib/birthday.js (optional phone number and birthday), pages/admin (what the owner sees), lib/store.js and lib/offline.js (on-device data). The build copies the app to privacy/index.html
// so this URL answers 200 on GitHub Pages (see scripts/postbuild.mjs).

import { Link } from 'react-router-dom'
import { ThemeToggle } from '../components/Shell.jsx'
import { Logo, MadeBy } from '../components/ui.jsx'

const CONTACT = 'learn.riteshdhekane@gmail.com'
const UPDATED = '22 October 2026'

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-title">{title}</h2>
      <div className="flex flex-col gap-2 text-body leading-7 text-ink-2">{children}</div>
    </section>
  )
}

export default function Privacy() {
  return (
    <div className="min-h-svh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo className="size-8" />
          <span className="text-heading">2AM Notes Pro</span>
        </Link>
        <ThemeToggle />
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 pt-4 pb-16 lg:px-8">
        <h1 className="text-[32px] leading-10 font-bold tracking-tight">Privacy policy</h1>
        <p className="mt-2 text-label text-ink-3">Last updated {UPDATED}</p>
        <p className="mt-4 text-body leading-7 text-ink-2">
          2AM Notes Pro is a free study portal for MCA and BCA students, run by Ritesh Dhekane. This page explains what the
          app collects, why, and what stays on your own device.
        </p>

        <Section title="When you sign in with Google">
          <p>
            Google shares your <strong className="text-ink">name, email address and profile photo</strong> with the app. They
            are used to show who is signed in and to let only signed-in students open the notes. The app never sees your
            Google password and asks for nothing else from your account.
          </p>
          <p>
            After sign-in, the app keeps you signed in for up to 7 days on that device. Signing out ends it straight away.
          </p>
        </Section>

        <Section title="The access log">
          <p>
            Before signing in you tick a box agreeing to a sign-in log. It is a private Google Sheet that only the portal&apos;s
            owner can open. Each row records:
          </p>
          <ul className="list-disc pl-5">
            <li>the time, your email and name</li>
            <li>what happened: sign-in, sign-out, opening the library, choosing a semester, or opening a file (and which one)</li>
            <li>
              your device: browser, operating system, device type and phone model (when the browser shares it), screen
              size, whether the app is installed, language and time zone
            </li>
          </ul>
          <p>It is used to see which notes help, to fix problems, and to keep the portal for its MCA and BCA students only.</p>
          <p>
            Only the portal&apos;s owner can see a student&apos;s activity in this log, and uses it to help that student when
            something goes wrong and to stop misuse, such as a shared account.
          </p>
        </Section>

        <Section title="Usage statistics">
          <p>
            The app uses Google Analytics to count which screens and features are used. It is never sent your name, email,
            Google account id or anything you type, such as searches.
          </p>
        </Section>

        <Section title="Saved with your account">
          <p>
            Your semester and electives are saved with your email, so they follow you to any device you sign in on.
          </p>
          <p>
            You can also add a <strong className="text-ink">phone number</strong>. It is optional, stored privately with
            your account, and seen only by the portal&apos;s owner, to reach you if there is a problem with your account. It
            is never sent to Google Analytics. Remove it any time in Profile &amp; Settings.
          </p>
          <p>
            Your <strong className="text-ink">birthday</strong> is optional too. It is stored privately with your account
            and seen only by the portal&apos;s owner. It is never sent to Google Analytics. Remove it any time in Profile
            &amp; Settings.
          </p>
        </Section>

        <Section title="Kept only on your device">
          <p>
            Bookmarks, reading history and settings (theme, text size) stay in your browser and are never sent to the
            server. To make notes open faster, the app also saves the notes of subjects you open in your browser; signing
            out deletes them.
          </p>
        </Section>

        <Section title="What we don't do">
          <p>
            Your data is not sold, shared with anyone, or used for advertising. There are no ads in the app. The notes
            themselves are served privately and never get public links.
          </p>
        </Section>

        <Section title="Your choices">
          <p>
            You can sign out at any time, and clear the app&apos;s data from your browser settings. To see or delete your
            rows in the access log, or for any question about this policy, email{' '}
            <a href={`mailto:${CONTACT}`} className="font-semibold text-primary-ink underline-offset-2 hover:underline">
              {CONTACT}
            </a>
            .
          </p>
          <p>
            The &ldquo;Questions &amp; feedback&rdquo; link opens the app&apos;s GitHub Discussions. It is hosted by GitHub,
            posting there needs a GitHub account, and posts are public.
          </p>
          <p>If this policy changes, the date at the top changes with it.</p>
        </Section>
      </main>

      <footer className="border-t border-line py-6 text-center">
        <MadeBy />
      </footer>
    </div>
  )
}
