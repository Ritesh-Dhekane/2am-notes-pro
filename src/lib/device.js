// A short description of the student's browser and device, sent with sign-in, library loads and file
// opens for the private access log (see apps-script/Logging.js). Students agree to this on the
// sign-in card. Nothing here goes to Google Analytics.

const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent

function browserName() {
  const pick = (re, name) => {
    const m = ua.match(re)
    return m ? `${name} ${m[1]}` : null
  }
  return (
    pick(/EdgA?\/(\d+)/, 'Edge') ||
    pick(/OPR\/(\d+)/, 'Opera') ||
    pick(/SamsungBrowser\/(\d+)/, 'Samsung Internet') ||
    pick(/(?:Firefox|FxiOS)\/(\d+)/, 'Firefox') ||
    pick(/CriOS\/(\d+)/, 'Chrome') ||
    pick(/Chrome\/(\d+)/, 'Chrome') ||
    pick(/Version\/(\d+)[\d.]*.*Safari/, 'Safari') ||
    'Other'
  )
}

// iPads report themselves as Macs; a Mac with a touch screen is an iPad.
const isIpad = /iPad/.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1)

function osName(platformVersion) {
  const android = ua.match(/Android (\d+)/)
  if (android) return `Android ${android[1]}`
  const ios = ua.match(/OS (\d+)_\d+.*like Mac OS X/)
  if (ios || isIpad) return `${isIpad ? 'iPadOS' : 'iOS'}${ios ? ` ${ios[1]}` : ''}`
  if (/Windows/.test(ua)) {
    // The user-agent says "Windows NT 10.0" for both 10 and 11; Chromium's client hints can tell.
    if (platformVersion) return Number(platformVersion.split('.')[0]) >= 13 ? 'Windows 11' : 'Windows 10'
    return 'Windows'
  }
  if (/CrOS/.test(ua)) return 'ChromeOS'
  if (/Mac OS X/.test(ua)) return 'macOS'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Other'
}

function deviceType() {
  if (isIpad || /Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) return 'Tablet'
  if (navigator.userAgentData?.mobile || /Mobi|iPhone/.test(ua)) return 'Phone'
  return 'Desktop'
}

// Chromium browsers share the phone model and exact Windows version only when asked (client hints).
let hints = {}
if (typeof navigator !== 'undefined' && navigator.userAgentData?.getHighEntropyValues) {
  navigator.userAgentData
    .getHighEntropyValues(['model', 'platformVersion'])
    .then((values) => {
      hints = values
    })
    .catch(() => {})
}

export function deviceInfo() {
  let installed = false
  try {
    installed = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
  } catch {
    // older browsers
  }
  return {
    browser: browserName(),
    os: osName(hints.platformVersion),
    device: deviceType(),
    model: hints.model || '',
    screen: `${window.screen.width}×${window.screen.height}`,
    installed: installed ? 'Yes' : 'No',
    language: navigator.language || '',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  }
}
