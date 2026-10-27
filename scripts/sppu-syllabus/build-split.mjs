// Turns the subject splits in data/syllabus-split/ into the site's data, one file per course (the
// catalogue's course, so the slugs match the syllabus pages):
//   public/data/syllabus-split/<course-slug>.json  { course, family, facultyShort, files: [{ id, title, kind,
//                                                   programme, pattern, language, uploaded,
//                                                   semesters: [{ semester, subjects }] }] }, newest first
//   public/data/syllabus-split/index.json          { count, courses: [{ slug, course, family, files, subjects }] }
// Splits with errors (split-check.mjs) and the "not-syllabus" / "scanned" ones are left out.
// Run: `node scripts/sppu-syllabus/build-split.mjs`.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { courseOf, courseSlug } from '../../src/lib/syllabus.js'
import { checkSplit } from './split-schema.mjs'

const SPLIT_DIR = 'data/syllabus-split'
const CATALOGUE = 'public/data/syllabus.json'
const OUT_DIR = 'public/data/syllabus-split'

const catalogue = new Map(JSON.parse(readFileSync(CATALOGUE, 'utf8')).items.map((e) => [e.id, e]))
const files = existsSync(SPLIT_DIR) ? readdirSync(SPLIT_DIR).filter((f) => f.endsWith('.json')) : []

const courses = new Map()
const skipped = []
for (const name of files) {
  const id = name.slice(0, -5)
  const entry = catalogue.get(id)
  let doc
  try {
    doc = JSON.parse(readFileSync(join(SPLIT_DIR, name), 'utf8'))
  } catch {
    skipped.push(`${id} (not valid JSON)`)
    continue
  }
  if (!entry || checkSplit(doc, { id }).errors.length) {
    skipped.push(`${id} (${entry ? 'has errors' : 'not in the catalogue'})`)
    continue
  }
  if (!doc.subjects.length) continue

  const bySemester = new Map()
  for (const s of doc.subjects) {
    const subject = { code: s.code ?? null, title: s.title, type: s.type ?? null, credits: s.credits ?? null, pages: s.pages, units: s.units }
    const key = s.semester ?? null
    if (!bySemester.has(key)) bySemester.set(key, [])
    bySemester.get(key).push(subject)
  }
  const semesters = [...bySemester]
    .sort(([a], [b]) => (a ?? 99) - (b ?? 99))
    .map(([semester, subjects]) => ({ semester, subjects }))

  const slug = courseSlug(entry)
  if (!courses.has(slug)) {
    courses.set(slug, { course: courseOf(entry), family: entry.family ?? null, facultyShort: entry.facultyShort ?? null, files: [] })
  }
  courses.get(slug).files.push({
    id,
    title: entry.title,
    kind: doc.kind,
    programme: doc.programme ?? null,
    pattern: doc.pattern ?? null,
    language: doc.language,
    uploaded: entry.uploaded ?? null,
    semesters,
  })
}

rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(OUT_DIR, { recursive: true })
const index = []
for (const [slug, course] of [...courses].sort(([a], [b]) => a.localeCompare(b))) {
  course.files.sort((a, b) => String(b.uploaded).localeCompare(String(a.uploaded)))
  writeFileSync(join(OUT_DIR, `${slug}.json`), JSON.stringify(course))
  const subjects = course.files.reduce((n, f) => n + f.semesters.reduce((m, s) => m + s.subjects.length, 0), 0)
  index.push({ slug, course: course.course, family: course.family, files: course.files.length, subjects })
}
writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify({ count: index.length, courses: index }))

console.log(`${index.length} courses written to ${OUT_DIR} from ${files.length} splits`)
for (const s of skipped) console.log(`skipped ${s}`)
