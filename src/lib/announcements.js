// Announcements from the portal owner (apps-script/Announcements.js), shown as a banner. Signed out,
// only those for everyone; signed in, also those for the student's course and semester. Dismissing one
// is remembered on this device, by its id.

import { callApi } from './api.js'

const DISMISSED_KEY = 'notes-pro.dismissed-announcements'

export function loadAnnouncements(idToken, semester) {
  const request = idToken ? callApi('announcements', { idToken, semester: semester || '' }) : callApi('announcements', {}, { public: true })
  return request.then((data) => data.announcements || [])
}

export function dismissedAnnouncements() {
  try {
    const list = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function dismissAnnouncement(id) {
  try {
    // Only the latest 50, so the list doesn't grow forever.
    const list = [...dismissedAnnouncements().filter((x) => x !== id), id].slice(-50)
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(list))
  } catch {
    // storage blocked: hidden until the next visit
  }
}

// "all" -> "Everyone", "course:MCA" -> "MCA", "semester:MCA-Sem-II" -> "MCA Sem II".
export function audienceLabel(audience) {
  if (audience === 'all') return 'Everyone'
  const [kind, value = ''] = String(audience).split(':')
  return kind === 'course' ? `${value} students` : value.replace(/-/g, ' ')
}
