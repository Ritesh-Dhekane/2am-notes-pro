// The library for one semester (subjects and every file in them) in one shape the screens can use.
//
// Backend contract (Apps Script, see apps-script/):
// - `catalog` (no sign-in): { semesters: [{ id, subjects: [{ slug, name, counts: { notes, pyqs,
//   references }, hasSyllabus, unit1: [file], sample: { paper, question, kind: exam|practice } | null }] }] } — what's on
//   offer; only Unit 1 notes are named.
// - `previewFile` / `previewAsset` (no sign-in): like getFile / getAsset, for Unit 1 notes only.
// - `listLibrary` ({ idToken, semester }): { subjects: [{ slug, name, files: { notes, pyqs,
//   references }, syllabus, comingSoon?, hidden? }] }, where syllabus is a file or null. Coming-soon
//   subjects come without files; hidden subjects and files only reach admins (marked `hidden`).

import { callApi } from './api.js'
import { clearSaved, getSaved, save } from './offline.js'
import { isSubjectVisible, semesterById } from './catalog.js'
import { CATEGORIES, describeFile } from './files.js'
import { subjectLook } from './subjects.js'

// Fetched once per visit (the welcome page and the preview reader share it).
let catalogRequest = null
export function loadCatalog() {
  if (!catalogRequest) {
    catalogRequest = callApi('catalog', {}, { public: true }).then((data) => data.semesters)
    catalogRequest.catch(() => (catalogRequest = null))
  }
  return catalogRequest
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
      return {
        slug: raw.slug,
        name: look.name || raw.name,
        look,
        files,
        syllabus,
        unitCount: units.size,
        comingSoon: Boolean(raw.comingSoon),
        hidden: Boolean(raw.hidden), // admins only
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const allFiles = subjects.flatMap((s) => [...CATEGORIES.flatMap(({ key }) => s.files[key]), ...(s.syllabus ? [s.syllabus] : [])])
  const byId = new Map(allFiles.map((f) => [f.id, f]))
  const bySlug = new Map(subjects.map((s) => [s.slug, s]))
  return { semester, subjects, allFiles, byId, bySlug }
}

// File contents, cached for the session (opening a file twice doesn't fetch it twice). Text files
// (notes, solutions) are also kept in the browser between visits (lib/offline.js), keyed by `updated`.
const contentCache = new Map()
const isText = (name = '') => /\.(md|markdown|txt)$/i.test(name)

// prefetch: fetched ahead of time, so the backend doesn't log it as opened.
export function loadFile(idToken, fileId, { updated, name, prefetch = false } = {}) {
  const key = `${fileId}:${updated ?? ''}` // a newer upload of the same file is a new entry
  if (!contentCache.has(key)) {
    const request = (async () => {
      const saved = isText(name) ? await getSaved(fileId, updated) : null
      if (saved) return saved
      const data = await callApi('getFile', { idToken, fileId, ...(prefetch ? { prefetch: true } : {}) })
      if (data.file.encoding === 'utf8') save(fileId, updated, data.file)
      return data.file
    })()
    request.catch(() => contentCache.delete(key))
    contentCache.set(key, request)
  }
  return contentCache.get(key)
}

// Opening a subject saves all of its notes and solutions in the background, two at a time.
const prefetched = new Set()
export async function prefetchSubject(idToken, subject) {
  if (!subject || prefetched.has(subject.slug)) return
  prefetched.add(subject.slug)
  const queue = [...subject.files.notes, ...subject.files.pyqs].filter((f) => isText(f.name))
  const worker = async () => {
    while (queue.length) {
      const f = queue.shift()
      await loadFile(idToken, f.id, { updated: f.updated, name: f.name, prefetch: true }).catch(() => {})
    }
  }
  await Promise.all([worker(), worker()])
}

// A Unit 1 note, signed out.
export function loadPreviewFile(fileId) {
  const key = `preview:${fileId}`
  if (!contentCache.has(key)) {
    const request = callApi('previewFile', { fileId }, { public: true }).then((data) => data.file)
    request.catch(() => contentCache.delete(key))
    contentCache.set(key, request)
  }
  return contentCache.get(key)
}

// Images a note refers to by a relative path, cached like file contents. Signed out (no idToken),
// only Unit 1 notes' images load.
export function loadAsset(idToken, noteId, path) {
  const key = `asset:${noteId}:${path}`
  if (!contentCache.has(key)) {
    const request = (
      idToken
        ? callApi('getAsset', { idToken, fileId: noteId, path })
        : callApi('previewAsset', { fileId: noteId, path }, { public: true })
    ).then((data) => data.asset)
    request.catch(() => contentCache.delete(key))
    contentCache.set(key, request)
  }
  return contentCache.get(key)
}

export function clearFileCache() {
  contentCache.clear()
  prefetched.clear()
  clearSaved()
}
