// An image inside a note. Web addresses load as usual; a relative path (`pic.png`, `images/pic.png`)
// is fetched from Drive next to the note through the backend, like the note itself.

import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { blobUrl } from '../lib/blobs.js'
import { loadAsset } from '../lib/library.js'

const isAbsolute = (src) => /^(https?:|data:|blob:)/i.test(src)

export default function NoteImage({ src, alt, noteId }) {
  const { user } = useAuth()
  const idToken = user?.idToken
  const relative = src && !isAbsolute(src)
  const [state, setState] = useState({ key: null, url: null, failed: false })
  const key = `${noteId}:${src}`

  useEffect(() => {
    if (!relative || !noteId || !idToken) return
    let cancelled = false
    loadAsset(idToken, noteId, src)
      .then((asset) => !cancelled && setState({ key, url: blobUrl(asset.content, asset.mimeType), failed: false }))
      .catch(() => !cancelled && setState({ key, url: null, failed: true }))
    return () => {
      cancelled = true
    }
  }, [relative, noteId, idToken, src, key])

  if (!relative) return <img src={src} alt={alt || ''} loading="lazy" />
  const current = state.key === key ? state : { url: null, failed: false }
  if (current.failed) return <span className="image-missing">[Image not found: {alt || src}]</span>
  if (!current.url) return <span className="image-loading" role="img" aria-label={alt || 'Image'} />
  return <img src={current.url} alt={alt || ''} />
}
