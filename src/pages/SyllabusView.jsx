// One SPPU syllabus (/syllabus/:id), public. The PDF is view-only for everyone (pdf.js on canvas, from
// syllabusView); signed-in students get "Download PDF" (syllabusDownload, logged by the backend), others
// "Sign in to download", which comes back here. The build pre-renders this page (scripts/syllabus-pages.mjs).

import { ArrowLeft, Download, FileWarning, LogIn } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import PdfView from '../components/PdfView.jsx'
import { CourseNotesLink, EntryRow, ShareButton, SourceCredit, SyllabusFrame } from '../components/SyllabusBits.jsx'
import { EmptyState, Skeleton } from '../components/ui.jsx'
import { useAuth } from '../context/useAuth.js'
import { trackEvent } from '../lib/analytics.js'
import { callApi } from '../lib/api.js'
import { base64ToBytes } from '../lib/blobs.js'
import { friendlyError } from '../lib/errorMessages.js'
import { byNewest, describeEntry, entryTitles, programmeOf, programmeSlug, slugify } from '../lib/syllabus.js'
import { useDocumentTitle, useSyllabi } from '../lib/useSyllabi.js'

function useSyllabusPdf(id) {
  const [state, setState] = useState({})
  useEffect(() => {
    let cancelled = false
    callApi('syllabusView', { id }, { public: true })
      .then((data) => !cancelled && setState({ id, data }))
      .catch((error) => !cancelled && setState({ id, error: error.message }))
    return () => {
      cancelled = true
    }
  }, [id])
  return state.id === id ? state : {}
}

function DownloadButton({ entry }) {
  const { user } = useAuth()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (!user) {
    return (
      <Link to="/login" state={{ from: location.pathname }} className="btn-primary">
        <LogIn className="size-4" aria-hidden="true" /> Sign in to download
      </Link>
    )
  }

  const download = async () => {
    setBusy(true)
    setError(null)
    try {
      const data = await callApi('syllabusDownload', { id: entry.id, idToken: user.idToken })
      const url = URL.createObjectURL(new Blob([base64ToBytes(data.content)], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = data.fileName || `${slugify(entry.title)}.pdf`
      document.body.append(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
      trackEvent('syllabus_download')
    } catch (e) {
      setError(friendlyError(e.message))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <button type="button" className="btn-primary" onClick={download} disabled={busy}>
        <Download className="size-4" aria-hidden="true" /> {busy ? 'Preparing…' : 'Download PDF'}
      </button>
      {error && <p role="alert" className="w-full text-label text-danger">{error}</p>}
    </>
  )
}

export default function SyllabusView() {
  const { id } = useParams()
  const { entries, error: listError } = useSyllabi()
  const entry = entries?.find((e) => e.id === id)
  const pdf = useSyllabusPdf(id)
  const titles = useMemo(() => entryTitles(entries || []), [entries])
  useDocumentTitle(entry && titles.get(entry.id))

  if (entries && !entry) {
    return (
      <SyllabusFrame>
        <EmptyState
          icon={FileWarning}
          title="Syllabus not found"
          text="It may have been replaced by a newer one."
          action={<Link to="/syllabus" className="btn-primary">Browse all syllabi</Link>}
        />
      </SyllabusFrame>
    )
  }

  const same = entry ? entries.filter((e) => e.id !== id && programmeOf(e) === programmeOf(entry)).sort(byNewest) : []
  const related = entry
    ? [...new Map(entries.filter((e) => e.faculty === entry.faculty && programmeOf(e) !== programmeOf(entry)).map((e) => [programmeOf(e), programmeSlug(e)]))].slice(0, 8)
    : []

  return (
    <SyllabusFrame>
      <Link to="/syllabus" className="mb-3 inline-flex items-center gap-1.5 text-label font-semibold text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" /> All syllabi
      </Link>
      {!entry ? (
        listError ? <p className="text-body text-ink-2">{listError}</p> : <Skeleton className="h-24 w-full" />
      ) : (
        <>
          <p className="font-mono text-caption text-ink-3">
            {entry.faculty} · <Link to={`/syllabus/p/${programmeSlug(entry)}`} className="hover:text-ink hover:underline">{programmeOf(entry)}</Link>
          </p>
          <h1 className="mt-1 text-[26px] leading-8 font-bold tracking-tight text-ink">{entry.title}</h1>
          <p className="mt-1 text-label text-ink-2">
            {[describeEntry(entry), `${entry.library} library`, `Uploaded ${entry.uploaded}`].filter(Boolean).join(' · ')}
          </p>
          <SourceCredit library={entry.library} className="mt-2" />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <DownloadButton entry={entry} />
            <ShareButton title={`SPPU ${entry.title} syllabus`} />
          </div>
        </>
      )}

      <div className="mt-5">
        {pdf.data?.content ? (
          <PdfView data={pdf.data} title={entry?.title || pdf.data.title || 'Syllabus'} />
        ) : pdf.error ? (
          <EmptyState
            icon={FileWarning}
            title={/not available/i.test(pdf.error) ? 'Not available to read here yet' : 'The syllabus could not be loaded'}
            text={/not available/i.test(pdf.error) ? 'It will appear here soon. Meanwhile, it is on SPPU’s syllabus site (link above).' : friendlyError(pdf.error)}
          />
        ) : (
          <Skeleton className="h-[60vh] w-full" />
        )}
      </div>

      {entry && (
        <div className="mt-8 flex flex-col gap-6">
          <CourseNotesLink programme={programmeOf(entry)} />
          {same.length > 0 && (
            <section aria-labelledby="same">
              <h2 id="same" className="mb-1 text-heading">More {programmeOf(entry)} syllabi</h2>
              <ul>{same.map((e) => <EntryRow key={e.id} entry={e} />)}</ul>
            </section>
          )}
          {related.length > 0 && (
            <section aria-labelledby="related">
              <h2 id="related" className="mb-2 text-heading">Related programmes</h2>
              <ul className="flex flex-wrap gap-2">
                {related.map(([name, slug]) => (
                  <li key={slug}>
                    <Link to={`/syllabus/p/${slug}`} className="inline-flex rounded-full border border-line bg-surface px-3 py-1.5 text-label text-ink-2 hover:border-line-strong hover:text-ink">
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </SyllabusFrame>
  )
}
