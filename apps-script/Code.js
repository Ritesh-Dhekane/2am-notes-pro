// Entry point for the 2am-notes-pro backend web app.
// doGet is a health check. doPost is the API router: `catalog` is public (counts only, no file
// names or ids); every other action requires a verified Google ID token (Auth.js).

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

  if (!body.idToken) {
    return jsonResponse({ authenticated: false, error: 'missing_id_token' })
  }

  var claims
  try {
    claims = verifyIdToken(body.idToken)
  } catch (err) {
    return jsonResponse({ authenticated: false, error: err.message })
  }

  var user = { email: claims.email, name: claims.name, picture: claims.picture }
  var action = body.action || 'verify'

  try {
    switch (action) {
      case 'verify':
        return jsonResponse({ authenticated: true, user: user })
      case 'login':
        logEvent(user, 'login', {}, body.client)
        return jsonResponse({ authenticated: true, user: user })
      case 'logout':
        logEvent(user, 'logout', {}, body.client)
        return jsonResponse({ authenticated: true, user: user })
      case 'listLibrary':
        logEvent(user, 'view_library', { semester: body.semester }, body.client)
        return jsonResponse({ authenticated: true, user: user, subjects: listLibrary(body.semester) })
      case 'getFile':
        var file = getFile(body.fileId)
        logEvent(user, 'file_open', { fileId: file.id, fileName: file.path || file.name, semester: (file.path || '').split('/')[0] }, body.client)
        return jsonResponse({ authenticated: true, user: user, file: file })
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
