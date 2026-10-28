// Subject-wise syllabi (public/data/syllabus-split/, built by scripts/sppu-syllabus/build-split.mjs): the
// index of courses that have them, and one course's files → semesters → subjects with their units.

import { useEffect, useState } from 'react'
import { slugify } from './syllabus.js'

const cache = new Map()
function load(name) {
  if (!cache.has(name)) {
    cache.set(
      name,
      fetch(`${import.meta.env.BASE_URL}data/syllabus-split/${name}.json`)
        .then((response) => {
          if (!response.ok) throw new Error(`${name}: status ${response.status}`)
          return response.json()
        })
        .catch((error) => {
          cache.delete(name)
          throw error
        }),
    )
  }
  return cache.get(name)
}

// Course slugs that have subject-wise syllabi.
export const loadSplitIndex = () => load('index').then((data) => new Set(data.courses.map((c) => c.slug)))

// A subject's address inside its file: semester and title ("3-management-accounting"; "x-…" without a semester).
export const subjectSlug = (semester, subject) => `${semester ?? 'x'}-${slugify(subject.title)}`

// undefined while loading, null if it couldn't be loaded, else the data.
function useLoaded(loader, key) {
  const [state, setState] = useState({})
  useEffect(() => {
    let cancelled = false
    loader()
      .then((data) => !cancelled && setState({ key, data }))
      .catch(() => !cancelled && setState({ key, data: null }))
    return () => {
      cancelled = true
    }
  }, [loader, key])
  return state.key === key ? state.data : undefined
}

const loaders = new Map()
export function useCourseSplit(courseSlug) {
  const slug = slugify(courseSlug) // only ever a file name in that folder
  if (!loaders.has(slug)) loaders.set(slug, () => load(slug))
  return useLoaded(loaders.get(slug), slug)
}

export const useSplitIndex = () => useLoaded(loadSplitIndex, 'index')
