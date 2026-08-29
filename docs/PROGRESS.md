# Progress log

## 2026-08-29 - Managed provider provisioning and release-block diagnosis

Status: Supabase production data/storage path complete and tested; Vercel public deployment blocked by provider state.

- Created the `WorseFive` Supabase organization and the `personalweb` project (`gmtkndehijhnmmpnugkw`) in `ap-southeast-1`.
- Applied `20260829_000001_portal_production.sql`, creating Postgres tables, RLS denials, moderation audit history, the atomic rate-limit RPC, and private `portal-resources` bucket.
- Added Vercel project `piggy12138-3362/personalweb`, configured Next.js detection, and set production-only server secrets/configuration. Deployment protection was explicitly disabled for the public release.
- Ran `npm run test:supabase` against the real project: anonymous REST access was denied or empty, the bucket was private with the correct 5 MB limit, the atomic rate limit rejected the fourth request, and a temporary object completed upload/download/removal.
- Fixed the Supabase contract fixture to generate a real 64-character request HMAC and made dynamic article pages server-render at request time so published comments are not frozen into a build artifact. `npm run verify` passed after the correction.
- Investigated the Vercel failure with direct, forced, and prebuilt deployment paths. The remote builds remain `BLOCKED`/`UNKNOWN` with 0 ms build records and no logs; the route URL serves Vercel's build-in-progress page, not the application. Local prebuild is additionally prevented by Windows symlink permission (`EPERM`), but this is not the cause of the remote platform block.

Verification: local complete gate and real Supabase contract gate passed. Public live functional and browser acceptance tests are intentionally not claimed because the Vercel endpoint has not served the application.

Next concrete step: in Vercel Dashboard, resolve the account/project deployment block shown for `personalweb` (including any identity, eligibility, or provider restriction), then rerun a direct production deployment followed by `npm run test:live` and browser QA.

## 2026-08-29 - Managed production migration prepared

Status: implementation complete and locally verified; source is pushed; external provider creation and deployment await owner OAuth consent.

- Added the Vercel + Supabase production adapter, including server-only service-role access, a private Storage bucket, resource metadata, moderation audit events, and fail-closed partial configuration.
- Added an atomic Postgres-backed comment limit keyed by an HMAC rather than a raw visitor address; retained the isolated in-memory equivalent for local tests.
- Added controlled resource listing/removal to the administrator surface, server-mediated download preservation, canonical/Open Graph/robots/sitemap metadata, and a 404 page.
- Added a Supabase contract test and a live HTTPS acceptance test. Both tests clean their temporary uploaded object; the live test rejects its temporary comment after checking the publication lifecycle.
- Created and pushed the private GitHub source repository: `https://github.com/WorseFive/PersonalWeb`.

Verification so far: TypeScript and unit tests passed after the adapter was introduced. The complete local build and functional gate, Supabase contract gate, deployed live gate, browser QA, and release URL remain pending the provider projects and deployment.

Next concrete step: the owner completes the displayed Supabase GitHub OAuth authorization; then create the managed project, apply the checked-in migration, configure Vercel secrets, deploy, and run every pending gate.

## 2026-08-29 — Planning and workflow foundation

Status: complete for research and project recording; application implementation has not started.

- Created the architecture, decision, source, and continuity records.
- Initialized the local `main` Git branch; downloaded upstream snapshots remain local research inputs and are intentionally excluded from commits.
- Downloaded and pinned three upstream Web-related skill snapshots under `research/upstream-skills`.
- Created the centralized `web-creator` skill at `D:\LaTeX\Projects\Skills\web-creator` and a discoverable entry point under `C:\Users\33406\.agents\skills\web-creator`.
- Selected a provisional Next.js + managed Auth/Postgres/object-storage portal architecture.
- Selected a Wii home dashboard plus iBooks-style collection design direction.

Verification: source snapshot revisions are recorded in `docs/SOURCE-LEDGER.md`; `quick_validate.py` reports `Skill is valid!`; owned skill and project records contain no unresolved placeholders.

Next concrete step: choose the actual hosting/data provider and the scope of public uploads, then scaffold the portal in this repository.

## 2026-08-29 - Local portal first release

Status: complete for the authorized local implementation and verification; public deployment remains unstarted.

- Implemented a strict TypeScript Next.js App Router portal with Wii-style home navigation and iBooks-style writing/resource shelves.
- Added authored writing routes, an about route, resource downloads, moderated plain-text comments, an administrator-only console, signed local sessions, and validated local uploads.
- Kept mutable data and uploaded files under the ignored non-public `.data` adapter directory, configurable through `PORTAL_DATA_DIR`.
- Added unit tests for validation/session primitives and isolated functional tests for public reading, moderation, login/logout, allowed and denied uploads, and mediated downloads.
- Fixed the local adapter so unreadable or corrupt database files are not silently replaced by a new empty store.

Verification: `npm run verify` passed on 2026-08-29. This ran TypeScript checking, 3/3 domain tests, an optimized production build, and the same functional suite against both Next development and production servers. Browser QA at desktop and 390px narrow width found no horizontal overflow or console errors on the homepage, library, reader, and administrator login surfaces.

Next concrete step: if and only if public deployment is authorized, select an owned provider, replace the local adapter with managed Auth/Postgres/object storage plus access policies, configure secrets, and run the release checklist.

## 2026-08-29 — First runnable portal implementation started

Status: superseded by the completed local portal first release above.

- Chosen the local development adapter described in `D-003` so comments, moderation, administrator uploads, and downloads can be implemented and exercised without external accounts.
- Planned a Next.js App Router implementation with Wii-style public navigation, iBooks-style content collections, MDX-like authored content held in source, and a local mutable-data boundary.

Verification: retained as the start-of-work record; implementation, static checks, functional tests, and browser QA are recorded in the completed release entry above.

Next concrete step: use the provider-selection release path recorded in the completed release entry when public deployment is authorized.

## 2026-08-29 — Web Creator guidance expanded

Status: complete; the former implementation status is superseded by the completed local portal first release above.

- Reworked `web-creator` from a general checklist into six executable gates with exit conditions.
- Added greenfield bootstrap, trust-boundary, comment, upload, release, and visual-brief guides.
- Added current official Next.js, Supabase, and OWASP sources to the source ledger.

Verification: strict UTF-8 checks passed; `quick_validate.py` reports `Skill is valid!`; unfinished-marker scan, referenced-guide existence checks, and Git whitespace checks passed.

Next concrete step: choose an owned hosting/data provider only when public deployment is authorized.
