# PersonalWeb

Personal portal project: a Wii-inspired home portal with an early-iPhone/iBooks-inspired library for writing, resources, and downloads.

- [Architecture](docs/ARCHITECTURE.md)
- [Decisions](docs/DECISIONS.md)
- [Progress](docs/PROGRESS.md)
- [Research sources](docs/SOURCE-LEDGER.md)

## Local first release

The runnable local release includes public writing and library routes, moderated public comments, an administrator login, administrator-only uploads, and server-mediated downloads. It uses a file-backed development adapter by default, deliberately kept outside `public/` and excluded from Git. It is not a public-production identity or storage solution.

1. Copy `.env.example` to `.env.local` and set a strong administrator password and a session secret of at least 32 characters.
2. Run `npm install`, then `npm run dev`.
3. Open `http://127.0.0.1:3000`; sign in at `/admin` to moderate comments and upload an allowed `.txt`, `.pdf`, or `.png` resource.

## Verification

- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:functional`
- `npm run test:functional:production`

`npm run verify` runs the complete gate. A Supabase or equivalent provider remains required before any authorized public deployment.
