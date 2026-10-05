// The library for one semester (subjects and every file in them) in one shape the screens can use.
//
// Backend contract (Apps Script, see apps-script/):
// - `catalog` (no sign-in): { semesters: [{ id, subjects: [{ slug, name, counts: { notes, pyqs,
//   references }, hasSyllabus }] }] } — what's on offer, without file names or ids.
// - `listLibrary` ({ idToken, semester }): { subjects: [{ slug, name, files: { notes, pyqs,
//   references }, syllabus }] }, where syllabus is a file or null.

import { callApi } from './api.js'
import { isSubjectVisible, semesterById } from './catalog.js'
import { CATEGORIES, describeFile } from './files.js'
import { subjectLook } from './subjects.js'

export async function loadCatalog() {
  const data = await callApi('catalog', {}, { public: true })
  return data.semesters
}

export async function loadRawLibrary(idToken, semesterId) {
  const data = await callApi('listLibrary', { idToken, semester: semesterId })
  return data.subjects
}

// Builds the library from the backend's subjects, keeping only those this student sees (the
// semester's core subjects and their electives).
export function buildLibrary(rawSubjects, { semester: semesterId, electives } = {}, now = Date.now()) {
  const semester = semesterById(semesterId)
  const subjects = rawSubjects
    .filter((raw) => isSubjectVisible(semester, electives, raw.slug))
    .map((raw) => {
      const look = subjectLook(raw.slug, raw.name)
      const files = {}
      for (const { key } of CATEGORIES) {
        files[key] = (raw.files?.[key] || [])
          .map((file) => ({ ...describeFile(file, key, now), subject: raw.slug }))
          .sort((a, b) => (a.unit ?? 999) - (b.unit ?? 999) || a.name.localeCompare(b.name))
      }
      const syllabus = raw.syllabus
        ? { ...describeFile(raw.syllabus, 'syllabus', now), subject: raw.slug, title: 'Syllabus', unit: null }
        : null
      const units = new Set(files.notes.map((f) => f.unit).filter((u) => u !== null))
      return { slug: raw.slug, name: look.name || raw.name, look, files, syllabus, unitCount: units.size }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const allFiles = subjects.flatMap((s) => [...CATEGORIES.flatMap(({ key }) => s.files[key]), ...(s.syllabus ? [s.syllabus] : [])])
  const byId = new Map(allFiles.map((f) => [f.id, f]))
  const bySlug = new Map(subjects.map((s) => [s.slug, s]))
  return { semester, subjects, allFiles, byId, bySlug }
}

// File contents, cached for the session (opening a file twice doesn't fetch it twice).
const contentCache = new Map()

export function loadFile(idToken, fileId) {
  if (!contentCache.has(fileId)) {
    const request = callApi('getFile', { idToken, fileId }).then((data) => data.file)
    request.catch(() => contentCache.delete(fileId))
    contentCache.set(fileId, request)
  }
  return contentCache.get(fileId)
}

export function clearFileCache() {
  contentCache.clear()
}
