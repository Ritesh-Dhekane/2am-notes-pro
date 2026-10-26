// CSV files for the admin exports, built in the browser. Cells are quoted when needed, and text that a
// spreadsheet would run as a formula (starting with = + - @) gets a leading ' so it opens as plain text.

export function csvCell(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return String(value)
  let text = String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// rows: arrays of cells, the first one the header.
export function toCsv(rows) {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

// "2am-notes-students-2026-10-21.csv", with today's local date.
export function csvFileName(kind, date = new Date()) {
  const day = [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((n) => String(n).padStart(2, '0')).join('-')
  return `2am-notes-${kind}-${day}.csv`
}

// Saves the file through a temporary link. The BOM makes Excel read it as UTF-8.
export function downloadCsv(fileName, rows) {
  const blob = new Blob(['﻿', toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
