# Decision log

## D-001 — 2026-08-29 — Adopt a server-capable portal baseline

Use GitHub for source control, Next.js App Router for the application, and a managed Auth + Postgres + object-storage provider such as Supabase for mutable data, comments, and uploads.

Status: historical baseline. Superseded for release 1 by D-013 after the owner made zero cost and GitHub hosting the first principles.

## D-002 — 2026-08-29 — Split the visual language by user task

Use Wii-style navigation for the home portal and iBooks-style shelving for blog/resource collections. Keep reading pages quiet and accessible rather than heavily textured.

Status: accepted and retained for both the static release and any future dynamic upgrade.

## D-003 — 2026-08-29 — Use a local development adapter before external provider setup

Implement the first runnable release with a file-backed local adapter so comments, moderation, uploads, and downloads can be exercised without an external provider.

Status: accepted for historical/local development only. It is not part of the GitHub Pages runtime.

## D-004 — 2026-08-29 — Freeze the original release-1 write policy

The original server release allowed public pending comments and administrator-only validated uploads.

Status: historical dynamic scope. Those write paths are deferred by D-013; no public write API is shipped in the zero-cost static release.

## D-005 — 2026-08-29 — Provision the managed production path

The original plan selected Vercel with Supabase Postgres and private Storage for the dynamic portal.

Status: historical implementation record. Superseded as the first-release target by D-013. Existing provider resources must not be treated as required by the static build.

## D-006 — 2026-08-29 — Use a private GitHub deployment source

The original Vercel plan used `WorseFive/PersonalWeb` as a private source repository.

Status: historical provider decision. GitHub Free Pages eligibility may require a public repository; visibility remains an owner-only decision under D-013.

## D-007 — 2026-08-29 — Preserve the Vercel release boundary while blocked

The Vercel account/project path was recorded as blocked/unknown during earlier attempts.

Status: historical blocker. Vercel is removed from the critical path for release 1; no Dashboard recovery is required for the static plan.

## D-008 — 2026-08-29 — Keep editorial content file-based

Store blog posts as Git-tracked Markdown with frontmatter.

Status: accepted and retained. Static export reads these files during the build.

## D-009 — 2026-08-29 — Complete share metadata with generated brand assets

Use a site icon, Open Graph image, article metadata, canonical URLs, robots, and sitemap.

Status: accepted. Static export must produce these assets with the final Pages origin.

## D-010 — 2026-08-29 — Separate CLI production release from GitHub identity eligibility

Treat an owner CLI release and GitHub integration as independent Vercel paths.

Status: historical provider decision; not a release-1 requirement.

## D-011 — 2026-08-29 — Remove Vercel web login from the critical release path

Render, Railway, or Docker/VPS were considered provider-portable alternatives after Vercel login trouble.

Status: superseded for release 1 by D-013. Retained only as a future dynamic-hosting fallback.

## D-012 — 2026-08-29 — Make Render the primary deployment target

Render was selected as the dynamic replacement because its web interface was accessible.

Status: superseded for release 1 by D-013. No Render service, paid service, DNS change, or production traffic switch was authorized by this decision.

## D-013 — 2026-08-29 — Make zero-cost GitHub Pages the release-1 target

The first principle is no payment. The only required deployment platform for release 1 is GitHub Pages, driven by GitHub Actions from the repository. To satisfy GitHub Pages' static-hosting boundary, release 1 is reduced to static home, About, Git-managed blog, public resource links/files, visual system, SEO assets, and 404 handling.

Defer administrator login, HMAC sessions, Supabase runtime access, Supabase keys, private Storage, uploads, private downloads, resource deletion, server APIs, mutable comments, moderation queues, and live server tests. Do not leave broken controls that imply these features work. Giscus is an optional later choice only after explicit approval of a public repository, GitHub Discussions, the giscus App, GitHub-only commenter identity, and third-party script/privacy implications.

The current repository must not be made public by the agent. Before Pages publication, the owner must either authorize public visibility or prepare a separate public Pages deployment repository. A paid GitHub plan, Render service, Vercel recovery, Supabase project, custom domain, DNS change, or external account creation is not required for the static release and must not be introduced to solve it.

Status: accepted and deployed as the zero-cost static release. The owner made the repository public, Pages was configured with `build_type=workflow`, and commit `ee95c23` was published successfully. Real About content and optional public resources remain owner-approved content inputs.

## D-014 — 2026-08-30 — Propose a local-first Tauri editor for static publishing

For the proposed next phase, keep the public site on the existing GitHub Pages static architecture and add a separate Windows Tauri 2 editor. The editor writes only approved public content into the local Git repository, validates it, shows the diff, and performs commit/push only after explicit user confirmation. It must not expose arbitrary filesystem access, store GitHub tokens in project files, modify secrets or workflows, or restore server-only functionality.

Status: accepted and implemented. The editor source is under `editor/`; manual confirmation is required before commit and push. A future background/one-click publish mode would require a separate security review.

## D-015 — 2026-08-30 — Use progressive motion with a non-WebGL baseline

Implement Wii-inspired motion in layers: CSS baseline for every device, lightweight Canvas enhancement where appropriate, and optional WebGL fluid simulation only when capability and performance checks pass. `prefers-reduced-motion`, page visibility, low-power/mobile settings, and WebGL failure must all produce a usable fallback.

Status: accepted and implemented for CSS + Canvas. WebGL remains an optional future enhancement. The fluid layer is decorative and does not obscure text, navigation, or keyboard focus.

## D-016 — 2026-08-30 — Publish PDFs locally with generated Library metadata

Keep PDF publishing compatible with zero-cost GitHub Pages. Add a dedicated local Tauri command that validates the extension, %PDF- signature, 5 MiB limit, safe target name, and duplicate target before copying a PDF. Generate the matching Git-tracked Library metadata in the same operation. Do not add a public browser upload endpoint, provider storage, authentication, or secret.

Status: accepted and implemented. The editor exposes a PDF-specific form; Rust performs the validation and writes both public artifacts; project/static checks enforce the one-PDF/one-Library-entry contract. The current GitHub main tree contains zero PDFs, so the requested repository-wide sync has no source files to import and no fabricated placeholder is added.
