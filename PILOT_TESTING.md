# Pilot Testing Checklist (TASK-012)

Everything up to here (TASK-001–011) is built and verified locally — build,
lint, and headless-browser smoke tests all pass. What's left needs a real
deployment and real people, which can't be done from this environment.

## 1. Finish the manual setup

Follow, in order:
1. `AUTH_SETUP.md` — Google OAuth client ID
2. `APPS_SCRIPT_SETUP.md` — deploy the backend, set `GOOGLE_CLIENT_ID`,
   `DRIVE_ROOT_FOLDER_ID`, `LOG_SHEET_ID`
3. `DRIVE_STRUCTURE.md` — create the real Drive folder tree, add a few real
   files (at least one `.md`, one `.pdf`, one plain `.txt`) so there's
   something to actually browse
4. `ANALYTICS.md` — GA4 property (optional for the pilot, but nice to have data from it)
5. Set all of the above in `.env`, then `npm run build && npm run preview`
   (or deploy the built `dist/` somewhere reachable) so testers hit a real URL,
   not your local dev server

## 2. Smoke test it yourself first

- Sign in with your own Google account
- Confirm the Sheet gets a `login` row
- Open a subject, open a file of each type (md/pdf/txt), confirm each renders
- Sign out, confirm the guest preview shows again
- Manually expire your session (clear `localStorage`'s `notes-pro.auth.idToken`
  or wait out the token's lifetime) and confirm you get a clean re-login
  prompt rather than a stuck error state

## 3. Recruit 2-3 real testers

Pick people who'll actually use it (classmates in the MCA program). Give
them the URL and nothing else — the whole point is seeing where an
unguided first-time user gets confused.

## 4. What to watch for

- Do they understand the guest preview vs. signed-in distinction?
- Does Google Sign-In work smoothly on their device/browser (especially
  mobile)?
- Do they find the notes/pyqs/references tabs intuitive?
- Any error messages they hit that aren't covered by `errorMessages.js`
  (`src/lib/errorMessages.js`) — add new mappings there as they turn up
- Check the `Logs` sheet after their session — does it capture a realistic
  picture of what they did?

## 5. Feed it back into TASKS.md

Anything broken or confusing becomes a new `TASK-013`, `TASK-014`, etc. —
this file's job is done once real feedback exists to act on.
