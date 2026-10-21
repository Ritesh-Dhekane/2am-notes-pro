// Reads the semester folders in the private Drive root and serves file content out of them.
//
// Layout (DRIVE_ROOT_FOLDER_ID is the top folder):
//   <root>/<semester>/subjects/<subject-slug>/{notes,pyqs,assignments,references}/<files>
//   <root>/<semester>/subjects/<subject-slug>/syllabus.pdf   (optional, at the subject root)
// A semester is any folder under the root that has a `subjects` folder; its name (e.g. MCA-Sem-III)
// is the semester id the app uses. A subject folder's name is its slug. Files are never exposed via
// Drive links; content is always proxied through this script after the caller is verified.

var ALLOWED_CATEGORIES = ['notes', 'pyqs', 'assignments', 'references']
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
          unit1: unitOneNotes(folder),
          sample: samplePyq(folder),
        }
      }),
    }
  })
}

// ---------- Open preview: Unit 1 notes and a sample PYQ question, signed out ----------

// Where a Unit 1 note sits (see assertFileUnderRoot): "<semester>/<subject>/notes/unit-01-….md".
var PREVIEW_PATH = /^[^\/]+\/[^\/]+\/notes\/unit[\s_-]*0*1(?!\d)/i

function unitOneNotes(subjectFolder) {
  var notes = findChildFolder(subjectFolder, 'notes')
  if (!notes) return []
  return filesIn(notes).filter(function (file) {
    return /^unit[\s_-]*0*1(?!\d)/i.test(file.name)
  })
}

var MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

// A real exam paper's date from names like "dec-2025-solutions.md" (as year * 12 + month), else -1.
function examDate(name) {
  var m = name.match(/^([a-z]{3})[a-z]*[\s_-]+(\d{4})/i)
  var month = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1
  return month === -1 ? -1 : Number(m[2]) * 12 + month
}

// The first question of the subject's newest real exam paper, without its solution. Without one, a
// question from the practice files (expected questions, MCQ banks), marked as practice.
function samplePyq(subjectFolder) {
  var pyqs = findChildFolder(subjectFolder, 'pyqs')
  if (!pyqs) return null
  var papers = filesIn(pyqs)
    .filter(function (file) {
      return /\.md$/i.test(file.name)
    })
    .sort(function (a, b) {
      return examDate(b.name) - examDate(a.name) || a.name.localeCompare(b.name)
    })
  for (var i = 0; i < papers.length; i++) {
    var text = DriveApp.getFileById(papers[i].id).getBlob().getDataAsString('UTF-8')
    var lines = text.split(/\r?\n/)
    for (var j = 0; j < lines.length; j++) {
      var match = lines[j].match(/^#{2,3}\s+(.+)$/)
      if (!match || /^(question\s*\d+|q\d+|answer|solution|instructions?)\s*$/i.test(match[1].trim())) continue
      var question = match[1]
        .replace(/^(q\d+\s*)?(\([a-z]\)|\d+)[.)]?\s*/i, '')
        .replace(/\s*\[\d+\]\s*$/, '')
        .replace(/`/g, '')
        .trim()
      if (question.length < 15) continue
      return {
        paper: slugToTitle(papers[i].name.replace(/\.md$/i, '').replace(/-?solutions?$/i, '')),
        question: question,
        kind: examDate(papers[i].name) === -1 ? 'practice' : 'exam',
      }
    }
  }
  return null
}

// ---------- One semester's library (signed-in only) ----------

// With the visibility rules applied (Visibility.js); admins also get hidden items, marked.
function listLibrary(semesterId, admin) {
  if (!semesterId) throw new Error('missing_semester')
  if (!admin && isHiddenPath(getVisibility(), semesterId)) throw new Error('semester_not_found')
  return visibleLibrary(semesterId, rawLibrary(semesterId), admin)
}

function rawLibrary(semesterId) {
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

// previewOnly: signed-out callers may only open Unit 1 notes and the free previews an admin picked.
// Hidden and coming-soon files are refused unless `admin` (Visibility.js).
function getFile(fileId, previewOnly, admin) {
  if (!fileId) throw new Error('missing_file_id')
  var file
  try {
    file = DriveApp.getFileById(fileId)
  } catch (err) {
    throw new Error('file_not_accessible')
  }
  var where = assertFileUnderRoot(file)
  assertVisible(where, file.getId(), admin)
  if (previewOnly && !isFreePreview(where, file.getId())) throw new Error('sign_in_required')

  var mimeType = file.getMimeType()
  var isText = mimeType === MimeType.PLAIN_TEXT || /markdown/.test(mimeType) || /\.(md|markdown|txt)$/i.test(file.getName())

  if (isText) {
    return {
      id: file.getId(),
      name: file.getName(),
      path: where,
      mimeType: mimeType,
      encoding: 'utf8',
      content: file.getBlob().getDataAsString('UTF-8'),
    }
  }

  return {
    id: file.getId(),
    name: file.getName(),
    path: where,
    mimeType: mimeType,
    encoding: 'base64',
    content: Utilities.base64Encode(file.getBlob().getBytes()),
  }
}

// An image a note refers to with a relative path: `x.png` next to the note, or `images/x.png` in an
// `images` folder beside it (kept out of file lists). Only plain image names are accepted.
var ASSET_PATH = /^(images\/)?[\w.\- ]{1,120}\.(png|jpe?g|gif|webp|svg)$/i

function getAsset(noteId, assetPath, previewOnly, admin) {
  if (!noteId || !assetPath) throw new Error('missing_asset')
  assetPath = String(assetPath).replace(/^\.\//, '')
  if (!ASSET_PATH.test(assetPath) || assetPath.indexOf('..') !== -1) throw new Error('file_not_accessible')
  var note
  try {
    note = DriveApp.getFileById(noteId)
  } catch (err) {
    throw new Error('file_not_accessible')
  }
  var notePath = assertFileUnderRoot(note)
  assertVisible(notePath, note.getId(), admin)
  if (previewOnly && !isFreePreview(notePath, note.getId())) throw new Error('sign_in_required')
  var parents = note.getParents()
  if (!parents.hasNext()) throw new Error('file_not_accessible')
  var folder = parents.next()
  var parts = assetPath.split('/')
  if (parts.length === 2) folder = findChildFolder(folder, parts[0])
  var name = parts[parts.length - 1]
  if (folder) {
    var files = folder.getFiles()
    while (files.hasNext()) {
      var file = files.next()
      if (file.getName() !== name) continue
      assertFileUnderRoot(file)
      return {
        name: name,
        mimeType: file.getMimeType(),
        encoding: 'base64',
        content: Utilities.base64Encode(file.getBlob().getBytes()),
      }
    }
  }
  throw new Error('file_not_found')
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
// Returns where it sits, e.g. "MCA-Sem-III/tableau/references/assignment.docx" (for the log).
function assertFileUnderRoot(file) {
  var rootFolderId = getRootFolderId()
  var parents = file.getParents()
  while (parents.hasNext()) {
    var trail = trailToRoot(parents.next(), rootFolderId)
    if (trail) return trail.concat([file.getName()]).join('/')
  }
  throw new Error('file_not_accessible')
}

// Folder names from just under the root down to `folder` (skipping "subjects"), or null if the
// folder isn't under the root.
function trailToRoot(folder, rootFolderId) {
  var names = []
  var current = folder
  for (var depth = 0; depth < 10; depth++) {
    if (current.getId() === rootFolderId) return names
    if (current.getName() !== 'subjects') names.unshift(current.getName())
    var parents = current.getParents()
    if (!parents.hasNext()) return null
    current = parents.next()
  }
  return null
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
