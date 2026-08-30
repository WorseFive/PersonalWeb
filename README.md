# PersonalWeb

PersonalWeb is a Wii-inspired personal portal with an early-iPhone/iBooks-inspired library for writing and public resources.

The first release follows one hard constraint: zero payment. It is a static Next.js site built by GitHub Actions and hosted on GitHub Pages. Git commits are the content-management workflow.

- [Architecture](docs/ARCHITECTURE.md)
- [Decisions](docs/DECISIONS.md)
- [Delivery plan](docs/PLAN.md)
- [Progress](docs/PROGRESS.md)
- [Research sources](docs/SOURCE-LEDGER.md)

## Release-1 scope

Included:

- static home, About, blog, and library pages;
- Markdown articles under `content/blog`;
- owner-approved public resource links or small public files;
- responsive Wii/iBooks visual system;
- static favicon, Open Graph image, robots, sitemap, and 404 page;
- GitHub Actions build and GitHub Pages publication.

Deferred because GitHub Pages has no server runtime:

- administrator login and moderation console;
- Supabase runtime/database access and all Supabase keys;
- comments and comment APIs;
- uploads, private files, and server-mediated downloads;
- mutable content and private access control.

Giscus may be considered later if the owner approves a public repository, GitHub Discussions, the giscus App, and GitHub-account-only comments.

## Local development

Install the locked dependencies and run the normal development server:

```powershell
npm ci
npm run dev
```

The static migration target is configured in `docs/PLAN.md`. Before static export is implemented, the repository still contains historical dynamic routes for local/future-server testing; they are not evidence that GitHub Pages can run those features.

## Static verification target

The complete release-1 local gate is intended to be:

```powershell
npm ci
npm run check:project
npm run check:release
npm run typecheck
npm run test
npm run build
npm run test:static
```

`npm run build` must generate `out/`. `npm run test:static` must verify routes, assets, public-boundary safety, secret absence, and the absence of broken dynamic-entry claims once the migration is implemented.

## GitHub Pages publication

The preferred project-site URL is:

```text
https://worsefive.github.io/PersonalWeb/
```

The repository is now public and Pages is configured to deploy from GitHub Actions. The current published site is available at this URL. The agent must not add a paid plan, change DNS, or publish unrelated external resources without authorization.

Render, Vercel, Supabase, Railway, and Docker/VPS remain documented only as future dynamic-hosting options if the owner later restores login, comments, uploads, private files, or database-backed content.
