# Stage 5 — Admin dashboard

## Delivered

- `/admin/login`: Supabase email/password login. A successful Auth login is not enough; the page checks `/api/admin/stats`, which verifies the user's `admin_profiles` role. Unauthorized users are signed out.
- `/admin`: server-protected dashboard with overview, sister records, public-name suggestions, wishes/story content, website settings and recent activity.
- Admin APIs under `/api/admin/*` verify the Supabase Auth user and `admin_profiles.role` on every request.
- Sister PINs are hashed with Argon2id and a server-only HMAC pepper before insertion. PIN hashes are never selected into API response payloads.
- Role policy: `admin` can manage records, reset PINs, edit settings and delete records; `editor` can read records and update non-PIN sister content through the API.
- Audit events record action, target and safe metadata; PIN values and wish bodies are not written into audit metadata.
- `0002_admin_policies.sql` enables narrow authenticated RLS policies. Apply after `0001_initial_schema.sql`.

## First-admin bootstrap

1. Create the first administrator in Supabase Authentication (email/password).
2. Open SQL Editor and run the following after replacing the email with the exact Auth email:

```sql
insert into public.admin_profiles (user_id, role)
select id, 'admin' from auth.users where lower(email) = lower('YOUR_ADMIN_EMAIL')
on conflict (user_id) do update set role = 'admin';
```

3. Do not expose the service-role key. The dashboard uses the user's Auth session and RLS.
4. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `PIN_HASH_PEPPER` in the hosting provider's encrypted environment variables. Keep `PIN_HASH_PEPPER` at least 32 characters and stable; changing it makes existing PIN hashes unverifiable.
5. Ensure the Upstash variables are configured before enabling the public PIN lookup endpoints in production.

## Routes

- `GET/POST /api/admin/sisters`
- `PATCH/DELETE /api/admin/sisters/:id`
- `GET/PUT /api/admin/settings`
- `GET/POST /api/admin/names`
- `PATCH/DELETE /api/admin/names/:id`
- `GET /api/admin/stats`
- `GET /api/admin/audit-logs?limit=50`

## Important security notes

- This stage has not been tested against a live Supabase project. Apply both migrations in order and verify RLS with an anonymous client and an authenticated non-admin user before launch.
- The `admin_profiles` table is self-readable only. The role-check helper functions are `SECURITY DEFINER`, use a fixed `search_path`, and expose only booleans.
- Never bootstrap an administrator by adding a public signup route. Create Auth users through the trusted Supabase dashboard or a separately secured invitation workflow.
- The admin dashboard currently uses server-verified role checks on every API request. Do not rely on hiding navigation links as authorization.
- Photo upload UI and storage policies are not part of this stage; do not store arbitrary public photo URLs as trusted content.
