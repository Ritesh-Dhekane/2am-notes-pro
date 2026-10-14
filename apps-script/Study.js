// Each student's semester and electives, saved with their Google account so the choice follows them
// to any device or browser. Stored in Script Properties as "study:<email>" (small JSON values).

var STUDY_PREFIX = 'study:'

function getStudy(email) {
  var raw = PropertiesService.getScriptProperties().getProperty(STUDY_PREFIX + String(email).toLowerCase())
  return raw ? JSON.parse(raw) : null
}

function saveStudy(email, study) {
  var clean = cleanStudy(study)
  PropertiesService.getScriptProperties().setProperty(STUDY_PREFIX + String(email).toLowerCase(), JSON.stringify(clean))
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
