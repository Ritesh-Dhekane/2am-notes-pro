// Development only: sample students and access-log rows for the admin pages in demo mode (?demo).
// Mirrors apps-script/Admin.js, worked out from the same kind of rows the Logs and Students tabs hold.

const DAY = 24 * 60 * 60 * 1000

// Same random numbers on every load, so screenshots stay comparable.
function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}

// "2026-10-21 09:30:00" in IST, like the sheet.
function ist(ms) {
  return new Date(ms + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
}

const PHONE = { device: 'Phone', browser: 'Chrome 141', os: 'Android 15' }
const IPHONE = { device: 'Phone', browser: 'Safari 26', os: 'iOS 26' }
const LAPTOP = { device: 'Desktop', browser: 'Chrome 141', os: 'Windows 11' }
const TABLET = { device: 'Tablet', browser: 'Safari 26', os: 'iPadOS 26' }

// start: days since first sign-in; last: days since last visit; opens: files opened; unitOne: only Unit 1 notes.
const PEOPLE = [
  { email: 'ritesh@example.com', name: 'Ritesh Dhekane', semester: 'MCA-Sem-II', electives: { electives: ['power-bi', 'cyber-security'] }, client: LAPTOP, installed: 'Yes', start: 40, last: 0, opens: 24 },
  { email: 'aarti.patil@example.com', name: 'Aarti Patil', phone: '+919876543210', semester: 'MCA-Sem-II', electives: { electives: ['power-bi', 'cloud-computing-management-and-security'] }, client: PHONE, installed: 'Yes', start: 28, last: 0, opens: 31 },
  { email: 'rohan.kulkarni@example.com', name: 'Rohan Kulkarni', semester: 'MCA-Sem-III', electives: { 'elective-iv': 'tableau', 'elective-v': 'deep-learning', 'elective-vi': 'e-commerce' }, client: PHONE, installed: 'No', start: 21, last: 1, opens: 14 },
  { email: 'sneha.joshi@example.com', name: 'Sneha Joshi', phone: '+918888812345', semester: 'MCA-Sem-III', electives: { 'elective-iv': 'tableau', 'elective-v': 'mern-stack-development', 'elective-vi': 'enterprise-resource-planning' }, client: IPHONE, installed: 'No', start: 18, last: 3, opens: 9 },
  { email: 'vikram.shinde@example.com', name: 'Vikram Shinde', semester: 'MCA-Sem-III', electives: { 'elective-iv': 'tableau', 'elective-v': 'deep-learning', 'elective-vi': 'e-commerce' }, client: LAPTOP, installed: 'No', start: 25, last: 20, opens: 3, unitOne: true },
  { email: 'priya.deshmukh@example.com', name: 'Priya Deshmukh', semester: 'MCA-Sem-I', electives: { 'elective-i': 'data-analytics' }, client: PHONE, installed: 'Yes', start: 6, last: 0, opens: 7, unitOne: true },
  { email: 'amit.more@example.com', name: 'Amit More', phone: '+917700011122', semester: 'BCA-Sem-V', electives: { elective: 'cloud-computing' }, client: TABLET, installed: 'No', start: 12, last: 2, opens: 5 },
  { email: 'neha.pawar@example.com', name: 'Neha Pawar', semester: 'BCA-Sem-V', electives: { elective: 'ui-ux-design' }, client: PHONE, installed: 'No', start: 4, last: 4, opens: 0 },
  { email: 'kunal.gaikwad@example.com', name: 'Kunal Gaikwad', semester: 'MCA-Sem-II', electives: { electives: ['power-bi', 'cyber-security'] }, client: PHONE, installed: 'Yes', start: 15, last: 9, opens: 11 },
  { email: 'pooja.jadhav@example.com', name: 'Pooja Jadhav', semester: 'BCA-Sem-V', electives: { elective: 'bca-cyber-security' }, client: LAPTOP, installed: 'No', start: 2, last: 0, opens: 2, unitOne: true },
]

// Every file as the log names it: "<semester>/<subject>/<category>/<file>".
function filePaths(semesters, semesterId) {
  return (semesters[semesterId] || []).flatMap((s) =>
    Object.entries(s.files).flatMap(([category, files]) => files.map((f) => `${semesterId}/${s.slug}/${category}/${f.name}`)),
  )
}

const UNIT_ONE = /\/notes\/unit[\s_-]*0*1(?!\d)/i

let cache = null

// { students: Students-tab rows, log: Logs rows (oldest first) }, built once.
function data(semesters) {
  if (cache) return cache
  const random = seeded(7)
  const now = Date.now()
  const log = []
  const row = (person, ms, event, file = '') =>
    log.push({ time: ist(ms), email: person.email, name: person.name, event, semester: person.semester, file, ...person.client, installed: person.installed })
  for (const person of PEOPLE) {
    const first = now - person.start * DAY - 3 * 60 * 60 * 1000
    const last = now - person.last * DAY - Math.floor(random() * 2 * 60 * 60 * 1000)
    row(person, first, 'login')
    row(person, first + 60 * 1000, 'save_study')
    const paths = filePaths(semesters, person.semester).filter((p) => !person.unitOne || UNIT_ONE.test(p))
    for (let i = 0; i < person.opens && paths.length; i++) {
      const ms = first + ((last - first) * (i + 1)) / (person.opens + 1)
      if (i % 4 === 0) row(person, ms - 60 * 1000, 'login')
      row(person, ms, 'view_library')
      row(person, ms + 30 * 1000, 'file_open', paths[Math.floor(random() * Math.min(paths.length, 6))])
    }
    row(person, last, person.opens ? 'view_library' : 'login')
  }
  log.sort((a, b) => a.time.localeCompare(b.time))

  const students = PEOPLE.map((person) => {
    const mine = log.filter((r) => r.email === person.email)
    const phone = person.email === 'ritesh@example.com' ? localStorage.getItem('notes-pro.demo-account-phone') || '' : person.phone || ''
    return {
      email: person.email,
      name: person.name,
      phone,
      course: person.semester.split('-')[0],
      semester: person.semester,
      electives: person.electives,
      firstSeen: mine[0].time,
      lastSeen: mine.at(-1).time,
      signIns: mine.filter((r) => r.event === 'login').length,
      opens: mine.filter((r) => r.event === 'file_open').length,
      device: `${person.client.device} · ${person.client.browser} · ${person.client.os}`,
    }
  })
  cache = { students, log }
  return cache
}

function top(counts, name, limit = 1000) {
  return Object.entries(counts)
    .map(([key, count]) => ({ [name]: key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export function demoOverview(semesters) {
  const { students, log } = data(semesters)
  const now = Date.now()
  const today = ist(now).slice(0, 10)

  const tree = {}
  for (const s of students) {
    const c = (tree[s.course] ||= { students: 0, semesters: {} })
    c.students++
    const sem = (c.semesters[s.semester] ||= { students: 0, electives: {} })
    sem.students++
    for (const slug of Object.values(s.electives).flat()) sem.electives[slug] = (sem.electives[slug] || 0) + 1
  }
  const courses = Object.keys(tree)
    .sort()
    .map((course) => ({
      course,
      students: tree[course].students,
      semesters: Object.keys(tree[course].semesters)
        .sort()
        .map((semester) => ({ semester, students: tree[course].semesters[semester].students, electives: top(tree[course].semesters[semester].electives, 'slug') })),
    }))

  const first = {}
  const last = {}
  const device = {}
  const installed = {}
  const subjectOpens = {}
  const fileOpens = {}
  for (const r of log) {
    first[r.email] ||= r.time
    last[r.email] = r.time
    device[r.email] = r.device
    installed[r.email] = r.installed
    if (r.event === 'file_open') {
      fileOpens[r.file] = (fileOpens[r.file] || 0) + 1
      const key = r.file.split('/').slice(0, 2).join('/')
      subjectOpens[key] = (subjectOpens[key] || 0) + 1
    }
  }
  const emails = Object.keys(last)
  const ms = (time) => new Date(`${time.replace(' ', 'T')}+05:30`).getTime()
  const within = (days) => emails.filter((e) => now - ms(last[e]) < days * DAY).length
  const perDay = {}
  for (const time of Object.values(first)) perDay[time.slice(0, 10)] = (perDay[time.slice(0, 10)] || 0) + 1
  const signUps = Array.from({ length: 30 }, (_, i) => {
    const day = ist(now - (29 - i) * DAY).slice(0, 10)
    return { day, count: perDay[day] || 0 }
  })

  const names = {}
  const neverOpened = []
  for (const [semester, subjects] of Object.entries(semesters)) {
    for (const s of subjects) {
      const key = `${semester}/${s.slug}`
      names[key] = s.name
      const files = Object.values(s.files).flat().length
      if (files && !subjectOpens[key]) neverOpened.push({ subject: key, name: s.name, files })
    }
  }
  const tally = (byEmail) => {
    const counts = {}
    for (const value of Object.values(byEmail)) counts[value] = (counts[value] || 0) + 1
    return top(counts, 'label')
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      students: students.length,
      activeToday: emails.filter((e) => last[e].slice(0, 10) === today).length,
      active7: within(7),
      active30: within(30),
      fileOpens: Object.values(fileOpens).reduce((a, b) => a + b, 0),
    },
    courses,
    signUps,
    topSubjects: top(subjectOpens, 'subject', 15).map((s) => ({ ...s, name: names[s.subject] || s.subject })),
    topFiles: top(fileOpens, 'file', 15),
    neverOpened,
    devices: tally(device),
    installed: tally(installed),
  }
}
