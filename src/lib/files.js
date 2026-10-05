// What a Drive file name tells us. Files follow unit-<NN>-<topic-slug>.<ext> (see the README's
// Drive Layout), e.g. "unit-02-exception-handling.md" → Unit 2, "Exception Handling", a note.
// Names that don't follow the pattern still work: no unit, title from the name.

const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'vs', 'with'])
const UPPER_WORDS = new Set(['jvm', 'jdbc', 'io', 'nio', 'api', 'sql', 'ml', 'svm', 'knn', 'pca', 'dax', 'bi', 'qa', 'pyq', 'pyqs', 'lpp', 'cpm', 'pert', 'oop', 'ui', 'uml', 'csv', 'pdf'])
const NEW_FOR_MS = 7 * 24 * 60 * 60 * 1000

export const CATEGORIES = [
  { key: 'notes', label: 'Notes', single: 'Note' },
  { key: 'pyqs', label: 'PYQs', single: 'PYQ' },
  { key: 'references', label: 'References', single: 'Reference' },
]

export function titleCase(slug) {
  return slug
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word, i) => {
      const lower = word.toLowerCase()
      if (UPPER_WORDS.has(lower)) return lower.toUpperCase()
      if (i > 0 && SMALL_WORDS.has(lower)) return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

const KIND_BY_EXT = {
  md: 'note', markdown: 'note', pdf: 'pdf', txt: 'text',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image',
  docx: 'word', xlsx: 'sheet', xls: 'sheet', csv: 'sheet', ods: 'sheet', pptx: 'slides',
}

export function fileKind(file) {
  const ext = (file.name.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase()
  if (KIND_BY_EXT[ext]) return KIND_BY_EXT[ext]
  const type = file.mimeType || ''
  if (/markdown/.test(type)) return 'note'
  if (type === 'application/pdf') return 'pdf'
  if (type === 'text/plain') return 'text'
  if (/^image\/(png|jpeg|gif|webp)$/.test(type)) return 'image'
  return 'other'
}

// Kinds that open in the document viewer (a modal) rather than inline.
export const VIEWER_KINDS = new Set(['image', 'word', 'sheet', 'slides'])

export function describeFile(file, category, now = Date.now()) {
  const base = file.name.replace(/\.[a-z0-9]+$/i, '')
  const match = base.match(/^unit[\s_-]*(\d+)[\s_-]*(.*)$/i)
  const unit = match ? Number(match[1]) : null
  const rest = match ? match[2] : base
  const updated = file.updated ? new Date(file.updated).getTime() : null
  return {
    ...file,
    category,
    kind: fileKind(file),
    unit,
    title: titleCase(rest || base) || file.name,
    isNew: updated !== null && now - updated < NEW_FOR_MS,
  }
}

export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// Notes grouped by unit (unit-less files last, under "Other").
export function groupByUnit(files) {
  const groups = new Map()
  for (const file of files) {
    const key = file.unit ?? 'other'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(file)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === 'other' ? 1 : b === 'other' ? -1 : a - b))
    .map(([unit, items]) => ({ unit: unit === 'other' ? null : unit, items }))
}

const KIND_LABELS = {
  note: 'Note',
  pdf: 'PDF',
  text: 'Text',
  image: 'Image',
  word: 'Word',
  sheet: 'Spreadsheet',
  slides: 'Slides',
  other: 'File',
}

export function kindLabel(kind) {
  return KIND_LABELS[kind] || KIND_LABELS.other
}

export function fileHref(file) {
  return `/read/${encodeURIComponent(file.subject)}/${encodeURIComponent(file.id)}`
}

// Previous-year papers: the exam year and month from the title ("Dec 2025 End Semester").
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

export function pyqDate(file) {
  const year = Number(file.title.match(/\b(20\d\d)\b/)?.[1]) || null
  const name = file.title.match(new RegExp(`\\b(${MONTHS.join('|')})[a-z]*\\b`, 'i'))?.[1]
  const month = name ? MONTHS.indexOf(name.toLowerCase()) : null
  return { year, month }
}

// Newest exam first, then by title.
export function byExamDesc(a, b) {
  const da = pyqDate(a)
  const db = pyqDate(b)
  return (db.year ?? 0) - (da.year ?? 0) || (db.month ?? -1) - (da.month ?? -1) || a.title.localeCompare(b.title)
}
