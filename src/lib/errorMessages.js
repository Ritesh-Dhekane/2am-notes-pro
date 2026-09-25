// Maps backend error codes (Auth.js/Drive.js) to user-facing copy, so the UI
// never shows a raw code like "server_misconfigured_missing_drive_root".
const FRIENDLY_MESSAGES = {
  invalid_or_expired_token: 'Your session has expired. Please sign in again.',
  token_audience_mismatch: 'Your session is invalid. Please sign in again.',
  missing_id_token: 'You need to sign in to do that.',
  email_not_verified: "This Google account's email isn't verified, so it can't be used here.",
  subject_not_found: "This subject doesn't exist or isn't set up yet.",
  category_not_found: 'No files have been added to this section yet.',
  file_not_accessible: "This file isn't accessible.",
  invalid_category: 'That section is not recognized.',
  subjects_folder_not_found: 'The subjects folder is missing from Drive. See the README (Apps Script Backend).',
  server_misconfigured_missing_client_id:
    "The backend isn't fully configured yet (missing Google client ID). See the README (Apps Script Backend).",
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
