// TASK-005: verifies a Google ID token server-side before granting access.
// This is the real authorization boundary — the frontend's client-side
// decode (src/lib/jwt.js) is display-only and must never be trusted alone.

function doPost(e) {
  var body
  try {
    body = JSON.parse(e.postData.contents)
  } catch (err) {
    return jsonResponse({ authenticated: false, error: 'invalid_request' })
  }

  var idToken = body.idToken
  if (!idToken) {
    return jsonResponse({ authenticated: false, error: 'missing_id_token' })
  }

  try {
    var claims = verifyIdToken(idToken)
    return jsonResponse({
      authenticated: true,
      user: {
        email: claims.email,
        name: claims.name,
        picture: claims.picture,
      },
    })
  } catch (err) {
    return jsonResponse({ authenticated: false, error: err.message })
  }
}

function verifyIdToken(idToken) {
  var response = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
    { muteHttpExceptions: true }
  )

  if (response.getResponseCode() !== 200) {
    throw new Error('invalid_or_expired_token')
  }

  var claims = JSON.parse(response.getContentText())

  var expectedClientId = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID')
  if (!expectedClientId) {
    throw new Error('server_misconfigured_missing_client_id')
  }
  if (claims.aud !== expectedClientId) {
    throw new Error('token_audience_mismatch')
  }

  var emailVerified = claims.email_verified === true || claims.email_verified === 'true'
  if (!emailVerified) {
    throw new Error('email_not_verified')
  }

  return claims
}
