// Signed-in home: greeting, continue reading, every subject, saved files and recent updates.

import { ArrowRight, Bookmark, Clock, FileQuestion, LayoutGrid, Moon, Play, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import LibraryGate from '../components/LibraryGate.jsx'
import SubjectCard from '../components/SubjectCard.jsx'
import { BookmarkButton, FileTypeIcon } from '../components/FileBits.jsx'
import { fileHref, kindLabel } from '../lib/files.js'
import { Card, EmptyState, Skeleton, Tag } from '../components/ui.jsx'
import { useAuth } from '../context/useAuth.js'
import { useBookmarks, useHistory } from '../lib/store.js'
import { useStudy } from '../lib/study.js'

function greeting(hour) {
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function timeLabel(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function ContinueCard({ entry, file, subject }) {
  const percent = Math.round((entry.progress || 0) * 100)
  return (
    <Card as="article" className="flex w-[280px] shrink-0 snap-start flex-col gap-3 p-4 sm:w-auto">
      <div className="flex items-center justify-between gap-2">
        <Tag look={subject.look}>
          {subject.look.short}
          {file.unit ? ` · Unit ${file.unit}` : ''}
        </Tag>
        <span className="text-caption text-ink-3">{kindLabel(file.kind)}</span>
      </div>
      <h3 className="line-clamp-2 text-heading">{file.title}</h3>
      <div className="mt-auto">
        <div className="mb-1.5 flex justify-between font-mono text-caption">
          <span className="text-ink-3">Progress</span>
          <span className="text-teal-ink">{percent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
          <div className="h-full rounded-full bg-teal" style={{ width: `${Math.max(percent, 3)}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link to={fileHref(file)} className="btn-primary flex-1" aria-label={`Resume ${file.title}`}>
          <Play className="size-4" aria-hidden="true" /> Resume
        </Link>
        <BookmarkButton file={file} />
      </div>
    </Card>
  )
}

function FileLine({ file, subject, meta }) {
  return (
    <li>
      <Link to={fileHref(file)} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
        <FileTypeIcon kind={file.kind} className="size-8" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-label font-semibold text-ink">{file.title}</span>
          <span className="block truncate text-caption text-ink-3">
            {subject.name}
            {meta ? ` · ${meta}` : ''}
          </span>
        </span>
      </Link>
    </li>
  )
}

function DashboardBody({ library }) {
  const history = useHistory()
  const bookmarks = useBookmarks()
  const [now] = useState(() => Date.now())

  const continueReading = history
    .map((entry) => ({ entry, file: library.byId.get(entry.fileId) }))
    .filter((x) => x.file)
    .slice(0, 3)
  const saved = Object.values(bookmarks)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .map((b) => library.byId.get(b.fileId))
    .filter(Boolean)
  const updates = library.allFiles
    .filter((f) => f.updated)
    .sort((a, b) => b.updated.localeCompare(a.updated))
    .slice(0, 5)
  const pyqCount = library.allFiles.filter((f) => f.category === 'pyqs').length

  if (library.subjects.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="No subjects yet"
        text="Subjects appear here as soon as their folders are added to the Drive library."
      />
    )
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
      <div className="flex min-w-0 flex-col gap-8">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          <Link to="/pyqs" className="btn-secondary shrink-0 bg-surface">
            <FileQuestion className="size-4 text-teal-ink" aria-hidden="true" /> PYQ Archive
            <span className="font-mono text-caption text-ink-3">{pyqCount}</span>
          </Link>
          <Link to="/saved" className="btn-secondary shrink-0 bg-surface">
            <Bookmark className="size-4 text-primary-ink" aria-hidden="true" /> Saved
            <span className="font-mono text-caption text-ink-3">{saved.length}</span>
          </Link>
        </div>

        {continueReading.length > 0 && (
          <section aria-labelledby="continue">
            <h2 id="continue" className="mb-3 flex items-center gap-2 text-title">
              <Play className="size-5 text-primary-ink" aria-hidden="true" /> Continue reading
            </h2>
            <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
              {continueReading.map(({ entry, file }) => (
                <ContinueCard key={file.id} entry={entry} file={file} subject={library.bySlug.get(file.subject)} />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="subjects">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 id="subjects" className="flex items-center gap-2 text-title">
              <LayoutGrid className="size-5 text-primary-ink" aria-hidden="true" /> Your subjects
            </h2>
            <span className="font-mono text-caption text-ink-3">
              MCA {library.semester?.short ?? ''} · {library.subjects.length}
            </span>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {library.subjects.map((subject) => (
              <li key={subject.slug}>
                <SubjectCard subject={subject} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="flex flex-col gap-4" aria-label="Saved and recent">
        <Card className="p-4">
          <h2 className="mb-2 flex items-center justify-between text-heading">
            <span className="flex items-center gap-2">
              <Bookmark className="size-5 text-primary-ink" aria-hidden="true" /> Saved
            </span>
            {saved.length > 0 && (
              <Link to="/saved" className="text-label font-medium text-primary-ink">
                View all
              </Link>
            )}
          </h2>
          {saved.length === 0 ? (
            <p className="px-2 py-2 text-label text-ink-2">Tap the bookmark on any file to keep it here.</p>
          ) : (
            <ul>
              {saved.slice(0, 4).map((file) => (
                <FileLine key={file.id} file={file} subject={library.bySlug.get(file.subject)} meta={kindLabel(file.kind)} />
              ))}
            </ul>
          )}
        </Card>
        {updates.length > 0 && (
          <Card className="p-4">
            <h2 className="mb-2 flex items-center gap-2 text-heading">
              <Sparkles className="size-5 text-teal-ink" aria-hidden="true" /> Recently added
            </h2>
            <ul>
              {updates.map((file) => {
                const days = Math.round((now - new Date(file.updated).getTime()) / 86400000)
                return (
                  <FileLine
                    key={file.id}
                    file={file}
                    subject={library.bySlug.get(file.subject)}
                    meta={days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`}
                  />
                )
              })}
            </ul>
          </Card>
        )}
      </aside>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { semesterInfo: semester } = useStudy()
  const [now] = useState(() => new Date())
  const lateNight = now.getHours() < 5

  return (
    <div className="flex flex-col gap-6">
      <Card className="relative overflow-hidden p-5 lg:p-6">
        <div
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-primary-soft blur-3xl"
          aria-hidden="true"
        />
        <p className="relative flex items-center gap-2 font-mono text-caption text-teal-ink">
          {lateNight ? <Moon className="size-3.5" aria-hidden="true" /> : <Clock className="size-3.5" aria-hidden="true" />}
          {timeLabel(now)}
          {lateNight ? ' · Quiet hours' : ''}
        </p>
        <h1 className="relative mt-2 text-[28px] leading-9 font-bold tracking-tight lg:text-display">
          {greeting(now.getHours())}, {user.firstName || 'there'}
        </h1>
        <p className="relative mt-1 text-body text-ink-2">
          {semester ? `MCA ${semester.label}` : 'MCA'} · pick up where you left off.
        </p>
      </Card>

      <LibraryGate
        skeleton={
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-busy="true" aria-label="Loading subjects">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        }
      >
        {(library) => <DashboardBody library={library} />}
      </LibraryGate>

      <p className="flex items-center gap-2 text-label text-ink-3">
        <ArrowRight className="size-4" aria-hidden="true" /> New files show up here as soon as they're added to the library.
      </p>
    </div>
  )
}
