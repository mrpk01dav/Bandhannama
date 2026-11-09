# Stage 3 — Public experience

## Implemented
- Mobile-first cinematic welcome scene with animated diya, decorative mandala and floating light particles.
- Name-entry form with client-side validation and accessible error feedback.
- Common-wish reveal personalized with the visitor's entered name.
- Three-part Bhai Dooj story with previous/continue navigation.
- Brother's message and final celebration screen.
- Replay flow, reduced-motion support, keyboard focus styles and responsive layouts.
- Search/social metadata foundation; indexing remains disabled until launch readiness.

## Intentionally deferred to Stage 4
- Registered-sister lookup and secure PIN verification. The browser must never receive the private sister list or PIN hashes. The current Stage 3 journey uses the common wish for every entered name until the secure server-side lookup endpoint is implemented.
- Admin-editable wish/message/story content.
- Supabase-backed content and optional memory/photo retrieval.
- Configurable DM contact link and actual audio playback (no audio asset or destination has been provided; music remains absent rather than simulated).

## Verification
- E2E tests cover the public common-wish journey and empty-name validation.
- Runtime/build/lint/typecheck still require dependency installation and execution in an environment with npm registry access.
