// Official SPPU syllabi, mirrored in Drive. The app lists them from public/data/syllabus.json; this file
// serves the PDFs: anyone may view one (syllabusView), only signed-in users may download one
// (syllabusDownload, logged). The SPPU file URLs never reach the browser.
//
// Drive: <root>/_syllabus/ holds manifest.json ({ "<id>": { "title": …, "source": "<SPPU URL>" } }, a
// copy of data/syllabus.sources.json uploaded by hand; the newest one wins) and the mirrored
// "<id>.pdf" files. It has no `subjects` folder, so it is never taken for a semester (Drive.js).
// syncSyllabus (hourly, installSyllabusTrigger) downloads the missing PDFs and records each one in the
// "Syllabus" tab of the log spreadsheet.

var SYLLABUS_FOLDER = '_syllabus'
var SYLLABUS_MANIFEST = 'manifest.json'
var SYLLABUS_HEADERS = ['id', 'driveFileId', 'bytes', 'syncedAt', 'error']
var SYLLABUS_ID = /^[a-z0-9][a-z0-9-]{0,119}$/
var SYLLABUS_MAX_BYTES = 40 * 1024 * 1024
var SYLLABUS_RUN_MS = 4.5 * 60 * 1000 // a run may take 6 minutes; stop early and go on next hour
var SYLLABUS_TOO_LARGE = 'too_large'

// The _syllabus folder under the Drive root, created the first time.
function syllabusFolder() {
  var root = DriveApp.getFolderById(getRootFolderId())
  return findChildFolder(root, SYLLABUS_FOLDER) || root.createFolder(SYLLABUS_FOLDER)
}

// { id: { title, source } } from the newest manifest.json, or {} when there is none yet.
function readSyllabusManifest(folder) {
  var files = folder.getFilesByName(SYLLABUS_MANIFEST)
  var newest = null
  while (files.hasNext()) {
    var file = files.next()
    if (!newest || file.getLastUpdated() > newest.getLastUpdated()) newest = file
  }
  if (!newest) return {}
  var manifest = JSON.parse(newest.getBlob().getDataAsString('UTF-8'))
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('syllabus_manifest_invalid')
  return manifest
}

// ---------- Serving ----------

// { fileId, title } of a mirrored syllabus; cached, since every view needs it.
function findSyllabusFile(id) {
  id = String(id || '')
  if (!SYLLABUS_ID.test(id)) throw new Error('syllabus_not_found')
  var cache = CacheService.getScriptCache()
  var hit = cache.get('syllabus:' + id)
  if (hit) return JSON.parse(hit)
  var folder = syllabusFolder()
  var entry = readSyllabusManifest(folder)[id]
  if (!entry) throw new Error('syllabus_not_found')
  var files = folder.getFilesByName(id + '.pdf')
  if (!files.hasNext()) throw new Error('syllabus_not_available_yet')
  var found = { fileId: files.next().getId(), title: String(entry.title || id) }
  try {
    cache.put('syllabus:' + id, JSON.stringify(found), CACHE_SECONDS)
  } catch (err) {}
  return found
}

// The PDF as base64. `download` adds a file name for saving it.
function getSyllabus(id, download) {
  var found = findSyllabusFile(id)
  var file
  try {
    file = DriveApp.getFileById(found.fileId)
  } catch (err) {
    CacheService.getScriptCache().remove('syllabus:' + id)
    throw new Error('syllabus_not_available_yet')
  }
  var result = {
    id: id,
    title: found.title,
    mimeType: 'application/pdf',
    encoding: 'base64',
    content: Utilities.base64Encode(file.getBlob().getBytes()),
  }
  if (download) result.fileName = found.title.replace(/[\\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) + '.pdf'
  return result
}

// ---------- Mirroring ----------

// Time-driven (installSyllabusTrigger): downloads PDFs that aren't in Drive yet, never-tried ones
// first, then earlier failures. Files over 40 MB are recorded as too_large and not tried again.
function syncSyllabus() {
  var lock = LockService.getScriptLock()
  if (!lock.tryLock(1000)) return // the previous run is still going
  var started = Date.now()
  try {
    var folder = syllabusFolder()
    var manifest = readSyllabusManifest(folder)
    var sheet = getTab('Syllabus', SYLLABUS_HEADERS)
    var rows = {}
    if (sheet && sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, SYLLABUS_HEADERS.length).getValues().forEach(function (row, i) {
        rows[String(row[0])] = { line: i + 2, error: String(row[4] || '') }
      })
    }
    var mirrored = {}
    var files = folder.getFiles()
    while (files.hasNext()) {
      var file = files.next()
      var match = file.getName().match(/^(.+)\.pdf$/)
      if (match) mirrored[match[1]] = file
    }

    var record = function (id, values) {
      if (!sheet) return
      var row = [id, values.fileId || '', values.bytes || '', istNow(), values.error || ''].map(cellText)
      if (rows[id]) sheet.getRange(rows[id].line, 1, 1, row.length).setValues([row])
      else {
        sheet.appendRow(row)
        rows[id] = { line: sheet.getLastRow(), error: values.error || '' }
      }
      rows[id].error = values.error || ''
    }

    var fresh = []
    var retry = []
    Object.keys(manifest).forEach(function (id) {
      if (!SYLLABUS_ID.test(id)) return
      if (mirrored[id]) {
        if (!rows[id] || rows[id].error) record(id, { fileId: mirrored[id].getId(), bytes: mirrored[id].getSize() })
        return
      }
      if (!rows[id]) fresh.push(id)
      else if (rows[id].error.indexOf(SYLLABUS_TOO_LARGE) !== 0) retry.push(id)
    })

    var queue = fresh.concat(retry)
    var done = 0
    for (var i = 0; i < queue.length && Date.now() - started < SYLLABUS_RUN_MS; i++) {
      var id = queue[i]
      try {
        var saved = mirrorSyllabus(folder, id, manifest[id])
        mirrored[id] = saved
        record(id, { fileId: saved.getId(), bytes: saved.getSize() })
        done++
      } catch (err) {
        record(id, { error: err.message })
      }
    }

    var total = Object.keys(manifest).length
    var count = Object.keys(manifest).filter(function (id) {
      return mirrored[id]
    }).length
    PropertiesService.getScriptProperties().setProperty(
      'SYLLABUS_STATUS',
      JSON.stringify({ syncedAt: new Date().toISOString(), mirrored: count, total: total, fetched: done, pending: total - count }),
    )
  } finally {
    lock.releaseLock()
  }
}

// Downloads one PDF (SPPU's links are http and may redirect) and saves it as "<id>.pdf".
function mirrorSyllabus(folder, id, entry) {
  var source = entry && String(entry.source || '')
  if (!/^https?:\/\//i.test(source)) throw new Error('no_source')
  var response = UrlFetchApp.fetch(source, { muteHttpExceptions: true, followRedirects: true })
  var code = response.getResponseCode()
  if (code !== 200) throw new Error('http_' + code)
  var blob = response.getBlob()
  var bytes = blob.getBytes()
  if (bytes.length > SYLLABUS_MAX_BYTES) throw new Error(SYLLABUS_TOO_LARGE + ' (' + Math.round(bytes.length / 1048576) + ' MB)')
  if (bytes.length < 5 || String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== '%PDF') throw new Error('not_a_pdf')
  return folder.createFile(blob.setName(id + '.pdf').setContentType('application/pdf'))
}

// Run once from the editor: mirrors new syllabi every hour (and starts now).
function installSyllabusTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'syncSyllabus') ScriptApp.deleteTrigger(trigger)
  })
  ScriptApp.newTrigger('syncSyllabus').timeBased().everyHours(1).create()
  syncSyllabus()
}
