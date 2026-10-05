// The whole library (subjects and every file in them) in one shape the screens can use.
// New backends answer `listLibrary` in one call; older deployments only have listSubjects/listFiles,
// so we fall back to those (one call per subject and category).

import { callApi } from './api.js'
import { CATEGORIES, describeFile } from './files.js'
import { subjectLook } from './subjects.js'

async function fetchRaw(idToken) {
  try {
    const data = await callApi('listLibrary', { idToken })
    return data.subjects
  } catch (err) {
    if (err.message !== 'unknown_action') throw err
  }
  const { subjects } = await callApi('listSubjects', { idToken })
  return Promise.all(
    subjects.map(async (subject) => {
      const files = {}
      await Promise.all(
        CATEGORIES.map(async ({ key }) => {
          try {
            files[key] = (await callApi('listFiles', { idToken, subjectSlug: subject.slug, category: key })).files
          } catch (err) {
            if (err.message !== 'category_not_found') throw err
            files[key] = []
          }
        }),
      )
      return { ...subject, files }
    }),
  )
}

export function buildLibrary(rawSubjects, now = Date.now()) {
  const subjects = rawSubjects
    .map((raw) => {
      const look = subjectLook(raw.slug, raw.name)
      const files = {}
      for (const { key } of CATEGORIES) {
        files[key] = (raw.files?.[key] || [])
          .map((file) => ({ ...describeFile(file, key, now), subject: raw.slug }))
          .sort((a, b) => (a.unit ?? 999) - (b.unit ?? 999) || a.name.localeCompare(b.name))
      }
      const units = new Set(files.notes.map((f) => f.unit).filter((u) => u !== null))
      return { slug: raw.slug, name: raw.name, look, files, unitCount: units.size }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const allFiles = subjects.flatMap((s) => CATEGORIES.flatMap(({ key }) => s.files[key]))
  const byId = new Map(allFiles.map((f) => [f.id, f]))
  const bySlug = new Map(subjects.map((s) => [s.slug, s]))
  return { subjects, allFiles, byId, bySlug }
}

export async function loadLibrary(idToken) {
  return buildLibrary(await fetchRaw(idToken))
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
