# BandhanNama

**One bond. Countless memories. Infinite love.**

A mobile-first digital Bhai Dooj experience with a public celebration flow and a private, role-protected admin dashboard.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Supabase Auth and PostgreSQL
- Argon2id PIN hashing with a server-only HMAC pepper
- Upstash Redis rate limiting
- Vitest and Playwright foundations

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure the required environment variables before using database-backed features. Never commit `.env.local` or any service-role key, database password, PIN pepper, or audit secret.

## Database setup

Apply the migrations in order using Supabase SQL Editor:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_admin_policies.sql`

Then create the first Auth user and bootstrap its admin profile using the SQL instructions in `docs/STAGE-5-ADMIN-DASHBOARD.md`.

## Admin dashboard

- `/admin/login` — Supabase email/password login
- `/admin` — protected dashboard
- Sister management, public name suggestions, editable festival messages, website settings and recent audit activity

Every admin API request validates the Auth session and `admin_profiles` role. Client-side navigation is not an authorization boundary.

## Project stages

- Stage 1: product planning and architecture
- Stage 2: application initialization
- Stage 3: public Bhai Dooj experience
- Stage 4: backend, database schema and secure wish lookup foundation
- Stage 5: admin dashboard and role-protected management APIs
- Stage 6: security hardening and authorization review
- Stage 7: integration, accessibility and end-to-end QA
- Stage 8: deployment and production verification

## Current verification status

The source scaffold and configuration files are prepared. A live Supabase migration, dependency installation, production build, API integration tests and browser E2E tests have not yet been verified in this environment. Do not treat this repository as production-ready until those checks pass.

## Attribution

Created with love by PRINCE KUMAR ❤️
