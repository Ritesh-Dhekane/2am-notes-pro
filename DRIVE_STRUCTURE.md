# Drive Content Structure

This is the finalized folder layout for the private Google Drive that backs
2am-notes-pro. Apps Script reads from this structure; the frontend never
talks to Drive directly (see TASKS.md TASK-006/007).

## Layout

```
MCA-3rd-Sem/                       <- Drive root folder (shared with Apps Script service account/app only)
  subjects/
    java-programming/
      notes/
      pyqs/
      references/
    software-testing/
      notes/
      pyqs/
      references/
    research-methodology/
      notes/
      pyqs/
      references/
    machine-learning/
      notes/
      pyqs/
      references/
```

## Conventions

- **Subject slug**: lowercase, hyphen-separated, matches the app's `/subject/:subjectId`
  route param exactly (e.g. `java-programming`). This is the key Apps Script uses
  to resolve a subject to its Drive folder — no separate ID mapping table needed.
- **Sub-folders per subject** (fixed set for now, all three always present even if empty):
  - `notes/` — unit-wise notes, markdown/PDF
  - `pyqs/` — previous year questions
  - `references/` — supplementary material (textbooks, extra reading)
- **File naming inside `notes/`**: `unit-<NN>-<topic-slug>.<ext>`, e.g. `unit-01-introduction.md`.
  Zero-padded unit numbers keep sort order correct.
- Adding a new subject = adding a new slug folder with the same three sub-folders.
  No code change needed for the subject list once TASK-006 (Drive-driven listing) ships.

## Local reference copy

The `drive/` folder at the repo root mirrors this structure for local reference only.
It is git-ignored (see `.gitignore`) — it is not the real content store and is never
read by the app at runtime. Treat the real Google Drive folder as the single source
of truth; keep `drive/` in sync manually if you want a local mental model.

## Manual step (outside this repo)

Create the same folder tree in your actual Google Drive, then share the
`MCA-3rd-Sem` root folder with whatever Apps Script identity/project will be
built in TASK-004/005 so it can read it programmatically.
