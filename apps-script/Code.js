// Entry point for the 2am-notes-pro backend web app.
// TASK-004: health check only. Auth verification, Drive reads, and logging
// are added in later tasks (TASK-005 onward) as new functions in this project.

function doGet(e) {
  return jsonResponse({
    status: 'ok',
    service: '2am-notes-pro-api',
    timestamp: new Date().toISOString(),
  })
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
}
