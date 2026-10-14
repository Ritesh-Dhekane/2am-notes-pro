// Google Analytics 4, only in production builds and only when VITE_GA_MEASUREMENT_ID is set.
// Never send personal data: no names, emails, Google ids or typed text (search terms) — only which
// screens and features are used. Who opened what is recorded separately, in the private log sheet
// (apps-script/Logging.js).

const GA_ID = import.meta.env.PROD ? import.meta.env.VITE_GA_MEASUREMENT_ID : null

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
  // send_page_view: false — SPA route changes are tracked manually via trackPageView, since gtag's
  // automatic page view only fires once. No Google signals or ad personalisation.
  window.gtag('config', GA_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })
}

// Routes with ids in them are reported by their pattern (/read/java-programming/:file), so private
// Drive ids never reach Analytics.
export function pagePath(pathname) {
  return pathname.replace(/^\/read\/([^/]+)\/[^/]+$/, '/read/$1/:file')
}

export function trackPageView(pathname) {
  if (!GA_ID) return
  ensureLoaded()
  const path = pagePath(pathname)
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  window.gtag('event', 'page_view', { page_path: path, page_location: location.origin + base + path })
}

export function trackEvent(name, params = {}) {
  if (!GA_ID) return
  ensureLoaded()
  window.gtag('event', name, params)
}
