// /admin/students: everyone who has signed in, most recent first. Search by name, email or phone and
// filter by course, semester and last visit; the filters live in the URL so Back keeps them.

import { ChevronLeft, ChevronRight, Search, Users } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card, EmptyState, ErrorState, Skeleton } from '../../components/ui.jsx'
import { COURSES, SEMESTERS } from '../../lib/catalog.js'
import { formatTime, semesterLabel, studentPath, useAdmin } from './adminData.js'
import { ExportButtons } from './bits.jsx'

const LAST_SEEN = [
  { value: '', label: 'Any time' },
  { value: '1', label: 'Today' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
]

const SELECT = 'h-11 min-w-0 rounded-xl border border-line bg-surface px-3 text-body text-ink'

function Filters({ params, set }) {
  const [text, setText] = useState(params.get('q') || '')
  const timer = useRef(null)
  const course = params.get('course') || ''

  function onSearch(value) {
    setText(value)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => set({ q: value.trim() }), 350)
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
      <label className="flex min-w-0 items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:border-primary-ink sm:col-span-2 lg:col-span-1">
        <Search className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
        <span className="sr-only">Search by name, email or phone</span>
        <input
          type="search"
          value={text}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Name, email or phone"
          className="h-11 min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-3"
        />
      </label>
      <select aria-label="Course" className={SELECT} value={course} onChange={(e) => set({ course: e.target.value, semester: '' })}>
        <option value="">All courses</option>
        {COURSES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select aria-label="Semester" className={SELECT} value={params.get('semester') || ''} onChange={(e) => set({ semester: e.target.value })}>
        <option value="">All semesters</option>
        {SEMESTERS.filter((s) => !course || s.course === course).map((s) => (
          <option key={s.id} value={s.id}>
            {s.course} {s.label}
          </option>
        ))}
      </select>
      <select aria-label="Last seen" className={SELECT} value={params.get('days') || ''} onChange={(e) => set({ days: e.target.value })}>
        {LAST_SEEN.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function Table({ students }) {
  return (
    <Card className="hidden overflow-hidden lg:block">
      <table className="w-full table-fixed text-left text-label">
        <thead className="border-b border-line bg-surface-2 text-ink-2">
          <tr>
            <th className="w-[30%] px-4 py-2.5 font-semibold">Student</th>
            <th className="px-4 py-2.5 font-semibold">Semester</th>
            <th className="px-4 py-2.5 font-semibold">Phone</th>
            <th className="px-4 py-2.5 font-semibold">Last seen</th>
            <th className="w-24 px-4 py-2.5 text-right font-semibold">Sign-ins</th>
            <th className="w-20 px-4 py-2.5 text-right font-semibold">Opens</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {students.map((s) => (
            <tr key={s.email} className="hover:bg-surface-2">
              <td className="px-4 py-2.5">
                <Link to={studentPath(s.email)} className="block min-w-0">
                  <span className="block truncate font-semibold text-ink">{s.name || s.email}</span>
                  <span className="block truncate font-mono text-caption text-ink-3">{s.email}</span>
                </Link>
              </td>
              <td className="truncate px-4 py-2.5 text-ink-2">{s.semester ? semesterLabel(s.semester) : '–'}</td>
              <td className="truncate px-4 py-2.5 font-mono text-ink-2">{s.phone || '–'}</td>
              <td className="truncate px-4 py-2.5 text-ink-2">{formatTime(s.lastSeen)}</td>
              <td className="px-4 py-2.5 text-right font-mono text-ink">{s.signIns}</td>
              <td className="px-4 py-2.5 text-right font-mono text-ink">{s.opens}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function CardsList({ students }) {
  return (
    <ul className="flex flex-col gap-3 lg:hidden">
      {students.map((s) => (
        <li key={s.email}>
          <Link to={studentPath(s.email)} className="block rounded-2xl border border-line bg-surface p-4 hover:border-line-strong">
            <span className="block truncate text-body font-semibold text-ink">{s.name || s.email}</span>
            <span className="block truncate font-mono text-caption text-ink-3">{s.email}</span>
            <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-2">
              <span>{s.semester ? semesterLabel(s.semester) : 'No semester'}</span>
              <span>Seen {formatTime(s.lastSeen)}</span>
              <span>
                {s.signIns} sign-ins · {s.opens} opens
              </span>
              {s.phone && <span className="font-mono">{s.phone}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function Students() {
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page')) || 1
  const { data, error, loading, reload } = useAdmin('adminStudents', {
    query: params.get('q') || '',
    course: params.get('course') || '',
    semester: params.get('semester') || '',
    lastSeenDays: Number(params.get('days')) || 0,
    page,
  })

  // Changing a filter goes back to page 1; empty values leave the URL.
  function set(changes) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries({ page: '', ...changes })) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace: true })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-display">Students</h1>
          <p className="mt-1 text-label text-ink-2" aria-live="polite">
            {data ? `${data.total} ${data.total === 1 ? 'student' : 'students'}` : 'Loading…'}
          </p>
        </div>
        <ExportButtons />
      </div>
      <Filters params={params} set={set} />

      {error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : data.students.length === 0 ? (
        <EmptyState icon={Users} title="No students match" text="Try a different search or fewer filters." />
      ) : (
        <div className={loading ? 'opacity-60 transition-opacity' : ''}>
          <Table students={data.students} />
          <CardsList students={data.students} />
        </div>
      )}

      {data && data.pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between gap-3">
          <button type="button" className="btn-secondary" disabled={data.page <= 1} onClick={() => set({ page: String(data.page - 1) })}>
            <ChevronLeft className="size-4" aria-hidden="true" /> Previous
          </button>
          <span className="text-label text-ink-2">
            Page {data.page} of {data.pages}
          </span>
          <button type="button" className="btn-secondary" disabled={data.page >= data.pages} onClick={() => set({ page: String(data.page + 1) })}>
            Next <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  )
}
