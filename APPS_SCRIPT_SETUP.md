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
- No Drive access or logging yet — those are TASK-006 onward.
- The frontend doesn't call `/verify` yet either — that's wired in once there's
  real protected data to gate (TASK-006/009).

## Verifying it works

After deploying, open the web app URL in a browser — you should see the JSON
health check response. This step has to be done manually since it requires a
live Google-hosted deployment.
