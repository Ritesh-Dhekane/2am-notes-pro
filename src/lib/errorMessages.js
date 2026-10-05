// Maps backend error codes (Auth.js/Drive.js) to user-facing copy, so the UI
// never shows a raw code like "server_misconfigured_missing_drive_root".
const FRIENDLY_MESSAGES = {
  invalid_or_expired_token: 'Your session has expired. Please sign in again.',
  token_audience_mismatch: 'Your session is invalid. Please sign in again.',
  missing_id_token: 'You need to sign in to do that.',
  email_not_verified: "This Google account's email isn't verified, so it can't be used here.",
  file_not_accessible: "This file isn't accessible.",
  missing_file_id: "This file isn't accessible.",
  semester_not_found:
    "Your semester's folder isn't in Drive yet. Pick another semester in Profile & Settings, or check the Drive layout in the README.",
  missing_semester: 'Choose your semester in Profile & Settings.',
  server_misconfigured_missing_client_id:
    "The backend isn't fully configured yet (missing Google client ID). See the README (Apps Script Backend).",
  missing_api_base_url: "The app isn't connected to its backend yet (VITE_API_BASE_URL is not set).",
  network_error: "Couldn't reach the server. Check your internet connection and try again.",
  unknown_action: 'The backend is out of date. Redeploy the Apps Script (see the README).',
  not_authenticated: 'You need to sign in to do that.',
  server_misconfigured_missing_drive_root:
    "The backend isn't fully configured yet (missing Drive root folder). See the README (Apps Script Backend).",
}

// A session-invalid error means the stored credential can no longer be
// trusted — the caller should log out rather than show an error banner.
const SESSION_ERROR_CODES = new Set(['invalid_or_expired_token', 'token_audience_mismatch'])

export function isSessionError(code) {
  return SESSION_ERROR_CODES.has(code)
}

export function friendlyError(code) {
  return FRIENDLY_MESSAGES[code] || code || 'Something went wrong.'
}
