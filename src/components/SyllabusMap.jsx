// The SPPU syllabus library as a zoomable treemap (/syllabus?mode=map), one level at a time:
// faculties → course families → courses; a course opens in the finder (onCourse(path)). Box area is the
// number of syllabi (d3-hierarchy squarify). Every box is at least ~44px each way: the smallest ones go into
// an "Others (N)" box that opens a list. The search box above dims the boxes without a match.
// Keyboard: Tab or the arrow keys move between boxes, Enter zooms in or opens, Esc or Backspace zooms out.
// Zooming uses the View Transitions API where there is one: the tapped box grows into the map (and the
// map shrinks back into it); the new boxes fade and scale in with CSS either way. Reduced motion: no motion.

import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy'
import { ArrowLeft, ChevronRight, Search as SearchIcon, X, ZoomIn } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { trackEvent } from '../lib/analytics.js'
import {
  courseOf,
  courseSlug,
  facultyShortOf,
  familyOf,
  familySlug,
  searchEntries,
  shortCourse,
  stageOf,
} from '../lib/syllabus.js'

const MIN = 44 // smallest box side, in px: a comfortable tap target
const GAP = 4
const LABEL_W = 56 // narrower boxes show only their count
const syllabi = (n) => `${n} ${n === 1 ? 'syllabus' : 'syllabi'}`

function mostCommon(values) {
  const count = new Map()
  for (const v of values) count.set(v, (count.get(v) || 0) + 1)
  return [...count].sort((a, b) => b[1] - a[1])[0]?.[0]
}

// faculty → family → course, each node { key, name, short, entries, children }.
function buildTree(entries) {
  const group = (list, keyOf, nameOf, shortOf, childrenOf) => {
    const map = new Map()
    for (const e of list) map.set(keyOf(e), [...(map.get(keyOf(e)) || []), e])
    return [...map]
      .map(([key, items]) => ({ key, name: nameOf(items[0]), short: shortOf(items[0]), entries: items, children: childrenOf?.(items) }))
      .sort((a, b) => b.entries.length - a.entries.length || a.name.localeCompare(b.name))
  }
  const courses = (list) => group(list, courseSlug, courseOf, (e) => shortCourse(courseOf(e), familyOf(e)))
  const families = (list) => group(list, familySlug, familyOf, (e) => familyOf(e).replace(/\s*\(.*\)$/, ''), courses)
  return group(entries, facultyShortOf, facultyShortOf, facultyShortOf, families)
}

// Squarified boxes for `nodes` in a w×h area; the smallest nodes fold into one "Others" box until every
// box is at least MIN px each way.
function layout(nodes, width, height) {
  // A floor on each box's share keeps small nodes tappable without folding them away.
  const total = nodes.reduce((sum, n) => sum + n.entries.length, 0)
  const floor = (total * MIN * MIN * 4) / (width * height)
  const tile = (list, ratio) => {
    // Only one level: the nodes' own children are not part of this layout.
    const root = hierarchy({ list }, (d) => d.list).sum((d) => (d.list ? 0 : Math.max(d.entries.length, floor)))
    treemap().tile(treemapSquarify.ratio(ratio)).size([width, height]).paddingInner(GAP).round(true)(root)
    return root.leaves()
  }
  for (let keep = nodes.length; keep >= 1; keep--) {
    const rest = nodes.slice(keep)
    if (rest.length === 1) continue // "Others (1)" would hide one box behind another
    const list = rest.length
      ? [...nodes.slice(0, keep), { key: '__others', name: `Others (${rest.length})`, short: `Others (${rest.length})`, entries: rest.flatMap((n) => n.entries), others: rest }]
      : nodes
    // A few box shapes are tried before folding more nodes away.
    for (const ratio of [1.3, 1, 1.8, 2.5]) {
      const leaves = tile(list, ratio)
      if (keep === 1 || leaves.every((l) => l.x1 - l.x0 >= MIN && l.y1 - l.y0 >= MIN)) return leaves
    }
  }
  return []
}

// Highlighting wants whole words ("fintech" shouldn't light up every box); the fuzzy search is the fallback.
function strictSearch(entries, query) {
  const words = query.toLowerCase().replace(/\./g, '').split(/[\s,()-]+/).filter(Boolean)
  const text = (e) => [e.title, e.programme, e.course, e.family].join(' ').toLowerCase().replace(/\./g, '')
  const exact = entries.filter((e) => words.every((w) => text(e).includes(w)))
  return exact.length ? exact : searchEntries(entries, query)
}

// A colour per box from the theme's primary and teal, so all themes stay on-palette.
const boxStyle = (i, n) => ({ '--box': `color-mix(in oklab, var(--c-primary) ${Math.round(100 - (i / Math.max(n - 1, 1)) * 80)}%, var(--c-teal))` })

export default function SyllabusMap({ entries, onCourse }) {
  const tree = useMemo(() => buildTree(entries), [entries])
  const [focus, setFocus] = useState([]) // keys: [] faculties, [faculty] families, [faculty, family] courses
  const [others, setOthers] = useState(null)
  const [hover, setHover] = useState(null)
  const [query, setQuery] = useState('')
  const [width, setWidth] = useState(0)
  const area = useRef(null)

  useLayoutEffect(() => {
    const el = area.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const height = width < 640 ? 440 : 500

  // The nodes along the focus path; a stale key (data changed) falls back to the top.
  const trail = []
  let level = tree
  for (const key of focus) {
    const node = level.find((n) => n.key === key)
    if (!node?.children) break
    trail.push(node)
    level = node.children
  }
  const depth = trail.length

  const leaves = useMemo(() => (width ? layout(level, width, height) : []), [level, width, height])

  // Search: the ids that match, and the deepest single node every match sits in ("Zoom to …").
  const matches = useMemo(() => (query.trim() ? new Set(strictSearch(entries, query).map((e) => e.id)) : null), [entries, query])
  const hits = (node) => !matches || node.entries.some((e) => matches.has(e.id))
  const only = useMemo(() => {
    if (!matches?.size) return null
    let path = []
    let nodes = tree
    for (;;) {
      const inside = nodes.filter((n) => n.entries.some((e) => matches.has(e.id)))
      if (inside.length !== 1) break
      path = [...path, inside[0]]
      if (!inside[0].children) break
      nodes = inside[0].children
    }
    return path.length ? path : null
  }, [matches, tree])

  const zoomTo = (keys) => {
    if (keys.join('/') === focus.join('/')) return
    trackEvent('syllabus_map_zoom', { depth: keys.length })
    const apply = () => {
      setOthers(null)
      setHover(null)
      setFocus(keys)
    }
    const el = area.current
    if (!el || !document.startViewTransition || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return apply()
    // One element carries the name in each snapshot: the box going in and the map coming out, or the reverse.
    const deeper = keys.length > focus.length
    const box = (key) => (key ? el.querySelector(`[data-key="${CSS.escape(key)}"]`) : null)
    const from = deeper ? box(keys.at(-1)) : el
    if (from) from.style.viewTransitionName = 'map-zoom'
    const transition = document.startViewTransition(() => {
      if (from) from.style.viewTransitionName = ''
      flushSync(apply)
      const to = deeper ? el : box(focus[keys.length])
      if (from && to) to.style.viewTransitionName = 'map-zoom'
    })
    transition.finished.finally(() => {
      el.style.viewTransitionName = ''
      for (const b of el.querySelectorAll('[data-key]')) b.style.viewTransitionName = ''
    })
  }
  const zoomOut = () => depth && zoomTo(focus.slice(0, depth - 1))

  const open = (node) => {
    if (node.others) return setOthers(node.others)
    if (node.children) return zoomTo([...trail.map((n) => n.key), node.key])
    const stage = mostCommon(node.entries.map(stageOf))
    onCourse?.(`${stage}/${familySlug(node.entries[0])}/${node.key}`)
  }

  // A match deep in the tree: zoom to its family (a course) or to the node itself.
  const zoomToOnly = () => {
    const keys = only.map((n) => n.key)
    zoomTo(only.at(-1).children ? keys : keys.slice(0, -1))
  }

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape' || event.target.closest?.('input')) return
      if (others) setOthers(null)
      else if (focus.length) zoomTo(focus.slice(0, -1))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  // Arrow keys: the next or previous box, in reading order.
  const onBoxKey = (event, i) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    if (event.key === 'Backspace') {
      event.preventDefault()
      zoomOut()
    }
    if (!step) return
    event.preventDefault()
    const boxes = area.current?.querySelectorAll('[data-box]')
    boxes?.[(i + step + boxes.length) % boxes.length]?.focus()
  }

  const shown = hover || (depth ? trail.at(-1) : null)
  const what = depth === 0 ? 'faculty' : depth === 1 ? 'course family' : 'programme'

  return (
    <div>
      <div className="flex items-center gap-2 rounded-2xl border border-line-strong bg-surface px-4 focus-within:border-primary-ink">
        <SearchIcon className="size-5 shrink-0 text-ink-3" aria-hidden="true" />
        <label htmlFor="map-q" className="sr-only">Highlight on the map</label>
        <input
          id="map-q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Highlight: MCA, Data Science…"
          autoComplete="off"
          className="h-12 min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button type="button" className="icon-btn" onClick={() => setQuery('')} aria-label="Clear highlight">
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-label text-ink-2 empty:hidden [&:not(:empty)]:mt-2 [&:not(:empty)]:min-h-11" aria-live="polite">
        {matches && <span>{matches.size ? `${syllabi(matches.size)} match` : 'No match'}</span>}
        {only && (
          <button type="button" className="btn-secondary press min-h-9 px-3 text-label" onClick={zoomToOnly}>
            <ZoomIn className="size-4" aria-hidden="true" /> Zoom to {only.at(-1).name}
          </button>
        )}
      </div>

      <nav aria-label="Map level" className="mt-2 flex min-h-11 items-center gap-1.5">
        <button type="button" className="icon-btn shrink-0" onClick={zoomOut} disabled={!depth} aria-label="Zoom out">
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <ol className="flex min-w-0 flex-wrap items-center gap-1.5">
          <li>
            <button type="button" className="finder-chip" onClick={() => zoomTo([])} aria-current={!depth ? 'step' : undefined}>All</button>
          </li>
          {trail.map((n, i) => (
            <li key={n.key} className="flex min-w-0 items-center gap-1.5">
              <ChevronRight className="size-3.5 shrink-0 text-ink-3" aria-hidden="true" />
              <button
                type="button"
                className="finder-chip"
                onClick={() => zoomTo(focus.slice(0, i + 1))}
                aria-current={i === depth - 1 ? 'step' : undefined}
              >
                {n.short}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div
        ref={area}
        role="group"
        aria-label={`${depth ? trail.at(-1).name : 'SPPU syllabi'}: ${level.length} ${what === 'faculty' ? 'faculties' : what === 'programme' ? 'programmes' : 'course families'}`}
        className="map-area relative mt-2 w-full overflow-hidden"
        style={{ height }}
        onMouseLeave={() => setHover(null)}
      >
        {leaves.map((leaf, i) => {
          const node = leaf.data
          const w = leaf.x1 - leaf.x0
          const h = leaf.y1 - leaf.y0
          const labelled = w >= LABEL_W && h >= MIN
          const small = w < 100
          const lit = hits(node)
          return (
            <button
              key={`${focus.join('/')}/${node.key}`}
              type="button"
              data-box
              data-key={node.key}
              onClick={() => open(node)}
              onKeyDown={(event) => onBoxKey(event, i)}
              onMouseEnter={() => setHover(node)}
              onFocus={() => setHover(node)}
              aria-label={`${node.name}, ${syllabi(node.entries.length)}${node.others ? ', show the list' : node.children ? ', zoom in' : ', open'}`}
              className={`map-box press absolute flex flex-col items-start justify-between overflow-hidden rounded-xl border p-2 text-left ${lit ? '' : 'map-box-dim'} ${matches && lit ? 'map-box-hit' : ''}`}
              style={{ ...boxStyle(i, leaves.length), left: leaf.x0, top: leaf.y0, width: w, height: h, '--i': Math.min(i, 14) }}
            >
              {labelled ? (
                <>
                  <span
                    className={`line-clamp-1 min-h-0 ${small ? 'text-caption' : 'text-label'} font-semibold hyphens-auto text-ink [overflow-wrap:anywhere]`}
                    style={{ WebkitLineClamp: Math.max(1, Math.floor((h - 34) / (small ? 14 : 16))) }}
                    lang="en"
                  >
                    {node.short}
                  </span>
                  <span className="shrink-0 font-mono text-caption text-ink-2">{node.entries.length}</span>
                </>
              ) : (
                <span className="m-auto font-mono text-caption font-semibold text-ink">{node.others ? `+${node.others.length}` : node.entries.length}</span>
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-2 min-h-11 truncate rounded-xl bg-surface-2 px-3 py-3 text-label text-ink-2" aria-hidden="true">
        {shown ? (
          <>
            <span className="font-semibold text-ink">{shown.name}</span> · {syllabi(shown.entries.length)}
          </>
        ) : (
          `Tap a ${what} to ${depth < 2 ? 'zoom in' : 'open it'}.`
        )}
      </p>

      {others && (
        <section className="map-others mt-3 rounded-2xl border border-line bg-surface p-2" aria-label="Others">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-label font-semibold text-ink-2">Others ({others.length})</h3>
            <button type="button" className="icon-btn" onClick={() => setOthers(null)} aria-label="Close the list">
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <ul>
            {others.map((node) => (
              <li key={node.key}>
                <button
                  type="button"
                  onClick={() => open(node)}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-surface-2 ${hits(node) ? '' : 'opacity-50'}`}
                >
                  <span className="min-w-0 flex-1 text-body text-ink">{node.name}</span>
                  <span className="shrink-0 font-mono text-caption text-ink-3">{node.entries.length}</span>
                  <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
