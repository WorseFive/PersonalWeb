# PersonalWeb architecture

## Current release target

PersonalWeb release 1 is a zero-cost, static personal portal. GitHub is both the source repository and the only required hosting platform. GitHub Pages publishes the static output produced by GitHub Actions; no paid host, database, runtime secret, or server process is required for this release.

The product scope was deliberately reduced to fit that boundary. The public site contains an editorial home page, About page, Git-managed blog, public resource links/files, responsive Wii/iBooks visual design, and static SEO assets. Visitor comments, administrator login, moderation, uploads, private downloads, and mutable database records are deferred rather than simulated.

## Target architecture

| Layer | Release-1 choice | Responsibility |
| --- | --- | --- |
| Source control | GitHub repository | Versioned code, Markdown, public assets, review, and release history. |
| Build | GitHub Actions + Node.js + Next.js | Install locked dependencies, build, inspect, and publish static output. |
| Application | Next.js App Router + TypeScript with `output: "export"` | Generate HTML, CSS, JavaScript, metadata, and public assets at build time. |
| Hosting | GitHub Pages | Serve the generated `out/` directory over HTTPS. |
| Content | Git-tracked Markdown and static resource manifests | The only release-1 data source; changes are Git commits. |
| Runtime data | None | The browser performs no privileged or mutable application operation. |
| Comments | None in release 1; optional Giscus later | Giscus, if approved, stores discussion in GitHub Discussions rather than a PersonalWeb database. |

The release-1 flow is:

```text
Git commit
    ↓
GitHub Actions
    ↓ npm ci && npm run build
Next.js static export: out/
    ↓ Pages artifact
GitHub Pages
    ↓
Visitor browser
```

There is intentionally no production request path from the browser to Next.js, Supabase, Render, Vercel, or another application server.

## Repository visibility and URL

The current repository is `WorseFive/PersonalWeb` and has historically been private. GitHub Free Pages is intended for public repositories; changing visibility is an owner action and must not be performed by the agent.

The preferred owner-approved route is a project site:

```text
Repository: WorseFive/PersonalWeb
URL:        https://worsefive.github.io/PersonalWeb/
basePath:   /PersonalWeb
```

If the owner does not want the source repository public, the only zero-cost alternative is a separately prepared public Pages deployment repository. That introduces synchronization and publication complexity and is not assumed automatically. A paid GitHub plan is explicitly outside the first-release objective.

## Route model

The static route tree contains only public reader routes:

| Route | Source | Release behavior |
| --- | --- | --- |
| `/` | React page and Git content | Static HTML entry dashboard. |
| `/about/` | Approved static profile content | Neutral placeholder until owner-approved details exist. |
| `/blog/` | `content/blog/*.md` | Static article index. |
| `/blog/[slug]/` | Markdown frontmatter/body | One static page per known slug using `generateStaticParams`. |
| `/library/` | Static resource manifest | Public links/files only. |
| `/404.html` | Next not-found output | Static not-found page. |
| `/robots.txt` | Static metadata | Contains the final Pages origin only. |
| `/sitemap.xml` | Static metadata | Lists only public static routes. |
| `/icon.svg` and OG image | Public/generated assets | Static share and browser assets. |

The following are not release-1 routes and must not be exposed by navigation or static output:

- `/api/**`;
- `/admin`;
- `/uploads`;
- server-mediated download/delete endpoints;
- runtime comment submission or moderation endpoints.

Existing server routes may remain in Git history or a clearly separated legacy area while migration is being verified, but they must not be imported by the static route tree or presented as working features.

## Content and public-data boundary

All content included in Pages is public. The release process therefore treats every committed Markdown file, image, resource, generated JavaScript bundle, and Git history as publishable.

- Blog posts remain in `content/blog` and are read at build time.
- `content/resources` contains public resource metadata when the resource library is retained.
- `public/resources` may contain only owner-approved, non-sensitive, non-executable small files.
- Large files should be represented by approved external public links or omitted.
- About content uses a neutral placeholder until the owner supplies and approves the exact display name, biography, and links.
- No private profile, secret, test fixture, upload, database export, or credential may enter the public repository or `out/`.

The preferred release-1 resource policy is public links or small public files. A static link is not private: anyone who obtains it can download it.

## Deferred dynamic architecture

The former dynamic design is retained as a future upgrade path only:

```text
Node.js host (Render/Railway/VPS or another authorized provider)
    ↓
Next.js server routes
    ↓
Supabase Postgres + private Storage
```

That future path can restore administrator authentication, moderated comments, uploads, private resources, and durable mutable records. It requires an account, provider eligibility, server-side secrets, RLS/storage policy tests, live tests, and possibly cost. It is not part of the zero-cost GitHub Pages release.

Supabase is therefore not a release-1 dependency. The existing Supabase migration and adapter are historical/future-server assets and must not be referenced by static pages or bundled with browser code. A service-role key and an anon/publishable key are both unnecessary for the Pages build.

## Build and deployment boundary

`next.config.ts` must configure the current Next.js version for static export, including `output: "export"`, a Pages-compatible trailing-slash strategy, and unoptimized/static image handling where required. The exact configuration must be validated against the checked-in Next.js guide before implementation.

The workflow must:

1. Check out the selected branch.
2. Install from `package-lock.json` with `npm ci`.
3. Run project and release-boundary checks.
4. Run type checking, unit tests, static build, and static-output inspection.
5. Upload only `out/` as the Pages artifact.
6. Deploy through the official Pages deployment actions with least-privilege permissions.

No secret is needed for the static build. `SITE_URL` and `basePath` must be non-secret build configuration, preferably derived from the selected Pages URL and recorded without private values.

## Security boundary

Release 1 has no privileged browser operation. Security work focuses on publication safety:

- no secrets in Git, the browser bundle, Actions logs, or `out/`;
- no private files in `public/`;
- no executable, HTML, SVG, archive, credential, or personal backup resource by default;
- no false login/upload/comment controls;
- no URL obscurity treated as access control;
- all external links are reviewed and HTTPS where supported;
- public content, metadata, image EXIF, Git history, Issues, Discussions, and Actions output are reviewed before publication.

If Giscus is later enabled, the owner must approve a public repository, GitHub Discussions, the giscus App, GitHub-account-only commenting, third-party script loading, and the changed privacy/console/accessibility test scope. Giscus is not equivalent to the former private moderation API.

## Verification boundary

The release-1 verification gate is local and static:

- project structure and environment documentation;
- static publication-boundary scan;
- TypeScript check;
- unit/domain tests that remain relevant;
- Next.js static build;
- static-output route, asset, secret, and forbidden-entry checks;
- a local HTTP static-server smoke test;
- desktop and 390px browser checks;
- keyboard, visible focus, reduced motion, console, 404, metadata, and overflow checks;
- GitHub Actions and Pages verification after the owner authorizes publication.

The Supabase contract test, `npm run test:live`, server functional tests, upload tests, and deployment-provider tests are not release-1 completion gates. They become gates only if the dynamic architecture is intentionally restored.

## Visual system

- Home/navigation: soft white and blue Wii-inspired dashboard, rounded channel tiles, selected and pressed states.
- Collections: iBooks-inspired wooden shelves, cover cards, paper-like reading pages, and restrained depth.
- Reading: high-contrast text on a quiet responsive surface; no long-form copy on low-contrast texture.
- Accessibility: semantic landmarks, named navigation, keyboard operation, visible focus, reduced-motion support, readable contrast, and a 390px layout without horizontal overflow.

## Architectural status

The repository currently contains a working dynamic Next.js implementation plus the newly documented static target. Static migration is not complete until the code, workflow, checks, and actual Pages output match this document. Render/Vercel/Supabase configuration is not evidence of a completed release and must not be represented as the GitHub Pages runtime.
