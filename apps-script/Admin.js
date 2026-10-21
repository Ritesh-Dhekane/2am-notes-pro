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
