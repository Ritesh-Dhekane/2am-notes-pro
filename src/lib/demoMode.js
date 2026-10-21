// Development only: open the app with ?demo to use built-in sample data instead of Google sign-in
// and the Apps Script backend (src/dev/demo.js). Production builds always return false.

const KEY = 'notes-pro.demo'
// The demo account is an admin; ?demo=student tries the app as a student instead.
export const DEMO_ROLE_KEY = 'notes-pro.demo-role'

export function isDemo() {
  if (!import.meta.env.DEV) return false
  try {
    const param = new URLSearchParams(window.location.search).get('demo')
    if (param !== null) {
      sessionStorage.setItem(KEY, '1')
      sessionStorage.setItem(DEMO_ROLE_KEY, param === 'student' ? 'student' : 'admin')
    }
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

// A token-shaped string the app can decode for name/email/photo. Never sent anywhere in demo mode.
export function demoToken() {
  const payload = {
    name: 'Ritesh Dhekane',
    given_name: 'Ritesh',
    email: 'ritesh@example.com',
    picture: null,
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
  }
  const encoded = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `demo.${encoded}.demo`
}
