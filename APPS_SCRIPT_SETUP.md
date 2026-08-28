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

## What exists right now (TASK-004)

- `doGet(e)` returns a JSON health check: `{ status: "ok", service, timestamp }`.
- No auth, no Drive access, no logging yet — those are TASK-005 onward.

## Verifying it works

After deploying, open the web app URL in a browser — you should see the JSON
health check response. This step has to be done manually since it requires a
live Google-hosted deployment.
