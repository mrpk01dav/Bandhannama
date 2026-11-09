# Stage 4 — Backend and database foundation

## Implemented in this stage

- Supabase service-role client isolated in a `server-only` module.
- Initial PostgreSQL migration for `sisters`, `public_name_suggestions`, `site_settings`, `admin_profiles`, and `audit_logs`.
- RLS enabled on all five tables; direct `anon` and `authenticated` grants revoked. No public client can read sister records or PIN hashes.
- Default common wish, brother message, and display-name settings seeded idempotently.
- `POST /api/wishes/lookup`: validates a name, rate-limits by IP and normalized name, and returns either a PIN-required state for an active registered sister or the common wish for everyone else.
- `POST /api/wishes/verify`: verifies Argon2id PIN hashes server-side. Unknown, inactive, and incorrect-PIN cases return the same common-wish shape.
- `GET /api/names`: returns only explicitly visible public display-name suggestions; it never queries the private sister table.
- Stage 3 public flow now calls the lookup and verify APIs, displays the PIN screen only for active registered names, and uses the server-returned common/personal wish. A successful PIN remains unlocked in component memory for replay during the same page experience.
- Argon2id PIN hashing helper uses a server-side HMAC pepper before Argon2id. Raw PINs are never stored.
- Zod request validation, no-store responses for wish data, and Upstash sliding-window rate limits.

## Required configuration

Set these in `.env.local` for development and in encrypted hosting environment variables for deployment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server only, never prefix with `NEXT_PUBLIC_`
- `PIN_HASH_PEPPER` — random secret of at least 32 characters
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Do not put real secrets in GitHub, screenshots, browser storage, or source files. Generate a pepper with a cryptographically secure password generator. If a pepper is rotated, existing PIN hashes must be reissued/reset because verification depends on the same pepper.

## Apply the migration

1. Create a Supabase project.
2. Open its SQL Editor.
3. Review and run `supabase/migrations/0001_initial_schema.sql`.
4. Confirm the five tables exist and RLS is enabled.
5. Add a test sister only after creating an Argon2id hash using the server helper in a trusted local environment. Never insert a plaintext PIN.
6. Configure Upstash Redis before deploying; production rate limiting fails closed when Redis is absent.

## API contract

### `POST /api/wishes/lookup`

Request: `{ "name": "Priya" }`

- Active registered name: `{ "status": "pin_required", "displayName": "Priya" }`
- Unknown or inactive name: `{ "status": "common_wish", "displayName": "Priya", "wish": "..." }`

### `POST /api/wishes/verify`

Request: `{ "name": "Priya", "pin": "1234" }`

- Correct PIN: returns personal wish and optional memory.
- Incorrect PIN, unknown name, or inactive record: returns common wish with the same response shape.

### `GET /api/names`

Returns only `public_name_suggestions` where `is_visible = true`. Public suggestion names are intentionally separate from private sister records.

## Not yet complete / release blockers

- No Supabase project credentials have been supplied or connected; SQL has not been executed against a live database.
- The public UI is wired to lookup and verify endpoints; browser integration tests still need to run against a configured Supabase project.
- Admin authentication, role checks, and admin policies are Stage 5.
- Private photo upload and signed URL delivery are deferred until storage policies are reviewed.
- Progressive lockout, audit events for public attempts, CSRF review, and security testing require Stage 6.
- No production security claim is made until the database migration and tests run against a real Supabase project.

## Current verification record

- TypeScript/TSX transpilation syntax pass: all source files transpiled with no syntax diagnostics.
- `npm install --no-audit --no-fund`: timed out in this environment; dependencies are not installed.
- `npm run typecheck`, lint, Vitest, Playwright, and Next.js production build: not run because dependency installation did not complete.
- Migration: reviewed as source only; not executed against a Supabase database.
