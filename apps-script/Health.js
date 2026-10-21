// /admin/health: whether the backend's background jobs and storage are fine, in one request. Each part
// is read on its own, so one broken part still shows the rest.

var PROPERTY_LIMIT_CHARS = 9000 // a Script Property holds about 9 KB

function adminHealth(user) {
  requireAdmin(user)
  logAdmin(user, 'health', '', null)
  var props = PropertiesService.getScriptProperties().getProperties()
  var cache = CacheService.getScriptCache()
  var health = {
    version: BACKEND_VERSION,
    time: new Date().toISOString(),
    lastError: cache.get('log:lastError') || '',
    cache: { refreshedAt: props.CACHE_REFRESHED_AT || '', catalogCached: false },
    triggers: { refreshCaches: false, checkFlags: false, error: '' },
    flags: { checkedAt: props.FLAG_CHECKED_AT || '', cursor: Number(props.FLAG_CURSOR) || 0 },
    sheets: { configured: Boolean(props.LOG_SHEET_ID), error: '' },
    properties: {
      limit: PROPERTY_LIMIT_CHARS,
      announcements: propertySize(props.ANNOUNCEMENTS, function (value) {
        return value.length
      }),
      visibility: propertySize(props.VISIBILITY, function (value) {
        return VISIBILITY_LISTS.reduce(function (sum, key) {
          return sum + (Array.isArray(value[key]) ? value[key].length : 0)
        }, 0)
      }),
      blocked: listCount(props.BLOCKED_EMAILS),
      admins: listCount(props.ADMIN_EMAILS),
    },
  }

  try {
    health.cache.catalogCached = cache.get('catalog') !== null
  } catch (err) {}

  try {
    ScriptApp.getProjectTriggers().forEach(function (trigger) {
      var handler = trigger.getHandlerFunction()
      if (handler === 'refreshCaches' || handler === 'checkFlags') health.triggers[handler] = true
    })
  } catch (err) {
    health.triggers.error = err.message
  }

  // Data rows (without the header) of each tab, or null when the tab doesn't exist yet.
  try {
    var spreadsheet = getLogSpreadsheet()
    var tabs = { students: 'Students', logs: 'Logs', flags: 'Flags', adminLog: 'Admin log', blocks: 'Blocks' }
    if (spreadsheet) {
      Object.keys(tabs).forEach(function (key) {
        var sheet = spreadsheet.getSheetByName(tabs[key])
        health.sheets[key] = sheet ? Math.max(0, sheet.getLastRow() - 1) : null
      })
    }
  } catch (err) {
    health.sheets.error = err.message
  }
  return health
}

// { chars, items } of a JSON property; items is null when it doesn't parse.
function propertySize(text, count) {
  text = text || ''
  var items = 0
  try {
    items = text ? count(JSON.parse(text)) : 0
  } catch (err) {
    items = null
  }
  return { chars: text.length, items: items }
}

function listCount(text) {
  return String(text || '')
    .split(',')
    .filter(function (item) {
      return item.trim()
    }).length
}
