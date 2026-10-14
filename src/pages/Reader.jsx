// The full reader: a note, PDF or text file with breadcrumb, outline, text size, bookmark,
// previous/next and saved reading progress.

import { ArrowLeft, ChevronLeft, ChevronRight, Clock, FileQuestion, Headphones, List, Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BookmarkButton } from '../components/FileBits.jsx'
import FileContent from '../components/FileContent.jsx'
import ListenBar from '../components/ListenBar.jsx'
import LibraryGate from '../components/LibraryGate.jsx'
import { EmptyState, ErrorState, Skeleton, Tag } from '../components/ui.jsx'
import { fileHref, kindLabel } from '../lib/files.js'
import { outline, readingMinutes } from '../lib/markdown.js'
import { FONT_SIZES, readingStyleFrom, setPrefs, usePrefs } from '../lib/prefs.js'
import { recordOpen, recordProgress } from '../lib/store.js'
import { useFile } from '../lib/useFile.js'
import { speechSupported, useNarration } from '../lib/narrator.js'

function TextSize() {
  const { fontSize } = usePrefs()
  const index = Math.max(0, FONT_SIZES.indexOf(fontSize))
  const step = (d) => setPrefs({ fontSize: FONT_SIZES[Math.min(FONT_SIZES.length - 1, Math.max(0, index + d))] })
  return (
    <span className="flex items-center rounded-xl border border-line">
      <button type="button" className="icon-btn" onClick={() => step(-1)} disabled={index === 0} aria-label="Smaller text">
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span className="w-8 text-center font-mono text-caption text-ink-2" aria-live="polite" aria-label={`Text size ${fontSize}`}>
        {fontSize}
      </span>
      <button
        type="button"
        className="icon-btn"
        onClick={() => step(1)}
        disabled={index === FONT_SIZES.length - 1}
        aria-label="Larger text"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </span>
  )
}

function Outline({ items, onPick }) {
  return (
    <ol className="flex flex-col gap-0.5">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            onClick={onPick}
            className={`block rounded-lg px-2 py-1.5 text-label leading-5 text-ink-2 hover:bg-surface-2 hover:text-ink ${
              item.level === 3 ? 'pl-5' : ''
            }`}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  )
}

// Saves how far down the article the student has scrolled (for "Continue reading").
function useReadingProgress(fileId, ref, ready) {
  useEffect(() => {
    if (!ready) return
    let last = 0
    let timer = null
    function measure() {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const progress = total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total))
      if (progress - last >= 0.02 || progress === 1) {
        last = progress
        recordProgress(fileId, progress)
      }
    }
    function onScroll() {
      if (timer) return
      timer = setTimeout(() => {
        timer = null
        measure()
      }, 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [fileId, ref, ready])
}

function ReaderBody({ library }) {
  const { fileId } = useParams()
  const file = library.byId.get(fileId)
  const subject = file ? library.bySlug.get(file.subject) : null
  const prefs = usePrefs()
  const { data, error, loading, retry } = useFile(file)
  const articleRef = useRef(null)
  const [outlineOpen, setOutlineOpen] = useState(false)

  useEffect(() => {
    if (file) recordOpen(file)
  }, [file])
  useReadingProgress(fileId, articleRef, Boolean(data))

  const items = useMemo(() => (data?.body ? outline(data.body) : []), [data])
  const narration = useNarration(articleRef, fileId)

  if (!file) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="This file isn't in the library"
        text="It may have been renamed or removed from Drive."
        action={
          <Link to="/subjects" className="btn-primary">
            All subjects
          </Link>
        }
      />
    )
  }

  const siblings = subject.files[file.category] || [file] // the syllabus has no siblings
  const index = siblings.findIndex((f) => f.id === file.id)
  const previous = siblings[index - 1]
  const next = siblings[index + 1]
  const title = data?.noteTitle || file.title
  const minutes = data?.body ? readingMinutes(data.body) : null
  const updated = file.updated
    ? new Date(file.updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Link to={`/subject/${subject.slug}`} className="icon-btn -ml-2" aria-label={`Back to ${subject.name}`}>
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1 truncate font-mono text-caption text-ink-3">
          <Link to={`/subject/${subject.slug}`} className="hover:text-ink">
            {subject.name}
          </Link>
          {file.unit ? ` / Unit ${file.unit}` : ''} / <span className="text-ink-2">{file.title}</span>
        </nav>
        {file.kind === 'note' && data && speechSupported && narration.status === 'idle' && (
          <button type="button" onClick={narration.play} className="btn-secondary hidden bg-surface sm:inline-flex">
            <Headphones className="size-4 text-teal-ink" aria-hidden="true" /> Listen
          </button>
        )}
        {file.kind === 'note' && <TextSize />}
        <BookmarkButton file={file} />
      </div>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Tag look={subject.look}>{subject.look.short}</Tag>
          {file.unit && <Tag>Unit {file.unit}</Tag>}
          <span className="font-mono text-caption text-ink-3">{kindLabel(file.kind)}</span>
        </div>
        <h1 className="text-[28px] leading-9 font-bold tracking-tight lg:text-[34px] lg:leading-[42px]">{title}</h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label text-ink-2">
          {minutes && (
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden="true" /> {minutes} min read
            </span>
          )}
          {updated && <span>Updated {updated}</span>}
        </p>
        {file.kind === 'note' && data && speechSupported && narration.status === 'idle' && (
          <button type="button" onClick={narration.play} className="btn-secondary self-start bg-surface sm:hidden">
            <Headphones className="size-4 text-teal-ink" aria-hidden="true" /> Listen to this note
          </button>
        )}
      </header>

      <div className={`grid gap-8 ${items.length > 1 ? 'xl:grid-cols-[220px_minmax(0,1fr)]' : ''}`}>
        {items.length > 1 && (
          <>
            <nav aria-label="On this page" className="hidden xl:block">
              <div className="sticky top-24 rounded-2xl border border-line bg-surface p-3">
                <p className="mb-2 px-2 text-caption font-semibold tracking-wide text-ink-3 uppercase">On this page</p>
                <Outline items={items} />
              </div>
            </nav>
            <div className="xl:hidden">
              <button
                type="button"
                className="btn-secondary w-full justify-between bg-surface"
                aria-expanded={outlineOpen}
                aria-controls="mobile-outline"
                onClick={() => setOutlineOpen((o) => !o)}
              >
                <span className="flex items-center gap-2">
                  <List className="size-4" aria-hidden="true" /> On this page
                </span>
                <span className="font-mono text-caption text-ink-3">{items.length} sections</span>
              </button>
              {outlineOpen && (
                <nav id="mobile-outline" aria-label="On this page" className="mt-2 rounded-2xl border border-line bg-surface p-2">
                  <Outline items={items} onPick={() => setOutlineOpen(false)} />
                </nav>
              )}
            </div>
          </>
        )}

        <article ref={articleRef} className="min-w-0" aria-busy={loading}>
          {error && <ErrorState message={error} onRetry={retry} />}
          {loading && (
            <div className="flex flex-col gap-3" aria-label="Loading">
              {[100, 92, 96, 70, 88, 60].map((w, i) => (
                <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />
              ))}
            </div>
          )}
          {data && <FileContent file={file} data={data} readingStyle={readingStyleFrom(prefs)} measure={prefs.measure} />}
        </article>
      </div>

      <ListenBar narration={narration} title={title} />

      {(previous || next) && (
        <nav aria-label="More in this section" className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-6">
          {previous ? (
            <Link to={fileHref(previous)} className="rounded-2xl border border-line bg-surface p-4 hover:border-line-strong">
              <span className="flex items-center gap-1 text-caption text-ink-3">
                <ChevronLeft className="size-4" aria-hidden="true" /> Previous
              </span>
              <span className="mt-1 line-clamp-2 block text-label font-semibold">{previous.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to={fileHref(next)} className="rounded-2xl border border-line bg-surface p-4 text-right hover:border-line-strong">
              <span className="flex items-center justify-end gap-1 text-caption text-ink-3">
                Next <ChevronRight className="size-4" aria-hidden="true" />
              </span>
              <span className="mt-1 line-clamp-2 block text-label font-semibold">{next.title}</span>
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}

export default function Reader() {
  return <LibraryGate>{(library) => <ReaderBody library={library} />}</LibraryGate>
}
