# Apps Script Backend Setup

The backend lives in `apps-script/` and is deployed as a Google Apps Script
web app. Creating and deploying the actual script project requires your own
Google account login (`clasp login`), which can't be scripted — do this
locally.

## One-time setup

1. Install [clasp](https://github.com/google/clasp) (Google's Apps Script CLI):
   ```
   npm install -g @google/clasp
   ```
2. Log in with the Google account that will own the script:
   ```
   clasp login
   ```
3. From the `apps-script/` folder, create the script project:
   ```
   cd apps-script
   clasp create --type webapp --title "2am-notes-pro-api" --rootDir .
   ```
   This generates a real `.clasp.json` with a `scriptId` — it's git-ignored
   (see `.clasp.json.example` for the shape) since it's specific to your
   Google account.
4. Push the local code to the script project:
   ```
   clasp push
   ```

## Deploying as a web app

1. Run `clasp open` to open the project in the Apps Script editor.
2. **Deploy → New deployment → Web app**.
3. Settings:
   - Execute as: **Me** (so it can read the private Drive folder regardless of caller)
   - Who has access: **Anyone** (the endpoint enforces its own auth checks in
     later tasks — this setting just controls who can *reach* the URL)
4. Copy the deployment's web app URL — you'll set this as the frontend's API
   base URL (added to `.env` in a later task, once the frontend needs to call it).

## Script Properties (required for TASK-005 auth)

The backend verifies Google ID tokens by checking their audience against your
OAuth client ID (the same one from `AUTH_SETUP.md`). This is stored as a
Script Property, not hardcoded, so it can differ per deployment:

1. In the Apps Script editor: **Project Settings → Script Properties → Add script property**.
2. Key: `GOOGLE_CLIENT_ID`, Value: the same client ID used in the frontend's `.env`.

Without this property set, every `/verify` call fails with
`server_misconfigured_missing_client_id`.

For TASK-006 (subject listing), also add:

- Key: `DRIVE_ROOT_FOLDER_ID`, Value: the Drive folder ID of your `MCA-3rd-Sem`
  root folder (open the folder in Drive, copy the ID out of the URL). Using
  an ID instead of searching by name avoids ambiguity if multiple folders
  share the same name.

Without this property set, `listSubjects` fails with
`server_misconfigured_missing_drive_root`.

## Wiring up the frontend

Once deployed, set in the frontend's `.env`:
```
VITE_API_BASE_URL=<your web app deployment URL>
```
The frontend sends the signed-in user's ID token with every call — see
`src/lib/api.js`. Every redeploy of the Apps Script (`clasp push` + a new
deployment version, or updating an existing deployment) may change this URL,
so re-check it after making backend changes.

## What exists right now

- `doGet(e)` (TASK-004) returns a JSON health check: `{ status: "ok", service, timestamp }`.
- `doPost(e)` (TASK-005) accepts `{ "idToken": "<google id token>" }` and verifies it
  server-side against Google's tokeninfo endpoint before trusting any identity claim:
  - Success: `{ "authenticated": true, "user": { "email", "name", "picture" } }`
  - Failure: `{ "authenticated": false, "error": "<reason>" }`
    (reasons: `missing_id_token`, `invalid_or_expired_token`, `token_audience_mismatch`,
    `email_not_verified`, `server_misconfigured_missing_client_id`)
  - Apps Script web apps always return HTTP 200; success/failure is only in the
    JSON body's `authenticated` field — callers must check it, not the status code.
- `doPost` with `action: "listSubjects"` (TASK-006) reads the `subjects/` folder
  tree under `DRIVE_ROOT_FOLDER_ID` and returns `{ authenticated, user, subjects: [{ slug, name }] }`.
  Folder names under `subjects/` are used directly as slugs, per `DRIVE_STRUCTURE.md`.
- No file-content access or logging yet — those are TASK-007 onward.
- The frontend now calls `listSubjects` from the Home page (`src/lib/api.js`,
  `src/pages/Home.jsx`) once the user is signed in.

## Verifying it works

After deploying, open the web app URL in a browser — you should see the JSON
health check response. This step has to be done manually since it requires a
live Google-hosted deployment.
