// Bot and misuse flags. checkFlags runs every hour (installFlagTrigger, run once from the editor) and
// reads the Logs rows added since its last run; the row it stopped at is the Script Property
// FLAG_CURSOR. Anything suspicious goes to the "Flags" tab for an admin to review at /admin/flags.
// Flags never block anyone by themselves: an admin dismisses them or blocks the student (adminBlock).

// Every threshold, in one place. Raise a number if a rule flags real students.
var FLAG_RULES = {
  burstMinute: 12, // more than this many file opens within one minute
  burstHour: 120, // more than this many file opens within one hour
  bulkShare: 0.8, // opened at least this share of a subject's (or semester's) files…
  bulkMinFiles: 10, // …and at least this many of them…
  bulkWindowMinutes: 30, // …within this many minutes
  devices: 4, // more than this many device/browser/OS combinations…
  devicesDays: 7, // …within this many days
  timingMinEvents: 10, // regular timing: at least this many file opens in a row…
  timingMaxSpread: 0.1, // …whose gaps vary by less than this share of the average gap…
  timingMaxGapSeconds: 300, // …when the average gap is at most this long
  lookbackRows: 5000, // earlier rows read with the new ones, for the rules that look back in time
  maxRowsPerRun: 20000, // new rows read per run; the rest wait for the next run
  firstRunRows: 2000, // with no FLAG_CURSOR yet, only this many of the newest rows are checked
  dedupeHours: 24, // no second open flag for the same email and rule within this many hours
}

// Headless browsers and scripts. The app marks automated browsers itself (src/lib/device.js), and a
// script calling the backend directly sends no device description at all.
var AUTOMATION_MARKERS = /headless|puppeteer|playwright|selenium|webdriver|phantomjs|python-requests|python-urllib|aiohttp|curl|wget|scrapy|httpclient|okhttp|go-http|postman/i

var FLAG_HEADERS = ['Time (IST)', 'Email', 'Rule', 'Evidence', 'Status', 'Reviewed by', 'Reviewed at']
var FLAG_COL = { time: 0, email: 1, rule: 2, evidence: 3, status: 4, reviewedBy: 5, reviewedAt: 6 }
var FLAG_STATUSES = ['open', 'dismissed', 'blocked']

function getFlagsSheet() {
  return getTab('Flags', FLAG_HEADERS)
}

// Run once from the editor: checks for flags every hour.
function installFlagTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'checkFlags') ScriptApp.deleteTrigger(trigger)
  })
  ScriptApp.newTrigger('checkFlags').timeBased().everyHours(1).create()
}

function checkFlags() {
  var lock = LockService.getScriptLock()
  if (!lock.tryLock(1000)) return // the previous run is still going
  try {
    var sheet = getLogSheet()
    if (!sheet) return
    var props = PropertiesService.getScriptProperties()
    var lastRow = sheet.getLastRow()
    var stored = props.getProperty('FLAG_CURSOR')
    var cursor = stored === null ? Math.max(1, lastRow - FLAG_RULES.firstRunRows) : Number(stored) || 1
    if (cursor > lastRow) cursor = 1 // the log was cleared
    if (cursor >= lastRow) return
    var end = Math.min(lastRow, cursor + FLAG_RULES.maxRowsPerRun)
    var start = Math.max(2, cursor + 1 - FLAG_RULES.lookbackRows)
    var entries = sheet.getRange(start, 1, end - start + 1, LOG_WIDTH).getValues().map(function (row, i) {
      var entry = logEntry(row)
      entry.row = start + i
      entry.ms = istMillis(entry.time)
      return entry
    })

    // Everyone with a new row, with all of their rows read (oldest first).
    var byEmail = {}
    entries.forEach(function (entry) {
      if (entry.email && entry.event !== 'test') (byEmail[entry.email] = byEmail[entry.email] || []).push(entry)
    })
    var found = []
    Object.keys(byEmail).forEach(function (email) {
      var list = byEmail[email]
      if (list[list.length - 1].row <= cursor || isBlocked(email)) return
      list.sort(function (a, b) {
        return a.ms - b.ms || a.row - b.row
      })
      var rules = [burstFlag, bulkFlag, devicesFlag, automationFlag, timingFlag]
      rules.forEach(function (rule) {
        var flag = rule(list, cursor)
        if (flag) found.push({ email: email, rule: flag.rule, evidence: flag.evidence })
      })
    })
    if (found.length) addFlags(found)
    props.setProperty('FLAG_CURSOR', String(end))
  } finally {
    lock.releaseLock()
  }
}

function isFileOpen(entry) {
  return entry.event === 'file_open' && entry.file
}

// More than burstMinute opens in a minute, or burstHour in an hour, ending at a new row.
function burstFlag(list, cursor) {
  var opens = list.filter(isFileOpen)
  var windows = [
    { ms: 60 * 1000, max: FLAG_RULES.burstMinute, label: '1 minute' },
    { ms: 60 * 60 * 1000, max: FLAG_RULES.burstHour, label: '1 hour' },
  ]
  for (var w = 0; w < windows.length; w++) {
    var first = 0
    for (var i = 0; i < opens.length; i++) {
      while (opens[i].ms - opens[first].ms >= windows[w].ms) first++
      var count = i - first + 1
      if (count > windows[w].max && opens[i].row > cursor) {
        return { rule: 'burst', evidence: count + ' file opens in ' + windows[w].label + ' (to ' + opens[i].time + ')' }
      }
    }
  }
  return null
}

// File totals per subject and per semester, from the catalog.
var catalogTotals_ = null
function catalogTotals() {
  if (catalogTotals_) return catalogTotals_
  catalogTotals_ = {}
  getCatalog().forEach(function (semester) {
    semester.subjects.forEach(function (subject) {
      var files = Object.keys(subject.counts || {}).reduce(function (sum, c) { return sum + subject.counts[c] }, 0)
      catalogTotals_[semester.id + '/' + subject.slug] = files
      catalogTotals_[semester.id] = (catalogTotals_[semester.id] || 0) + files
    })
  })
  return catalogTotals_
}

// Most of a subject's or a semester's files opened within bulkWindowMinutes, ending at a new row.
function bulkFlag(list, cursor) {
  var opens = list.filter(isFileOpen)
  var totals = catalogTotals()
  var windowMs = FLAG_RULES.bulkWindowMinutes * 60 * 1000
  var first = 0
  for (var i = 0; i < opens.length; i++) {
    while (opens[i].ms - opens[first].ms > windowMs) first++
    if (opens[i].row <= cursor || i - first + 1 < FLAG_RULES.bulkMinFiles) continue
    var distinct = {}
    for (var j = first; j <= i; j++) {
      var subject = subjectKey(opens[j].file)
      if (!subject) continue
      distinct[subject] = distinct[subject] || {}
      distinct[subject][opens[j].file] = true
      var semester = subject.split('/')[0]
      distinct[semester] = distinct[semester] || {}
      distinct[semester][opens[j].file] = true
    }
    var keys = Object.keys(distinct)
    for (var k = 0; k < keys.length; k++) {
      var opened = Object.keys(distinct[keys[k]]).length
      var total = totals[keys[k]] || 0
      if (total && opened >= FLAG_RULES.bulkMinFiles && opened / total >= FLAG_RULES.bulkShare) {
        return {
          rule: 'bulk',
          evidence: opened + ' of ' + total + ' files in ' + keys[k] + ' within ' + FLAG_RULES.bulkWindowMinutes + ' min (to ' + opens[i].time + ')',
        }
      }
    }
  }
  return null
}

// More than `devices` device/browser/OS combinations in devicesDays, the newest first seen in a new row.
function devicesFlag(list, cursor) {
  var since = list[list.length - 1].ms - FLAG_RULES.devicesDays * DAY_MS
  var seen = {}
  var order = []
  list.forEach(function (entry) {
    if (entry.ms < since || !(entry.device || entry.browser || entry.os)) return
    var combo = [entry.device, entry.browser, entry.os].join(' · ')
    if (seen[combo]) return
    seen[combo] = entry.row
    order.push(combo)
  })
  if (order.length <= FLAG_RULES.devices || seen[order[order.length - 1]] <= cursor) return null
  return {
    rule: 'devices',
    evidence: order.length + ' devices in ' + FLAG_RULES.devicesDays + ' days: ' + order.slice(-3).join('; ') + (order.length > 3 ? '…' : ''),
  }
}

// A new row whose Browser, OS or Model names a headless browser or script, or a file open without any
// device description (not sent by the app).
function automationFlag(list, cursor) {
  for (var i = list.length - 1; i >= 0 && list[i].row > cursor; i--) {
    var entry = list[i]
    var text = [entry.browser, entry.os, entry.model].join(' ')
    var match = text.match(AUTOMATION_MARKERS)
    if (match) return { rule: 'automation', evidence: '"' + match[0] + '" in ' + text.trim() + ' (' + entry.time + ')' }
    if (isFileOpen(entry) && !entry.browser && !entry.os && !entry.device) {
      return { rule: 'automation', evidence: 'File opened without device details, not from the app (' + entry.time + ')' }
    }
  }
  return null
}

// timingMinEvents file opens in a row, ending at a new row, with almost equal gaps between them.
function timingFlag(list, cursor) {
  var opens = list.filter(isFileOpen)
  var n = FLAG_RULES.timingMinEvents
  for (var i = opens.length - 1; i >= n - 1 && opens[i].row > cursor; i--) {
    var gaps = []
    for (var j = i - n + 2; j <= i; j++) gaps.push((opens[j].ms - opens[j - 1].ms) / 1000)
    var mean = gaps.reduce(function (sum, g) { return sum + g }, 0) / gaps.length
    if (!mean || mean > FLAG_RULES.timingMaxGapSeconds) continue
    var spread = Math.sqrt(gaps.reduce(function (sum, g) { return sum + (g - mean) * (g - mean) }, 0) / gaps.length)
    if (spread / mean < FLAG_RULES.timingMaxSpread) {
      return {
        rule: 'timing',
        evidence: n + ' opens about ' + mean.toFixed(1) + ' s apart (± ' + spread.toFixed(1) + ' s, to ' + opens[i].time + ')',
      }
    }
  }
  return null
}

// Appends flags, skipping any email + rule with an open flag from the last dedupeHours.
function addFlags(found) {
  var sheet = getFlagsSheet()
  if (!sheet) return
  var since = Date.now() - FLAG_RULES.dedupeHours * 60 * 60 * 1000
  var recent = {}
  readFlagRows(sheet).forEach(function (flag) {
    if (flag.status === 'open' && istMillis(flag.time) >= since) recent[flag.email + '|' + flag.rule] = true
  })
  var time = istNow()
  var rows = found
    .filter(function (flag) {
      return !recent[flag.email + '|' + flag.rule]
    })
    .map(function (flag) {
      return [time, flag.email, flag.rule, flag.evidence, 'open', '', ''].map(cellText)
    })
  if (rows.length) sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, FLAG_HEADERS.length).setValues(rows)
}

// Every flag, with its sheet row number (the id adminFlagUpdate takes).
function readFlagRows(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return []
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, FLAG_HEADERS.length).getValues().map(function (row, i) {
    return {
      row: i + 2,
      time: cellTime(row[FLAG_COL.time]),
      email: String(row[FLAG_COL.email]).toLowerCase(),
      rule: String(row[FLAG_COL.rule]),
      evidence: String(row[FLAG_COL.evidence]),
      status: String(row[FLAG_COL.status]) || 'open',
      reviewedBy: String(row[FLAG_COL.reviewedBy]),
      reviewedAt: cellTime(row[FLAG_COL.reviewedAt]),
    }
  })
}

// One student's flags, newest first (the student page).
function flagsFor(email) {
  return readFlagRows(getFlagsSheet())
    .filter(function (flag) {
      return flag.email === email
    })
    .reverse()
}

// ---------- Admin actions ----------

var FLAGS_LIMIT = 500

// params: { status ('' for all), email, badge }. Newest first, with the count per status. `badge` is
// the admin nav's count, which isn't written to the Admin log.
function adminFlags(user, params) {
  requireAdmin(user)
  params = params || {}
  var status = FLAG_STATUSES.indexOf(params.status) !== -1 ? params.status : ''
  var email = String(params.email || '').trim().toLowerCase()
  if (!params.badge) logAdmin(user, 'flags', email, status ? { status: status } : null)
  var all = readFlagRows(getFlagsSheet()).reverse()
  var counts = { open: 0, dismissed: 0, blocked: 0 }
  all.forEach(function (flag) {
    if (counts[flag.status] !== undefined) counts[flag.status]++
  })
  var list = all.filter(function (flag) {
    return (!status || flag.status === status) && (!email || flag.email === email)
  })
  return { flags: params.badge ? [] : list.slice(0, FLAGS_LIMIT), total: list.length, counts: counts }
}

// params: { row, status }: dismiss a flag, or open it again.
function adminFlagUpdate(user, params) {
  requireAdmin(user)
  params = params || {}
  var status = params.status === 'open' ? 'open' : params.status === 'dismissed' ? 'dismissed' : ''
  var sheet = getFlagsSheet()
  var row = Math.floor(Number(params.row))
  if (!status || !sheet || !(row >= 2 && row <= sheet.getLastRow())) throw new Error('flag_not_found')
  setFlagStatus(sheet, [row], status, user)
  var flag = readFlagRows(sheet)[row - 2]
  logAdmin(user, 'flag_' + status, flag.email, { row: row, rule: flag.rule })
  return flag
}

function setFlagStatus(sheet, rows, status, user) {
  var time = istNow()
  rows.forEach(function (row) {
    sheet.getRange(row, FLAG_COL.status + 1, 1, 3).setValues([[status, user.email, time]])
  })
}
