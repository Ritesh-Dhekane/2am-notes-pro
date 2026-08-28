# Project Tasks

Working plan for 2am-notes-pro, broken into sequential tasks. Done one at a time,
each with its own commit(s) prefixed `TASK-0XX: ...`. New tasks can be appended
as features are added — numbering stays sequential.

## Status legend
- [ ] not started
- [~] in progress
- [x] done

## Tasks

- [x] TASK-001: Project scaffold — Vite/React app, base folder layout, routing skeleton
- [x] TASK-002: Drive content structure spec — finalize subject/unit folder layout as a doc, mirror it in the real Drive
- [x] TASK-003: Google Sign-In integration (frontend auth UI + flow)
- [x] TASK-004: Apps Script backend setup — project, deployment config, basic health endpoint
- [x] TASK-005: Session/identity verification — Apps Script validates the logged-in user
- [x] TASK-006: Subject & unit listing — Apps Script reads Drive folder tree, frontend renders subject pages
- [x] TASK-007: Secure file viewer — Apps Script serves file metadata/content, frontend renders PDF/MD/TXT without exposing raw Drive links
- [x] TASK-008: Guest preview mode — limited unauthenticated access + upgrade-to-login prompt
- [x] TASK-009: Protected routing — audited that no protected data/calls happen before auth resolves (see note below)
- [ ] TASK-010: Access logging — log login/logout, page visits, file opens to a Google Sheet
- [ ] TASK-011: Google Analytics integration — page views, subject click patterns, login-to-content conversion
- [ ] TASK-012: Polish & pilot testing — error/loading states, edge cases, test with 2-3 real users

## Notes
- `drive/` is a local reference-only folder (git-ignored), not the real content store.
- Commit convention: `TASK-0XX: <what changed>` for every commit tied to a task.
- TASK-009 scope decision: Home/Subject deliberately show an in-page guest
  preview (TASK-008) instead of redirecting unauthenticated visitors to
  /login. A redirect-based `ProtectedRoute` guard was intentionally not built
  since there's no current private-only page that needs one — add it if a
  future task introduces one (e.g. an admin/logs view), rather than carrying
  unused code now.
