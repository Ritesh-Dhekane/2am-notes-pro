// SPPU Syllabus Explorer (/syllabus), public: instant search, filters, "What's new", then every syllabus
// grouped faculty → programme. Search and filters live in the URL, so a filtered view can be shared.
// The build pre-renders this page for search engines (scripts/syllabus-pages.mjs).

import { ScrollText, Search as SearchIcon, X } from 'lucide-react'
import { useDeferredValue, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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

export default function Syllabus() {
  useDocumentTitle(EXPLORER_TITLE)
  const { entries, error, retry } = useSyllabi()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const query = useDeferredValue(q)
  const chosen = chosenIn(params)

  const update = (changes) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace: true })
  }

  // Options for each filter come from the entries the other filters leave.
  const options = useMemo(() => {
    if (!entries) return {}
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
    for (const e of entries || []) {
      const name = programmeOf(e)
      if (!newest.has(name) || byNewest(e, newest.get(name)) < 0) newest.set(name, e)
    }
    return new Set([...newest.values()].map((e) => e.id))
  }, [entries])

  const results = useMemo(() => {
    if (!entries) return []
    const chosen = chosenIn(params)
    const filtered = entries.filter((e) => FILTERS.every((f) => !chosen[f.key] || f.of(e) === chosen[f.key]))
    return searchEntries(filtered, query)
  }, [entries, query, params])

  const narrowed = Boolean(query.trim()) || FILTERS.some((f) => chosen[f.key])

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

      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-line-strong bg-surface px-4 focus-within:border-primary-ink">
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

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FILTERS.map((f) => (
          <label key={f.key} className="min-w-0">
            <span className="sr-only">{f.label}</span>
            <select value={chosen[f.key]} onChange={(e) => update({ [f.key]: e.target.value })} className={selectClass}>
              <option value="">{f.all}</option>
              {(options[f.key] || []).map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {/* Explore map: a toggle here that shows <SyllabusMap entries={entries} /> (lazy import of
          ../components/SyllabusMap.jsx), added when that component is merged. */}

      {error ? (
        <div className="mt-6"><ErrorState message={error} onRetry={retry} /></div>
      ) : !entries ? (
        <div className="mt-6 flex flex-col gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : (
        <>
          {!narrowed && <WhatsNew entries={entries} />}
          <p id="syllabus-count" className="mt-6 text-label text-ink-3" aria-live="polite">
            {narrowed ? `${results.length} of ${entries.length} syllabi` : `${entries.length} syllabi`}
            {narrowed && (
              <button type="button" className="ml-2 font-semibold text-primary-ink hover:underline" onClick={() => setParams({}, { replace: true })}>
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
      )}
    </SyllabusFrame>
  )
}
