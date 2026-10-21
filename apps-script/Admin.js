// The admin portal (/admin in the app). Admins are listed in the Script Property ADMIN_EMAILS, a
// comma-separated list; set it to dhekaneritesh@gmail.com. Every admin action calls requireAdmin first,
// and is recorded in the "Admin log" tab of the log spreadsheet.

var ADMIN_LOG_HEADERS = ['Time (IST)', 'Admin', 'Action', 'Target', 'Details']

function isAdmin(email) {
  var list = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAILS') || ''
  return Boolean(email) && list
    .split(',')
    .map(function (e) {
      return e.trim().toLowerCase()
    })
    .indexOf(String(email).toLowerCase()) !== -1
}

function requireAdmin(user) {
  if (!user || !isAdmin(user.email)) throw new Error('not_admin')
}

// ---------- Reading the tabs ----------

// Every Students row, as arrays (STUDENT_COL).
function readStudents() {
  var sheet = getStudentsSheet()
  if (!sheet || sheet.getLastRow() < 2) return []
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, STUDENT_HEADERS.length).getValues()
}

// The Logs columns the admin pages use: A Time … F File, J Device, M Installed app. One getValues of A:M
// is faster than a call per column.
var LOG_WIDTH = 13
function logEntry(row) {
  return {
    time: cellTime(row[0]),
    email: String(row[1]).toLowerCase(),
    event: String(row[3]),
    semester: String(row[4]),
    file: String(row[5]),
    browser: String(row[7]),
    os: String(row[8]),
    device: String(row[9]),
    installed: String(row[12]),
  }
}

function readLog() {
  var sheet = getLogSheet()
  if (!sheet || sheet.getLastRow() < 2) return []
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, LOG_WIDTH).getValues().map(logEntry)
}

// "MCA-Sem-III/tableau/notes/unit-01.md" -> "MCA-Sem-III/tableau".
function subjectKey(path) {
  var parts = String(path).split('/')
  return parts.length >= 3 ? parts[0] + '/' + parts[1] : ''
}

// Elective slugs chosen in a Students row.
function electiveSlugs(row) {
  var chosen = []
  try {
    var electives = JSON.parse(row[STUDENT_COL.electives] || '{}')
    Object.keys(electives).forEach(function (group) {
      chosen = chosen.concat(electives[group])
    })
  } catch (err) {}
  return chosen.filter(Boolean)
}

// { key: count } -> [{ <name>: key, count }] sorted by count, at most `limit`.
function topCounts(counts, name, limit) {
  return Object.keys(counts)
    .map(function (key) {
      var item = { count: counts[key] }
      item[name] = key
      return item
    })
    .sort(function (a, b) {
      return b.count - a.count
    })
    .slice(0, limit || 1000)
}

// ---------- Overview ----------

var DAY_MS = 24 * 60 * 60 * 1000
var OVERVIEW_CACHE_SECONDS = 600

// Cached for 10 minutes; `fresh` rebuilds it. Lists are capped so the JSON stays under CacheService's
// 100 KB per value.
function adminOverview(user, fresh) {
  requireAdmin(user)
  logAdmin(user, 'overview', '', fresh ? { fresh: true } : null)
  var cache = CacheService.getScriptCache()
  var hit = fresh ? null : cache.get('admin:overview')
  if (hit) return JSON.parse(hit)
  var overview = buildOverview()
  var text = JSON.stringify(overview)
  if (text.length < 100000) {
    try {
      cache.put('admin:overview', text, OVERVIEW_CACHE_SECONDS)
    } catch (err) {}
  }
  return overview
}

function buildOverview() {
  var now = Date.now()
  var today = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd')

  // Students by course -> semester -> elective.
  var students = readStudents()
  var tree = {}
  students.forEach(function (row) {
    var course = String(row[STUDENT_COL.course] || '') || 'Not chosen'
    var semester = String(row[STUDENT_COL.semester] || '') || 'Not chosen'
    var c = tree[course] = tree[course] || { students: 0, semesters: {} }
    c.students++
    var s = c.semesters[semester] = c.semesters[semester] || { students: 0, electives: {} }
    s.students++
    electiveSlugs(row).forEach(function (slug) {
      s.electives[slug] = (s.electives[slug] || 0) + 1
    })
  })
  var courses = Object.keys(tree).sort().map(function (course) {
    return {
      course: course,
      students: tree[course].students,
      semesters: Object.keys(tree[course].semesters).sort().map(function (semester) {
        var s = tree[course].semesters[semester]
        return { semester: semester, students: s.students, electives: topCounts(s.electives, 'slug') }
      }),
    }
  })

  // One pass over the log.
  var firstSeen = {}
  var lastSeen = {}
  var device = {}
  var installed = {}
  var subjectOpens = {}
  var fileOpens = {}
  readLog().forEach(function (entry) {
    if (!entry.email || entry.event === 'test') return
    var t = istMillis(entry.time)
    if (!firstSeen[entry.email] || entry.time < firstSeen[entry.email]) firstSeen[entry.email] = entry.time
    if (!lastSeen[entry.email] || t > lastSeen[entry.email]) lastSeen[entry.email] = t
    // Rows are in time order, so the last one wins: the student's latest device.
    if (entry.device) device[entry.email] = entry.device
    if (entry.installed) installed[entry.email] = entry.installed
    if (entry.event === 'file_open' && entry.file) {
      fileOpens[entry.file] = (fileOpens[entry.file] || 0) + 1
      var key = subjectKey(entry.file)
      if (key) subjectOpens[key] = (subjectOpens[key] || 0) + 1
    }
  })

  var emails = Object.keys(lastSeen)
  var activeWithin = function (days) {
    return emails.filter(function (email) {
      return now - lastSeen[email] < days * DAY_MS
    }).length
  }
  var activeToday = emails.filter(function (email) {
    return Utilities.formatDate(new Date(lastSeen[email]), 'Asia/Kolkata', 'yyyy-MM-dd') === today
  }).length

  // Sign-ups per day: each email's first log row, for the last 30 days (oldest first).
  var perDay = {}
  Object.keys(firstSeen).forEach(function (email) {
    var day = firstSeen[email].slice(0, 10)
    perDay[day] = (perDay[day] || 0) + 1
  })
  var signUps = []
  for (var i = 29; i >= 0; i--) {
    var day = Utilities.formatDate(new Date(now - i * DAY_MS), 'Asia/Kolkata', 'yyyy-MM-dd')
    signUps.push({ day: day, count: perDay[day] || 0 })
  }

  // Subjects in the catalog with files that nobody has opened.
  var names = {}
  var neverOpened = []
  getCatalog().forEach(function (semester) {
    semester.subjects.forEach(function (subject) {
      var key = semester.id + '/' + subject.slug
      names[key] = subject.name
      var files = Object.keys(subject.counts || {}).reduce(function (sum, c) { return sum + subject.counts[c] }, 0)
      if (files && !subjectOpens[key]) neverOpened.push({ subject: key, name: subject.name, files: files })
    })
  })

  var tally = function (byEmail) {
    var counts = {}
    Object.keys(byEmail).forEach(function (email) {
      counts[byEmail[email]] = (counts[byEmail[email]] || 0) + 1
    })
    return topCounts(counts, 'label')
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      students: students.length,
      activeToday: activeToday,
      active7: activeWithin(7),
      active30: activeWithin(30),
      fileOpens: Object.keys(fileOpens).reduce(function (sum, f) { return sum + fileOpens[f] }, 0),
    },
    courses: courses,
    signUps: signUps,
    topSubjects: topCounts(subjectOpens, 'subject', 15).map(function (s) {
      s.name = names[s.subject] || slugToTitle(s.subject.split('/')[1] || s.subject)
      return s
    }),
    topFiles: topCounts(fileOpens, 'file', 15),
    neverOpened: neverOpened.slice(0, 100),
    devices: tally(device),
    installed: tally(installed),
  }
}

// ---------- Students list ----------

var STUDENTS_PAGE = 25

function studentFromRow(row) {
  var electives = {}
  try {
    electives = JSON.parse(row[STUDENT_COL.electives] || '{}')
  } catch (err) {}
  return {
    email: String(row[STUDENT_COL.email]),
    name: String(row[STUDENT_COL.name]),
    phone: String(row[STUDENT_COL.phone]),
    course: String(row[STUDENT_COL.course]),
    semester: String(row[STUDENT_COL.semester]),
    electives: electives,
    firstSeen: cellTime(row[STUDENT_COL.firstSeen]),
    lastSeen: cellTime(row[STUDENT_COL.lastSeen]),
    signIns: Number(row[STUDENT_COL.signIns]) || 0,
    opens: Number(row[STUDENT_COL.opens]) || 0,
    device: String(row[STUDENT_COL.device]),
  }
}

// params: { query (name, email or phone), course, semester, lastSeenDays, page }. Most recent first.
function adminStudents(user, params) {
  requireAdmin(user)
  params = params || {}
  var query = String(params.query || '').trim().toLowerCase()
  var digits = query.replace(/[\s+-]/g, '')
  var days = Number(params.lastSeenDays) || 0
  var since = Date.now() - days * DAY_MS
  logAdmin(user, 'students', query, { course: params.course, semester: params.semester, lastSeenDays: days })

  var list = readStudents()
    .map(studentFromRow)
    .filter(function (s) {
      if (params.course && s.course !== params.course) return false
      if (params.semester && s.semester !== params.semester) return false
      if (days && istMillis(s.lastSeen) < since) return false
      if (!query) return true
      return s.name.toLowerCase().indexOf(query) !== -1 ||
        s.email.toLowerCase().indexOf(query) !== -1 ||
        (/^\d{3,}$/.test(digits) && s.phone.indexOf(digits) !== -1)
    })
    .sort(function (a, b) {
      return a.lastSeen < b.lastSeen ? 1 : a.lastSeen > b.lastSeen ? -1 : 0
    })

  var pages = Math.max(1, Math.ceil(list.length / STUDENTS_PAGE))
  var page = Math.min(Math.max(1, Math.floor(Number(params.page) || 1)), pages)
  return {
    students: list.slice((page - 1) * STUDENTS_PAGE, page * STUDENTS_PAGE),
    total: list.length,
    page: page,
    pages: pages,
  }
}

// Best effort, like logEvent.
function logAdmin(user, action, target, details) {
  try {
    var sheet = getTab('Admin log', ADMIN_LOG_HEADERS)
    if (!sheet) return
    sheet.appendRow([istNow(), user.email, action, target || '', details ? JSON.stringify(details) : ''].map(cellText))
  } catch (err) {
    rememberLogError(err)
  }
}
