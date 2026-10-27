// The subject split of one SPPU syllabus PDF: data/syllabus-split/<id>.json, where <id> is the entry's id in
// public/data/syllabus.json. Written per file (by hand or with notes-studio/prompts/syllabus-split.md),
// checked by split-check.mjs, turned into the site's data by build-split.mjs.
//
// {
//   "id": "<catalogue id>",
//   "kind": "programme" | "course" | "not-syllabus" | "scanned",
//   "programme": "<programme name as printed>" | null,
//   "pattern": "<pattern year, e.g. 2024>" | null,
//   "language": "en" | "mr" | "hi",
//   "subjects": [{
//     "code": "<course code>" | null,
//     "title": "<course title as printed>",
//     "semester": 1-12 | null,
//     "type": "<e.g. Major Core, Elective, Practical>" | null,
//     "credits": <number> | null,
//     "pages": [<first page>, <last page>],  // detailed syllabus of this course in the PDF
//     "units": [{ "title": "<unit title>", "topics": "<unit contents>" | null, "hours": <number> | null }]
//   }],
//   "notes": "<anything unsure>" | null
// }
//
// kind: "programme" = several courses of a programme (a structure table alone still counts: its courses get
// no units); "course" = one course (common courses, single papers); "not-syllabus" = rules, notices, lab
// books and other files without a course list; "scanned" = no readable text. Only "programme" and "course"
// have subjects.

export const KINDS = ['programme', 'course', 'not-syllabus', 'scanned']
export const LANGUAGES = ['en', 'mr', 'hi']
export const MAX_TOPICS = 1200

const DOC_KEYS = ['id', 'kind', 'programme', 'pattern', 'language', 'subjects', 'notes']
const SUBJECT_KEYS = ['code', 'title', 'semester', 'type', 'credits', 'pages', 'units']
const UNIT_KEYS = ['title', 'topics', 'hours']

const isText = (v, max) => typeof v === 'string' && v.trim() !== '' && v.length <= max
const isTextOrNull = (v, max) => v === null || isText(v, max)
const isNumberOrNull = (v, min, max) => v === null || (typeof v === 'number' && v >= min && v <= max)
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

function unknownKeys(obj, allowed, where, errors) {
  for (const key of Object.keys(obj)) if (!allowed.includes(key)) errors.push(`${where}: unknown field "${key}"`)
}

// { errors, warnings } for one file. `pageCount` (from the text extract) bounds the page ranges when known.
export function checkSplit(doc, { id, pageCount } = {}) {
  const errors = []
  const warnings = []
  if (!isObject(doc)) return { errors: ['not a JSON object'], warnings }
  unknownKeys(doc, DOC_KEYS, 'file', errors)
  if (id && doc.id !== id) errors.push(`id "${doc.id}" does not match the file name "${id}"`)
  if (!KINDS.includes(doc.kind)) errors.push(`kind must be one of ${KINDS.join(', ')}`)
  if (!isTextOrNull(doc.programme ?? null, 200)) errors.push('programme must be text or null')
  if (!(doc.pattern === null || doc.pattern === undefined || /^(19|20)\d\d$/.test(doc.pattern))) {
    errors.push('pattern must be a year like "2024" or null')
  }
  if (!LANGUAGES.includes(doc.language)) errors.push(`language must be one of ${LANGUAGES.join(', ')}`)
  if (!isTextOrNull(doc.notes ?? null, 1000)) errors.push('notes must be text (up to 1000 characters) or null')
  if (!Array.isArray(doc.subjects)) {
    errors.push('subjects must be a list')
    return { errors, warnings }
  }

  const withSubjects = doc.kind === 'programme' || doc.kind === 'course'
  if (withSubjects && doc.subjects.length === 0) errors.push(`a "${doc.kind}" file needs at least one subject`)
  if (!withSubjects && doc.subjects.length > 0) errors.push(`a "${doc.kind}" file has no subjects`)
  if (doc.kind === 'programme' && !doc.programme) errors.push('a "programme" file needs the programme name')

  const seen = new Set()
  doc.subjects.forEach((s, i) => {
    const where = `subject ${i + 1}`
    if (!isObject(s)) return errors.push(`${where}: not an object`)
    unknownKeys(s, SUBJECT_KEYS, where, errors)
    if (!isText(s.title, 200)) errors.push(`${where}: title is required (up to 200 characters)`)
    if (!isTextOrNull(s.code ?? null, 40)) errors.push(`${where}: code must be text or null`)
    if (!(s.semester === null || (Number.isInteger(s.semester) && s.semester >= 1 && s.semester <= 12))) {
      errors.push(`${where}: semester must be 1-12 or null`)
    }
    if (!isTextOrNull(s.type ?? null, 80)) errors.push(`${where}: type must be text or null`)
    if (!isNumberOrNull(s.credits ?? null, 0, 40)) errors.push(`${where}: credits must be 0-40 or null`)
    const [a, b] = Array.isArray(s.pages) ? s.pages : []
    if (!(Array.isArray(s.pages) && s.pages.length === 2 && Number.isInteger(a) && Number.isInteger(b) && a >= 1 && a <= b)) {
      errors.push(`${where}: pages must be [first, last] with first <= last`)
    } else if (pageCount && b > pageCount) {
      errors.push(`${where}: pages ${a}-${b} go past the last page (${pageCount})`)
    }
    if (!Array.isArray(s.units)) errors.push(`${where}: units must be a list`)
    else {
      if (s.units.length === 0) warnings.push(`${where} (${s.title}): no units`)
      s.units.forEach((u, j) => {
        const uw = `${where} unit ${j + 1}`
        if (!isObject(u)) return errors.push(`${uw}: not an object`)
        unknownKeys(u, UNIT_KEYS, uw, errors)
        if (!isText(u.title, 300)) errors.push(`${uw}: title is required (up to 300 characters)`)
        if (!isTextOrNull(u.topics ?? null, MAX_TOPICS)) errors.push(`${uw}: topics must be text up to ${MAX_TOPICS} characters, or null`)
        if (!isNumberOrNull(u.hours ?? null, 0, 200)) errors.push(`${uw}: hours must be 0-200 or null`)
      })
    }
    const key = `${s.semester}|${s.code || ''}|${String(s.title).toLowerCase()}`
    if (seen.has(key)) warnings.push(`${where} (${s.title}): listed twice in the same semester`)
    seen.add(key)
  })
  return { errors, warnings }
}
