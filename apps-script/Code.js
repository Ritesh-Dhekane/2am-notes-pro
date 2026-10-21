// Entry point for the 2am-notes-pro backend web app.
// doGet is a health check. doPost is the API router. Public: `catalog` (counts, plus each subject's
// Unit 1 notes and one sample PYQ question) and `previewFile` / `previewAsset` (Unit 1 notes only).
// Everything else needs a session or a Google ID token, sent as `idToken` (Auth.js).

function doGet(e) {
  return jsonResponse({
    status: 'ok',
    service: '2am-notes-pro-api',
    timestamp: new Date().toISOString(),
  })
}

function doPost(e) {
  var body
  try {
    body = JSON.parse(e.postData.contents)
  } catch (err) {
    return jsonResponse({ authenticated: false, error: 'invalid_request' })
  }

  if (body.action === 'catalog') {
    try {
      return jsonResponse({ authenticated: false, semesters: getCatalog() })
    } catch (err) {
      return jsonResponse({ authenticated: false, error: err.message })
    }
  }

  if (body.action === 'previewFile' || body.action === 'previewAsset') {
    try {
      return jsonResponse(
        body.action === 'previewFile'
          ? { authenticated: false, file: getFile(body.fileId, true) }
          : { authenticated: false, asset: getAsset(body.fileId, body.path, true) }
      )
    } catch (err) {
      return jsonResponse({ authenticated: false, error: err.message })
    }
  }

  if (!body.idToken) {
    return jsonResponse({ authenticated: false, error: 'missing_id_token' })
  }

  var claims
  try {
    claims = authenticate(body.idToken)
  } catch (err) {
    return jsonResponse({ authenticated: false, error: err.message })
  }

  var user = { email: claims.email, name: claims.name, picture: claims.picture }
  var action = body.action || 'verify'

  try {
    switch (action) {
      case 'verify':
        return jsonResponse({ authenticated: true, user: user, isAdmin: isAdmin(user.email) })
      case 'login':
        logEvent(user, 'login', {}, body.client)
        recordSignIn(user, body.client)
        return jsonResponse({ authenticated: true, user: user, session: issueSession(claims), isAdmin: isAdmin(user.email) })
      case 'getStudy':
        return jsonResponse({ authenticated: true, user: user, study: getStudy(user.email) })
      case 'saveStudy':
        var saved = saveStudy(user, body.study)
        logEvent(user, 'save_study', { semester: saved.semester }, body.client)
        return jsonResponse({ authenticated: true, user: user, study: saved })
      case 'getProfile':
        return jsonResponse({ authenticated: true, user: user, profile: getProfile(user.email) })
      case 'saveProfile':
        return jsonResponse({ authenticated: true, user: user, profile: saveProfile(user, { phone: body.phone }) })
      case 'adminOverview':
        return jsonResponse({ authenticated: true, user: user, overview: adminOverview(user, body.fresh) })
      case 'adminStudents':
        return jsonResponse(Object.assign({ authenticated: true, user: user }, adminStudents(user, body)))
      case 'adminStudent':
        return jsonResponse(Object.assign({ authenticated: true, user: user }, adminStudent(user, body)))
      case 'logout':
        logEvent(user, 'logout', {}, body.client)
        return jsonResponse({ authenticated: true, user: user })
      case 'listLibrary':
        logEvent(user, 'view_library', { semester: body.semester }, body.client)
        return jsonResponse({ authenticated: true, user: user, subjects: listLibrary(body.semester) })
      case 'getFile':
        var file = getFile(body.fileId)
        if (!body.prefetch) {
          logEvent(user, 'file_open', { fileId: file.id, fileName: file.path || file.name, semester: (file.path || '').split('/')[0] }, body.client)
          recordFileOpen(user, body.client)
        }
        return jsonResponse({ authenticated: true, user: user, file: file })
      case 'getAsset':
        return jsonResponse({ authenticated: true, user: user, asset: getAsset(body.fileId, body.path) })
      default:
        return jsonResponse({ authenticated: true, user: user, error: 'unknown_action' })
    }
  } catch (err) {
    return jsonResponse({ authenticated: true, user: user, error: err.message })
  }
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
}
