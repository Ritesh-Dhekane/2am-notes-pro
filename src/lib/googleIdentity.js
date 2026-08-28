const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

let scriptPromise = null

export function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

export async function renderGoogleSignInButton({ clientId, container, onCredential }) {
  await loadGoogleIdentityScript()

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => onCredential(response.credential),
  })

  window.google.accounts.id.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    width: 280,
  })
}
