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
  sign_in_required: 'Sign in (free) to read this.',
  access_blocked: 'Your access has been blocked. Contact the portal owner.',
  not_admin: "This account isn't an admin.",
  student_not_found: 'No student with this email has signed in.',
  flag_not_found: 'This flag no longer exists. Reload the list.',
  reason_required: 'Write a reason first.',
  coming_soon: 'This subject is coming soon. Check back later.',
  visibility_too_large: 'Too many hidden items to save. Hide whole subjects instead of single files.',
  invalid_email: "That isn't a valid email address.",
  cannot_block_self: "You can't block your own account.",
  invalid_announcement: 'Write the announcement as plain text, up to 280 characters.',
  announcement_not_found: 'This announcement no longer exists. Reload the list.',
  announcements_too_large: 'Too many active announcements to save. Deactivate a few first.',
  invalid_phone: 'Enter a 10-digit number, or + and your country code.',
  invalid_birthday: 'Enter a real date: your age must be between 15 and 80.',
  profile_not_saved: "Couldn't save right now. Please try again.",
  server_misconfigured_missing_drive_root:
    "The backend isn't fully configured yet (missing Drive root folder). See the README (Apps Script Backend).",
}

// A session-invalid error means the stored credential can no longer be
// trusted — the caller should log out rather than show an error banner.
const SESSION_ERROR_CODES = new Set(['invalid_or_expired_token', 'token_audience_mismatch', 'access_blocked'])

export function isSessionError(code) {
  return SESSION_ERROR_CODES.has(code)
}

// Why a session error signs the student out, for the sign-in page: blocked, or just expired.
export function signOutReason(code) {
  return code === 'access_blocked' ? 'blocked' : 'expired'
}

export function friendlyError(code) {
  return FRIENDLY_MESSAGES[code] || code || 'Something went wrong.'
}
