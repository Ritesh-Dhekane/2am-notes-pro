// Entry point for the 2am-notes-pro backend web app.
// doGet is an unauthenticated health check; doPost is the authenticated API
// router — every action requires a verified Google ID token (Auth.js).

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
        logEvent(user, 'login', {})
        return jsonResponse({ authenticated: true, user: user })
      case 'logout':
        logEvent(user, 'logout', {})
        return jsonResponse({ authenticated: true, user: user })
      case 'listSubjects':
        logEvent(user, 'view_home', {})
        return jsonResponse({ authenticated: true, user: user, subjects: listSubjects() })
      case 'listFiles':
        logEvent(user, 'view_subject', { subjectSlug: body.subjectSlug, category: body.category })
        return jsonResponse({
          authenticated: true,
          user: user,
          files: listFiles(body.subjectSlug, body.category),
        })
      case 'getFile':
        var file = getFile(body.fileId)
        logEvent(user, 'file_open', { fileId: file.id, fileName: file.name })
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
