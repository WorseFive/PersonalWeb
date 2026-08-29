# Decision log

## D-001 — 2026-08-29 — Adopt a server-capable portal baseline

Use GitHub for source control, Next.js App Router for the application, and a managed Auth + Postgres + object-storage provider such as Supabase for mutable data, comments, and uploads. GitHub Pages alone is insufficient for the required authenticated comments, moderation, and uploads.

Status: accepted baseline; actual providers remain unselected.

## D-002 — 2026-08-29 — Split the visual language by user task

Use Wii-style navigation for the home portal and iBooks-style shelving for blog/resource collections. Keep reading pages quiet and accessible rather than heavily textured.

Status: accepted design direction.

## D-003 — 2026-08-29 — Use a local development adapter before external provider setup

Implement the first runnable release with a file-backed local adapter: JSON records in a configurable data directory, non-public file storage, public comments held for moderation, and administrator-only uploads guarded by environment-provided credentials and signed cookies. This makes all requested functions testable locally without creating a provider account or publishing the site.

Status: accepted for local development only. Supabase or an equivalent production provider remains required before public deployment.

## D-004 - 2026-08-29 - Freeze release-1 write policy

Keep article and library reading public. Accept visitor comments as plain text only, rate-limit them locally, and keep every new comment pending until an administrator publishes or rejects it. Restrict file creation to the administrator and accept only small TXT, PDF, and PNG files through a server-side allowlist and signature check.

Status: accepted for the local first release. Public visitor uploads, self-service accounts, rich-text comments, and a production provider are explicitly out of scope.

## D-005 - 2026-08-29 - Provision the managed production path

For the authorized production release, use Vercel to host the Next.js application and a private Supabase Storage bucket plus Supabase Postgres for mutable data. Keep the existing single-administrator, server-side password and signed-cookie boundary for this personal portal; the Supabase service-role key is server-only and never reaches the browser. Public comments remain plain text and pending until moderation. Library downloads are mediated by the application, so storage objects remain private.

Status: provisional until the owner completes provider OAuth consent and the projects are created. This deployment authorization does not authorize accepting third-party terms or OAuth scopes on the owner's behalf.
