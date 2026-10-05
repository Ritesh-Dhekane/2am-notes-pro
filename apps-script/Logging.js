// Best-effort access log in a private Google Sheet (Script Property LOG_SHEET_ID): who signed in,
// which semester they loaded and which files they opened. Logging must never break the request it's
// attached to, so failures here (missing config, transient Sheets error) are swallowed.

var LOG_HEADERS = ['Time (IST)', 'Email', 'Name', 'Event', 'Semester', 'File', 'Details']

function logEvent(user, eventType, details) {
  try {
    var sheet = getLogSheet()
    if (!sheet) return
    details = details || {}
    sheet.appendRow([
      Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss'),
      user.email,
      user.name,
      eventType,
      details.semester || '',
      details.fileName || '',
      details.fileId ? JSON.stringify({ fileId: details.fileId }) : '',
    ])
  } catch (err) {
    // Swallow — logging is not allowed to break the calling action.
  }
}

// The "Logs" tab, created with a header row the first time.
function getLogSheet() {
  var sheetId = PropertiesService.getScriptProperties().getProperty('LOG_SHEET_ID')
  if (!sheetId) return null
  var spreadsheet = SpreadsheetApp.openById(sheetId)
  var sheet = spreadsheet.getSheetByName('Logs') || spreadsheet.insertSheet('Logs')
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(LOG_HEADERS)
    sheet.setFrozenRows(1)
    sheet.getRange(1, 1, 1, LOG_HEADERS.length).setFontWeight('bold')
  }
  return sheet
}

// Run from the editor after setting LOG_SHEET_ID: writes a test row, so you can see it works.
function testLog() {
  logEvent({ email: 'test@example.com', name: 'Log test' }, 'test', { semester: 'MCA-Sem-III' })
  Logger.log(getLogSheet() ? 'Wrote a test row to the Logs tab.' : 'LOG_SHEET_ID is not set.')
}
