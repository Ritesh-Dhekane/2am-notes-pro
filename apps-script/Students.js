// The "Students" tab of the log spreadsheet: one row per student with their choices and a running
// summary (first/last seen, sign-ins, file opens, last device). It replaces the "study:<email>" Script
// Properties, which cap at about 500 KB in total and would fill up as students join.
// Like logEvent, updating it must never break the request, so failures are swallowed.

// New columns go on the right, so rows written before them stay aligned.
var STUDENT_HEADERS = [
  'Email', 'Name', 'Phone', 'Course', 'Semester', 'Electives', 'First seen', 'Last seen',
  'Sign-ins', 'File opens', 'Last device', 'Choices saved',
]
var STUDENT_COL = {
  email: 0, name: 1, phone: 2, course: 3, semester: 4, electives: 5, firstSeen: 6, lastSeen: 7,
  signIns: 8, opens: 9, device: 10, savedAt: 11,
}

function getStudentsSheet() {
  return getTab('Students', STUDENT_HEADERS)
}

// Sheet row number (2+) of a student, or 0.
function findStudentRow(sheet, email) {
  var last = sheet.getLastRow()
  if (last < 2) return 0
  var hit = sheet.getRange(2, 1, last - 1, 1).createTextFinder(String(email).toLowerCase())
    .matchEntireCell(true).matchCase(false).findNext()
  return hit ? hit.getRow() : 0
}

function readStudentRow(email) {
  var sheet = getStudentsSheet()
  if (!sheet) return null
  var row = findStudentRow(sheet, email)
  return row ? sheet.getRange(row, 1, 1, STUDENT_HEADERS.length).getValues()[0] : null
}

// Changes one student's row under a script lock (two requests at once would add two rows).
// `change(row)` edits the array in place. Returns true when it was saved.
function updateStudent(user, change) {
  try {
    var sheet = getStudentsSheet()
    if (!sheet) return false
    var lock = LockService.getScriptLock()
    lock.waitLock(10000)
    try {
      var email = String(user.email).toLowerCase()
      var rowNumber = findStudentRow(sheet, email)
      var row = rowNumber
        ? sheet.getRange(rowNumber, 1, 1, STUDENT_HEADERS.length).getValues()[0]
        : [email, '', '', '', '', '', istNow(), '', 0, 0, '', '']
      while (row.length < STUDENT_HEADERS.length) row.push('')
      if (user.name) row[STUDENT_COL.name] = user.name
      change(row)
      row = row.map(function (value, i) {
        if (typeof value === 'number' || value instanceof Date) return value
        // The ISO time stays text ("'" prefix), or Sheets would turn it into a date.
        return i === STUDENT_COL.savedAt && value ? "'" + value : studentCell(value)
      })
      if (rowNumber) sheet.getRange(rowNumber, 1, 1, row.length).setValues([row])
      else sheet.appendRow(row)
      return true
    } finally {
      lock.releaseLock()
    }
  } catch (err) {
    rememberLogError(err)
    return false
  }
}

// Like cellText, but long enough for the electives JSON.
function studentCell(value) {
  var text = value === undefined || value === null ? '' : String(value).slice(0, 1000)
  return /^[=+\-@]/.test(text) ? "'" + text : text
}

function deviceLabel(client) {
  client = client && typeof client === 'object' ? client : {}
  return [client.device, client.browser, client.os].filter(Boolean).join(' · ')
}

// After a sign-in.
function recordSignIn(user, client) {
  updateStudent(user, function (row) {
    row[STUDENT_COL.signIns] = (Number(row[STUDENT_COL.signIns]) || 0) + 1
    row[STUDENT_COL.lastSeen] = istNow()
    var device = deviceLabel(client)
    if (device) row[STUDENT_COL.device] = device
  })
}

// After a file was opened.
function recordFileOpen(user, client) {
  updateStudent(user, function (row) {
    row[STUDENT_COL.opens] = (Number(row[STUDENT_COL.opens]) || 0) + 1
    row[STUDENT_COL.lastSeen] = istNow()
    var device = deviceLabel(client)
    if (device) row[STUDENT_COL.device] = device
  })
}

// The course is the start of the semester id: "BCA-Sem-V" -> "BCA".
function courseOf(semester) {
  return String(semester || '').split('-')[0]
}

function writeStudy(user, study) {
  return updateStudent(user, function (row) {
    row[STUDENT_COL.course] = courseOf(study.semester)
    row[STUDENT_COL.semester] = study.semester
    row[STUDENT_COL.electives] = JSON.stringify(study.electives || {})
    row[STUDENT_COL.savedAt] = study.updatedAt || ''
    row[STUDENT_COL.lastSeen] = istNow()
  })
}

// The saved choice from a Students row, or null.
function studyFromRow(row) {
  if (!row || !row[STUDENT_COL.semester]) return null
  var electives = {}
  try {
    electives = JSON.parse(row[STUDENT_COL.electives] || '{}')
  } catch (err) {}
  var savedAt = row[STUDENT_COL.savedAt]
  return {
    semester: String(row[STUDENT_COL.semester]),
    electives: electives,
    updatedAt: savedAt instanceof Date ? savedAt.toISOString() : String(savedAt || ''),
  }
}

// ---------- Phone number (optional) ----------
// Spaces and dashes are dropped; a bare 10-digit number is taken as Indian (+91). Otherwise it must be
// "+" and 8–15 digits. Empty clears it. Same rule as the app (src/lib/phone.js).
function cleanPhone(phone) {
  var text = String(phone || '').replace(/[\s-]/g, '')
  if (!text) return ''
  if (/^\d{10}$/.test(text)) text = '+91' + text
  if (!/^\+\d{8,15}$/.test(text)) throw new Error('invalid_phone')
  return text
}

function saveProfile(user, profile) {
  var phone = cleanPhone(profile && profile.phone)
  if (!updateStudent(user, function (row) { row[STUDENT_COL.phone] = phone })) throw new Error('profile_not_saved')
  return { phone: phone }
}

function getProfile(email) {
  var row = readStudentRow(email)
  return { phone: row ? String(row[STUDENT_COL.phone] || '') : '' }
}

// Run once by hand from the editor after deploying: copies every "study:<email>" property into the
// Students tab (rows that already have a semester are left alone). The properties are kept as a backup.
function migrateStudyToStudents() {
  var props = PropertiesService.getScriptProperties().getProperties()
  var copied = 0
  Object.keys(props).forEach(function (key) {
    if (key.indexOf(STUDY_PREFIX) !== 0) return
    var email = key.slice(STUDY_PREFIX.length)
    var study = JSON.parse(props[key])
    var saved = updateStudent({ email: email }, function (row) {
      if (row[STUDENT_COL.semester]) return
      row[STUDENT_COL.course] = courseOf(study.semester)
      row[STUDENT_COL.semester] = study.semester
      row[STUDENT_COL.electives] = JSON.stringify(study.electives || {})
      row[STUDENT_COL.savedAt] = study.updatedAt || ''
    })
    if (saved) copied++
  })
  Logger.log('Copied ' + copied + ' saved choices to the Students tab.')
}
