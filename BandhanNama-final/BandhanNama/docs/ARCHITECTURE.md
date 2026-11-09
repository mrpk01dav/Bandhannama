# BandhanNama architecture

## Application boundaries

- `src/app`: Next.js routes, layouts, route handlers and page composition.
- `src/components`: reusable presentation and interaction components.
- `src/lib`: server utilities, validation, Supabase clients and domain logic.
- `src/types`: shared TypeScript types; database types will be generated from Supabase.
- `supabase/migrations`: reviewed SQL migrations and row-level security policies.
- `tests/unit`, `tests/integration`, `tests/e2e`: isolated test layers.

## Trust boundaries

1. Browser code may use only the Supabase publishable/anon key and public data endpoints.
2. Private sister records, PIN hashes, personal wishes and memory references are server-only.
3. PIN verification, privileged writes, audit signing and admin authorization run on the server.
4. The service-role key, PIN pepper and audit HMAC key must never use a `NEXT_PUBLIC_` prefix.
5. Public name suggestions are a separate dataset; the public lookup must not enumerate private sister records.

## Public lookup contract (planned)

The public interface submits a display name and, only when the server determines a registered active match exists, a PIN. The server returns either a private unlocked wish or the common wish. Unknown names, inactive records and failed PIN verification must not disclose record existence. Rate limits and generic errors are required before public release.

## Release gates

- Database RLS and server authorization reviewed.
- PIN hashing and verification tests pass.
- Rate limits and generic fallback behavior verified.
- No secrets or private records in client bundles, logs or repository history.
- Keyboard, screen-reader, reduced-motion and mobile checks pass.
