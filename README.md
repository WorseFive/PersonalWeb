# PersonalWeb

Personal portal project: a Wii-inspired home portal with an early-iPhone/iBooks-inspired library for writing, resources, and downloads.

- [Architecture](docs/ARCHITECTURE.md)
- [Decisions](docs/DECISIONS.md)
- [Progress](docs/PROGRESS.md)
- [Research sources](docs/SOURCE-LEDGER.md)

## Development and production adapters

The portal includes public writing and library routes, moderated public comments, an administrator login, administrator-only uploads, server-mediated downloads, resource removal, and SEO metadata. Development uses the ignored file-backed adapter outside `public/`. Production automatically switches to Supabase when all three Supabase runtime values are configured.

1. Copy `.env.example` to `.env.local` and set a strong administrator password and a session secret of at least 32 characters.
2. Run `npm install`, then `npm run dev`.
3. Open `http://127.0.0.1:3000`; sign in at `/admin` to moderate comments and upload an allowed `.txt`, `.pdf`, or `.png` resource.

## Production release (Vercel + Supabase)

1. Create a Supabase project, run [the production migration](supabase/migrations/20260829_000001_portal_production.sql) in its SQL Editor, and copy the Project URL, anon key, and service-role key. The migration creates all tables, indexes, RLS denials, atomic database-backed comment limits, audit history, and the private `portal-resources` bucket.
2. Create a Vercel project from this repository and set `ADMIN_PASSWORD`, `SESSION_SECRET`, `RATE_LIMIT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET=portal-resources`, and `SITE_URL`. Keep every secret server-only; do not use a `NEXT_PUBLIC_` prefix.
3. Deploy to production. After the production URL exists, run the two credentialed acceptance scripts shown below. They create only temporary objects/comments and remove or reject them before exiting.

## Verification

- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:functional`
- `npm run test:functional:production`
- `npm run test:supabase` (requires the four Supabase test variables, including `SUPABASE_ANON_KEY`)
- `npm run test:live` (requires `PORTAL_TEST_BASE_URL` and `PORTAL_TEST_ADMIN_PASSWORD`)

`npm run verify` is the complete local gate. A public release additionally requires `npm run test:supabase` and `npm run test:live` to pass against the actual provider and deployed HTTPS URL.
