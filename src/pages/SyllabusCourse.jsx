// A course's subject-wise syllabus, public, from public/data/syllabus-split/ (lib/syllabusSplit.js).
// /syllabus/c/:course: its semesters and subjects (?file= picks another of its syllabi, ?sem= the semester).
// /syllabus/c/:course/:file/:subject: one subject, with Syllabus (units and topics) and Notes tabs; Notes
// points courses that have notes to the portal and says "not available yet" for the rest. PYQs come later.

import { ArrowLeft, BookOpen, ChevronRight, FileText, FileWarning } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CourseNotesLink, ShareButton, SyllabusFrame } from '../components/SyllabusBits.jsx'
import { EmptyState, Skeleton } from '../components/ui.jsx'
import { notesCourseOf } from '../lib/catalog.js'
import { subjectSlug, useCourseSplit } from '../lib/syllabusSplit.js'
import { useDocumentTitle } from '../lib/useSyllabi.js'

const semesterLabel = (n) => (n == null ? 'All semesters' : `Sem ${n}`)
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

function subjectMeta(s) {
  return [s.code, s.type, s.credits != null && plural(s.credits, 'credit'), s.units?.length && plural(s.units.length, 'unit')]
    .filter(Boolean)
    .join(' · ')
}

function NotFound({ title }) {
  return (
    <EmptyState
      icon={FileWarning}
      title={title}
      action={<Link to="/syllabus" className="btn-primary">Browse all syllabi</Link>}
    />
  )
}

function CourseView({ data, slug }) {
  const [params, setParams] = useSearchParams()
  const file = data.files.find((f) => f.id === params.get('file')) || data.files[0]
  const semester = file.semesters.find((s) => String(s.semester) === params.get('sem')) || file.semesters[0]
  const pick = (changes) => {
    const next = { ...Object.fromEntries(params), ...changes }
    setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v)), { replace: true })
  }

  return (
    <>
      <p className="font-mono text-caption text-ink-3">{data.facultyShort || data.family}</p>
      <h1 className="mt-1 text-[26px] leading-8 font-bold tracking-tight text-ink">SPPU {data.course} syllabus, subject-wise</h1>
      <p className="mt-1 text-label text-ink-2">Units and topics of every subject, from the official syllabus.</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ShareButton title={`SPPU ${data.course} subject-wise syllabus`} />
        <Link to={`/syllabus/${encodeURIComponent(file.id)}`} className="btn-secondary">
          <FileText className="size-4" aria-hidden="true" /> Official PDF
        </Link>
      </div>

      {data.files.length > 1 && (
        <label className="mt-5 block">
          <span className="mb-1 block text-label font-semibold text-ink-2">Syllabus</span>
          <select
            value={file.id}
            onChange={(e) => pick({ file: e.target.value, sem: '' })}
            className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-body text-ink"
          >
            {data.files.map((f) => (
              <option key={f.id} value={f.id}>
                {[f.title, f.pattern && `${f.pattern} pattern`].filter(Boolean).join(' · ')}
              </option>
            ))}
          </select>
        </label>
      )}

      {file.semesters.length > 1 && (
        <div role="tablist" aria-label="Semester" className="scrollbar-none mt-5 flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1">
          {file.semesters.map((s) => (
            <button
              key={String(s.semester)}
              type="button"
              role="tab"
              aria-selected={s === semester}
              onClick={() => pick({ sem: String(s.semester) })}
              className={`min-h-10 shrink-0 rounded-lg px-4 text-label font-semibold transition-colors ${
                s === semester ? 'bg-primary text-on-primary' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {semesterLabel(s.semester)}
            </button>
          ))}
        </div>
      )}

      <h2 className="mt-5 mb-2 text-heading">
        {semesterLabel(semester.semester)} · {plural(semester.subjects.length, 'subject')}
      </h2>
      <ul className="rounded-2xl border border-line bg-surface p-1">
        {semester.subjects.map((s, i) => (
          <li key={`${s.code}-${i}`}>
            <Link
              to={`/syllabus/c/${slug}/${encodeURIComponent(file.id)}/${subjectSlug(semester.semester, s)}`}
              className="flex min-h-14 items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-body font-medium text-ink">{s.title}</span>
                <span className="block font-mono text-caption text-ink-3">{subjectMeta(s)}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <CourseNotesLink programme={data.course} />
      </div>
    </>
  )
}

const TABS = [
  { key: 'syllabus', label: 'Syllabus' },
  { key: 'notes', label: 'Notes' },
]

function SubjectView({ data, slug, file, semester, subject }) {
  const [tab, setTab] = useState('syllabus')
  const notes = notesCourseOf(data.course)
  const back = `/syllabus/c/${slug}?file=${encodeURIComponent(file.id)}&sem=${semester.semester}`

  return (
    <>
      <Link to={back} className="mb-3 inline-flex items-center gap-1.5 text-label font-semibold text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" /> {data.course} subjects
      </Link>
      <p className="font-mono text-caption text-ink-3">
        {[data.course, semester.semester != null && semesterLabel(semester.semester), subject.code].filter(Boolean).join(' · ')}
      </p>
      <h1 className="mt-1 text-[26px] leading-8 font-bold tracking-tight text-ink">{subject.title}</h1>
      <p className="mt-1 text-label text-ink-2">
        {[subject.type, subject.credits != null && plural(subject.credits, 'credit'), file.pattern && `${file.pattern} pattern`].filter(Boolean).join(' · ')}
      </p>
      <div className="mt-4">
        <ShareButton title={`SPPU ${data.course} ${subject.title} syllabus`} />
      </div>

      <div role="tablist" aria-label="Subject" className="mt-5 grid grid-cols-2 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={t.key === tab}
            aria-controls="subject-panel"
            onClick={() => setTab(t.key)}
            className={`-mb-px min-h-11 border-b-2 text-label font-semibold transition-colors ${
              t.key === tab ? 'border-primary-ink text-ink' : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id="subject-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-5">
        {tab === 'syllabus' ? (
          <>
            {subject.units?.length ? (
              <ol className="flex flex-col gap-3">
                {subject.units.map((u, i) => (
                  <li key={i} className="rounded-2xl border border-line bg-surface p-4">
                    <p className="flex items-baseline justify-between gap-3">
                      <span className="text-body font-semibold text-ink">
                        <span className="font-mono text-caption text-ink-3">Unit {i + 1} · </span>
                        {u.title}
                      </span>
                      {u.hours != null && <span className="shrink-0 font-mono text-caption text-ink-3">{u.hours} h</span>}
                    </p>
                    {u.topics && <p className="mt-1.5 text-label leading-6 text-ink-2">{u.topics}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-body text-ink-2">This subject's units aren't listed in the syllabus. The official PDF has the details.</p>
            )}
            <Link
              to={`/syllabus/${encodeURIComponent(file.id)}`}
              className="mt-4 inline-flex items-center gap-1.5 text-label font-semibold text-primary-ink hover:underline"
            >
              <FileText className="size-4" aria-hidden="true" /> Official PDF
              {subject.pages?.length === 2 && ` (pages ${subject.pages[0]}–${subject.pages[1]})`}
            </Link>
          </>
        ) : notes ? (
          <CourseNotesLink programme={data.course} />
        ) : (
          <EmptyState
            icon={BookOpen}
            title="Notes not available yet"
            text={`Notes are added course by course. Meanwhile, the ${data.course} syllabus is all here.`}
          />
        )}
      </div>
    </>
  )
}

export default function SyllabusCourse() {
  const { course: slug, file: fileId, subject: subjectId } = useParams()
  const data = useCourseSplit(slug)
  const file = fileId && data?.files.find((f) => f.id === fileId)
  let semester, subject
  for (const s of file?.semesters || []) {
    const found = s.subjects.find((x) => subjectSlug(s.semester, x) === subjectId)
    if (found) [semester, subject] = [s, found]
  }
  useDocumentTitle(
    data && (subject ? `${subject.title}: SPPU ${data.course} syllabus | 2AM Notes Pro` : `SPPU ${data.course} subject-wise syllabus | 2AM Notes Pro`),
  )

  return (
    <SyllabusFrame>
      {!subjectId && (
        <Link to="/syllabus" className="mb-3 inline-flex items-center gap-1.5 text-label font-semibold text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" /> All syllabi
        </Link>
      )}
      {data === undefined ? (
        <Skeleton className="h-40 w-full" />
      ) : !data ? (
        <NotFound title="Course not found" />
      ) : !subjectId ? (
        <CourseView data={data} slug={slug} />
      ) : subject ? (
        <SubjectView data={data} slug={slug} file={file} semester={semester} subject={subject} />
      ) : (
        <NotFound title="Subject not found" />
      )}
    </SyllabusFrame>
  )
}
