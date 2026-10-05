// Reads the semester folders in the private Drive root and serves file content out of them.
//
// Layout (DRIVE_ROOT_FOLDER_ID is the top folder):
//   <root>/<semester>/subjects/<subject-slug>/{notes,pyqs,references}/<files>
//   <root>/<semester>/subjects/<subject-slug>/syllabus.pdf   (optional, at the subject root)
// A semester is any folder under the root that has a `subjects` folder; its name (e.g. MCA-Sem-III)
// is the semester id the app uses. A subject folder's name is its slug. Files are never exposed via
// Drive links; content is always proxied through this script after the caller is verified.

var ALLOWED_CATEGORIES = ['notes', 'pyqs', 'references']
var SYLLABUS_NAME = /^syllabus\.[a-z0-9]+$/i

// Listing touches Drive a hundred-plus times (each call is slow in Apps Script), so listings are
// cached for the maximum six hours and rebuilt hourly by a trigger (installTriggers), so no visitor
// waits on a cold cache. After uploading files, run refreshCaches() to show them straight away.
var CACHE_SECONDS = 21600

// ---------- Public catalog: what's on offer, without file names or ids ----------

function getCatalog() {
  return cached('catalog', buildCatalog)
}

function buildCatalog() {
  return listSemesterFolders().map(function (semester) {
    return {
      id: semester.id,
      subjects: listSubjectFolders(semester.subjectsFolder).map(function (folder) {
        var counts = {}
        ALLOWED_CATEGORIES.forEach(function (category) {
          var categoryFolder = findChildFolder(folder, category)
          counts[category] = categoryFolder ? countFiles(categoryFolder) : 0
        })
        return {
          slug: folder.getName(),
          name: slugToTitle(folder.getName()),
          counts: counts,
          hasSyllabus: Boolean(findSyllabus(folder)),
        }
      }),
    }
  })
}

// ---------- One semester's library (signed-in only) ----------

function listLibrary(semesterId) {
  if (!semesterId) throw new Error('missing_semester')
  return cached('library:' + semesterId, function () {
    return buildLibrary(findSemester(semesterId))
  })
}

function buildLibrary(semester) {
  return listSubjectFolders(semester.subjectsFolder).map(function (folder) {
    var files = {}
    ALLOWED_CATEGORIES.forEach(function (category) {
      var categoryFolder = findChildFolder(folder, category)
      files[category] = categoryFolder ? filesIn(categoryFolder) : []
    })
    var syllabus = findSyllabus(folder)
    return {
      slug: folder.getName(),
      name: slugToTitle(folder.getName()),
      files: files,
      syllabus: syllabus ? describe(syllabus) : null,
    }
  })
}

function getFile(fileId) {
  if (!fileId) throw new Error('missing_file_id')
  var file
  try {
    file = DriveApp.getFileById(fileId)
  } catch (err) {
    throw new Error('file_not_accessible')
  }
  assertFileUnderRoot(file)

  var mimeType = file.getMimeType()
  var isText = mimeType === MimeType.PLAIN_TEXT || /markdown/.test(mimeType) || /\.(md|markdown|txt)$/i.test(file.getName())

  if (isText) {
    return {
      id: file.getId(),
      name: file.getName(),
      mimeType: mimeType,
      encoding: 'utf8',
      content: file.getBlob().getDataAsString('UTF-8'),
    }
  }

  return {
    id: file.getId(),
    name: file.getName(),
    mimeType: mimeType,
    encoding: 'base64',
    content: Utilities.base64Encode(file.getBlob().getBytes()),
  }
}

// ---------- Folder helpers ----------

function listSemesterFolders() {
  var root = DriveApp.getFolderById(getRootFolderId())
  var semesters = []
  var folders = root.getFolders()
  while (folders.hasNext()) {
    var folder = folders.next()
    var subjectsFolder = findChildFolder(folder, 'subjects')
    if (subjectsFolder) semesters.push({ id: folder.getName(), subjectsFolder: subjectsFolder })
  }
  semesters.sort(function (a, b) {
    return a.id.localeCompare(b.id)
  })
  return semesters
}

function findSemester(semesterId) {
  var root = DriveApp.getFolderById(getRootFolderId())
  var folder = findChildFolder(root, semesterId)
  var subjectsFolder = folder && findChildFolder(folder, 'subjects')
  if (!subjectsFolder) throw new Error('semester_not_found')
  return { id: semesterId, subjectsFolder: subjectsFolder }
}

function listSubjectFolders(subjectsFolder) {
  var subjects = []
  var folders = subjectsFolder.getFolders()
  while (folders.hasNext()) subjects.push(folders.next())
  subjects.sort(function (a, b) {
    return a.getName().localeCompare(b.getName())
  })
  return subjects
}

function findSyllabus(subjectFolder) {
  var files = subjectFolder.getFiles()
  while (files.hasNext()) {
    var file = files.next()
    if (SYLLABUS_NAME.test(file.getName())) return file
  }
  return null
}

function filesIn(folder) {
  var files = []
  var it = folder.getFiles()
  while (it.hasNext()) files.push(describe(it.next()))
  files.sort(function (a, b) {
    return a.name.localeCompare(b.name)
  })
  return files
}

function countFiles(folder) {
  var n = 0
  var it = folder.getFiles()
  while (it.hasNext()) {
    it.next()
    n++
  }
  return n
}

function describe(file) {
  return {
    id: file.getId(),
    name: file.getName(),
    mimeType: file.getMimeType(),
    size: file.getSize(),
    updated: file.getLastUpdated().toISOString(),
  }
}

// Walks a file's parent chain to confirm it actually lives under the configured Drive root, so a
// caller can't request an arbitrary fileId elsewhere in Drive just because they have a valid session.
function assertFileUnderRoot(file) {
  var rootFolderId = getRootFolderId()
  var parents = file.getParents()
  while (parents.hasNext()) {
    if (isUnderFolder(parents.next(), rootFolderId)) return
  }
  throw new Error('file_not_accessible')
}

function isUnderFolder(folder, rootFolderId) {
  var current = folder
  for (var depth = 0; depth < 10; depth++) {
    if (current.getId() === rootFolderId) return true
    var parents = current.getParents()
    if (!parents.hasNext()) return false
    current = parents.next()
  }
  return false
}

function getRootFolderId() {
  var rootFolderId = PropertiesService.getScriptProperties().getProperty('DRIVE_ROOT_FOLDER_ID')
  if (!rootFolderId) throw new Error('server_misconfigured_missing_drive_root')
  return rootFolderId
}

function findChildFolder(parent, name) {
  var it = parent.getFoldersByName(name)
  return it.hasNext() ? it.next() : null
}

function slugToTitle(slug) {
  return slug
    .split('-')
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

// ---------- Cache ----------

function cached(key, compute) {
  var hit = CacheService.getScriptCache().get(key)
  if (hit) return JSON.parse(hit)
  var value = compute()
  store(key, value)
  return value
}

function store(key, value) {
  try {
    CacheService.getScriptCache().put(key, JSON.stringify(value), CACHE_SECONDS) // over 100 KB isn't cached
  } catch (err) {
    // fine: computed fresh next time
  }
}

// Rebuilds every listing. Run it from the editor after adding or renaming files; the hourly trigger
// runs it too.
function refreshCaches() {
  store('catalog', buildCatalog())
  listSemesterFolders().forEach(function (semester) {
    store('library:' + semester.id, buildLibrary(semester))
  })
}

// Run once from the editor: refreshes the caches every hour (and right now).
function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'refreshCaches') ScriptApp.deleteTrigger(trigger)
  })
  ScriptApp.newTrigger('refreshCaches').timeBased().everyHours(1).create()
  refreshCaches()
}
