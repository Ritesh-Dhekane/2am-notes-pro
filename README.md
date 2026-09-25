# 2am-notes-pro

A private academic notes and study portal built for authenticated access, guest preview flow, and structured subject-wise learning content.

## Overview
This project is intended to provide a secure, organized study experience where notes, PDFs, revision material, and previous-year questions can be managed through a private content structure and accessed via authentication.

## Goals
- Secure access to private study material
- Guest preview mode with upgrade prompt
- Subject-wise organization
- Activity logging for access and downloads
- Google Drive-based content storage
- Apps Script-based backend-like integration

## Repository Structure
- `src/` - React (Vite) frontend
- `apps-script/` - Google Apps Script backend (deployed with `clasp`)
- `drive/` - Google Drive-compatible root folder structure for content organization (local reference only, git-ignored)

## Local Development
```
npm install
cp .env.example .env   # fill in the values from the sections below
npm run dev            # http://localhost:5173
```

## Google Sign-In
1. In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials → Create Credentials → OAuth client ID**, type **Web application**.
2. Add **Authorized JavaScript origins**: `http://localhost:5173` and, once deployed, `https://ritesh-dhekane.github.io`.
3. Set `VITE_GOOGLE_CLIENT_ID` in `.env` and restart `npm run dev`.

The frontend only decodes the credential for display; the Apps Script backend verifies it server-side before returning any data.

## Apps Script Backend
1. `npm install -g @google/clasp`, then `clasp login` with the Google account that owns the Drive content.
2. `cd apps-script && clasp create --type webapp --title "2am-notes-pro-api" --rootDir .` (creates the git-ignored `.clasp.json`), then `clasp push`.
3. `clasp open` → **Deploy → New deployment → Web app**, execute as **Me**, access **Anyone** (the script enforces its own auth).
4. **Project Settings → Script Properties**:
   - `GOOGLE_CLIENT_ID` — same client ID as the frontend (required; otherwise every call fails with `server_misconfigured_missing_client_id`)
   - `DRIVE_ROOT_FOLDER_ID` — ID of the `MCA-3rd-Sem` Drive folder (required; otherwise `server_misconfigured_missing_drive_root`)
   - `LOG_SHEET_ID` — optional Google Sheet with a `Logs` tab for access logging
5. Set the web app URL as `VITE_API_BASE_URL` in `.env`. A new deployment version can change this URL — re-check it after backend changes.

Opening the web app URL in a browser returns a JSON health check.

## Drive Layout
```
MCA-3rd-Sem/
  subjects/
    <subject-slug>/      # e.g. java-programming — matches /subject/:subjectId
      notes/             # unit-<NN>-<topic-slug>.<ext>
      pyqs/
      references/
```
Adding a subject = adding a slug folder with the same three sub-folders; no code change.

## Analytics
Optional GA4: set `VITE_GA_MEASUREMENT_ID` (`G-XXXXXXXXXX`). Without it, analytics is disabled entirely. Tracks page views, `login`, `subject_click`, and `file_open`.

## Deployment
Every push to `main` builds the app and publishes `dist/` to the `prod` branch (`.github/workflows/deploy.yml`), served by GitHub Pages at `https://ritesh-dhekane.github.io/2am-notes-pro/`.

One-time: **Settings → Pages → Deploy from a branch → `prod` / root**, and add repo secrets `VITE_GOOGLE_CLIENT_ID`, `VITE_API_BASE_URL`, and optionally `VITE_GA_MEASUREMENT_ID`.

## Notes
This project is currently being set up as a private academic management portal and will evolve with authentication, content access rules, and tracking features.
