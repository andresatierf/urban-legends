# Require Evidence on every Submission

## Status

Accepted

## Context

The review queue relies solely on freeform text descriptions. Reviewers either rubber-stamp claims or spend time in Slack chasing proof. Submitters have no way to _show_ their activity, only assert it. Adding mandatory Evidence gives Reviewers a concrete basis for approval or rejection decisions and makes tournament scoring credible.

## Decision

- **Evidence lives on the Submission row**, not the SubmissionGroup. Every participant in a team activity uploads their own Evidence — per-member presence is independently verifiable.
- **Count: 1–5 images per Submission**. The schema field `evidenceStorageIds` uses `v.optional(v.array(v.id("_storage")))` (permissive) so the count constraint can be tightened or loosened later without a migration. Mutations enforce the count strictly.
- **Storage backend: Convex `ctx.storage`**. URLs are resolved server-side per query — Convex defaults to time-limited signed URLs, so they are never embedded in long-lived data.
- **File constraints**: JPEG, PNG, WebP, GIF, and HEIC (HEIC added in issue #56). Max 10 MB per file. Client-side processing uses a canvas downscale to ≤2000px on the longest edge + JPEG re-encode at quality 0.85. The canvas round-trip drops EXIF metadata as a side effect — no separate EXIF-strip library is needed.
- **Orphan prevention**: a `pendingUploads` table tracks every upload that has completed but not yet been claimed by a Submission. A daily cron at 03:00 UTC (issue #59) sweeps rows older than 24 hours, deleting the blob and the row.
- **Two-step upload flow**: `evidenceStorage.issueUploadUrl()` generates the Convex storage upload URL; after the upload completes the client immediately calls `evidenceStorage.registerUpload(storageId)` to create the `pendingUploads` row. The storageId is only available in the upload response body — it cannot be pre-allocated before the upload.

## Considered alternatives

- **Group-level shared Evidence** (one pool of photos for the entire SubmissionGroup): rejected — every claimed participant should independently prove their presence. A shared pool would allow one member's photos to vouch for the whole team.
- **Optional Evidence with reviewer nudges**: rejected — optional Evidence still leaves the review basis subjective. A hard minimum (≥1 image) makes the rule unambiguous and prevents the form from being submitted without proof.
- **Video or document Evidence**: rejected — out of scope for the current milestone. The term "Evidence" is intentionally generic in the domain glossary to accommodate future expansion without a renaming pass.
- **External storage (S3, R2, Cloudflare R2)**: rejected — Convex storage is sufficient at current scale and avoids adding external infrastructure dependencies and secrets management.
