// Signed-out reading: Unit 1 of any subject is free, and any file an admin made a free preview. A bar keeps reminding the reader that signing in
// (free) opens every unit, PYQ solutions and the rest; the subject's sample PYQ question closes the page.

import { ArrowLeft, FileQuestion, LogIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import FileContent from '../components/FileContent.jsx'
import { ThemeToggle } from '../components/Shell.jsx'
import { ErrorState, Logo, MadeBy, Skeleton } from '../components/ui.jsx'
import { useAuth } from '../context/useAuth.js'
import { trackEvent } from '../lib/analytics.js'
import { friendlyError } from '../lib/errorMessages.js'
import { describeFile } from '../lib/files.js'
import { loadCatalog, loadPreviewFile } from '../lib/library.js'
import { splitTitle } from '../lib/markdown.js'
import { subjectLook } from '../lib/subjects.js'

const LINES = [92, 100, 84, 96, 70, 100, 88]

function useSubjectEntry(slug) {
  const [entry, setEntry] = useState(undefined) // undefined while loading, null if not found
  useEffect(() => {
    let cancelled = false
    loadCatalog()
      .then((semesters) => {
        const found = semesters.flatMap((s) => s.subjects).find((s) => s.slug === slug)
        if (!cancelled) setEntry(found || null)
      })
      .catch(() => !cancelled && setEntry(null))
    return () => {
      cancelled = true
    }
  }, [slug])
  return entry
}

function usePreviewFile(fileId) {
  const [state, setState] = useState({ id: null, data: null, error: null })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false
    loadPreviewFile(fileId)
      .then((data) => {
        if (cancelled) return
        const extra = data.encoding === 'utf8' && /\.(md|markdown)$/i.test(data.name) ? splitTitle(data.content) : {}
        setState({ id: fileId, data: { ...data, body: extra.body, noteTitle: extra.title }, error: null })
      })
      .catch((err) => !cancelled && setState({ id: fileId, data: null, error: friendlyError(err.message) }))
    return () => {
      cancelled = true
    }
  }, [fileId, attempt])
  const current = state.id === fileId ? state : { data: null, error: null }
  return { ...current, retry: () => setAttempt((n) => n + 1) }
}

export default function Preview() {
  const { subjectId, fileId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const entry = useSubjectEntry(subjectId)
  const { data, error, retry } = usePreviewFile(fileId)

  useEffect(() => {
    trackEvent('preview_open', { subject: subjectId })
  }, [subjectId, fileId])

  // Signed in already: the full reader.
  if (user) return <Navigate to={`/read/${subjectId}/${fileId}`} replace />

  const look = subjectLook(subjectId, entry?.name || subjectId)
  // Unit 1 notes, then any other file an admin made a free preview.
  const freeFiles = [...(entry?.unit1 || []), ...(entry?.free || [])]
  const raw = freeFiles.find((f) => f.id === fileId)
  const file = { ...(raw ? describeFile(raw, raw.category || 'notes') : { kind: 'note', title: '' }), id: fileId, subject: subjectId }
  const signIn = () => navigate('/login', { state: { from: `/read/${subjectId}/${fileId}` } })

  return (
    <div className="min-h-svh pb-28">
      <header className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo className="size-8" />
          <span className="text-heading">2AM Notes Pro</span>
        </Link>
        <span className="flex items-center gap-2">
          <button type="button" className="btn-secondary" onClick={signIn}>
            <LogIn className="size-4" aria-hidden="true" /> Sign in
          </button>
          <ThemeToggle />
        </span>
      </header>

      <main id="main" className="mx-auto max-w-4xl px-5 pt-2 lg:px-8">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-label text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" /> All subjects
        </Link>
        <p className="font-mono text-caption text-ink-3">
          {look.name} · {raw && file.unit !== 1 ? (file.unit ? `Unit ${file.unit} · ` : '') : 'Unit 1 · '}free preview
        </p>
        <h1 className="mt-1 mb-4 text-[28px] leading-9 font-bold tracking-tight lg:text-[34px] lg:leading-[42px]">
          {data?.noteTitle || file.title || 'Unit 1'}
        </h1>

        {freeFiles.length > 1 && (
          <nav aria-label="Free notes" className="mb-5 flex flex-wrap gap-2">
            {freeFiles.map((f) => {
              const d = describeFile(f, f.category || 'notes')
              return (
                <Link
                  key={f.id}
                  to={`/preview/${subjectId}/${f.id}`}
                  aria-current={f.id === fileId ? 'page' : undefined}
                  className={`rounded-lg border px-3 py-1.5 text-label ${f.id === fileId ? 'border-primary bg-primary-soft text-primary-ink' : 'border-line text-ink-2 hover:text-ink'}`}
                >
                  {d.title}
                </Link>
              )
            })}
          </nav>
        )}

        {error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : !data ? (
          <div className="flex flex-col gap-3" aria-busy="true">
            {LINES.map((w, i) => (
              <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : (
          <FileContent file={file} data={data} />
        )}

        {entry?.sample && (
          <section aria-labelledby="sample" className="mt-10 rounded-2xl border border-line bg-surface p-5">
            <h2 id="sample" className="flex items-center gap-2 text-heading">
              <FileQuestion className="size-5 text-primary-ink" aria-hidden="true" /> {entry.sample.kind === 'practice' ? 'Practice question' : 'From a past paper'} · {entry.sample.paper}
            </h2>
            <p className="mt-2 text-body">{entry.sample.question}</p>
            <p className="mt-3 text-label text-ink-2">
              {entry.counts?.pyqs ? `${entry.counts.pyqs} PYQ ${entry.counts.pyqs === 1 ? 'file' : 'files'} with solutions` : 'Solutions'} are
              waiting after sign-in.
            </p>
          </section>
        )}
        <MadeBy className="mt-10 text-center" />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <p className="text-label text-ink-2">
            <span className="font-semibold text-ink">You're reading Unit 1 free.</span> Sign in (free) for every unit,
            PYQ solutions and more.
          </p>
          <button type="button" className="btn-primary sign-in-glow shrink-0" onClick={signIn}>
            Sign in free
          </button>
        </div>
      </div>
    </div>
  )
}
