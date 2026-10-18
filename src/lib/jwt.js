// Client-side decode only, for displaying profile info in the UI.
// This is NOT verification — the real credential must be validated
// server-side (Apps Script, TASK-005) before any access is granted.
// Takes a Google ID token (header.payload.signature) or the backend's own session (payload.signature).
export function decodeJwtPayload(token) {
  const parts = token.split('.')
  const payload = parts.length === 2 ? parts[0] : parts[1]
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  )
  return JSON.parse(json)
}
