// Search: every file in the library by title, unit, subject or type, with scope and subject
// filters. The query lives in ?q= so the top-bar search and the back button work.

import { History, Search as SearchIcon, SearchX, X } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import Chips from '../components/Chips.jsx'
import { BookmarkButton, FileTypeIcon } from '../components/FileBits.jsx'
import LibraryGate from '../components/LibraryGate.jsx'
import PaneLayout from '../components/PaneLayout.jsx'
import { Card, EmptyState, Tag } from '../components/ui.jsx'
import { CATEGORIES, categoryLabel, formatSize, kindLabel } from '../lib/files.js'
import { highlightParts, queryWords, searchLibrary } from '../lib/search.js'
import { clearSearches, rememberSearch, useRecentSearches } from '../lib/store.js'
import { useFilePane } from '../lib/useFilePane.js'

const SCOPES = [{ key: 'all', label: 'All' }, ...CATEGORIES]

function Highlighted({ text, words }) {
  return highlightParts(text, words).map((part, i) =>
    part.match ? (
      <mark key={i} className="rounded-sm bg-primary-soft text-primary-ink">
        {part.text}
      </mark>
    ) : (
      part.text
    ),
  )
}

function Result({ result, words, active, onOpen }) {
  const { file, subject } = result
  const meta = [kindLabel(file.kind), formatSize(file.size)].filter(Boolean)
  return (
    <li className="relative">
      <button
        type="button"
        onClick={() => onOpen(file)}
        aria-current={active ? 'true' : undefined}
        className={`flex w-full flex-col gap-2 rounded-2xl border p-4 pr-14 text-left transition-colors ${
          active ? 'border-primary bg-surface-2' : 'border-line bg-surface hover:border-line-strong'
        }`}
      >
        <span className="flex flex-wrap items-center gap-1.5">
          <Tag look={subject.look}>{subject.look.short}</Tag>
          <span className="font-mono text-caption text-ink-3">
            {[categoryLabel(file.category), file.unit ? `Unit ${file.unit}` : null].filter(Boolean).join(' · ')}
          </span>
          {file.isNew && (
            <span className="rounded bg-primary-soft px-1.5 font-mono text-[10px] font-semibold text-primary-ink">NEW</span>
          )}
        </span>
        <span className="flex items-start gap-3">
          <FileTypeIcon kind={file.kind} className="mt-0.5 size-8" />
          <span className="min-w-0 flex-1">
            <span className="block text-heading text-ink">
              <Highlighted text={file.title} words={words} />
            </span>
            <span className="mt-0.5 block font-mono text-caption text-ink-3">{meta.join(' · ')}</span>
          </span>
        </span>
      </button>
      <span className="absolute top-2 right-2">
        <BookmarkButton file={file} />
      </span>
    </li>
  )
}

function RecentSearches({ onPick }) {
  const recent = useRecentSearches()
  if (!recent.length) {
    return (
      <EmptyState
        icon={SearchIcon}
        title="Find any note or paper"
        text="Search by topic, unit (“unit 2”), subject or type (“pyq 2025”)."
      />
    )
  }
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-label font-semibold text-ink-2">
          <History className="size-4" aria-hidden="true" /> Recent searches
        </h2>
        <button type="button" onClick={clearSearches} className="min-h-9 rounded-lg px-2 text-label font-medium text-primary-ink">
          Clear
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {recent.map((q) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onPick(q)}
              className="flex h-9 items-center rounded-lg border border-line bg-surface-2 px-3 font-mono text-caption text-ink hover:border-line-strong"
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function SearchBody({ library }) {
  const [params, setParams] = useSearchParams()
  const { active, activeId, open } = useFilePane(library)
  const q = params.get('q') ?? ''
  const scope = SCOPES.some((s) => s.key === params.get('scope')) ? params.get('scope') : 'all'
  const subjectFilter = library.bySlug.has(params.get('subject')) ? params.get('subject') : 'all'
  const words = queryWords(q)
  const matches = useMemo(() => searchLibrary(library, q), [library, q])

  function update(changes) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (!value || value === 'all') next.delete(key)
      else next.set(key, value)
    }
    setParams(next, { replace: true })
  }

  const inSubject = matches.filter((r) => subjectFilter === 'all' || r.file.subject === subjectFilter)
  const inScope = matches.filter((r) => scope === 'all' || r.file.category === scope)
  const results = inSubject.filter((r) => scope === 'all' || r.file.category === scope)

  const scopeOptions = SCOPES.map((s) => ({
    ...s,
    count: s.key === 'all' ? inSubject.length : inSubject.filter((r) => r.file.category === s.key).length,
  }))
  const subjectOptions = [
    { key: 'all', label: 'All subjects', count: inScope.length },
    ...library.subjects
      .map((s) => ({ key: s.slug, label: s.look.short, count: inScope.filter((r) => r.file.subject === s.slug).length }))
      .filter((o) => o.count > 0 || o.key === subjectFilter),
  ]

  function openResult(file) {
    rememberSearch(q)
    open(file)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-display">Search</h1>
        <p className="mt-1 text-body text-ink-2">Every note, PYQ and reference across your subjects.</p>
      </div>

      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          rememberSearch(q)
          event.currentTarget.querySelector('input')?.blur()
        }}
        className="flex items-center gap-2 rounded-2xl border border-line-strong bg-surface px-4 focus-within:border-primary-ink"
      >
        <SearchIcon className="size-5 text-ink-3" aria-hidden="true" />
        <label htmlFor="search-q" className="sr-only">
          Search the library
        </label>
        <input
          id="search-q"
          type="search"
          value={q}
          autoFocus={!q}
          onChange={(e) => update({ q: e.target.value, file: null })}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && q) {
              e.preventDefault()
              update({ q: null, file: null })
            }
          }}
          placeholder="Search notes, PYQs, references…"
          autoComplete="off"
          enterKeyHint="search"
          className="h-14 min-w-0 flex-1 bg-transparent text-heading lg:text-title text-ink outline-none placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button type="button" className="icon-btn" onClick={() => update({ q: null, file: null })} aria-label="Clear search">
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </form>

      {words.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <Chips label="Type" options={scopeOptions} value={scope} onChange={(key) => update({ scope: key })} />
          {subjectOptions.length > 2 && (
            <Chips label="Subject" options={subjectOptions} value={subjectFilter} onChange={(key) => update({ subject: key })} mono />
          )}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {words.length ? `${results.length} ${results.length === 1 ? 'result' : 'results'}` : ''}
      </p>

      {words.length === 0 ? (
        <RecentSearches onPick={(pick) => update({ q: pick })} />
      ) : (
        <PaneLayout library={library} active={active}>
          <p className="px-1 font-mono text-caption text-ink-3" aria-hidden="true">
            {results.length} {results.length === 1 ? 'result' : 'results'} for “{q.trim()}”
          </p>
          {results.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Nothing matches"
              text={
                matches.length
                  ? 'There are matches outside these filters.'
                  : 'Try fewer words, or search by subject, unit or type.'
              }
              action={
                matches.length > 0 && (
                  <button type="button" className="btn-secondary" onClick={() => update({ scope: null, subject: null })}>
                    Clear filters
                  </button>
                )
              }
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {results.map((r) => (
                <Result key={r.file.id} result={r} words={words} active={r.file.id === activeId} onOpen={openResult} />
              ))}
            </ul>
          )}
        </PaneLayout>
      )}
    </div>
  )
}

export default function Search() {
  return <LibraryGate>{(library) => <SearchBody library={library} />}</LibraryGate>
}
