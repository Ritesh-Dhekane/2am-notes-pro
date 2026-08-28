// TASK-006/007: reads the subject folder tree and serves file content out of
// the private Drive root. Folder layout is defined in DRIVE_STRUCTURE.md — a
// folder's name under subjects/ doubles as its slug, so no separate mapping
// table is needed. Files are never exposed via raw Drive links; content is
// always proxied through this script.

var ALLOWED_CATEGORIES = ['notes', 'pyqs', 'references']

function listSubjects() {
  var subjectsFolder = getSubjectsFolder()

  var subjects = []
  var folders = subjectsFolder.getFolders()
  while (folders.hasNext()) {
    var folder = folders.next()
    subjects.push({
      slug: folder.getName(),
      name: slugToTitle(folder.getName()),
    })
  }

  subjects.sort(function (a, b) {
    return a.name.localeCompare(b.name)
  })

  return subjects
}

function listFiles(subjectSlug, category) {
  var categoryFolder = getCategoryFolder(subjectSlug, category)

  var files = []
  var it = categoryFolder.getFiles()
  while (it.hasNext()) {
    var file = it.next()
    files.push({
      id: file.getId(),
      name: file.getName(),
      mimeType: file.getMimeType(),
    })
  }

  files.sort(function (a, b) {
    return a.name.localeCompare(b.name)
  })

  return files
}

function getFile(fileId) {
  var file = DriveApp.getFileById(fileId)
  assertFileUnderRoot(file)

  var mimeType = file.getMimeType()
  var isText = mimeType === MimeType.PLAIN_TEXT || /markdown/.test(mimeType) || /\.md$/.test(file.getName())

  if (isText) {
    return {
      id: file.getId(),
      name: file.getName(),
      mimeType: mimeType,
      encoding: 'utf8',
      content: file.getBlob().getDataAsString(),
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

function getCategoryFolder(subjectSlug, category) {
  if (ALLOWED_CATEGORIES.indexOf(category) === -1) {
    throw new Error('invalid_category')
  }

  var subjectsFolder = getSubjectsFolder()
  var subjectFolder = findChildFolder(subjectsFolder, subjectSlug)
  if (!subjectFolder) throw new Error('subject_not_found')

  var categoryFolder = findChildFolder(subjectFolder, category)
  if (!categoryFolder) throw new Error('category_not_found')

  return categoryFolder
}

function getSubjectsFolder() {
  var root = DriveApp.getFolderById(getRootFolderId())
  var subjectsFolder = findChildFolder(root, 'subjects')
  if (!subjectsFolder) throw new Error('subjects_folder_not_found')
  return subjectsFolder
}

// Walks a file's parent chain to confirm it actually lives under the
// configured Drive root, so a caller can't request an arbitrary fileId
// elsewhere in Drive just because they have a valid session.
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
