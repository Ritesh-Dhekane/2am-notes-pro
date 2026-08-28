// TASK-010: best-effort access logging to a Google Sheet.
// Logging must never break the request it's attached to, so failures here
// (missing config, transient Sheets error) are swallowed rather than thrown.

function logEvent(user, eventType, details) {
  try {
    var sheet = getLogSheet()
    if (!sheet) return
    sheet.appendRow([
      new Date().toISOString(),
      user.email,
      user.name,
      eventType,
      JSON.stringify(details || {}),
    ])
  } catch (err) {
    // Swallow — logging is not allowed to break the calling action.
  }
}

function getLogSheet() {
  var sheetId = PropertiesService.getScriptProperties().getProperty('LOG_SHEET_ID')
  if (!sheetId) return null
  var spreadsheet = SpreadsheetApp.openById(sheetId)
  return spreadsheet.getSheetByName('Logs') || spreadsheet.getActiveSheet()
}
