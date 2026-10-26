// /admin/gaps: what's still missing. Every semester and subject in the app's catalog (lib/catalog.js),
// set against what the backend lists in Drive (adminGaps, from the cached listings): whether the folder
// exists, how many notes and which units have them, syllabus and PYQs. Subjects without notes and units
// skipped below the highest one seen are highlighted. Drive folders the catalog doesn't know come last.

import { FolderX } from 'lucide-react'
import { useState } from 'react'
import Chips from '../../components/Chips.jsx'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui.jsx'
import { semesterTitle, SEMESTERS } from '../../lib/catalog.js'
import { subjectLook } from '../../lib/subjects.js'
import { semesterLabel, useAdmin } from './adminData.js'
import { Panel, StatCard } from './bits.jsx'

// One subject's gaps. `drive` is its adminGaps entry, or undefined without a folder.
function check(slug, drive, group) {
  const units = drive?.units || []
  const highest = units.length ? units.at(-1) : 0
  const missing = Array.from({ length: highest }, (_, i) => i + 1).filter((u) => !units.includes(u))
  return {
    slug,
    name: subjectLook(slug, drive?.name || slug).name,
    group,
    folder: Boolean(drive),
    notes: drive?.notes || 0,
    units,
    missing,
    syllabus: Boolean(drive?.syllabus),
    pyqs: drive?.pyqs || 0,
  }
}

const hasGap = (s) => !s.folder || !s.notes || s.missing.length > 0

// [{ id, title, subjects }] for the catalog's semesters, then Drive semesters it doesn't know.
function buildRows(driveSemesters) {
  const drive = new Map(driveSemesters.map((s) => [s.id, new Map(s.subjects.map((x) => [x.slug, x]))]))
  const rows = SEMESTERS.map((semester) => {
    const found = drive.get(semester.id) || new Map()
    const known = [...semester.core.map((slug) => [slug, 'Core']), ...semester.groups.flatMap((g) => g.options.map((slug) => [slug, g.label]))]
    const subjects = known.map(([slug, group]) => check(slug, found.get(slug), group))
    for (const [slug, entry] of found) if (!known.some(([k]) => k === slug)) subjects.push(check(slug, entry, 'Not in the catalog'))
    return { id: semester.id, title: semesterTitle(semester), folder: drive.has(semester.id), subjects }
  })
  for (const s of driveSemesters) {
    if (!SEMESTERS.some((x) => x.id === s.id)) {
      rows.push({ id: s.id, title: `${semesterLabel(s.id)} (not in the catalog)`, folder: true, subjects: s.subjects.map((x) => check(x.slug, x, 'Not in the catalog')) })
    }
  }
  return rows
}

function Badge({ bad, children }) {
  return <span className={`rounded-full border px-2 py-px text-caption font-medium ${bad ? 'border-danger text-danger' : 'border-line text-ink-2'}`}>{children}</span>
}

function SubjectRow({ s }) {
  return (
    <li className="min-w-0 py-3">
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="min-w-0 font-semibold break-words text-ink">{s.name}</span>
        <span className="text-caption text-ink-3">{s.group}</span>
      </p>
      <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {!s.folder ? (
          <Badge bad>No Drive folder</Badge>
        ) : (
          <>
            <Badge bad={!s.notes}>{s.notes} notes</Badge>
            <Badge bad={!s.syllabus}>{s.syllabus ? 'Syllabus' : 'No syllabus'}</Badge>
            <Badge>{s.pyqs} PYQs</Badge>
          </>
        )}
      </p>
      {s.folder && s.notes > 0 && (
        <p className="mt-1.5 flex flex-wrap items-center gap-1 text-caption" aria-label={`Units with notes: ${s.units.join(', ') || 'none'}`}>
          <span className="mr-1 text-ink-2">Units</span>
          {s.units.length === 0 && <span className="text-ink-3">no unit-NN file names</span>}
          {Array.from({ length: s.units.at(-1) || 0 }, (_, i) => i + 1).map((u) => {
            const missing = s.missing.includes(u)
            return (
              <span
                key={u}
                title={missing ? `Unit ${u} has no notes` : `Unit ${u}`}
                className={`inline-flex size-6 items-center justify-center rounded-md border font-mono ${
                  missing ? 'border-danger text-danger' : 'border-line bg-surface-2 text-ink'
                }`}
              >
                {u}
              </span>
            )
          })}
          {s.missing.length > 0 && <span className="ml-1 text-danger">missing {s.missing.join(', ')}</span>}
        </p>
      )}
    </li>
  )
}

export default function Gaps() {
  const { data, error, reload } = useAdmin('adminGaps')
  const [only, setOnly] = useState('gaps')

  if (error && !data) return <ErrorState message={error} onRetry={reload} />

  const rows = data ? buildRows(data.semesters) : null
  const all = rows ? rows.flatMap((r) => r.subjects) : []
  const shown = rows?.map((r) => ({ ...r, subjects: only === 'gaps' ? r.subjects.filter(hasGap) : r.subjects })).filter((r) => r.subjects.length)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-display">Content gaps</h1>
        <p className="mt-1 text-body text-ink-2">
          Each subject in the catalog against its Drive folder. Missing units are those below the highest unit that has notes.
        </p>
      </div>
      {!rows ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Subjects" value={all.length} hint={`${all.filter((s) => s.folder).length} with a Drive folder`} />
            <StatCard label="Without notes" value={all.filter((s) => !s.notes).length} />
            <StatCard label="Missing units" value={all.filter((s) => s.missing.length).length} hint="subjects" />
            <StatCard label="No syllabus" value={all.filter((s) => s.folder && !s.syllabus).length} hint="of those with a folder" />
          </div>
          <Chips
            label="Show"
            value={only}
            onChange={setOnly}
            options={[
              { key: 'gaps', label: 'Only gaps', count: all.filter(hasGap).length },
              { key: 'all', label: 'All subjects', count: all.length },
            ]}
          />
          {!shown.length ? (
            <EmptyState icon={FolderX} title="No gaps" text="Every subject has notes, with no unit skipped." />
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
              {shown.map((r) => (
                <Panel key={r.id} title={r.title}>
                  {!r.folder && <p className="mb-2 text-label text-danger">No folder for this semester in Drive.</p>}
                  <ul className="-my-3 flex flex-col divide-y divide-line">
                    {r.subjects.map((s) => (
                      <SubjectRow key={s.slug} s={s} />
                    ))}
                  </ul>
                </Panel>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
