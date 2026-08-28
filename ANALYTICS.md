# Google Analytics Setup

Usage analytics runs on GA4 (`gtag.js`). Creating the GA4 property itself
requires your own Google account and can't be scripted.

## One-time setup

1. Go to [Google Analytics](https://analytics.google.com/) and create a GA4
   property for this app (or reuse an existing one).
2. Under **Admin → Data Streams**, add a Web stream for your app's domain
   (and one for `localhost` if you want dev-time data separated — or just
   test without setting the env var locally).
3. Copy the **Measurement ID** (`G-XXXXXXXXXX`).
4. Set in `.env`:
   ```
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

Without this set, `src/lib/analytics.js` no-ops entirely — no script is
injected, no network calls are made.

## What's tracked

- **Page views** — on every route change (`App.jsx`), since GA4's automatic
  pageview only fires once on initial script load and wouldn't see
  React Router navigations otherwise.
- **`login`** (`{ method: 'google' }`) — fired from `AuthContext.jsx` right
  after a successful sign-in.
- **`subject_click`** (`{ subject }`) — fired from the Home page when a
  signed-in user opens a subject.
- **`file_open`** (`{ subject, category, fileName }`) — fired from the
  Subject page when a file is selected for preview.

This mirrors the access log written to the Google Sheet (`APPS_SCRIPT_SETUP.md`,
TASK-010) but serves a different purpose: the Sheet is the authoritative,
per-user audit trail; GA is for aggregate usage patterns (funnels, drop-off
between login and content, which subjects get clicked most).
