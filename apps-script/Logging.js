// Best-effort access log in a private Google Sheet (Script Property LOG_SHEET_ID): who signed in,
// which semester they loaded and which files they opened. Logging must never break the request it's
// attached to, so failures here (missing config, transient Sheets error) are swallowed.

// New columns go on the right, so rows written before them stay aligned.
var LOG_HEADERS = [
  'Time (IST)', 'Email', 'Name', 'Event', 'Semester', 'File', 'Details',
  'Browser', 'OS', 'Device', 'Model', 'Screen', 'Installed app', 'Language', 'Time zone',
]
var CLIENT_FIELDS = ['browser', 'os', 'device', 'model', 'screen', 'installed', 'language', 'timeZone']

// `client` is the device description the app sends (src/lib/device.js); it comes from the browser,
// so it's trimmed and kept from being read as a spreadsheet formula.
function logEvent(user, eventType, details, client) {
  try {
    var sheet = getLogSheet()
    if (!sheet) return
    details = details || {}
    client = client && typeof client === 'object' ? client : {}
    sheet.appendRow(
      [
        Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss'),
        user.email,
        user.name,
        eventType,
        details.semester || '',
        details.fileName || '',
        details.fileId ? JSON.stringify({ fileId: details.fileId }) : '',
      ]
        .concat(CLIENT_FIELDS.map(function (key) { return client[key] }))
        .map(cellText),
    )
  } catch (err) {
    // Swallow — logging is not allowed to break the calling action — but keep the reason for testLog.
    try {
      CacheService.getScriptCache().put('log:lastError', new Date().toISOString() + ' ' + err.message, 21600)
    } catch (ignored) {}
  }
}

// The "Logs" tab, created with a header row the first time.
function getLogSheet() {
  var sheetId = PropertiesService.getScriptProperties().getProperty('LOG_SHEET_ID')
  if (!sheetId) return null
  var spreadsheet = SpreadsheetApp.openById(sheetId)
  var sheet = spreadsheet.getSheetByName('Logs')
  if (!sheet) {
    // A new spreadsheet's one empty tab becomes the log; otherwise add a Logs tab.
    var tabs = spreadsheet.getSheets()
    sheet = tabs.length === 1 && tabs[0].getLastRow() === 0 ? tabs[0].setName('Logs') : spreadsheet.insertSheet('Logs')
  }
  if (sheet.getLastRow() === 0) sheet.appendRow(LOG_HEADERS)
  // Older logs have fewer columns: extend the header row in place.
  if (sheet.getLastColumn() < LOG_HEADERS.length) {
    sheet.getRange(1, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS])
  }
  sheet.setFrozenRows(1)
  sheet.getRange(1, 1, 1, LOG_HEADERS.length).setFontWeight('bold')
  return sheet
}

function cellText(value) {
  var text = value === undefined || value === null ? '' : String(value).slice(0, 200)
  return /^[=+\-@]/.test(text) ? "'" + text : text
}

// Run from the editor after setting LOG_SHEET_ID: writes a test row and reports any problem (unlike
// logEvent, errors here are shown in the execution log).
function testLog() {
  var lastError = CacheService.getScriptCache().get('log:lastError')
  Logger.log('LOG_SHEET_ID: ' + (PropertiesService.getScriptProperties().getProperty('LOG_SHEET_ID') || '(not set)'))
  Logger.log('Last logging error: ' + (lastError || 'none'))
  var sheet = getLogSheet()
  if (!sheet) throw new Error('LOG_SHEET_ID is not set in Project Settings → Script Properties.')
  sheet.appendRow([
    Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss'),
    'test@example.com',
    'Log test',
    'test',
    '',
    '',
    '',
  ])
  Logger.log('Wrote a test row to "' + sheet.getName() + '" in ' + sheet.getParent().getName() + ' (' + sheet.getParent().getUrl() + ')')
}
