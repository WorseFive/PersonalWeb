# PersonalWeb architecture

## Purpose

Build a personal public portal containing self-introduction, blog posts, a resource/download library, comments, and controlled file uploads. The visual system combines a Wii-style home dashboard with an iBooks-style bookshelf for content collections.

## Baseline architecture

| Layer | Chosen baseline | Responsibility |
| --- | --- | --- |
| Source control | GitHub | Source review, history, release trigger. |
| Application | Next.js App Router + TypeScript | Public pages, server-side operations, SEO, administration UI. |
| Hosting | Vercel or Cloudflare Pages | Preview and production application deployment. |
| Data and identity | Supabase Postgres + Auth | Profiles, permissions, posts when dynamic, comments, audit records. |
| Object storage | Supabase Storage or Cloudflare R2 | Images, attachments, user-uploaded files, signed access. |
| Editorial content | MDX in Git at first | Blog content and revision-friendly authoring. |

The authorized production target is Vercel for hosting and Supabase Postgres plus a private Supabase Storage bucket for mutable records and files. The provider project identifiers, region, production URL, and creation state are recorded in `docs/DECISIONS.md` and `docs/PROGRESS.md` once the owner finishes provider consent.

## Local development adapter

The first runnable release uses a local file-backed development adapter when production credentials are absent. JSON records live under `PORTAL_DATA_DIR` (default `.data`) and uploaded files live under its non-public `uploads` directory. A single administrator password and signed session cookie provide the administrator boundary. When `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` are present, the same server API uses Supabase Postgres and private Storage instead. This keeps local functional tests isolated while making production data durable.

## Implemented release-1 routes

| Route | Purpose |
| --- | --- |
| `/` | Wii-style portal dashboard and entry points. |
| `/about` | Introduction and external links. |
| `/blog` and `/blog/[slug]` | Article library and reader pages. |
| `/library` | iBooks-style resources and download shelves. |
| `/uploads` | Authenticated upload area, if public/user uploads are enabled. |
| `/admin` | Author/moderator management surface. |

The public shell also includes a visible navigation header. `app/(public)` owns the reader-facing route group; interactive comment and administration controls are isolated in client components while storage, session validation, and all mutations remain server-side. Article detail routes are deliberately dynamic so newly moderated comments are read from Postgres at request time rather than frozen into a static build artifact.

## Security baseline

All write operations use server-side authentication and authorization. Every user-owned database row and object has an owner and visibility policy. Files are type- and size-validated before storage. Public comments require a moderation state, rate limit, and removal workflow. Environment secrets never enter Git.

For the local adapter, public comments are stored as `pending`; only the administrator may approve or reject them. Uploads are administrator-only. The server generates storage keys, keeps upload paths outside `public`, and serves downloads through a resource record rather than a user-supplied path.

Allowed local uploads are `.txt` (`text/plain`), `.pdf` (`application/pdf`), and `.png` (`image/png`) up to 5 MB. Extension, declared media type, byte size, and a basic file signature are checked server-side. Administrator sessions are HMAC-signed, `HttpOnly`, `SameSite=Lax`, and expire after eight hours. The local JSON adapter is intentionally development-only: it does not provide multi-process write coordination, durable audit history, or production-grade identity.

## Production boundary

Production runs on Vercel. The application selects the Supabase adapter only when all three server-only values `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` exist; a partial configuration fails closed. Postgres holds comments, moderation events, resources, and HMAC-keyed rate-limit windows. The `portal-resources` Storage bucket is private, has a 5 MB MIME allowlist, and has no browser policy. The server checks the public resource record before downloading bytes. The administrator can remove a resource through the application, which removes the private object and its metadata record.

The single administrator boundary remains an HMAC-signed `HttpOnly`, `SameSite=Lax` cookie generated after comparing `ADMIN_PASSWORD` server-side. The rate-limit HMAC uses `RATE_LIMIT_SECRET` (or a strong session secret only for local compatibility), so the database never receives a raw address. `SITE_URL` supplies canonical, robots, sitemap, and Open Graph metadata.

## Verification boundary

`tests/domain.test.ts` covers validation and signed-session primitives. `scripts/run-functional-tests.mjs` starts an isolated server with a temporary data directory and verifies both development and production modes: public reading, comment creation and moderation, denied and allowed uploads, mediated download, object removal, and logout. `scripts/run-supabase-contract-tests.mjs` verifies actual RLS/bucket/rate-limit/object-storage policy. `scripts/run-live-production-tests.mjs` verifies the deployed HTTPS origin end-to-end and cleans its temporary test data. Browser QA checks desktop and 390px narrow layouts, overflow, route rendering, and console errors.

## Visual system

- Home: soft white/blue Wii menu, rounded channel tiles, deliberate selected and pressed states.
- Collections: wooden shelves, cover cards, paper-like reading pages, restrained texture.
- Reading: high-contrast text and conventional responsive reading width; no textured background behind body copy.
- Accessibility: semantic navigation, visible focus, keyboard use, reduced motion, and mobile layouts are mandatory.
