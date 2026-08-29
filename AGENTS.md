# PersonalWeb continuity rules

This repository is the single record for the personal portal plan, code, decisions, and progress.

Before changing code or configuration, read `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, and `docs/PROGRESS.md`. After every meaningful change, update `docs/PROGRESS.md` with the date, scope, affected files, verification, and next concrete step. Record architecture, security, provider, deployment, or visual-system decisions in `docs/DECISIONS.md`, and update the architecture document whenever the system shape changes.

Keep secrets outside Git. Do not publish, deploy publicly, create external accounts, or enable public writes without the user's authorization. Test real comment and upload flows before calling them complete.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
