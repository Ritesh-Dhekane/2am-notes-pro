// Each student's semester and electives, saved with their Google account so the choice follows them
// to any device or browser. Stored in the Students tab (Students.js). Older choices are still in
// Script Properties as "study:<email>" until migrateStudyToStudents copies them over.

var STUDY_PREFIX = 'study:'

function getStudy(email) {
  var study = null
  try {
    study = studyFromRow(readStudentRow(email))
  } catch (err) {
    rememberLogError(err)
  }
  if (study) return study
  var raw = PropertiesService.getScriptProperties().getProperty(STUDY_PREFIX + String(email).toLowerCase())
  return raw ? JSON.parse(raw) : null
}

// Written to the Students tab; if the sheet can't be reached, to the old property so the choice isn't lost.
function saveStudy(user, study) {
  var clean = cleanStudy(study)
  if (!writeStudy(user, clean)) {
    PropertiesService.getScriptProperties().setProperty(STUDY_PREFIX + String(user.email).toLowerCase(), JSON.stringify(clean))
  }
  return clean
}

// Only the expected shape is kept: { semester, electives: { group: slug | [slug] }, updatedAt }.
function cleanStudy(study) {
  if (!study || typeof study !== 'object') throw new Error('invalid_study')
  var text = function (value) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9-]{1,80}$/.test(value)) throw new Error('invalid_study')
    return value
  }
  var electives = {}
  var groups = study.electives && typeof study.electives === 'object' ? Object.keys(study.electives) : []
  if (groups.length > 10) throw new Error('invalid_study')
  groups.forEach(function (group) {
    var value = study.electives[group]
    if (Array.isArray(value)) {
      if (value.length > 10) throw new Error('invalid_study')
      electives[text(group)] = value.map(text)
    } else if (value) {
      electives[text(group)] = text(value)
    }
  })
  return { semester: text(study.semester), electives: electives, updatedAt: new Date().toISOString() }
}
