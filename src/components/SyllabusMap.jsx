// Interactive sunburst of the SPPU syllabus library: Faculty -> Programme -> number of syllabi.
//
// Usage (e.g. on /syllabus under an "Explore map" toggle):
//   import SyllabusMap from '../components/SyllabusMap.jsx'
//   <SyllabusMap />                      loads public/data/syllabus.json
//   <SyllabusMap entries={entries} />    or pass the already loaded entries
// Click or tap a faculty to zoom in, the centre or the breadcrumb to zoom out (Esc works too).
// A programme opens /syllabus/p/<programme-slug>. Plain SVG maths, no chart library.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SIZE = 320
const C = SIZE / 2
const R_HOLE = 58
const R_MID = 112
const R_OUT = 156
const TAU = Math.PI * 2
const NO_PROGRAMME = 'Other syllabi'

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const plural = (n) => `${n} ${n === 1 ? 'syllabus' : 'syllabi'}`

// Faculty colours: steps between the theme's primary and teal, so every theme stays on-palette.
const facultyColour = (i, n) => {
  const t = n < 2 ? 0 : Math.round((i / (n - 1)) * 100)
  return `color-mix(in srgb, var(--c-teal) ${t}%, var(--c-primary))`
}
const programmeColour = (base, j) => `color-mix(in srgb, ${base} ${[80, 60, 42][j % 3]}%, var(--c-surface))`

function buildTree(entries) {
  const faculties = new Map()
  for (const e of entries) {
    const f = e.faculty || 'Other'
    const p = e.programme || NO_PROGRAMME
    if (!faculties.has(f)) faculties.set(f, new Map())
    const progs = faculties.get(f)
    progs.set(p, (progs.get(p) || 0) + 1)
  }
  const list = [...faculties].map(([name, progs]) => {
    const children = [...progs]
      .map(([pname, value]) => ({ name: pname, value, link: pname !== NO_PROGRAMME }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    return { name, children, value: children.reduce((s, c) => s + c.value, 0) }
  })
  list.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
  list.forEach((f, i) => {
    f.colour = facultyColour(i, list.length)
    f.children.forEach((p, j) => (p.colour = programmeColour(f.colour, j)))
  })
  return list
}

const pt = (a, r) => [C + r * Math.sin(a), C - r * Math.cos(a)]

function arcPath(a0, a1, r0, r1) {
  const span = Math.min(a1 - a0, TAU - 1e-4)
  const pad = span > 0.02 ? 0.004 : 0
  const s = a0 + pad
  const e = a0 + span - pad
  const large = e - s > Math.PI ? 1 : 0
  const [x0, y0] = pt(s, r1)
  const [x1, y1] = pt(e, r1)
  const [x2, y2] = pt(e, r0)
  const [x3, y3] = pt(s, r0)
  const f = (n) => n.toFixed(2)
  return `M${f(x0)} ${f(y0)}A${r1} ${r1} 0 ${large} 1 ${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}A${r0} ${r0} 0 ${large} 0 ${f(x3)} ${f(y3)}Z`
}

// Lays the nodes of one level around the circle, in proportion to their counts.
function layout(nodes, a0, a1) {
  const total = nodes.reduce((s, n) => s + n.value, 0) || 1
  let a = a0
  return nodes.map((node) => {
    const start = a
    a += ((a1 - a0) * node.value) / total
    return { node, a0: start, a1: a }
  })
}

// A short label that fits the slice, or nothing when the slice is too thin.
function sliceLabel(name, a0, a1, r0, r1) {
  const arcLen = (a1 - a0) * ((r0 + r1) / 2)
  const room = Math.min(arcLen, (r1 - r0) * 1.6)
  const max = Math.floor(room / 6)
  if (max < 3) return null
  const word = name.split(/[\s(]/)[0]
  return word.length > max ? `${word.slice(0, max - 1)}…` : word
}

export default function SyllabusMap({ entries, src }) {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(null)
  const [failed, setFailed] = useState(false)
  const [focus, setFocus] = useState(null)
  const [hint, setHint] = useState('')
  const svgRef = useRef(null)
  const zoomed = useRef(false)

  useEffect(() => {
    if (entries) return
    let live = true
    fetch(src || `${import.meta.env.BASE_URL}data/syllabus.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((data) => live && setLoaded(Array.isArray(data) ? data : data?.items || []))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [entries, src])

  const data = entries || loaded
  const tree = useMemo(() => (data ? buildTree(data) : []), [data])
  const total = tree.reduce((s, f) => s + f.value, 0)
  const faculty = focus && tree.find((f) => f.name === focus)

  // After a zoom the focused slice is gone, so focus moves to the first slice of the new level.
  useEffect(() => {
    if (!zoomed.current) return
    zoomed.current = false
    svgRef.current?.querySelector('path[tabindex]')?.focus()
  }, [focus])

  const zoom = (name) => {
    zoomed.current = true
    setHint('')
    setFocus(name)
  }

  if (failed) return <p className="text-sm text-ink-2">The syllabus map could not be loaded.</p>
  if (!data) return <p className="text-sm text-ink-3">Loading the syllabus map…</p>
  if (!total) return <p className="text-sm text-ink-2">No syllabi to map yet.</p>

  const openProgramme = (p) => {
    if (p.link) navigate(`/syllabus/p/${slug(p.name)}`)
  }

  // Slices to draw: zoomed out, faculties inside and their programmes outside;
  // zoomed into a faculty, its programmes fill the whole ring.
  const slices = []
  if (faculty) {
    for (const s of layout(faculty.children, 0, TAU)) {
      slices.push({ ...s, r0: R_HOLE + 2, r1: R_OUT, kind: 'programme', parent: faculty.name })
    }
  } else {
    for (const s of layout(tree, 0, TAU)) {
      slices.push({ ...s, r0: R_HOLE + 2, r1: R_MID, kind: 'faculty' })
      for (const c of layout(s.node.children, s.a0, s.a1)) {
        slices.push({ ...c, r0: R_MID + 2, r1: R_OUT, kind: 'programme', parent: s.node.name })
      }
    }
  }

  const describe = (s) =>
    s.kind === 'faculty'
      ? `${s.node.name}: ${plural(s.node.value)} in ${s.node.children.length} programmes. Open to zoom in.`
      : `${s.node.name} (${s.parent}): ${plural(s.node.value)}.${s.node.link ? ' Open the programme.' : ''}`

  const activate = (s) => (s.kind === 'faculty' ? zoom(s.node.name) : openProgramme(s.node))

  const onKey = (e, s) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      activate(s)
    }
  }

  const listed = faculty ? faculty.children : tree

  return (
    <div
      className="mx-auto w-full max-w-md"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && focus) zoom(null)
      }}
    >
      <nav aria-label="Map level" className="mb-2 flex min-h-8 flex-wrap items-center gap-1 text-sm">
        {faculty ? (
          <>
            <button
              type="button"
              onClick={() => zoom(null)}
              className="rounded-md px-1.5 py-0.5 font-medium text-primary-ink hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-primary-ink"
            >
              All faculties
            </button>
            <span aria-hidden="true" className="text-ink-3">
              ›
            </span>
            <span aria-current="page" className="min-w-0 truncate px-1.5 font-semibold text-ink">
              {faculty.name}
            </span>
          </>
        ) : (
          <span aria-current="page" className="px-1.5 font-semibold text-ink">
            All faculties
          </span>
        )}
      </nav>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="block h-auto w-full touch-manipulation select-none"
        role="group"
        aria-label={faculty ? `${faculty.name}: programmes` : 'SPPU syllabi by faculty and programme'}
      >
        <g key={focus || 'root'}>
          {slices.map((s) => {
            const label = sliceLabel(s.node.name, s.a0, s.a1, s.r0, s.r1)
            const mid = (s.a0 + s.a1) / 2
            const [lx, ly] = pt(mid, (s.r0 + s.r1) / 2)
            const clickable = s.kind === 'faculty' || s.node.link
            return (
              <g key={`${s.kind}:${s.parent || ''}:${s.node.name}`}>
                <path
                  d={arcPath(s.a0, s.a1, s.r0, s.r1)}
                  fill={s.node.colour}
                  role={clickable ? (s.kind === 'faculty' ? 'button' : 'link') : 'img'}
                  tabIndex={0}
                  aria-label={describe(s)}
                  className={`stroke-surface outline-none transition-opacity hover:opacity-80 focus-visible:stroke-ink ${clickable ? 'cursor-pointer' : ''}`}
                  strokeWidth="1.5"
                  onClick={() => activate(s)}
                  onKeyDown={(e) => onKey(e, s)}
                  onMouseEnter={() => setHint(describe(s))}
                  onFocus={() => setHint(describe(s))}
                />
                {label && (
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="central"
                    aria-hidden="true"
                    className="pointer-events-none fill-ink stroke-surface text-[10px] font-semibold"
                    strokeWidth="3"
                    paintOrder="stroke"
                  >
                    {label}
                  </text>
                )}
              </g>
            )
          })}
        </g>
        <g
          role={faculty ? 'button' : undefined}
          tabIndex={faculty ? 0 : undefined}
          aria-label={faculty ? 'Zoom out to all faculties' : undefined}
          className={`outline-none ${faculty ? 'cursor-pointer [&:focus-visible>circle]:stroke-ink' : ''}`}
          onClick={() => faculty && zoom(null)}
          onKeyDown={(e) => {
            if (faculty && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              zoom(null)
            }
          }}
        >
          <circle cx={C} cy={C} r={R_HOLE} className="fill-surface-2 stroke-line" strokeWidth="1.5" />
          <text x={C} y={C - 8} textAnchor="middle" className="fill-ink text-[22px] font-bold">
            {faculty ? faculty.value : total}
          </text>
          <text x={C} y={C + 13} textAnchor="middle" className="fill-ink-3 text-[10px] font-medium">
            {faculty ? '← zoom out' : 'syllabi'}
          </text>
        </g>
      </svg>

      <p aria-live="polite" className="mt-2 min-h-10 text-center text-xs text-ink-2">
        {hint || 'Tap a faculty to zoom in, then a programme to open it.'}
      </p>

      <ul className="mt-2 grid gap-1 text-sm">
        {listed.map((n) => (
          <li key={n.name}>
            <button
              type="button"
              disabled={!faculty ? false : !n.link}
              onClick={() => (faculty ? openProgramme(n) : zoom(n.name))}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-ink hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-primary-ink disabled:cursor-default disabled:hover:bg-transparent"
            >
              <span aria-hidden="true" className="size-3 shrink-0 rounded-sm" style={{ background: n.colour }} />
              <span className="min-w-0 flex-1 truncate">{n.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-ink-3">{n.value}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
