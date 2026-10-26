// SPPU Syllabus Explorer (/syllabus), public, in three modes (?mode=): Find, a step-by-step course picker
// (the default); Map, the courses as a zoomable map; Search all, instant search and filters over every
// syllabus, grouped faculty → programme. Mode, step, search and filters live in the URL, so any view can be
// shared. The build pre-renders this page for search engines (scripts/syllabus-pages.mjs).

import { Compass, List, Map as MapIcon, ScrollText, Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react'
import { lazy, Suspense, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SyllabusFinder from '../components/SyllabusFinder.jsx'
import { EntryRow, ShareButton, SourceCredit, SyllabusFrame } from '../components/SyllabusBits.jsx'
import { EmptyState, ErrorState, Skeleton } from '../components/ui.jsx'
import { byNewest, EXPLORER_TITLE, groupEntries, programmeOf, searchEntries } from '../lib/syllabus.js'
import { useDocumentTitle, useSyllabi } from '../lib/useSyllabi.js'

const FILTERS = [
  { key: 'faculty', label: 'Faculty', all: 'All faculties', of: (e) => e.faculty },
  { key: 'level', label: 'Level', all: 'All levels', of: (e) => e.level },
  { key: 'library', label: 'Year', all: 'All years', of: (e) => e.library },
  { key: 'programme', label: 'Programme', all: 'All programmes', of: programmeOf },
]

const MODES = [
  { key: 'find', label: 'Find', icon: Compass },
  { key: 'map', label: 'Map', icon: MapIcon },
  { key: 'search', label: 'Search all', icon: List },
]

// The map loads only when someone opens it.
const SyllabusMap = lazy(() => import('../components/SyllabusMap.jsx'))

const chosenIn = (params) => Object.fromEntries(FILTERS.map((f) => [f.key, params.get(f.key) || '']))

const selectClass = 'h-11 w-full min-w-0 rounded-xl border border-line bg-surface px-3 text-label text-ink'

function WhatsNew({ entries }) {
  const newest = useMemo(() => [...entries].sort(byNewest).slice(0, 10), [entries])
  return (
    <section aria-labelledby="whats-new" className="mt-6">
      <h2 id="whats-new" className="mb-2 text-heading">What's new</h2>
      <ul className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {newest.map((e) => (
          <li key={e.id} className="w-60 shrink-0 snap-start">
            <Link to={`/syllabus/${encodeURIComponent(e.id)}`} className="flex h-full flex-col gap-1 rounded-2xl border border-line bg-surface p-3 hover:border-line-strong">
              <span className="font-mono text-caption text-ink-3">{e.uploaded} · {e.library}</span>
              <span className="line-clamp-2 text-label font-semibold text-ink">{e.title}</span>
              <span className="mt-auto text-caption text-ink-2">{e.faculty}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Browse({ entries, open, latest }) {
  const groups = useMemo(() => groupEntries(entries), [entries])
  return (
    <div className="mt-6 flex flex-col gap-3">
      {groups.map(({ faculty, programmes }) => (
        <details key={faculty} open={open} className="group rounded-2xl border border-line bg-surface">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 text-heading">
            <span className="min-w-0">{faculty}</span>
            <span className="shrink-0 font-mono text-caption text-ink-3">{programmes.length} programme{programmes.length === 1 ? '' : 's'}</span>
          </summary>
          <div className="flex flex-col gap-4 border-t border-line px-1 py-3">
            {programmes.map((p) => (
              <section key={p.name} aria-label={p.name}>
                <h3 className="flex items-center justify-between gap-2 px-3 text-label font-semibold text-ink-2">
                  <Link to={`/syllabus/p/${p.slug}`} className="min-w-0 hover:text-ink hover:underline">{p.name}</Link>
                  <span className="shrink-0 font-mono text-caption font-normal text-ink-3">{p.entries.length}</span>
                </h3>
                <ul>
                  {p.entries.map((e) => (
                    <EntryRow key={e.id} entry={e} latest={latest.has(e.id)} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </details>
      ))}
    </div>
  )
}

// The four filters: inline from 640px up; on phones, in a bottom sheet behind a "Filters" button.
function Filters({ chosen, options, update, count, clear }) {
  const [open, setOpen] = useState(false)
  const active = FILTERS.filter((f) => chosen[f.key]).length
  useEffect(() => {
    if (!open) return
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  const selects = FILTERS.map((f) => (
    <label key={f.key} className="min-w-0">
      <span className="sr-only">{f.label}</span>
      <select value={chosen[f.key]} onChange={(e) => update({ [f.key]: e.target.value })} className={selectClass}>
        <option value="">{f.all}</option>
        {(options[f.key] || []).map((value) => (
          <option key={value} value={value}>{value}</option>
        ))}
      </select>
    </label>
  ))
  return (
    <>
      <div className="mt-3 hidden grid-cols-4 gap-2 sm:grid">{selects}</div>
      <button type="button" className="btn-secondary press mt-3 sm:hidden" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        <SlidersHorizontal className="size-4" aria-hidden="true" /> Filters
        {active > 0 && <span className="grid size-5 place-items-center rounded-full bg-primary text-caption font-bold text-on-primary">{active}</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button type="button" className="sheet-scrim absolute inset-0 bg-scrim" aria-label="Close filters" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="filters-title"
            className="sheet-panel absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-surface px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-line-strong" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <h2 id="filters-title" className="text-heading">Filters</h2>
              {active > 0 && (
                <button type="button" className="min-h-11 px-2 text-label font-semibold text-primary-ink" onClick={clear}>Clear filters</button>
              )}
            </div>
            <div className="mt-3 flex flex-col gap-2">{selects}</div>
            <button type="button" className="btn-primary mt-4 w-full" onClick={() => setOpen(false)} autoFocus>
              Show {count} {count === 1 ? 'syllabus' : 'syllabi'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function SearchAll({ entries, params, setParams, update }) {
  const q = params.get('q') || ''
  const query = useDeferredValue(q)
  const chosen = chosenIn(params)

  // Options for each filter come from the entries the other filters leave.
  const options = useMemo(() => {
    const chosen = chosenIn(params)
    return Object.fromEntries(
      FILTERS.map((f) => {
        const rest = entries.filter((e) => FILTERS.every((g) => g === f || !chosen[g.key] || g.of(e) === chosen[g.key]))
        return [f.key, [...new Set(rest.map(f.of).filter(Boolean))].sort()]
      }),
    )
  }, [entries, params])

  // "Latest": the newest upload of each programme, whatever the filters show.
  const latest = useMemo(() => {
    const newest = new Map()
    for (const e of entries) {
      const name = programmeOf(e)
      if (!newest.has(name) || byNewest(e, newest.get(name)) < 0) newest.set(name, e)
    }
    return new Set([...newest.values()].map((e) => e.id))
  }, [entries])

  const results = useMemo(() => {
    const chosen = chosenIn(params)
    const filtered = entries.filter((e) => FILTERS.every((f) => !chosen[f.key] || f.of(e) === chosen[f.key]))
    return searchEntries(filtered, query)
  }, [entries, query, params])

  const narrowed = Boolean(query.trim()) || FILTERS.some((f) => chosen[f.key])

  return (
    <>
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-line-strong bg-surface px-4 focus-within:border-primary-ink">
        <SearchIcon className="size-5 shrink-0 text-ink-3" aria-hidden="true" />
        <label htmlFor="syllabus-q" className="sr-only">Search syllabi</label>
        <input
          id="syllabus-q"
          type="search"
          value={q}
          onChange={(e) => update({ q: e.target.value })}
          placeholder="Search: MCA, B.Sc CS, 2025 pattern…"
          autoComplete="off"
          enterKeyHint="search"
          className="h-13 min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button type="button" className="icon-btn" onClick={() => update({ q: '' })} aria-label="Clear search">
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <Filters
        chosen={chosen}
        options={options}
        update={update}
        count={results.length}
        clear={() => update(Object.fromEntries(FILTERS.map((f) => [f.key, ''])))}
      />

      {!narrowed && <WhatsNew entries={entries} />}
      <p id="syllabus-count" className="mt-6 text-label text-ink-3" aria-live="polite">
        {narrowed ? `${results.length} of ${entries.length} syllabi` : `${entries.length} syllabi`}
        {narrowed && (
          <button type="button" className="ml-2 font-semibold text-primary-ink hover:underline" onClick={() => setParams({ mode: 'search' }, { replace: true })}>
            Clear all
          </button>
        )}
      </p>
      {results.length ? (
        <Browse entries={results} open={narrowed} latest={latest} />
      ) : (
        <div className="mt-4"><EmptyState icon={SearchIcon} title="No syllabus matches" text="Try fewer words, or clear a filter." /></div>
      )}
    </>
  )
}

// Find · Map · Search all, with an indicator that slides to the chosen tab; arrow keys move between them.
function ModeTabs({ mode, onMode }) {
  const at = MODES.findIndex((m) => m.key === mode)
  return (
    <div role="tablist" aria-label="Explorer mode" className="relative mt-5 grid grid-cols-3 border-b border-line">
      {MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          role="tab"
          id={`tab-${m.key}`}
          aria-selected={m.key === mode}
          aria-controls="syllabus-panel"
          tabIndex={m.key === mode ? 0 : -1}
          onClick={() => onMode(m.key)}
          onKeyDown={(event) => {
            const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
            if (!step) return
            const next = MODES[(at + step + MODES.length) % MODES.length]
            onMode(next.key)
            document.getElementById(`tab-${next.key}`)?.focus()
          }}
          className="flex min-h-12 items-center justify-center gap-1.5 text-label font-semibold text-ink-2 transition-colors hover:text-ink aria-selected:text-primary-ink"
        >
          <m.icon className="size-4" aria-hidden="true" /> {m.label}
        </button>
      ))}
      <span
        aria-hidden="true"
        className="tab-indicator absolute bottom-[-1px] left-0 h-0.5 w-1/3 rounded-full bg-primary-ink"
        style={{ transform: `translateX(${Math.max(at, 0) * 100}%)` }}
      />
    </div>
  )
}

export default function Syllabus() {
  useDocumentTitle(EXPLORER_TITLE)
  const { entries, error, retry } = useSyllabi()
  const [params, setParams] = useSearchParams()
  const legacyMap = params.get('view') === 'map' // links from before the modes
  const mode = MODES.some((m) => m.key === params.get('mode')) ? params.get('mode') : legacyMap ? 'map' : 'find'

  const update = (changes, options = { replace: true }) => {
    const next = new URLSearchParams(params)
    next.delete('view')
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, options)
  }
  // Mode and finder steps push history, so the phone's Back button steps back.
  const setMode = (key) => update({ mode: key }, { replace: false })
  const setPath = (path) => update({ mode: 'find', path }, { replace: false })

  return (
    <SyllabusFrame>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-[28px] leading-9 font-bold tracking-tight">
            <ScrollText className="size-7 shrink-0 text-primary-ink" aria-hidden="true" /> SPPU Syllabus
          </h1>
          <p className="mt-1 text-body text-ink-2">Every official syllabus of Savitribai Phule Pune University, searchable and readable on your phone.</p>
        </div>
        <ShareButton title="SPPU Syllabus Explorer" />
      </div>
      <SourceCredit library="2026" className="mt-2" />

      <ModeTabs mode={mode} onMode={setMode} />

      <div key={mode} id="syllabus-panel" role="tabpanel" aria-labelledby={`tab-${mode}`} className="mode-panel">
        {error ? (
          <div className="mt-6"><ErrorState message={error} onRetry={retry} /></div>
        ) : !entries ? (
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3" aria-busy="true">
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="shimmer h-24 w-full" />)}
          </div>
        ) : mode === 'find' ? (
          <SyllabusFinder entries={entries} path={params.get('path') || ''} onPath={setPath} />
        ) : mode === 'map' ? (
          <Suspense fallback={<Skeleton className="shimmer mt-4 h-96 w-full" />}>
            <div className="mt-4"><SyllabusMap entries={entries} onCourse={setPath} /></div>
          </Suspense>
        ) : (
          <SearchAll entries={entries} params={params} setParams={setParams} update={update} />
        )}
      </div>
    </SyllabusFrame>
  )
}
