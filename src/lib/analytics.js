const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

let loaded = false

function ensureLoaded() {
  if (loaded || !GA_ID) return
  loaded = true

  const script = document.createElement('script')
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  script.async = true
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  // send_page_view: false — SPA route changes are tracked manually via trackPageView,
  // since gtag's automatic pageview only fires once on initial script load.
  window.gtag('config', GA_ID, { send_page_view: false })
}

export function trackPageView(path) {
  if (!GA_ID) return
  ensureLoaded()
  window.gtag('event', 'page_view', { page_path: path })
}

export function trackEvent(name, params = {}) {
  if (!GA_ID) return
  ensureLoaded()
  window.gtag('event', name, params)
}
