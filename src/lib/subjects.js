// Look of each subject (icon, colour, short name, one-line description), from the catalog. Subjects
// the catalog doesn't know yet still work, with a neutral look and the name from their folder.

import { BookOpen } from 'lucide-react'
import { subjectInfo } from './catalog.js'

const FALLBACK = { icon: BookOpen, tint: '#6366F1', about: 'Notes, PYQs and references.' }

export function subjectLook(slug, name) {
  const info = subjectInfo(slug)
  return { ...FALLBACK, short: name, name, ...(info || {}) }
}

// Style for an element that carries a subject colour (used with the .tint classes in index.css).
export function tintStyle(look) {
  return { '--tint': look.tint }
}
