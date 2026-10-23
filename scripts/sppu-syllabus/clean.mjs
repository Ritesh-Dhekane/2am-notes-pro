// Turns data/syllabus.raw.json (scrape.mjs) into:
//   public/data/syllabus.json        the list the site ships: no SPPU file URLs
//   data/syllabus.sources.json       { id: { title, source } } for the backend mirror (repo only;
//                                    upload it to Drive as _syllabus/manifest.json, see README)
// Programme, level, pattern, years and semesters are best-effort guesses from the file name, using the
// tables below: the first matching row wins. Run: `node scripts/sppu-syllabus/clean.mjs`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'

const RAW = process.argv[2] || 'data/syllabus.raw.json'
const OUT = 'public/data/syllabus.json'
const SOURCES = 'data/syllabus.sources.json'

// Programmes with a fixed name: [pattern on the cleaned name, programme, level].
const PROGRAMMES = [
  [/\bMCA\b.*\bIntegrated\b|\bIntegrated\b.*\bMCA\b/i, 'MCA (Integrated)', 'UG'],
  [/\bMCA\b/i, 'MCA', 'PG'],
  [/\bBBA\s*LL\.?\s*B|\bBA\s*LL\.?\s*B/i, 'LL.B. (Integrated)', 'UG'],
  [/\bLL\.?\s*M\b|\bLLM\b/i, 'LL.M.', 'PG'],
  [/\bLL\.?\s*B\b/i, 'LL.B.', 'UG'],
  [/\bBBA[\s-]*\(?CA\b/i, 'BBA (Computer Applications)', 'UG'],
  [/\bBBA[\s-]*\(?IB\b/i, 'BBA (International Business)', 'UG'],
  [/\bBBA\b/i, 'BBA', 'UG'],
  [/\bB\.?\s?C\.?\s?A\b\.?|Bachelor of Computer Applications/i, 'BCA', 'UG'],
  [/\bMBA\b/i, 'MBA', 'PG'],
  [/\bMHMCT\b/i, 'MHMCT', 'PG'],
  [/\bBHMCT\b/i, 'BHMCT', 'UG'],
  [/\bM\.?\s?Com\b/i, 'M.Com', 'PG'],
  [/\bB\.?\s?Com\b[\s.-]*\(?(CA)\b/i, 'B.Com (Computer Applications)', 'UG'],
  [/\bB\.?\s?Com\b[\s.-]*\(?(IB)\b/i, 'B.Com (International Business)', 'UG'],
  [/\bB\.?\s?Com\b[\s.-]*\(?(BM)\b/i, 'B.Com (Business Management)', 'UG'],
  [/\bB\.?\s?Com\b/i, 'B.Com', 'UG'],
  [/\bM\.?\s?Arch\b/i, 'M.Arch', 'PG'],
  [/\bB\.?\s?Arch\b/i, 'B.Arch', 'UG'],
  [/\bB\.?\s?Des\b/i, 'B.Des', 'UG'],
  [/\bB\.?\s?Tech\b.*Biotech|\bBT\b/i, 'B.Tech Biotechnology', 'UG'],
  [/\bITEP\b/i, 'ITEP (B.A. B.Ed.)', 'UG'],
  [/\bM\.?\s?Ed\b/i, 'M.Ed', 'PG'],
  [/\bB\.?\s?Ed\b/i, 'B.Ed', 'UG'],
  [/\bB\.?\s?FA\b/i, 'BFA', 'UG'],
  [/\bB\.?\s?VA\b/i, 'BVA', 'UG'],
  [/\bB\.?\s?Voc\b/i, 'B.Voc', 'UG'],
  [/\bPh\.?\s?D\b/i, 'Ph.D.', 'PhD'],
]

// Degrees named after a subject, e.g. "S.Y.B.Sc. (Data Science)" -> "B.Sc Data Science":
// [pattern ending right before the subject, degree, level].
const SUBJECT_DEGREES = [
  [/\bM\.?\s?A\.?\s*,?\s*M\.?\s?Sc\b\.?/i, 'M.A./M.Sc', 'PG'],
  [/\bM\.?\s?Sc\b\.?/i, 'M.Sc', 'PG'],
  [/\bM\.?\s?A\b\.?/, 'M.A.', 'PG'],
  [/\bB\.?\s?Sc\b\.?/i, 'B.Sc', 'UG'],
  [/\bB\.?\s?A\b\.?/, 'B.A.', 'UG'],
]
// Not a subject: "S.Y.B.Sc. (Restructuring Pattern)" is just B.Sc.
const NOT_SUBJECT = /[Rr]estructuring|[Pp]attern|[Bb]lended|[Ss]yllabus|\b[A-Z]\.[A-Z]\./
// Where the subject after a degree ends.
const SUBJECT_END = /\s*(?:\bsyllabus\b|\bstructure\b|\bnep\b|\bsem(?:ester)?\b|\bfrom\b|\bac(?:ademic)?\b|\ba\.?y\b|\bpattern\b|\bas per\b|\bspecial\b|\bfinal\b|\bupdated\b|\bonly\b|\d|[([\]_-]|$)/i

// Engineering: the name starts with FE/SE/TE/BE/ME; the branch comes from this table.
const ENGINEERING = /^(?:R\d+\s*)?(?:[Ff]inal\s*|FINAL\s*)?([FSTBM])\.?\s?E\b\.?|^(?:TE-BE|ETC|E\s*and\s*TC)\b/
const BRANCHES = [
  [/computer science\s*(?:and|&)\s*design/i, 'Computer Science and Design'],
  [/\bCSE?\b.*\bdata science|computer science.*data science/i, 'Computer Science and Engineering (Data Science)'],
  [/\bCSE\s*AI\b|computer engineering\s*\(artificial intelligence\)/i, 'Computer Engineering (AI)'],
  [/computer science|\bCSE\b/i, 'Computer Science and Engineering'],
  [/computer engineering/i, 'Computer Engineering'],
  [/\bAI\s*(?:and|&)?\s*DS\b|artificial intelligence and data science/i, 'AI and Data Science'],
  [/\bAI\s*(?:and|&)?\s*ML\b/i, 'AI and Machine Learning'],
  [/data science/i, 'Data Science'],
  [/\bIT\b|[Ii]nformation [Tt]echnology/, 'Information Technology'],
  [/cyber/i, 'Cyber Security'],
  [/\bIo\s?T\b/i, 'Internet of Things'],
  [/robotics and ai/i, 'Robotics and AI'],
  [/\bR\s*(?:and|&)\s*A\b|robotics/i, 'Robotics and Automation'],
  [/\bE\s*(?:and|&)\s*TC\b|\bETC\b/i, 'E&TC'],
  [/\bEC\b|\bECE\b|\bACT\b|[Ee]lectronics and [Cc]ommunication|\bE\s*(?:and|&)\s*C\b/, 'Electronics and Communication'],
  [/electrical/i, 'Electrical'],
  [/electronics|VLSI/i, 'Electronics'],
  [/mechatronics/i, 'Mechatronics'],
  [/mech/i, 'Mechanical'],
  [/civil|environment|construction/i, 'Civil'],
  [/chemical/i, 'Chemical'],
  [/instrumentation/i, 'Instrumentation and Control'],
  [/automobile|\bauto\b/i, 'Automobile'],
  [/production|\bprod\b|ind\.?\s*engg/i, 'Production'],
  [/printing/i, 'Printing and Packaging'],
]

// Patterns, in order: "2024 Pattern" (also "2024 Patt", "2025 Pat", "2024 Course"), NEP, CBCS.
const PATTERNS = [
  [/(?<!\d)(20\d\d)\s*(?:NEP\s*|CBCS\s*)?(?:\d\d\s*[-+]\s*\d\d\s*)?(?:pattern|patt?|course)\b/i, (m) => `${m[1]} Pattern`],
  [/\bNEP\s*[-_]?\s*(20\d\d)\b/i, (m) => (m[1] === '2020' ? 'NEP 2020' : `NEP ${m[1]}`)],
  [/\bNEP\b/i, () => 'NEP 2020'],
  [/\bCBCS\b/i, () => 'CBCS'],
]

// Years of study, from the start of the name.
const YEARS = [
  [/^(?:F\.?\s?Y|F\.?\s?E\b|[Ff]irst [Yy]ear)/, 'F.Y.'],
  [/^(?:S\.?\s?Y|S\.?\s?E\b|[Ss]econd [Yy]ear|2ND YR)/, 'S.Y.'],
  [/^(?:T\.?\s?Y|T\.?\s?E\b|[Tt]hird [Yy]ear)/, 'T.Y.'],
  [/^(?:B\.?\s?E\b|[Ff]ourth|[Ff]inal [Yy]ear|(?:\d\.\s*)?4th yr|B\.?\s*Fourth)/, 'Final Year'],
]
// Semesters: "Sem III and IV", "Semester 1-4", "sem I to IV" -> "Sem III–IV".
const SEMESTERS = /\bsem(?:ester)?\s*[-_.]?\s*((?:[IVX]+|\d{1,2})\b(?:\s*(?:,|and|&|to|-)?\s*(?:sem(?:ester)?\s*)?(?:[IVX]+|\d{1,2})\b)*)/i

// SPPU appends the upload date to most names: "…_24042026", "…-22082026", "…_02_04_2026".
const DATE_SUFFIX = /[\s_-]+(\d{2})[_-]?(\d{2})[_-]?(\d{4})\s*$/

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

const clean = (text) => String(text || '').replace(/[‎‏]/g, '').replace(/\s+/g, ' ').trim()

function fileStem(href) {
  return decodeURIComponent(href.split('/').pop()).replace(/\.[a-z0-9]+$/i, '')
}

// Strips every trailing date ("…_12072025_14072025"); the last one is the upload date.
function splitDate(stem) {
  let base = stem
  let date = null
  let first = true
  for (let m = base.match(DATE_SUFFIX); m; m = base.match(DATE_SUFFIX)) {
    const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])]
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2099) break
    if (first && year >= 2015) date = `${year}-${m[2]}-${m[1]}` // "…_23062006" is a typo
    first = false
    base = base.slice(0, m.index)
  }
  return { base, date }
}

function listDate(text) {
  const m = String(text || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : null
}

function titleOf(base) {
  return clean(
    base
      .replace(/\.docx?$/i, '')
      .replace(/_/g, ' ')
      .replace(/\s*\(\d\)\s*$|\s*\[\d\]/g, ' ')
      .replace(/\)\)+$/, ')'),
  ).replace(/[\s,-]+$/, '')
}

function slugOf(text) {
  return text
    .normalize('NFKD')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
    .replace(/-+$/, '')
}

function romanOf(token) {
  const n = /^\d+$/.test(token) ? Number(token) : ROMAN.indexOf(token.toUpperCase())
  return n > 0 && n < ROMAN.length ? n : null
}

function semestersOf(title) {
  const m = title.match(SEMESTERS)
  if (!m) return null
  const numbers = (m[1].match(/[IVX]+|\d{1,2}/gi) || []).map(romanOf).filter(Boolean)
  if (!numbers.length) return null
  const low = Math.min(...numbers)
  const high = Math.max(...numbers)
  return low === high ? `Sem ${ROMAN[low]}` : `Sem ${ROMAN[low]}–${ROMAN[high]}`
}

function yearsOf(title) {
  const row = YEARS.find(([re]) => re.test(title))
  const m = title.match(YEAR_BEFORE_DEGREE) // "SPPU NEP SYBBA"
  return row ? row[1] : m ? `${m[1]}.Y.` : null
}

function patternOf(title) {
  for (const [re, name] of PATTERNS) {
    const m = title.match(re)
    if (m) return name(m)
  }
  return null
}

// Strips "F.Y."/"S.Y."/"T.Y." before a degree, so "SYBCom" reads as "BCom".
const YEAR_BEFORE_DEGREE = /\b([FST])\.?\s?Y\.?\s*(?=B)/
const withoutYear = (title) => title.replace(new RegExp(YEAR_BEFORE_DEGREE, 'g'), '')

function programmeOf(title, group) {
  const bare = withoutYear(title)
  if (/engineering|honou?rs|minors/i.test(group) || ENGINEERING.test(bare)) {
    const m = bare.match(ENGINEERING)
    const branch = BRANCHES.find(([re]) => re.test(bare))
    const postgrad = m && /^M/i.test(m[1] || '')
    if (/^F\.?\s?E\b/i.test(bare)) return { programme: 'B.E. (First Year, all branches)', level: 'UG' }
    if (branch) return { programme: `${postgrad ? 'M.E.' : 'B.E.'} ${branch[1]}`, level: postgrad ? 'PG' : 'UG' }
  }
  for (const [re, programme, level] of PROGRAMMES) if (re.test(bare)) return { programme, level }
  for (const [re, degree, level] of SUBJECT_DEGREES) {
    const m = bare.match(re)
    if (!m) continue
    let rest = bare.slice(m.index + m[0].length).trim()
    const paren = rest.match(/^\(([^)]+)\)/)
    rest = rest.replace(/^syllabus\s+/i, '')
    if (paren) rest = paren[1]
    else rest = rest.slice(0, rest.search(SUBJECT_END) === -1 ? undefined : rest.search(SUBJECT_END))
    rest = clean(rest.replace(/[^\w\s&,.]+/g, ' ')).replace(/[\s,.]+$/, '')
    return { programme: rest && !NOT_SUBJECT.test(rest) ? `${degree} ${rest}` : degree, level }
  }
  if (/\bdiploma?\b/i.test(title)) return { programme: null, level: 'Diploma' }
  return { programme: null, level: /^(?:F|S|T)\.?\s?Y/i.test(title) ? 'UG' : 'Other' }
}

const raw = JSON.parse(readFileSync(RAW, 'utf8'))
// Sorted, so suffixes for clashing ids stay the same from run to run.
const rows = [...raw].sort((a, b) => a.href.localeCompare(b.href))
const used = new Set()
const entries = []
const sources = {}
for (const row of rows) {
  const stem = fileStem(row.href)
  const { base, date } = splitDate(stem)
  const title = titleOf(base) || titleOf(stem)
  let id = slugOf(stem)
  if (!/[a-z]/.test(id)) id = `syllabus-${id}`.replace(/-$/, '') // e.g. a name only in Marathi
  if (used.has(id)) id = `${id}-${row.year}`
  const taken = id
  for (let n = 2; used.has(id); n++) id = `${taken}-${n}`
  used.add(id)
  const group = clean(row.course).replace(/^[A-Z]{1,4}\)\s*/, '')
  const { programme, level } = programmeOf(title, group)
  entries.push({
    id,
    title,
    faculty: clean(row.faculty),
    group,
    library: Number(row.year),
    programme,
    level,
    pattern: patternOf(title),
    years: yearsOf(title),
    semesters: semestersOf(title),
    uploaded: date || listDate(row.date),
  })
  sources[id] = { title, source: row.href }
}
entries.sort((a, b) => b.library - a.library || a.faculty.localeCompare(b.faculty) || a.group.localeCompare(b.group) || a.title.localeCompare(b.title))

mkdirSync('public/data', { recursive: true })
writeFileSync(OUT, JSON.stringify({ source: 'Savitribai Phule Pune University', count: entries.length, items: entries }) + '\n')
writeFileSync(SOURCES, JSON.stringify(sources, null, 1) + '\n')

const pct = (key) => `${entries.filter((e) => e[key]).length} (${Math.round((entries.filter((e) => e[key]).length / entries.length) * 100)}%)`
const top = Object.entries(entries.reduce((acc, e) => ((acc[e.programme || '(none)'] = (acc[e.programme || '(none)'] || 0) + 1), acc), {}))
  .sort((a, b) => b[1] - a[1])
  .slice(0, 12)
console.log(`${entries.length} entries -> ${OUT}, sources -> ${SOURCES}`)
console.log(`programme ${pct('programme')}, pattern ${pct('pattern')}, years ${pct('years')}, semesters ${pct('semesters')}, uploaded ${pct('uploaded')}`)
console.log('levels', JSON.stringify(entries.reduce((acc, e) => ((acc[e.level] = (acc[e.level] || 0) + 1), acc), {})))
console.log('top programmes', top.map(([p, n]) => `${p} ${n}`).join(', '))
