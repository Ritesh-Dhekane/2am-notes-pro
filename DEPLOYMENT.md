# Deployment (GitHub Pages)

## How it works

- `.github/workflows/deploy.yml` builds the app on every push to `main` and
  publishes `dist/` to the `prod` branch (via `peaceiris/actions-gh-pages`).
- `prod` is seeded with a placeholder `index.html` right now — the first
  successful workflow run overwrites it with the real build.
- `vite.config.js` uses an absolute base (`/2am-notes-pro/`) for production
  builds only, matching the GitHub Pages project URL; the dev server still
  serves from `/`. `main.jsx` reads this back via `import.meta.env.BASE_URL`
  for the router's `basename`, so the two stay in sync automatically.
- `postbuild` copies `dist/index.html` to `dist/404.html` — the standard
  workaround for client-side routing on GitHub Pages, which has no server to
  rewrite unknown paths back to `index.html`. Without it, refreshing on
  `/subject/java-programming` or sharing that link directly would 404.

## One-time manual steps (GitHub UI)

1. **Enable Pages**: repo **Settings → Pages → Build and deployment → Source:
   Deploy from a branch → Branch: `prod`, folder: `/ (root)`**. The site will
   be live at `https://ritesh-dhekane.github.io/2am-notes-pro/`.
2. **Repo secrets** (optional, but needed for the deployed app to actually
   work): **Settings → Secrets and variables → Actions**, add:
   - `VITE_GOOGLE_CLIENT_ID` (see `AUTH_SETUP.md`)
   - `VITE_API_BASE_URL` (see `APPS_SCRIPT_SETUP.md`)
   - `VITE_GA_MEASUREMENT_ID` (see `ANALYTICS.md`, optional)

   Without these, the workflow still builds and deploys successfully — the
   deployed app just shows the same "not configured yet" messages you'd see
   locally without a `.env`.
3. Also add `https://ritesh-dhekane.github.io` as an **Authorized JavaScript
   origin** on the OAuth client (`AUTH_SETUP.md`) once Pages is live, or
   Google Sign-In will reject requests from that origin.

## Dev environment

Not set up yet — GitHub Pages serves one site per repo, so a second "dev"
environment would need a subpath convention (e.g. `/dev/`) built into the
same `prod` branch, or a separate hosting target. Deferred until there's an
actual need for a live preview separate from local `npm run dev`.
