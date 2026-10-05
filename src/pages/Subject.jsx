// One subject: notes by unit, PYQs and references. On desktop the chosen file opens in a pane on
// the right; on phones it opens in the full reader.

import { ChevronDown, ChevronRight, FileQuestion, Library, NotebookText, ScrollText, Search } from 'lucide-react'
import { createElement, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import FileRow from '../components/FileRow.jsx'
import LibraryGate from '../components/LibraryGate.jsx'
import FilePane from '../components/FilePane.jsx'
import { Card, EmptyState, SubjectIcon, Tag } from '../components/ui.jsx'
import { byExamDesc, CATEGORIES, groupByUnit } from '../lib/files.js'
import { useFilePane } from '../lib/useFilePane.js'
import { subjectGroupLabel } from '../lib/catalog.js'
import { tintStyle } from '../lib/subjects.js'

const TABS = [{ key: 'all', label: 'All' }, ...CATEGORIES]
const TAB_ICON = { notes: NotebookText, pyqs: FileQuestion, references: Library }

function UnitGroup({ unit, items, open, onToggle, activeId, onOpen }) {
  const id = `unit-${unit ?? 'other'}`
  return (
    <li className="rounded-2xl border border-line bg-surface">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          className="flex w-full items-center gap-3 px-4 py-3 text-left"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 font-mono text-label text-ink-2">
            {unit ? String(unit).padStart(2, '0') : '··'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-mono text-caption text-ink-3">{unit ? `UNIT ${String(unit).padStart(2, '0')}` : 'OTHER'}</span>
            <span className="block truncate text-body font-semibold text-ink">
              {items.length} {items.length === 1 ? 'file' : 'files'}
              {items.some((f) => f.isNew) && <span className="ml-2 text-caption font-medium text-primary-ink">· new</span>}
            </span>
          </span>
          {open ? <ChevronDown className="size-5 text-ink-3" aria-hidden="true" /> : <ChevronRight className="size-5 text-ink-3" aria-hidden="true" />}
        </button>
      </h3>
      {open && (
        <ul id={id} className="flex flex-col gap-1 px-2 pb-2">
          {items.map((file) => (
            <FileRow key={file.id} file={file} active={file.id === activeId} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </li>
  )
}

function SubjectBody({ library }) {
  const { subjectId } = useParams()
  const [params, setParams] = useSearchParams()
  const { active, activeId, open } = useFilePane(library)
  const subject = library.bySlug.get(subjectId)
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'all'
  const [filter, setFilter] = useState('')
  const [openUnits, setOpenUnits] = useState(null) // null = default (first unit and any with new files)

  if (!subject) {
    return (
      <EmptyState
        icon={Library}
        title="This subject isn't in the library"
        text="It may have been renamed or removed."
        action={
          <Link to="/subjects" className="btn-primary">
            All subjects
          </Link>
        }
      />
    )
  }

  const words = filter.toLowerCase().split(/\s+/).filter(Boolean)
  const matches = (f) => words.every((w) => `${f.title} unit ${f.unit ?? ''}`.toLowerCase().includes(w))
  const notes = subject.files.notes.filter(matches)
  const pyqs = subject.files.pyqs.filter(matches).sort(byExamDesc)
  const references = subject.files.references.filter(matches)
  const groups = groupByUnit(notes)
  const defaultOpen = new Set(groups.filter((g, i) => i === 0 || g.items.some((f) => f.isNew)).map((g) => g.unit))
  const isOpen = (unit) => (words.length ? true : (openUnits ?? defaultOpen).has(unit))

  function setTab(key) {
    const next = new URLSearchParams(params)
    if (key === 'all') next.delete('tab')
    else next.set('tab', key)
    setParams(next, { replace: true })
  }

  const showNotes = tab === 'all' || tab === 'notes'
  const showPyqs = tab === 'all' || tab === 'pyqs'
  const showRefs = tab === 'all' || tab === 'references'
  const nothing = (showNotes ? notes.length : 0) + (showPyqs ? pyqs.length : 0) + (showRefs ? references.length : 0) === 0

  const counts = { all: subject.files.notes.length + subject.files.pyqs.length + subject.files.references.length }
  for (const c of CATEGORIES) counts[c.key] = subject.files[c.key].length

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Breadcrumb" className="font-mono text-caption text-ink-3">
        <Link to="/subjects" className="hover:text-ink">
          Subjects
        </Link>{' '}
        / <span className="text-ink-2">{subject.name}</span>
      </nav>

      <Card className="tint p-5" style={tintStyle(subject.look)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <SubjectIcon look={subject.look} size="lg" />
            <div className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <Tag look={subject.look}>{subject.look.code || subject.look.short}</Tag>
                <span className="font-mono text-caption text-ink-3">{subjectGroupLabel(library.semester, subject.slug)}</span>
              </span>
              <h1 className="mt-1.5 text-[26px] leading-8 font-bold tracking-tight lg:text-display">{subject.name}</h1>
              <p className="mt-1 max-w-2xl font-serif text-[15px] leading-6 text-ink-2">{subject.look.about}</p>
              {subject.syllabus && (
                <button
                  type="button"
                  onClick={() => open(subject.syllabus)}
                  aria-current={activeId === subject.syllabus.id ? 'true' : undefined}
                  className="btn-secondary mt-3 bg-surface"
                >
                  <ScrollText className="size-4 text-primary-ink" aria-hidden="true" /> Syllabus
                </button>
              )}
            </div>
          </div>
          <dl className="grid grid-cols-4 gap-2 lg:flex lg:gap-6">
            {[
              ['Units', subject.unitCount],
              ['Notes', counts.notes],
              ['PYQs', counts.pyqs],
              ['Refs', counts.references],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-surface-2 px-3 py-2 lg:bg-transparent lg:p-0">
                <dt className="text-caption text-ink-3">{label}</dt>
                <dd className="font-mono text-heading text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      <div role="tablist" aria-label="Sections" className="-mx-5 flex gap-2 overflow-x-auto px-5 scrollbar-none lg:mx-0 lg:px-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-label font-semibold transition-colors ${
              tab === t.key ? 'bg-primary text-on-primary' : 'border border-line bg-surface text-ink-2 hover:text-ink'
            }`}
          >
            {TAB_ICON[t.key] && createElement(TAB_ICON[t.key], { className: 'size-4', 'aria-hidden': true })}
            {t.label} <span className="font-mono text-caption">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <label className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:border-primary-ink">
            <Search className="size-4 text-ink-3" aria-hidden="true" />
            <span className="sr-only">Search in {subject.name}</span>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={`Search in ${subject.look.short}…`}
              className="h-11 min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-3"
            />
          </label>

          {nothing && (
            <EmptyState
              icon={Library}
              title={words.length ? 'Nothing matches' : 'No files here yet'}
              text={words.length ? 'Try fewer or different words.' : 'Files appear as soon as they are added to this subject in Drive.'}
            />
          )}

          {showNotes && groups.length > 0 && (
            <section aria-labelledby="notes-h">
              <h2 id="notes-h" className="mb-2 px-1 text-heading">
                Notes
              </h2>
              <ul className="flex flex-col gap-2">
                {groups.map((g) => (
                  <UnitGroup
                    key={g.unit ?? 'other'}
                    unit={g.unit}
                    items={g.items}
                    open={isOpen(g.unit)}
                    activeId={activeId}
                    onOpen={open}
                    onToggle={() =>
                      setOpenUnits((current) => {
                        const next = new Set(current ?? defaultOpen)
                        if (next.has(g.unit)) next.delete(g.unit)
                        else next.add(g.unit)
                        return next
                      })
                    }
                  />
                ))}
              </ul>
            </section>
          )}

          {showPyqs && pyqs.length > 0 && (
            <section aria-labelledby="pyqs-h">
              <h2 id="pyqs-h" className="mb-2 px-1 text-heading">
                Previous-year papers
              </h2>
              <Card as="ul" className="flex flex-col gap-1 p-2">
                {pyqs.map((file) => (
                  <FileRow key={file.id} file={file} showUnit active={file.id === activeId} onOpen={open} />
                ))}
              </Card>
            </section>
          )}

          {showRefs && references.length > 0 && (
            <section aria-labelledby="refs-h">
              <h2 id="refs-h" className="mb-2 px-1 text-heading">
                References
              </h2>
              <Card as="ul" className="flex flex-col gap-1 p-2">
                {references.map((file) => (
                  <FileRow key={file.id} file={file} showUnit active={file.id === activeId} onOpen={open} />
                ))}
              </Card>
            </section>
          )}
        </div>

        <div className="hidden lg:sticky lg:top-24 lg:block">
          <FilePane file={active} subject={subject} />
        </div>
      </div>
    </div>
  )
}

export default function Subject() {
  return <LibraryGate>{(library) => <SubjectBody library={library} />}</LibraryGate>
}
