// Files arrive from the backend as base64. These turn them into bytes, Blobs and blob: URLs.

export function base64ToBytes(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// blob: URLs for base64 content, kept for the most recent few files and revoked as they drop out,
// so going back and forth between files doesn't rebuild them.
const urlCache = new Map()
const URL_CACHE_SIZE = 6

export function blobUrl(content, type) {
  if (!content) return null
  const key = `${type}:${content.length}:${content.slice(0, 64)}:${content.slice(-64)}`
  if (urlCache.has(key)) return urlCache.get(key)
  const url = URL.createObjectURL(new Blob([base64ToBytes(content)], { type }))
  urlCache.set(key, url)
  if (urlCache.size > URL_CACHE_SIZE) {
    const [oldest, oldUrl] = urlCache.entries().next().value
    urlCache.delete(oldest)
    URL.revokeObjectURL(oldUrl)
  }
  return url
}
