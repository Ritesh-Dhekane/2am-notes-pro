// /admin/content: every semester, subject and file, to hide or show and to mark as coming soon. The
// backend enforces the rules (apps-script/Visibility.js): students never get hidden items, and
// coming-soon subjects are listed without their files. Each change is saved straight away.

import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { ErrorState, Skeleton, StatusBadges } from '../../components/ui.jsx'
import { semesterLabel, useAdmin, useAdminAction } from './adminData.js'
import { Panel } from './bits.jsx'

const CATEGORY_LABEL = { notes: 'Notes', pyqs: 'PYQs', assignments: 'Assignments', references: 'References' }

// Whether `path` is in the list or under one of its paths; file ids match exactly (like listCovers).
function covers(list, path, id) {
  return list.some((item) => item === path || (id && item === id) || path.startsWith(`${item}/`))
}

function without(list, ...items) {
  return list.filter((item) => !items.includes(item))
}

function fileCount(subject) {
  return Object.values(subject.files).flat().length + (subject.syllabus ? 1 : 0)
}

// A switch (`on` set) or, with `on` undefined, a plain button.
function Toggle({ on, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-label font-medium transition-colors disabled:opacity-60 ${
        on ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

// One semester, subject or file: name, state and its toggles. `inherited` is set when a parent already
// hides it (or marks it coming soon), so its own toggle would change nothing.
function Row({ depth, name, detail, expanded, onExpand, state, children }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 py-2 ${depth === 1 ? 'pl-4 sm:pl-6' : depth === 2 ? 'pl-8 sm:pl-12' : ''}`}>
      {onExpand ? (
        <button type="button" onClick={onExpand} aria-expanded={expanded} className="flex min-h-10 min-w-0 flex-1 items-center gap-2 text-left">
          {expanded ? <ChevronDown className="size-4 shrink-0 text-ink-3" aria-hidden="true" /> : <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden="true" />}
          <span className="min-w-0">
            <span className={`block truncate ${depth === 0 ? 'text-heading' : 'text-body font-semibold'} text-ink`}>{name}</span>
            {detail && <span className="block truncate text-caption text-ink-3">{detail}</span>}
          </span>
        </button>
      ) : (
        <span className="min-w-0 flex-1">
          <span className="block truncate text-label text-ink" title={name}>
            {name}
          </span>
          {detail && <span className="block truncate text-caption text-ink-3">{detail}</span>}
        </span>
      )}
      <span className="flex flex-wrap items-center gap-2">
        <StatusBadges item={state} />
        {children}
      </span>
    </div>
  )
}

export default function Content() {
  const { data, error, reload } = useAdmin('adminVisibility')
  const [saved, setSaved] = useState(null)
  const [open, setOpen] = useState({})
  const [run, action] = useAdminAction()
  const rules = saved || data?.visibility

  if (error && !data) return <ErrorState message={error} onRetry={reload} />
  if (!rules) return <Skeleton className="h-96" />

  async function save(next) {
    const result = await run('adminVisibilitySet', { visibility: { ...rules, ...next } })
    if (result) setSaved(result.visibility)
  }
  const flip = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }))

  // Hide/Show for a path (and, for a file, its id). Showing also drops a path entry made by hand.
  function hideToggle(path, id, hidden, inherited) {
    return (
      <Toggle disabled={action.busy || inherited} onClick={() => save({ hidden: hidden ? without(rules.hidden, path, id) : [...rules.hidden, id || path] })}>
        {hidden ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4" aria-hidden="true" />}
        {hidden ? 'Show' : 'Hide'}
      </Toggle>
    )
  }

  function soonToggle(path, soon, inherited) {
    return (
      <Toggle
        on={soon}
        disabled={action.busy || inherited}
        onClick={() => save({ comingSoon: soon ? without(rules.comingSoon, path) : [...rules.comingSoon, path] })}
      >
        Coming soon
      </Toggle>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-display">Content</h1>
        <p className="mt-1 text-body text-ink-2">
          Hidden items disappear for students, and links to them stop working. Coming-soon subjects stay listed with a badge, but their files
          don't open. Admins still see everything. Changes apply straight away.
        </p>
      </div>
      {action.error && (
        <p role="alert" className="text-label text-danger">
          {action.error}
        </p>
      )}
      <Panel title="Semesters, subjects and files">
        <ul className="flex flex-col divide-y divide-line">
          {data.semesters.map((semester) => {
            const semHidden = covers(rules.hidden, semester.id)
            const semSoon = covers(rules.comingSoon, semester.id)
            return (
              <li key={semester.id}>
                <Row
                  depth={0}
                  name={semesterLabel(semester.id)}
                  detail={`${semester.subjects.length} subjects`}
                  expanded={Boolean(open[semester.id])}
                  onExpand={() => flip(semester.id)}
                  state={{ hidden: semHidden }}
                >
                  {hideToggle(semester.id, null, rules.hidden.includes(semester.id), false)}
                  {soonToggle(semester.id, rules.comingSoon.includes(semester.id), false)}
                </Row>
                {open[semester.id] && (
                  <ul className="flex flex-col divide-y divide-line border-t border-line">
                    {semester.subjects.length === 0 && <li className="py-2 pl-6 text-label text-ink-3">No subjects yet.</li>}
                    {semester.subjects.map((subject) => {
                      const path = `${semester.id}/${subject.slug}`
                      const hidden = covers(rules.hidden, path)
                      const soon = covers(rules.comingSoon, path)
                      const files = [
                        ...Object.entries(subject.files).flatMap(([category, list]) =>
                          list.map((f) => ({ ...f, category, path: `${path}/${category}/${f.name}` })),
                        ),
                        ...(subject.syllabus ? [{ ...subject.syllabus, category: 'syllabus', path: `${path}/${subject.syllabus.name}` }] : []),
                      ]
                      return (
                        <li key={path}>
                          <Row
                            depth={1}
                            name={subject.name}
                            detail={`${fileCount(subject)} files`}
                            expanded={Boolean(open[path])}
                            onExpand={() => flip(path)}
                            state={{ hidden, comingSoon: semSoon }}
                          >
                            {hideToggle(path, null, hidden, semHidden)}
                            {soonToggle(path, soon, semSoon)}
                          </Row>
                          {open[path] && (
                            <ul className="flex flex-col border-t border-line">
                              {files.length === 0 && <li className="py-2 pl-12 text-label text-ink-3">No files yet.</li>}
                              {files.map((f) => {
                                const fileHidden = covers(rules.hidden, f.path, f.id)
                                return (
                                  <li key={f.id}>
                                    <Row depth={2} name={f.name} detail={CATEGORY_LABEL[f.category] || 'Syllabus'} state={{ hidden: fileHidden }}>
                                      {hideToggle(f.path, f.id, fileHidden, hidden)}
                                    </Row>
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </Panel>
    </div>
  )
}
