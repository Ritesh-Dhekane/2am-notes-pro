// The optional phone number in Setup and Profile. Spaces and dashes are dropped; a bare 10-digit
// number is taken as Indian (+91). Otherwise it must be "+" and 8–15 digits. The backend checks the
// same rule (apps-script/Students.js). Never sent to analytics.

// { phone } with the cleaned number ('' when empty), or { error }.
export function normalizePhone(input) {
  let text = String(input || '').replace(/[\s-]/g, '')
  if (!text) return { phone: '' }
  if (/^\d{10}$/.test(text)) text = `+91${text}`
  if (!/^\+\d{8,15}$/.test(text)) return { error: 'Enter a 10-digit number, or + and your country code.' }
  return { phone: text }
}
