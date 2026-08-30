# Research source ledger

## Architecture research

| Project | URL | Why retained |
| --- | --- | --- |
| Narravo | https://github.com/sphildreth/narravo | Self-hostable portal reference with accounts, comments, moderation, uploads, and administration. |
| bloggr | https://github.com/Antibody/bloggr | Next.js + Supabase blog and administration reference. |
| u-blog | https://github.com/U-C4N/u-blog | Personal blog/portfolio reference with uploads and Supabase. |
| next-markdown-journal | https://github.com/Jeff-Russ/next-markdown-journal | Static editorial baseline and GitHub-hosted comment integration reference. |

## Visual research

| Project | URL | Why retained |
| --- | --- | --- |
| wii-menu-page | https://github.com/cornetespoir/wii-menu-page | Wii menu navigation and pop-up interaction reference. |
| bookshelf | https://github.com/kentcdodds/bookshelf | React book/catalog data and presentation reference. |
| skeuomorphic-forge | https://github.com/MMMProd-Org/skeuomorphic-forge | Material, depth, highlight, and pressed-state reference. |

## Downloaded skill snapshots

Stored at `research/upstream-skills` and pinned in `D:\LaTeX\Projects\Skills\web-creator\references\upstream-attribution.md`.

| Repository | Revision |
| --- | --- |
| Do-fei/website-studio-skill | `b7815014b158e2dc1a259bc45d4c39fdeff36fa7` |
| zebbern/claude-code-guide | `4eaf4ff18cef08f4daabfbe6b6dc417901e72b45` |
| openai/plugins | `1e285826e604f66f7208f7ac4dba0fe8341d1f57` |

## Current technical guidance

| Source | URL | Why retained |
| --- | --- | --- |
| GitHub Pages overview | https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages | Confirms Pages serves static HTML/CSS/JavaScript and documents GitHub Free repository eligibility. |
| Create a GitHub Pages site | https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site | Documents repository setup and publishing a site. |
| GitHub Pages limits | https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits | Records the 1 GB site, soft bandwidth, deployment-time, and build-frequency constraints used by the plan. |
| GitHub Pages custom workflows | https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages | Official Actions pattern for configuring Pages, uploading an artifact, and deploying it. |
| Next.js Static Exports | https://nextjs.org/docs/app/guides/static-exports | Confirms `output: "export"` generates an `out/` static artifact and identifies unsupported server-dependent features. |
| Giscus | https://giscus.app/ | Optional GitHub Discussions comment path; requires a public repository, Discussions, the App, and GitHub identity. |
| Next.js App Router | https://nextjs.org/docs/app | Current routing and server/client component guidance. |
| Supabase Auth with Next.js | https://supabase.com/docs/guides/auth/quickstarts/nextjs | Future dynamic-hosting authentication reference only. |
| Supabase Row Level Security | https://supabase.com/docs/guides/database/postgres/row-level-security | Future dynamic data authorization reference only. |
| Supabase Storage access control | https://supabase.com/docs/guides/storage/security/access-control | Future private-storage authorization reference only. |
| OWASP File Upload Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html | Future dynamic upload validation reference only. |
| Render Next.js deployment | https://render.com/docs/deploy-nextjs-app | Future full Node.js hosting fallback; not required for zero-cost release 1. |
| Railway Next.js deployment | https://docs.railway.com/guides/nextjs | Future full Node.js hosting fallback; not required for zero-cost release 1. |
| Cloudflare Pages Next.js | https://developers.cloudflare.com/pages/framework-guides/nextjs/ | Alternative static/adapter reference; GitHub Pages remains the selected zero-cost target. |
| Cloudflare Workers Next.js | https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/ | Future full-stack compatibility reference; not needed for the static release. |
| Fly.io Next.js | https://fly.io/docs/js/frameworks/nextjs/ | Future Docker/server fallback; not needed for the static release. |

## Wii UI and motion research

| Source | URL | License / handling | Why retained |
| --- | --- | --- | --- |
| wii-menu-page | https://github.com/cornetespoir/wii-menu-page | No clear SPDX license detected; research and visual inspiration only, no direct code/assets copied. | Wii-style channel grid, rounded cards, gradients, shadows, and status-bar ideas. |
| WebGL-Fluid-Simulation | https://github.com/PavelDoGreat/WebGL-Fluid-Simulation | MIT; retain copyright and license if code is integrated. | GPU fluid simulation, pointer/touch interaction, quality controls, and fallback requirements. |
| LiquidDistortion | https://github.com/codrops/LiquidDistortion | Custom terms in README; preserve attribution and audit PixiJS, GSAP, and example-image licenses separately. | Liquid displacement and transition ideas; downloaded for study, not bundled into the site. |
| Tauri | https://tauri.app/start/ | Official documentation; implementation reference. | Local Windows editor architecture, file access, security, and packaging. |
| Tauri security | https://tauri.app/security/ | Official documentation; implementation reference. | Capability and permission boundary for a local editor. |
| Tauri distribute | https://tauri.app/distribute/ | Official documentation; implementation reference. | Windows installer/EXE distribution and signing considerations. |
