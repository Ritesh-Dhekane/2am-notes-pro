// First sign-in: pick your semester and electives. Only that semester's core subjects and your
// electives are shown afterwards; this can be changed any time in Profile & Settings.

import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/Shell.jsx'
import StudyPicker from '../components/StudyPicker.jsx'
import { Logo } from '../components/ui.jsx'
import { useAuth } from '../context/useAuth.js'
import { groupChoiceCount, groupNeeds, isSetupComplete, semesterById } from '../lib/catalog.js'
import { getStudy, setStudy } from '../lib/study.js'

// "Elective IV", or for choose-n groups "1 more elective" / "2 electives".
function stillToChoose(group, electives) {
  if (group.pick === 'one') return group.label
  const left = groupNeeds(group) - groupChoiceCount(group, electives)
  const noun = group.label.toLowerCase().replace(/s$/, '')
  return `${left}${left < groupNeeds(group) ? ' more' : ''} ${noun}${left === 1 ? '' : 's'}`
}

export default function Setup() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [draft, setDraft] = useState(() => {
    const { semester, electives } = getStudy()
    return { semester, electives }
  })
  const semester = semesterById(draft.semester)
  const ready = isSetupComplete(semester, draft.electives)
  const missing = semester?.groups.filter((g) => groupChoiceCount(g, draft.electives) !== groupNeeds(g)) || []

  function finish(event) {
    event.preventDefault()
    if (!ready) return
    setStudy(draft)
    const from = location.state?.from
    navigate(from && from !== '/setup' ? from : '/', { replace: true })
  }

  return (
    <div className="min-h-svh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
        <span className="flex items-center gap-2.5">
          <Logo className="size-8" />
          <span className="text-heading">2AM Notes Pro</span>
        </span>
        <ThemeToggle />
      </header>
      <main id="main" className="mx-auto max-w-3xl px-5 pt-4 pb-32">
        <p className="font-mono text-caption text-teal-ink">Welcome{user?.firstName ? `, ${user.firstName}` : ''}</p>
        <h1 className="mt-1 text-display">Set up your semester</h1>
        <p className="mt-1 mb-8 text-body text-ink-2">
          You'll only see your semester's subjects and the electives you take. You can change this later in Profile &amp;
          Settings.
        </p>
        <form id="setup" onSubmit={finish}>
          <StudyPicker value={draft} onChange={setDraft} />
        </form>
      </main>
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3">
          <p className="min-w-0 text-label text-ink-2" aria-live="polite">
            {!semester
              ? 'Choose your semester to continue.'
              : missing.length
                ? `Still to choose: ${missing.map((g) => stillToChoose(g, draft.electives)).join(', ')}.`
                : 'All set.'}
          </p>
          <button type="submit" form="setup" className="btn-primary shrink-0" disabled={!ready}>
            Continue <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
