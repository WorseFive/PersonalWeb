# Supabase production migration

Apply `migrations/20260829_000001_portal_production.sql` in the Supabase SQL Editor after creating the project. It creates the portal tables, moderation audit history, database-backed atomic rate limit, indexes, a private `portal-resources` bucket, and denies direct anonymous/authenticated table and object access through RLS.

The Next.js server uses the Supabase service-role key only at runtime. Do not put that key in a `NEXT_PUBLIC_` variable or commit it to this repository.

Before release, set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, and a non-public `SUPABASE_ANON_KEY` shell variable, then run `npm run test:supabase`. The test proves the direct browser role cannot read the tables, checks the private bucket configuration, exercises the atomic rate limit, and uploads/downloads/removes a temporary object through the service boundary.
