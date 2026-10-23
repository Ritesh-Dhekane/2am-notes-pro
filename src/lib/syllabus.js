// SPPU syllabi (public/data/syllabus.json): loading, search, grouping and page titles. No imports, so
// scripts/syllabus-pages.mjs uses the same titles and slugs at build time. Entries never carry the PDF's
// address; the backend serves the file (syllabusView, syllabusDownload).

export const SPPU_LIBRARIES = {
  2025: 'http://collegecirculars.unipune.ac.in/sites/documents/Syllabus2025/Forms/AllItems.aspx',
  2026: 'http://collegecirculars.unipune.ac.in/sites/documents/Syllabus2026/Forms/AllItems.aspx',
}

export const libraryUrl = (library) => SPPU_LIBRARIES[library] || SPPU_LIBRARIES[2026]

// The file is either a bare array or { source, count, items }.
export const entriesOf = (data) => (Array.isArray(data) ? data : data?.items || [])

export const programmeOf = (entry) => entry.programme || entry.title

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export const programmeSlug = (entry) => slugify(programmeOf(entry))

export const byNewest = (a, b) => (b.uploaded || '').localeCompare(a.uploaded || '') || a.title.localeCompare(b.title)

const SUFFIX = ' — Official PDF | 2AM Notes Pro'

// One page title per entry, made unique by adding its years (or its own title) when two would match.
export function entryTitles(entries) {
  const base = (e) => `SPPU ${programmeOf(e)} Syllabus${e.pattern ? ` ${e.pattern}` : ''}`
  const count = new Map()
  for (const e of entries) count.set(base(e), (count.get(base(e)) || 0) + 1)
  const titles = new Map()
  const used = new Set()
  for (const e of entries) {
    let title = base(e)
    if (count.get(title) > 1) title += ` (${[e.years, e.semesters].filter(Boolean).join(', ') || e.title})`
    if (used.has(title)) title += ` (${e.title})`
    used.add(title)
    titles.set(e.id, title + SUFFIX)
  }
  return titles
}

export function programmeTitle(name, entries) {
  const patterns = [...new Set(entries.map((e) => e.pattern).filter(Boolean))].slice(0, 2)
  return `SPPU ${name} Syllabus${patterns.length ? ` ${patterns.join(', ')}` : ''} — All Official PDFs | 2AM Notes Pro`
}

export const EXPLORER_TITLE = 'SPPU Syllabus Explorer — Official PDFs for every programme | 2AM Notes Pro'

export function describeEntry(e) {
  return [e.level, e.pattern, e.years, e.semesters].filter(Boolean).join(' · ')
}

// Faculty → programme → entries (newest first), each list sorted by name.
export function groupEntries(entries) {
  const faculties = new Map()
  for (const e of entries) {
    const faculty = faculties.get(e.faculty) || new Map()
    faculties.set(e.faculty, faculty)
    const name = programmeOf(e)
    faculty.set(name, [...(faculty.get(name) || []), e])
  }
  return [...faculties]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([faculty, programmes]) => ({
      faculty,
      programmes: [...programmes]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, list]) => ({ name, slug: slugify(name), entries: list.sort(byNewest) })),
    }))
}

// Search: "mca 2025", "b.sc cs", "comp engg". Dots are ignored; each word must appear, or (4+ letters)
// appear in order with gaps (fuzzy). Whole-word hits rank first, then newer uploads.
const normalise = (text) => String(text || '').toLowerCase().replace(/\./g, '')

function inOrder(word, text) {
  let at = 0
  for (const ch of word) {
    at = text.indexOf(ch, at) + 1
    if (!at) return false
  }
  return true
}

export function searchEntries(entries, query) {
  const words = normalise(query).split(/[\s,()-]+/).filter(Boolean)
  if (!words.length) return entries
  const scored = []
  for (const e of entries) {
    const text = normalise([e.title, e.programme, e.pattern, e.faculty, e.group].join(' '))
    let score = 0
    for (const word of words) {
      if (text.includes(word)) score += new RegExp(`\\b${word.replace(/[^a-z0-9]/g, '')}`).test(text) ? 3 : 2
      else if (word.length >= 4 && inOrder(word, text)) score += 1
      else {
        score = -1
        break
      }
    }
    if (score > 0) scored.push([score, e])
  }
  return scored.sort((a, b) => b[0] - a[0] || byNewest(a[1], b[1])).map(([, e]) => e)
}

let cached
export function loadSyllabi() {
  cached ||= fetch(`${import.meta.env.BASE_URL}data/syllabus.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`syllabus list: status ${response.status}`)
      return response.json()
    })
    .then(entriesOf)
    .catch((error) => {
      cached = null
      throw error
    })
  return cached
}
