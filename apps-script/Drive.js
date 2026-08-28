// TASK-006: reads the subject folder tree out of the private Drive root.
// Folder layout is defined in DRIVE_STRUCTURE.md — a folder's name under
// subjects/ doubles as its slug, so no separate mapping table is needed.

function listSubjects() {
  var rootFolderId = PropertiesService.getScriptProperties().getProperty('DRIVE_ROOT_FOLDER_ID')
  if (!rootFolderId) {
    throw new Error('server_misconfigured_missing_drive_root')
  }

  var root = DriveApp.getFolderById(rootFolderId)
  var subjectsFolder = findChildFolder(root, 'subjects')
  if (!subjectsFolder) {
    throw new Error('subjects_folder_not_found')
  }

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
