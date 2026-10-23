// "Find my syllabus" (/syllabus?mode=find): a step-by-step picker, stage → course family → course →
// pattern or year (only when a course has several) → its syllabi. The step lives in the URL (?path=), so
// any step can be shared; the last course opened is remembered on this device ("Continue: …").
// Steps slide in from the right going forward and from the left going back; cards stagger in (index.css).

import { ChevronRight, History } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { trackEvent } from '../lib/analytics.js'
import { EntryRow } from './SyllabusBits.jsx'
import {
  byNewest,
  courseOf,
  courseSlug,
  familyOf,
  familySlug,
  programmeSlug,
  shortCourse,
  slugify,
  STAGES,
  stageOf,
} from '../lib/syllabus.js'

const REMEMBER = 'notes-pro.syllabus-course'

// Shortcuts jump to a family (the stage most of its syllabi are in) or straight to a course.
const SHORTCUTS = [
  { label: 'MCA', family: 'mca' },
  { label: 'BCA', family: 'bca' },
  { label: 'MBA', family: 'mba' },
  { label: 'B.Com', family: 'bcom-mcom', stage: 'ug' },
  { label: 'B.Sc Computer Science', course: 'bsc-computer-science' },
  { label: 'B.E. Computer', course: 'be-computer-engineering' },
]

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
const syllabi = (n) => `${n} ${n === 1 ? 'syllabus' : 'syllabi'}`

function mostCommon(values) {
  const count = new Map()
  for (const v of values) count.set(v, (count.get(v) || 0) + 1)
  return [...count].sort((a, b) => b[1] - a[1])[0]?.[0]
}

// name -> entries, sorted by name.
function groupBy(list, key) {
  const groups = new Map()
  for (const e of list) groups.set(key(e), [...(groups.get(key(e)) || []), e])
  return [...groups].sort(([a], [b]) => a.localeCompare(b))
}

// A course's syllabi split by pattern, or by year when they share one pattern; null when there's one.
function variantsOf(list) {
  for (const [key, empty] of [['pattern', 'Other pattern'], ['years', 'All years']]) {
    const groups = groupBy(list, (e) => e[key] || empty)
    if (groups.length > 1) return groups.map(([label, items]) => ({ slug: slugify(label), label, entries: items }))
  }
  return null
}

// The finder's state from ?path= ("pg/mca/mca/2025-pattern"); a path without its stage (from
// /syllabus/f/<family>/) gets the stage most of that family's syllabi are in. Unknown parts are dropped.
function resolvePath(entries, path) {
  let parts = String(path || '').split('/').filter(Boolean)
  if (parts[0] && !STAGES.some((s) => s.slug === parts[0])) {
    const stage = mostCommon(entries.filter((e) => familySlug(e) === parts[0]).map(stageOf))
    parts = stage ? [stage, ...parts] : []
  }
  const [stageSlug, family, course, variant] = parts
  const state = { trail: [], options: null, list: null, step: 'stage' }
  const stage = STAGES.find((s) => s.slug === stageSlug)
  const inStage = stage ? entries.filter((e) => stageOf(e) === stage.slug) : []
  if (!inStage.length) {
    state.options = STAGES.map((s) => ({ slug: s.slug, name: s.name, sub: s.label, count: entries.filter((e) => stageOf(e) === s.slug).length }))
    return state
  }
  state.trail.push({ name: stage.name, path: stage.slug })
  const families = groupBy(inStage, familyOf)
  const inFamily = inStage.filter((e) => familySlug(e) === family)
  if (!inFamily.length) {
    state.step = 'family'
    state.options = families.map(([name, items]) => ({ slug: slugify(name), name, sub: plural(new Set(items.map(courseOf)).size, 'programme'), count: items.length }))
    return state
  }
  const familyName = familyOf(inFamily[0])
  state.trail.push({ name: familyName, path: `${stage.slug}/${family}` })
  const courses = groupBy(inFamily, courseOf)
  // A family with one course goes straight to it.
  const chosen = courses.length === 1 ? courseSlug(inFamily[0]) : course
  const inCourse = inFamily.filter((e) => courseSlug(e) === chosen)
  if (!inCourse.length) {
    state.step = 'course'
    state.options = courses.map(([name, items]) => ({ slug: slugify(name), name: shortCourse(name, familyName), sub: name, count: items.length }))
    return state
  }
  const courseName = courseOf(inCourse[0])
  const coursePath = `${stage.slug}/${family}/${chosen}`
  state.course = { name: courseName, path: coursePath }
  state.trail.push({ name: shortCourse(courseName, familyName), path: coursePath })
  const variants = variantsOf(inCourse)
  const picked = variants?.find((v) => v.slug === variant)
  if (variants && !picked) {
    state.step = 'variant'
    state.options = variants.map((v) => ({ slug: v.slug, name: v.label, sub: '', count: v.entries.length }))
    return state
  }
  if (picked) state.trail.push({ name: picked.label, path: `${coursePath}/${picked.slug}` })
  state.step = 'list'
  state.list = (picked ? picked.entries : inCourse).sort(byNewest)
  return state
}

const HEADINGS = {
  stage: 'What are you studying?',
  family: 'Choose your course',
  course: 'Choose your programme',
  variant: 'Choose the pattern',
}

function readRemembered() {
  try {
    const saved = JSON.parse(localStorage.getItem(REMEMBER) || 'null')
    return saved?.path && saved?.name ? saved : null
  } catch {
    return null
  }
}

export default function SyllabusFinder({ entries, path, onPath }) {
  const state = useMemo(() => resolvePath(entries, path), [entries, path])
  // Read once: "Continue" offers the course from an earlier visit.
  const [remembered] = useState(readRemembered)
  const here = state.trail.at(-1)?.path || ''

  // Remember the course someone opened, for "Continue" next time.
  useEffect(() => {
    if (!state.course) return
    try {
      localStorage.setItem(REMEMBER, JSON.stringify(state.course))
    } catch {
      // private mode or storage blocked: nothing to remember
    }
  }, [state.course])

  const shortcuts = useMemo(
    () =>
      SHORTCUTS.map((s) => {
        const list = entries.filter((e) => (s.course ? courseSlug(e) === s.course : familySlug(e) === s.family))
        if (!list.length) return null
        const stage = s.stage || mostCommon(list.map(stageOf))
        return { ...s, path: [stage, familySlug(list[0]), s.course].filter(Boolean).join('/') }
      }).filter(Boolean),
    [entries],
  )

  const [direction, setDirection] = useState('forward')
  const depthOf = (p) => p.split('/').filter(Boolean).length
  const go = (next, shortcut) => {
    setDirection(depthOf(next) >= depthOf(here) ? 'forward' : 'back')
    if (shortcut) trackEvent('syllabus_shortcut', { shortcut })
    else trackEvent('syllabus_find_step', { depth: depthOf(next) })
    onPath(next)
  }
  const onCourse = state.course && remembered?.path === state.course.path

  return (
    <div className="mt-4">
      {remembered && !onCourse && (
        <button
          type="button"
          onClick={() => go(remembered.path)}
          className="press mb-3 flex min-h-12 w-full items-center gap-3 rounded-2xl border border-primary-ink/40 bg-primary-soft px-4 text-left"
        >
          <History className="size-5 shrink-0 text-primary-ink" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-body font-semibold text-ink">Continue: {remembered.name}</span>
          <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
        </button>
      )}

      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0" role="group" aria-label="Shortcuts">
        {shortcuts.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => go(s.path, s.label)}
            aria-current={here === s.path ? 'step' : undefined}
            className="press min-h-11 shrink-0 rounded-full border border-line bg-surface px-4 text-label font-semibold text-ink-2 hover:border-line-strong hover:text-ink aria-[current]:border-primary-ink aria-[current]:text-primary-ink"
          >
            {s.label}
          </button>
        ))}
      </div>

      <nav aria-label="Finder steps" className="mt-3">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <button type="button" onClick={() => go('')} className="finder-chip" aria-current={!state.trail.length ? 'step' : undefined}>
              All
            </button>
          </li>
          {state.trail.map((t, i) => (
            <li key={t.path} className="finder-chip-in flex min-w-0 items-center gap-1.5">
              <ChevronRight className="size-3.5 shrink-0 text-ink-3" aria-hidden="true" />
              <button type="button" onClick={() => go(t.path)} className="finder-chip" aria-current={i === state.trail.length - 1 ? 'step' : undefined}>
                {t.name}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="-mx-1 mt-4 overflow-x-clip px-1 pb-1">
        <div key={here || 'root'} className={`finder-step ${direction === 'back' ? 'finder-step-back' : ''}`}>
          {state.options ? (
            <>
              <h2 className="mb-3 text-heading">{HEADINGS[state.step]}</h2>
              <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {state.options.map((o, i) => (
                  <li key={o.slug} className="finder-card-in min-w-0" style={{ '--i': Math.min(i, 12) }}>
                    <button
                      type="button"
                      onClick={() => go(here ? `${here}/${o.slug}` : o.slug)}
                      disabled={!o.count}
                      className="press flex h-full min-h-24 w-full flex-col items-start gap-1 rounded-2xl border border-line bg-surface p-3.5 text-left hover:border-line-strong disabled:opacity-50"
                    >
                      <span className="text-body font-semibold break-words text-ink">{o.name}</span>
                      {o.sub && o.sub !== o.name && <span className="line-clamp-2 text-caption text-ink-2">{o.sub}</span>}
                      <span className="mt-auto pt-1 font-mono text-caption text-ink-3">{syllabi(o.count)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h2 className="mb-1 text-heading">{state.course.name}</h2>
              <p className="mb-3 text-label text-ink-2">
                {syllabi(state.list.length)}, newest first.{' '}
                {new Set(state.list.map(programmeSlug)).size === 1 && (
                  <Link to={`/syllabus/p/${programmeSlug(state.list[0])}`} className="font-semibold text-primary-ink hover:underline">
                    Programme page
                  </Link>
                )}
              </p>
              <ul className="rounded-2xl border border-line bg-surface p-1">
                {state.list.map((e, i) => (
                  <EntryRow key={e.id} entry={e} latest={i === 0} className="finder-card-in" style={{ '--i': Math.min(i, 12) }} />
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
