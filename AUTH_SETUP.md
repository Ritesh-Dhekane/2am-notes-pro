# Google Sign-In Setup

The frontend uses Google Identity Services (GIS) for login. This requires a
Google OAuth Client ID, created manually in Google Cloud Console — there's no
way to script this step.

## Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and select
   or create a project for this app.
2. Go to **APIs & Services → Credentials**.
3. Click **Create Credentials → OAuth client ID**.
4. Application type: **Web application**.
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (Vite dev server default)
   - your production domain, once deployed
6. Save, then copy the generated **Client ID**.
7. Copy `.env.example` to `.env` and set:
   ```
   VITE_GOOGLE_CLIENT_ID=<the client id you copied>
   ```
8. Restart `npm run dev`.

## What this gives you right now

- The Login page renders the real Google Sign-In button once `VITE_GOOGLE_CLIENT_ID`
  is set (without it, it shows a message pointing back to this doc).
- On success, the returned credential (a JWT) is decoded client-side just to
  show name/email/picture in the UI, and stored in `localStorage`.

## What this does NOT give you yet

Client-side decoding is display-only and **not secure verification** — anyone
could hand the frontend a hand-crafted token. Real access control requires the
Apps Script backend (TASK-004/005) to verify the Google credential server-side
before returning any subject/file data. Until that ships, this flow is UI-only
and must not be treated as an access boundary.
