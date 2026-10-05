import { isDemo } from './demoMode.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Deliberately no Content-Type header: Apps Script web apps don't handle the
// CORS preflight (OPTIONS) that "application/json" would trigger. Leaving
// the body as a plain string keeps fetch's default text/plain, which is a
// CORS-safelisted content type and skips preflight entirely.
export async function callApi(action, params = {}) {
  // Dev-only demo data (?demo); the import is dropped from production builds.
  if (import.meta.env.DEV && isDemo()) {
    const { handleDemo } = await import('../dev/demo.js')
    return handleDemo(action, params)
  }

  if (!API_BASE_URL) {
    throw new Error('missing_api_base_url')
  }

  let response
  try {
    response = await fetch(API_BASE_URL, {
      method: 'POST',
      body: JSON.stringify({ action, ...params }),
    })
  } catch {
    throw new Error('network_error')
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const data = await response.json()
  if (!data.authenticated) {
    throw new Error(data.error || 'not_authenticated')
  }
  if (data.error) {
    throw new Error(data.error)
  }

  return data
}
