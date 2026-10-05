# 2am-notes-pro

A private MCA study portal: subject-wise notes, previous-year papers (PYQs) and references, stored in Google Drive and opened only after Google sign-in.

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
4. Go to **Deploy → New deployment → Web app**: execute as **Me**, access **Anyone** (not "Anyone with Google account": the app calls it straight from the browser). Only the catalog (subject names and file counts) is public; everything else checks the Google sign-in. `appsscript.json` already sets this, so `clasp create-deployment` works too.
5. In the editor, run `installTriggers` once and allow the permissions it asks for. It refreshes the cached listings every hour, so pages load fast.
6. Set the web app URL (ends in `/exec`) as `VITE_API_BASE_URL` in `.env`.

Opening the web app URL in a browser returns a JSON health check.

**After adding or renaming files in Drive**, run `refreshCaches` in the editor (otherwise they appear within the hour).

**After changing the backend code**, run `clasp push`. Then go to **Deploy → Manage deployments**, edit the web app and pick **New version**. This keeps the same URL.

## Drive Layout
```
<top folder>/                    # its ID is DRIVE_ROOT_FOLDER_ID
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
```
- Category folders are flat (files directly inside `notes/`, `pyqs/` and `references/`).
- A new subject folder shows up without code changes. Its proper name, icon and core/elective group come from `src/lib/catalog.js`; until it's listed there, it shows as a core subject with a plain look.
- In notes, a blockquote starting with `**Exam tip:**`, `**Important:**`, `**Definition:**` or `**Note:**`, or a GitHub-style `> [!NOTE]` / `[!TIP]` / `[!IMPORTANT]` / `[!WARNING]`, becomes a callout.
- Notes and text open in the reader. PDFs, images, Word, Excel/CSV and PowerPoint files open in the viewer. Old `.doc` and `.ppt` files are download-only.

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
Every push to `main` builds the app and publishes `dist/` to the `prod` branch (`.github/workflows/deploy.yml`). GitHub Pages serves it at `https://ritesh-dhekane.github.io/2am-notes-pro/`.

One-time setup:
- **Settings → Pages → Deploy from a branch → `prod` / root**.
- Add the repo secrets `VITE_GOOGLE_CLIENT_ID`, `VITE_API_BASE_URL` and, optionally, `VITE_GA_MEASUREMENT_ID`.
