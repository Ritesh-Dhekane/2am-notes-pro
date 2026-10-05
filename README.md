# 2am-notes-pro

A private MCA study portal: subject-wise notes, previous-year papers (PYQs) and references, stored in Google Drive and opened only after Google sign-in.

## Features
- **Dashboard**: continue reading (with progress), every subject, saved files and recent additions.
- **Subjects**: notes grouped by unit, PYQs newest first, references. On desktop, files open in a preview pane beside the list.
- **Reader**: Markdown notes with an outline, exam-tip and definition callouts, code panels with syntax colours, and tables. PDFs and text files open too. Includes text size controls, bookmarks and previous/next.
- **Listen**: notes are read aloud with the device's voices, highlighting the sentence being read. Speed, skip and voice controls.
- **Search**: across every file by title, unit, subject or type, with type and subject filters. Recent searches are kept. `Ctrl K` from anywhere.
- **PYQ Archive** and **Saved**: all papers by exam year; bookmarks grouped by subject.
- **Profile & Settings**: four themes (Midnight, OLED, Light, Sepia), reading typeface, size, spacing and line length, and read-aloud defaults. Also an install-as-app option.

Bookmarks, reading history and settings stay in the browser (`localStorage`). They are never sent to the backend.

## Repository Structure
- `src/`: React (Vite) frontend
- `apps-script/`: Google Apps Script backend (deployed with `clasp`)
- `public/`: icons and the web app manifest

## Local Development
```
npm install
cp .env.example .env   # fill in the values from the sections below
npm run dev            # http://localhost:5173
```

### Demo mode (development only)
To work on the UI without the Google client ID or the backend, open `http://localhost:5173/?demo` and choose **Continue with the demo account**. You get sample subjects, notes and PDFs from `src/dev/demo.js`. Demo mode and its sample data only exist in `npm run dev`; production builds don't include them.

## Google Sign-In
1. In [Google Cloud Console](https://console.cloud.google.com/), go to **APIs & Services → Credentials → Create Credentials → OAuth client ID** and choose type **Web application**.
2. Add **Authorized JavaScript origins**: `http://localhost:5173` and, once deployed, `https://ritesh-dhekane.github.io`.
3. Set `VITE_GOOGLE_CLIENT_ID` in `.env` and restart `npm run dev`.

The frontend only decodes the credential for display. The Apps Script backend verifies it server-side before returning any data.

## Apps Script Backend
1. Run `npm install -g @google/clasp`, then `clasp login` with the Google account that owns the Drive content.
2. Run `cd apps-script && clasp create --type webapp --title "2am-notes-pro-api" --rootDir .` (this creates the git-ignored `.clasp.json`), then `clasp push`.
3. Run `clasp open`, then **Deploy → New deployment → Web app**: execute as **Me**, access **Anyone** (the script enforces its own auth).
4. In **Project Settings → Script Properties**, set:
   - `GOOGLE_CLIENT_ID`: the same client ID as the frontend. Required; without it every call fails with `server_misconfigured_missing_client_id`.
   - `DRIVE_ROOT_FOLDER_ID`: the ID of the `MCA-3rd-Sem` Drive folder. Required; without it calls fail with `server_misconfigured_missing_drive_root`.
   - `LOG_SHEET_ID`: optional. A Google Sheet with a `Logs` tab, for access logging.
5. Set the web app URL as `VITE_API_BASE_URL` in `.env`.

Opening the web app URL in a browser returns a JSON health check.

**After changing the backend** (e.g. the `listLibrary` action, which loads every subject's files in one call), run `clasp push`. Then go to **Deploy → Manage deployments**, edit the web app and pick **New version**. This keeps the same URL. Until it's redeployed, the app falls back to one call per subject, which works but is slower.

## Drive Layout
```
MCA-3rd-Sem/
  subjects/
    <subject-slug>/      # e.g. java-programming, matching /subject/:subjectId
      notes/             # unit-<NN>-<topic-slug>.md, e.g. unit-02-exception-handling.md
      pyqs/              # e.g. dec-2025-end-semester.pdf (the year and month set the order)
      references/
```
To add a subject, add a slug folder with the same three sub-folders; no code change is needed. In notes, a blockquote starting with `**Exam tip:**`, `**Important:**`, `**Definition:**` or `**Note:**` becomes a callout.

## Analytics
GA4 is optional: set `VITE_GA_MEASUREMENT_ID` (`G-XXXXXXXXXX`). Without it, analytics is disabled entirely. It tracks page views, `login`, `subject_click` and `file_open`.

## Deployment
Every push to `main` builds the app and publishes `dist/` to the `prod` branch (`.github/workflows/deploy.yml`). GitHub Pages serves it at `https://ritesh-dhekane.github.io/2am-notes-pro/`.

One-time setup:
- **Settings → Pages → Deploy from a branch → `prod` / root**.
- Add the repo secrets `VITE_GOOGLE_CLIENT_ID`, `VITE_API_BASE_URL` and, optionally, `VITE_GA_MEASUREMENT_ID`.
