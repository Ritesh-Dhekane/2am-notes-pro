// TASK-005: verifies a Google ID token server-side before granting access.
// This is the real authorization boundary — the frontend's client-side
// decode (src/lib/jwt.js) is display-only and must never be trusted alone.

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

// ---------- 7-day sessions ----------
// A Google ID token lasts an hour. On sign-in the token is checked once (above) and the app gets its
// own session instead: "<payload>.<HMAC-SHA256 signature>", signed with SESSION_SECRET (a script
// property created on first use), valid for SESSION_DAYS. It also saves a call to Google per request.
// To sign everyone out, delete SESSION_SECRET. To block someone, add their email to BLOCKED_EMAILS
// (comma-separated script property; admins can do it from the admin portal, see adminBlock); it applies
// on their next request, since authenticate checks it every time.

var SESSION_DAYS = 7

function sessionSecret() {
  var props = PropertiesService.getScriptProperties()
  var secret = props.getProperty('SESSION_SECRET')
  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid()
    props.setProperty('SESSION_SECRET', secret)
  }
  return secret
}

function webSafe(bytesOrText) {
  return Utilities.base64EncodeWebSafe(bytesOrText).replace(/=+$/, '')
}

function signSession(body) {
  return webSafe(Utilities.computeHmacSha256Signature(body, sessionSecret()))
}

function issueSession(claims) {
  var payload = {
    email: claims.email,
    name: claims.name,
    given_name: claims.given_name,
    picture: claims.picture,
    exp: Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60,
  }
  var body = webSafe(Utilities.newBlob(JSON.stringify(payload)).getBytes())
  return body + '.' + signSession(body)
}

function verifySession(token) {
  var parts = token.split('.')
  if (parts.length !== 2 || signSession(parts[0]) !== parts[1]) throw new Error('invalid_or_expired_token')
  var padded = parts[0] + '===='.slice(parts[0].length % 4 || 4)
  var claims = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(padded)).getDataAsString('UTF-8'))
  if (!claims.exp || claims.exp * 1000 < Date.now()) throw new Error('invalid_or_expired_token')
  return claims
}

function isBlocked(email) {
  var list = PropertiesService.getScriptProperties().getProperty('BLOCKED_EMAILS') || ''
  return list
    .split(',')
    .map(function (e) {
      return e.trim().toLowerCase()
    })
    .indexOf(String(email).toLowerCase()) !== -1
}

// Accepts either a session (two parts) or a Google ID token (three parts).
function authenticate(token) {
  var claims = token.split('.').length === 2 ? verifySession(token) : verifyIdToken(token)
  if (isBlocked(claims.email)) throw new Error('access_blocked')
  return claims
}
