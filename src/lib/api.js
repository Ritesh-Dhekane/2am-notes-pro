const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Deliberately no Content-Type header: Apps Script web apps don't handle the
// CORS preflight (OPTIONS) that "application/json" would trigger. Leaving
// the body as a plain string keeps fetch's default text/plain, which is a
// CORS-safelisted content type and skips preflight entirely.
export async function callApi(action, params = {}) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not set. See the README (Apps Script Backend).')
  }

  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify({ action, ...params }),
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const data = await response.json()
  if (!data.authenticated) {
    throw new Error(data.error || 'not_authenticated')
  }

  return data
}
