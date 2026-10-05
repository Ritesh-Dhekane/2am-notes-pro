// Search over the library's metadata: file titles, units, subjects and types. Every word has to
// match somewhere; title matches rank highest. (File contents aren't searched: they're only
// fetched when opened.)

import { CATEGORIES, kindLabel } from './files.js'

export function queryWords(query) {
  return query.toLowerCase().split(/\s+/).filter(Boolean)
}

function fieldsOf(file, subject) {
  const category = CATEGORIES.find((c) => c.key === file.category)
  return [
    [file.title.toLowerCase(), 4],
    [file.unit ? `unit ${file.unit} u${file.unit}` : '', 2],
    [`${subject.name} ${subject.look.short} ${subject.slug}`.toLowerCase(), 1.5],
    [`${category?.label ?? ''} ${category?.single ?? ''} ${kindLabel(file.kind)} ${file.name}`.toLowerCase(), 1],
  ]
}

function scoreFile(file, subject, words, phrase) {
  const fields = fieldsOf(file, subject)
  let score = 0
  for (const word of words) {
    let best = 0
    for (const [text, weight] of fields) {
      const at = text.indexOf(word)
      if (at === -1) continue
      const wordStart = at === 0 || /[\s\-_.]/.test(text[at - 1])
      best = Math.max(best, weight * (wordStart ? 1.5 : 1))
    }
    if (!best) return 0
    score += best
  }
  const title = fields[0][0]
  if (title.startsWith(phrase)) score += 3
  else if (title.includes(phrase)) score += 2
  if (file.isNew) score += 0.5
  return score
}

// All matches (ignoring scope and subject filters) with their scores, best first.
export function searchLibrary(library, query) {
  const words = queryWords(query)
  if (!words.length) return []
  const phrase = words.join(' ')
  const results = []
  for (const file of library.allFiles) {
    const subject = library.bySlug.get(file.subject)
    if (!subject) continue
    const score = scoreFile(file, subject, words, phrase)
    if (score) results.push({ file, subject, score })
  }
  return results.sort((a, b) => b.score - a.score || a.file.title.localeCompare(b.file.title))
}

// Splits text into plain and matching parts for <mark>-style highlighting.
export function highlightParts(text, words) {
  if (!words.length) return [{ text, match: false }]
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length)
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi')
  return text
    .split(pattern)
    .filter(Boolean)
    .map((part) => ({ text: part, match: words.includes(part.toLowerCase()) }))
}
