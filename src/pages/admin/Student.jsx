// /admin/students/:email: one student's profile, what they open, and their full activity log, with a
// few hints for when they might need help.

import { ArrowLeft, Ban, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ErrorState, Skeleton } from '../../components/ui.jsx'
import { ageOf } from '../../lib/birthday.js'
import { subjectLook } from '../../lib/subjects.js'
import { daysSince, formatTime, semesterLabel, useAdmin, useAdminAction } from './adminData.js'
import { Bars, BlockControl, FlagItem, Panel } from './bits.jsx'

const EVENTS = {
  login: 'Signed in',
  logout: 'Signed out',
  view_library: 'Opened the library',
  file_open: 'Opened a file',
  save_study: 'Saved semester',
}

// A logged file path is "<semester>/<subject slug>/<category>/<file>", so the subject and semester come
// from it, for old events too. Anything shorter (a bare name) has no subject line.
function fileWhere(path) {
  const parts = path.split('/')
  if (parts.length < 3) return ''
  return [subjectLook(parts[1], parts[1]).name, semesterLabel(parts[0])].join(' · ')
}

function hintsFor(student, data) {
  const hints = []
  if (!data.fileOpens) hints.push('Never opened a file')
  else if (data.onlyUnitOne) hints.push('Only opened Unit 1 notes')
  const idle = daysSince(student.lastSeen || data.timeline[0]?.time)
  if (idle !== null && idle >= 7) hints.push(`Inactive for ${idle} days`)
  return hints
}

function Profile({ student }) {
  const electives = Object.values(student.electives || {})
    .flat()
    .map((slug) => subjectLook(slug, slug).name)
  const rows = [
    ['Semester', student.semester ? semesterLabel(student.semester) : 'Not chosen'],
    ['Electives', electives.join(', ') || '–'],
    ['Phone', student.phone || '–'],
    ['Birthday', student.birthday ? `${student.birthday} (age ${ageOf(student.birthday)})` : '–'],
    ['First seen', formatTime(student.firstSeen)],
    ['Last seen', formatTime(student.lastSeen)],
    ['Sign-ins', student.signIns ?? '–'],
    ['Files opened', student.opens ?? '–'],
    ['Last device', student.device || '–'],
  ]
  return (
    <Panel title="Profile">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-label">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-ink-2">{label}</dt>
            <dd className="min-w-0 break-words text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  )
}

// This student's flags from the misuse check, newest first.
function Flags({ flags, onUpdate, action }) {
  return (
    <Panel title={`Flags (${flags.length})`}>
      {action.error && (
        <p role="alert" className="mb-2 text-label text-danger">
          {action.error}
        </p>
      )}
      <ul className="-my-3 flex flex-col divide-y divide-line">
        {flags.map((flag) => (
          <FlagItem
            key={flag.row}
            flag={flag}
            showEmail={false}
            actions={
              flag.status === 'open' && (
                <button type="button" className="btn-secondary" disabled={action.busy} onClick={() => onUpdate(flag, 'dismissed')}>
                  Dismiss
                </button>
              )
            }
          />
        ))}
      </ul>
    </Panel>
  )
}

function Timeline({ data, page, setPage }) {
  return (
    <Panel title={`Activity (${data.total})`}>
      {!data.timeline.length && <p className="text-label text-ink-3">No activity logged.</p>}
      <ol className="flex flex-col divide-y divide-line">
        {data.timeline.map((e, i) => (
          <li key={`${e.time}-${i}`} className="grid grid-cols-1 gap-x-4 gap-y-0.5 py-2.5 text-label lg:grid-cols-[9rem_10rem_minmax(0,1fr)]">
            <span className="font-mono text-caption text-ink-3 lg:text-label">{formatTime(e.time)}</span>
            <span className="font-semibold text-ink">{EVENTS[e.event] || e.event}</span>
            <span className="min-w-0">
              {e.file ? (
                <>
                  <span className="block truncate text-ink" title={e.file}>
                    {e.file.split('/').pop()}
                  </span>
                  {fileWhere(e.file) && <span className="block truncate text-ink-2">{fileWhere(e.file)}</span>}
                </>
              ) : (
                e.semester && <span className="block text-ink-2">{semesterLabel(e.semester)}</span>
              )}
              <span className="block truncate text-caption text-ink-3">{[e.device, e.browser, e.os].filter(Boolean).join(' · ')}</span>
            </span>
          </li>
        ))}
      </ol>
      {data.pages > 1 && (
        <nav aria-label="Activity pages" className="mt-3 flex items-center justify-between gap-3">
          <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="size-4" aria-hidden="true" /> Newer
          </button>
          <span className="text-label text-ink-2">
            {data.page} / {data.pages}
          </span>
          <button type="button" className="btn-secondary" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
            Older <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </Panel>
  )
}

// `onChange` updates the open flag count in the admin nav.
export default function Student({ onChange }) {
  const { email } = useParams()
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page')) || 1
  const { data, error, loading, reload } = useAdmin('adminStudent', { email, page })
  const [run, action] = useAdminAction()
  const current = data && data.student.email === email.toLowerCase() ? data : null

  async function updateFlag(flag, status) {
    if (await run('adminFlagUpdate', { row: flag.row, status })) {
      reload()
      onChange?.()
    }
  }

  const back = (
    <Link to="/admin/students" className="inline-flex min-h-10 items-center gap-1.5 text-label font-semibold text-primary-ink">
      <ArrowLeft className="size-4" aria-hidden="true" /> All students
    </Link>
  )

  if (error && !current) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <ErrorState message={error} onRetry={reload} />
      </div>
    )
  }
  if (!current) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  const { student } = current
  const hints = hintsFor(student, current)
  return (
    <div className={`flex flex-col gap-5 ${loading ? 'opacity-80' : ''}`}>
      {back}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-display">{student.name || student.email}</h1>
          <p className="truncate font-mono text-caption text-ink-2">{student.email}</p>
        </div>
        <BlockControl
          email={student.email}
          blocked={Boolean(current.block?.blocked)}
          onDone={() => {
            reload()
            onChange?.()
          }}
        />
      </div>
      {current.block?.blocked && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-danger px-3 py-2.5 text-label text-ink">
          <Ban className="mt-px size-4 shrink-0 text-danger" aria-hidden="true" />
          <span className="min-w-0 break-words">
            Blocked{current.block.action === 'block' && ` by ${current.block.by}, ${formatTime(current.block.time)}: ${current.block.reason}`}
          </span>
        </p>
      )}
      {hints.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {hints.map((hint) => (
            <li key={hint} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1 text-label text-ink">
              <Lightbulb className="size-4 text-teal-ink" aria-hidden="true" /> {hint}
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <Profile student={student} />
          {current.flags?.length > 0 && <Flags flags={current.flags} onUpdate={updateFlag} action={action} />}
          <Panel title="Opens by subject">
            <Bars
              items={current.subjects.map((s) => ({ key: s.subject, label: s.name, count: s.count, detail: semesterLabel(s.subject.split('/')[0]) }))}
              empty="No files opened yet."
            />
          </Panel>
        </div>
        <Timeline data={current} page={page} setPage={(p) => setParams(p > 1 ? { page: String(p) } : {}, { replace: true })} />
      </div>
    </div>
  )
}
