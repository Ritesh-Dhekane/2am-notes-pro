// Notes kept in the browser (IndexedDB), so a subject opened once reads instantly and copes with a weak
// connection. Each copy is stored with the file's "updated" time from the library listing; a newer
// upload doesn't match, so it's fetched again. Signing out clears everything.

const DB_NAME = 'notes-pro'
const STORE = 'files'
let dbRequest = null

function openDb() {
  if (!dbRequest) {
    dbRequest = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(STORE)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    dbRequest.catch(() => (dbRequest = null))
  }
  return dbRequest
}

async function run(mode, fn) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(req?.result)
    tx.onerror = () => reject(tx.error)
  })
}

/** The saved copy of a file, if it matches `updated`; otherwise null. */
export async function getSaved(fileId, updated) {
  if (!updated || typeof indexedDB === 'undefined') return null
  const record = await run('readonly', (store) => store.get(fileId)).catch(() => null)
  return record && record.updated === updated ? record.data : null
}

export function save(fileId, updated, data) {
  if (!updated || typeof indexedDB === 'undefined') return Promise.resolve()
  return run('readwrite', (store) => store.put({ updated, data }, fileId)).catch(() => {})
}

export function clearSaved() {
  if (typeof indexedDB === 'undefined') return Promise.resolve()
  return run('readwrite', (store) => store.clear()).catch(() => {})
}
