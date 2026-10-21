// Announcements: short notices shown as a banner in the app, set from /admin/announcements. Kept in
// the Script Property ANNOUNCEMENTS, a JSON list (a property holds about 9 KB):
//   { id, text, audience, createdAt, updatedAt, active }
// audience is "all", "course:<ID>" (e.g. "course:MCA") or "semester:<semesterId>" (e.g.
// "semester:MCA-Sem-II"). Text is plain: tags are stripped here and the app shows it as text, never HTML.
// Signed out, only "all" ones are returned (the Welcome page); signed in, those for the student's
// course and semester too.

var ANNOUNCEMENT_MAX_CHARS = 280
var ANNOUNCEMENTS_MAX_CHARS = 8000
var ANNOUNCEMENT_AUDIENCE = /^(all|course:[A-Za-z0-9]{1,20}|semester:[A-Za-z0-9-]{1,80})$/

function readAnnouncements() {
  try {
    var list = JSON.parse(PropertiesService.getScriptProperties().getProperty('ANNOUNCEMENTS') || '[]')
    return Array.isArray(list) ? list : []
  } catch (err) {
    return [] // a broken value shows nothing
  }
}

// The active announcements for a semester id ('' when signed out or not chosen), newest first.
function announcementsFor(semester) {
  semester = String(semester || '')
  var audiences = ['all']
  if (semester) audiences.push('course:' + courseOf(semester), 'semester:' + semester)
  return readAnnouncements()
    .filter(function (a) {
      return a.active && audiences.indexOf(a.audience) !== -1
    })
    .sort(function (a, b) {
      return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0
    })
    .map(function (a) {
      return { id: a.id, text: a.text, audience: a.audience, createdAt: a.createdAt }
    })
}

// Plain text on one paragraph: tags and control characters removed, spaces collapsed.
function cleanAnnouncementText(text) {
  var clean = String(text || '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!clean || clean.length > ANNOUNCEMENT_MAX_CHARS) throw new Error('invalid_announcement')
  return clean
}

// ---------- Admin actions ----------

function adminAnnouncements(user) {
  requireAdmin(user)
  logAdmin(user, 'announcements', '', null)
  return {
    announcements: readAnnouncements().sort(function (a, b) {
      return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0
    }),
  }
}

// params: { id (to edit; none creates one), text, audience, active }. Deactivating keeps it in the list.
function adminAnnouncementSet(user, params) {
  requireAdmin(user)
  params = params || {}
  var audience = String(params.audience || 'all').trim()
  if (!ANNOUNCEMENT_AUDIENCE.test(audience)) throw new Error('invalid_announcement')
  var text = cleanAnnouncementText(params.text)
  var active = params.active !== false
  var now = new Date().toISOString()
  var saved

  var lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    var list = readAnnouncements()
    var id = String(params.id || '')
    var existing = null
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) existing = list[i]
    }
    if (id && !existing) throw new Error('announcement_not_found')
    if (existing) {
      existing.text = text
      existing.audience = audience
      existing.active = active
      existing.updatedAt = now
      saved = existing
    } else {
      saved = { id: 'a' + Date.now().toString(36), text: text, audience: audience, createdAt: now, updatedAt: now, active: active }
      list.push(saved)
    }
    // Over the limit: the oldest inactive ones make room, then it's an error.
    var json = JSON.stringify(list)
    while (json.length > ANNOUNCEMENTS_MAX_CHARS) {
      var oldest = -1
      for (var j = 0; j < list.length; j++) {
        if (!list[j].active && list[j] !== saved && (oldest === -1 || list[j].createdAt < list[oldest].createdAt)) oldest = j
      }
      if (oldest === -1) throw new Error('announcements_too_large')
      list.splice(oldest, 1)
      json = JSON.stringify(list)
    }
    PropertiesService.getScriptProperties().setProperty('ANNOUNCEMENTS', json)
  } finally {
    lock.releaseLock()
  }
  logAdmin(user, existing ? (active ? 'announcement_edit' : 'announcement_deactivate') : 'announcement_create', saved.id, {
    audience: audience,
    active: active,
    text: text.slice(0, 80),
  })
  return saved
}
