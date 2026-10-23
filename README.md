# 2am-notes-pro

[![Live site](https://img.shields.io/badge/live-open%20the%20app-2ea44f?logo=googlechrome&logoColor=white)](https://ritesh-dhekane.github.io/2am-notes-pro/)
[![Deploy](https://github.com/Ritesh-Dhekane/2am-notes-pro/actions/workflows/deploy.yml/badge.svg)](https://github.com/Ritesh-Dhekane/2am-notes-pro/actions/workflows/deploy.yml)
[![Last commit](https://img.shields.io/github/last-commit/Ritesh-Dhekane/2am-notes-pro)](https://github.com/Ritesh-Dhekane/2am-notes-pro/commits)
![React](https://img.shields.io/badge/React-20232a?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06b6d4?logo=tailwindcss&logoColor=white)
![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285f4?logo=googleappsscript&logoColor=white)

A private study portal for MCA and BCA students (Savitribai Phule Pune University): subject-wise notes, previous-year papers (PYQs) and references, stored in Google Drive and opened only after Google sign-in.

## Features
- **Sign-in flow**: visitors see every semester's subjects with their note and paper counts, locked. After Google sign-in, students pick their semester and electives (changeable in Settings), and only those subjects appear.
- **Dashboard**: continue reading (with progress), every subject, saved files and recent additions.
- **Subjects**: syllabus, notes grouped by unit, PYQs newest first, references. On desktop, files open in a preview pane beside the list.
- **Reader**: Markdown notes with an outline, exam-tip and definition callouts, code panels with syntax colours, and tables. PDFs and text files open too. Includes text size controls, bookmarks and previous/next.
- **Listen**: notes are read aloud with the device's voices, highlighting the sentence being read. Speed, skip and voice controls.
- **Search**: across every file by title, unit, subject or type, with type and subject filters. Recent searches are kept. `Ctrl K` from anywhere.
- **PYQ Archive** and **Saved**: all papers by exam year; bookmarks grouped by subject.
- **Document viewer**: images, Word, Excel/CSV and PowerPoint files open full screen, rendered in the browser.
- **Profile & Settings**: four themes (Midnight, OLED, Light, Sepia), reading typeface, size, spacing and line length, and read-aloud defaults. Also an install-as-app option.

Each student's semester and electives are saved with their Google account (Script Properties, `study:<email>`), so they follow them to any device. Bookmarks, reading history and settings stay in the browser (`localStorage`) and are never sent to the backend.

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
1. Run `npm install -g @google/clasp`, then `clasp login` with the Google account that owns the Drive content. Turn on the Apps Script API at https://script.google.com/home/usersettings first, or clasp can't connect.
2. Run `cd apps-script && clasp create --type webapp --title "2am-notes-pro-api" --rootDir .` (this creates the git-ignored `.clasp.json`), then `clasp push`.
3. In **Project Settings → Script Properties**, set:
   - `GOOGLE_CLIENT_ID`: the same client ID as the frontend. Required; without it every signed-in call fails with `server_misconfigured_missing_client_id`.
   - `DRIVE_ROOT_FOLDER_ID`: the ID of the top Drive folder (see Drive Layout). Required.
   - `LOG_SHEET_ID`: optional. A Google Sheet with a `Logs` tab, for access logging.
   - `SESSION_SECRET`: created automatically on the first sign-in. It signs the 7-day sessions; delete it to sign everyone out.
   - `BLOCKED_EMAILS`: optional, comma-separated. These accounts lose access on their next request.
4. Go to **Deploy → New deployment → Web app**: execute as **Me**, access **Anyone** (not "Anyone with Google account": the app calls it straight from the browser). Public: the catalog (subject names, file counts, each subject's Unit 1 notes and one sample PYQ question) and the Unit 1 notes themselves. Everything else needs a sign-in. `appsscript.json` already sets this, so `clasp create-deployment` works too.
5. In the editor, run `installTriggers` once and allow the permissions it asks for. It refreshes the cached listings every hour, so pages load fast.
6. Set the web app URL (ends in `/exec`) as `VITE_API_BASE_URL` in `.env`.

Opening the web app URL in a browser returns a JSON health check.

**Sessions:** sign-in checks the Google token once, then the backend issues its own session that lasts 7 days (Google's token lasts an hour).

**After adding or renaming files in Drive**, run `refreshCaches` in the editor (otherwise they appear within the hour).

**After changing the backend code**, run `clasp push`. Then go to **Deploy → Manage deployments**, edit the web app and pick **New version**. This keeps the same URL.

## Releasing the website

Work happens on a branch from `dev` (`feat/…`, `fix/…`, `chore/…`), which is merged into `dev` by pull request when it's done; pushing to `dev` does not deploy. To release, open a pull request from `dev` to `prod` and merge it: `.github/workflows/deploy.yml` builds `prod` and publishes it to GitHub Pages. `prod` accepts changes only through pull requests. The workflow can also be run by hand from the Actions tab.

Every pull request runs `.github/workflows/ci.yml` (lint, production build, Apps Script syntax check); a PR into `prod` can be merged only when it passes. Plain pushes to `dev` run nothing.

## Weekly syllabus refresh

`.github/workflows/sppu-syllabus.yml` runs every Monday at 03:30 UTC (or by hand from the Actions tab). It checks out `dev`, installs Playwright Chromium, runs `scripts/sppu-syllabus/scrape.mjs` and `clean.mjs`, and, if `public/data/syllabus.json` or `data/syllabus.sources.json` changed, opens a pull request into `dev` titled "Syllabus updates: N new, M changed" with the new and changed titles. A scrape that finds nothing, or fewer than 90% of the current syllabi, fails the run instead, so a broken scrape never replaces the data. Nothing merges by itself: review and merge the PR. Needs **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests**. PRs opened by the workflow don't start `ci.yml` on their own; close and reopen the PR (or push to its branch) to run the checks.

**After merging:** refresh the Drive mirror's manifest (upload the new `data/syllabus.sources.json` to `_syllabus/` as `manifest.json`), as described in [SPPU syllabi](#sppu-syllabi).

## Drive Layout
```
<top folder>/                    # its ID is DRIVE_ROOT_FOLDER_ID
  MCA-Sem-I/                     # 2025 pattern (Sem II and III are the 2024 pattern)
  MCA-Sem-II/                    # one folder per semester; the name is the semester id
    subjects/
      java-programming/          # subject slug, matches /subject/:subjectId
        syllabus.pdf             # optional, at the subject root
        notes/                   # unit-<NN>-<topic-slug>.<ext>, e.g. unit-02-exception-handling.md
        pyqs/                    # e.g. dec-2025-end-semester.pdf (the year and month set the order)
        references/
  MCA-Sem-III/
    subjects/
      …
  BCA-Sem-V/                     # <COURSE>-Sem-<N>: the prefix is the course
    subjects/
      …
```
- Category folders are flat (files directly inside `notes/`, `pyqs/` and `references/`).
- A new course or semester needs an entry in `COURSES` / `SEMESTERS` in `src/lib/catalog.js`; subject slugs must be unique across courses (e.g. `bca-cyber-security`).
- A new subject folder shows up without code changes. Its proper name, icon and core/elective group come from `src/lib/catalog.js`; until it's listed there, it shows as a core subject with a plain look.
- In notes, a blockquote starting with `**Exam tip:**`, `**Important:**`, `**Definition:**` or `**Note:**`, or a GitHub-style `> [!NOTE]` / `[!TIP]` / `[!IMPORTANT]` / `[!WARNING]`, becomes a callout.
- Notes and text open in the reader. PDFs, images, Word, Excel/CSV and PowerPoint files open in the viewer. Old `.doc` and `.ppt` files are download-only.

## SPPU syllabi
Every official syllabus from SPPU's syllabus pages (credit: Savitribai Phule Pune University; the app links only to SPPU's listing page). Anyone can view one in the app; downloading needs a sign-in and is logged (`syllabus_download` in the Logs tab). The PDFs are mirrored in Drive, so SPPU's file links never reach the browser.

- `npm run syllabus:scrape` (needs `npx playwright install chromium` once) writes `data/syllabus.raw.json`; `npm run syllabus:clean` turns it into `public/data/syllabus.json` (shipped with the site, no file links) and `data/syllabus.sources.json` (id → title and SPPU link, repo only).
- **Setup, once:** in the Drive top folder, create `_syllabus/` (`syncSyllabus` creates it too; it has no `subjects` folder, so it's never read as a semester). Upload `data/syllabus.sources.json` into it, renamed `manifest.json`. Then `clasp push`, make a new deployment version (see Apps Script Backend), and run `installSyllabusTrigger` once in the editor. It mirrors the PDFs every hour (up to ~4.5 minutes per run) and records each in the **Syllabus** tab of the log spreadsheet; failures are retried, files over 40 MB are skipped. /admin/health shows how many are mirrored.
- **To refresh the list:** run both scripts, commit, and upload the new `data/syllabus.sources.json` to `_syllabus/` as `manifest.json` again (replace the old file, or upload a new one: the newest `manifest.json` wins). New syllabi are mirrored within the hour.

## Analytics
Optional GA4, production builds only: set the repo secret `VITE_GA_MEASUREMENT_ID` (`G-XXXXXXXXXX`). Without it, analytics is disabled entirely. Google signals and ad personalisation are off.

Nothing personal is sent: no names, emails or typed search text, and reader addresses are reported as `/read/<subject>/:file`. Events:
- `page_view`, `login`
- `semester_setup` and `semester_change` (semester, electives)
- `subject_click`, `file_open` (subject, category, file type)
- `document_view` (file type), `listen_start`, `bookmark_add`
- `search_result_open` (number of results, position)

## Access log
Optional: set the Script Property `LOG_SHEET_ID` to a Google Sheet owned by the script's account. It gets a **Logs** tab (created with headers on first use) with one row per sign-in, library load and file opened: time (IST), email, name, event, semester, file path, and the device (browser, OS, device type, phone model where Chrome shares it, screen, installed app or not, language, time zone). Students must tick a consent box under the sign-in button that mentions both Analytics and this log; the choice is remembered on the device. Run `testLog` in the editor to check it. The public catalog isn't logged.

## Deployment
A merge into `prod` builds the app and publishes it (`.github/workflows/deploy.yml`). GitHub Pages serves it at `https://ritesh-dhekane.github.io/2am-notes-pro/`.

One-time setup:
- **Settings → Pages → Deploy from a branch → `prod` / root**.
- Add the repo secrets `VITE_GOOGLE_CLIENT_ID`, `VITE_API_BASE_URL` and, optionally, `VITE_GA_MEASUREMENT_ID`.
