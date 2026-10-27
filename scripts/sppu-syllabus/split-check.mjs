// Checks the subject splits in data/syllabus-split/ (format: split-schema.mjs) and hands out the next ones
// to write. Page ranges are checked against the page counts extract.py recorded.
//   node scripts/sppu-syllabus/split-check.mjs              check every split, print progress
//   node scripts/sppu-syllabus/split-check.mjs <id> <id>    check only these
//   node scripts/sppu-syllabus/split-check.mjs --next 10    the next 10 to write, in rollout order
// --text <dir> points at extract.py's output (default ../notes-studio/syllabus-split/text).
// Exits 1 when a checked file has errors.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { checkSplit } from './split-schema.mjs'

const SPLIT_DIR = 'data/syllabus-split'
const CATALOGUE = 'public/data/syllabus.json'

// Rollout order: families with the most students first; anything not listed comes last.
const ORDER = [
  'B.E. / B.Tech (Engineering)', 'M.E. / M.Tech', 'B.Com / M.Com', 'B.Sc', 'M.Sc', 'B.A.', 'M.A.', 'BBA', 'BCA',
  'MBA', 'MCA',
]

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const i = args.indexOf(name)
  if (i === -1) return fallback
  const [, value] = args.splice(i, 2)
  return value
}
const next = Number(option('--next', 0))
const textDir = option('--text', '../notes-studio/syllabus-split/text')

const catalogue = JSON.parse(readFileSync(CATALOGUE, 'utf8')).items
const reportPath = join(textDir, '_report.json')
const report = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, 'utf8')) : {}
const written = new Set(existsSync(SPLIT_DIR) ? readdirSync(SPLIT_DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)) : [])

if (next) {
  const rank = (e) => (ORDER.includes(e.family) ? ORDER.indexOf(e.family) : ORDER.length)
  const queue = catalogue
    .filter((e) => !written.has(e.id) && report[e.id] && !report[e.id].error && !report[e.id].scanned)
    .sort((a, b) => rank(a) - rank(b) || String(b.uploaded).localeCompare(String(a.uploaded)))
  for (const e of queue.slice(0, next)) {
    console.log(`${e.id}\t${report[e.id].pages} pages\t${e.family} | ${e.title}`)
  }
  console.log(`(${queue.length} left with text; text files in ${textDir})`)
  process.exit(0)
}

const known = new Set(catalogue.map((e) => e.id))
const ids = args.length ? args : [...written]
let failed = 0
let warned = 0
for (const id of ids.sort()) {
  const file = join(SPLIT_DIR, `${id}.json`)
  let problems
  if (!known.has(id)) problems = { errors: ['no such id in public/data/syllabus.json'], warnings: [] }
  else if (!existsSync(file)) problems = { errors: [`missing ${file}`], warnings: [] }
  else {
    try {
      problems = checkSplit(JSON.parse(readFileSync(file, 'utf8')), { id, pageCount: report[id]?.pages })
    } catch (err) {
      problems = { errors: [`not valid JSON: ${err.message}`], warnings: [] }
    }
  }
  if (problems.errors.length) failed++
  if (problems.warnings.length) warned++
  for (const e of problems.errors) console.log(`ERROR ${id}: ${e}`)
  for (const w of problems.warnings) console.log(`warn  ${id}: ${w}`)
}

const scanned = catalogue.filter((e) => report[e.id]?.scanned).length
console.log(
  `${ids.length} checked: ${ids.length - failed} OK, ${failed} with errors, ${warned} with warnings. ` +
    `Progress: ${written.size}/${catalogue.length} written, ${Object.keys(report).length} extracted, ${scanned} scanned.`,
)
process.exit(failed ? 1 : 0)
