// What students may see, set from /admin/content and enforced here, so a hidden file can't be opened
// by its id either. The rules are the Script Property VISIBILITY, a small JSON object (a property
// holds about 9 KB):
//   hidden:      semester, subject or file paths ("MCA-Sem-I", "MCA-Sem-I/data-analytics",
//                "MCA-Sem-I/data-analytics/notes/unit-02.md") or file ids. Left out for students;
//                admins still get them, marked `hidden`.
//   comingSoon:  semester or subject paths. Listed with a "Coming soon" badge, but their files aren't
//                served to students.
//   freePreview: file ids that open signed out, as well as every Unit 1 note (see isFreePreview).
// The listings are cached without the rules (Drive.js) and the rules are applied on every request,
// so a change shows straight away without rebuilding any cache.

var VISIBILITY_LISTS = ['hidden', 'comingSoon', 'freePreview']
var VISIBILITY_MAX_CHARS = 8000

var visibility_ = null

function getVisibility() {
  if (visibility_) return visibility_
  var stored = {}
  try {
    stored = JSON.parse(PropertiesService.getScriptProperties().getProperty('VISIBILITY') || '{}') || {}
  } catch (err) {
    // a broken value hides nothing
  }
  visibility_ = {}
  VISIBILITY_LISTS.forEach(function (key) {
    visibility_[key] = Array.isArray(stored[key]) ? stored[key].map(String) : []
  })
  return visibility_
}

// Whether `path` is in `list` or sits under one of its paths; file ids match exactly.
function listCovers(list, path, id) {
  for (var i = 0; i < list.length; i++) {
    if (list[i] === path || (id && list[i] === id) || path.indexOf(list[i] + '/') === 0) return true
  }
  return false
}

function isHiddenPath(rules, path, id) {
  return listCovers(rules.hidden, path, id)
}

function isComingSoon(rules, path) {
  return listCovers(rules.comingSoon, path)
}

// Throws unless a student may open the file at `where` (as assertFileUnderRoot names it).
function assertVisible(where, id, admin) {
  if (admin) return
  var rules = getVisibility()
  if (isHiddenPath(rules, where, id)) throw new Error('file_not_accessible')
  if (isComingSoon(rules, where)) throw new Error('coming_soon')
}

// Signed-out readers may open Unit 1 notes (PREVIEW_PATH in Drive.js) and the files listed in freePreview.
function isFreePreview(where, id) {
  return PREVIEW_PATH.test(where) || getVisibility().freePreview.indexOf(id) !== -1
}

// The freePreview files other than Unit 1 notes, by subject path, from the cached listings.
function extraFreeFiles(rules, semesters) {
  var bySubject = {}
  if (!rules.freePreview.length) return bySubject
  semesters.forEach(function (semester) {
    rawLibrary(semester.id).forEach(function (subject) {
      var path = semester.id + '/' + subject.slug
      Object.keys(subject.files).forEach(function (category) {
        subject.files[category].forEach(function (file) {
          var where = path + '/' + category + '/' + file.name
          if (rules.freePreview.indexOf(file.id) === -1 || PREVIEW_PATH.test(where) || isHiddenPath(rules, where, file.id)) return
          bySubject[path] = (bySubject[path] || []).concat([Object.assign({ category: category }, file)])
        })
      })
    })
  })
  return bySubject
}

// The public catalog for students: hidden semesters and subjects left out, coming-soon ones marked
// and without their Unit 1 notes or sample question. `free` lists a subject's other free previews.
function visibleCatalog(semesters) {
  var rules = getVisibility()
  var free = extraFreeFiles(rules, semesters)
  return semesters
    .filter(function (semester) {
      return !isHiddenPath(rules, semester.id)
    })
    .map(function (semester) {
      var semesterSoon = isComingSoon(rules, semester.id)
      var subjects = semester.subjects
        .filter(function (subject) {
          return !isHiddenPath(rules, semester.id + '/' + subject.slug)
        })
        .map(function (subject) {
          var path = semester.id + '/' + subject.slug
          var copy = Object.assign({}, subject, { free: free[path] || [] })
          if (semesterSoon || isComingSoon(rules, path)) {
            copy.comingSoon = true
            copy.unit1 = []
            copy.free = []
            copy.sample = null
          }
          copy.unit1 = (copy.unit1 || []).filter(function (file) {
            return !isHiddenPath(rules, path + '/notes/' + file.name, file.id)
          })
          return copy
        })
      var result = { id: semester.id, subjects: subjects }
      if (semesterSoon) result.comingSoon = true
      return result
    })
}

// One semester's subjects with the rules applied. Admins get everything, marked.
function visibleLibrary(semesterId, subjects, admin) {
  var rules = getVisibility()
  var semesterHidden = isHiddenPath(rules, semesterId)
  var semesterSoon = isComingSoon(rules, semesterId)
  var result = []
  subjects.forEach(function (subject) {
    var path = semesterId + '/' + subject.slug
    var hidden = semesterHidden || isHiddenPath(rules, path)
    var soon = semesterSoon || isComingSoon(rules, path)
    if (hidden && !admin) return
    var closed = soon && !admin
    var mark = function (file, where) {
      if (!isHiddenPath(rules, where, file.id)) return file
      return admin ? Object.assign({ hidden: true }, file) : null
    }
    var files = {}
    Object.keys(subject.files).forEach(function (category) {
      files[category] = closed ? [] : subject.files[category]
        .map(function (file) {
          return mark(file, path + '/' + category + '/' + file.name)
        })
        .filter(Boolean)
    })
    var copy = {
      slug: subject.slug,
      name: subject.name,
      files: files,
      syllabus: subject.syllabus && !closed ? mark(subject.syllabus, path + '/' + subject.syllabus.name) : null,
    }
    if (hidden) copy.hidden = true
    if (soon) copy.comingSoon = true
    result.push(copy)
  })
  return result
}

// ---------- Admin actions ----------

// The rules and every semester, subject and file (from the cached listings) for /admin/content.
function adminVisibility(user) {
  requireAdmin(user)
  logAdmin(user, 'visibility', '', null)
  return {
    visibility: getVisibility(),
    semesters: getCatalog().map(function (semester) {
      return {
        id: semester.id,
        subjects: rawLibrary(semester.id).map(function (subject) {
          var files = {}
          Object.keys(subject.files).forEach(function (category) {
            files[category] = subject.files[category].map(function (file) {
              return { id: file.id, name: file.name }
            })
          })
          return {
            slug: subject.slug,
            name: subject.name,
            files: files,
            syllabus: subject.syllabus ? { id: subject.syllabus.id, name: subject.syllabus.name } : null,
          }
        }),
      }
    }),
  }
}

// params: { visibility: { hidden, comingSoon, freePreview } }, the whole new set of rules.
function adminVisibilitySet(user, params) {
  requireAdmin(user)
  var input = (params && params.visibility) || {}
  var before = getVisibility()
  var rules = {}
  VISIBILITY_LISTS.forEach(function (key) {
    var seen = {}
    rules[key] = (Array.isArray(input[key]) ? input[key] : [])
      .map(function (item) {
        return String(item).trim().replace(/^\/+|\/+$/g, '')
      })
      .filter(function (item) {
        if (!item || item.length > 200 || item.indexOf('..') !== -1 || seen[item]) return false
        seen[item] = true
        return true
      })
  })
  var text = JSON.stringify(rules)
  if (text.length > VISIBILITY_MAX_CHARS) throw new Error('visibility_too_large')

  var changes = {}
  VISIBILITY_LISTS.forEach(function (key) {
    var added = rules[key].filter(function (item) {
      return before[key].indexOf(item) === -1
    })
    var removed = before[key].filter(function (item) {
      return rules[key].indexOf(item) === -1
    })
    if (added.length) changes[key + '+'] = added
    if (removed.length) changes[key + '-'] = removed
  })
  PropertiesService.getScriptProperties().setProperty('VISIBILITY', text)
  visibility_ = null
  logAdmin(user, 'visibility_set', '', changes)
  return getVisibility()
}
