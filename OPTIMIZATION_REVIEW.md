# ProseLab optimization review — 8 September 2026

## Implemented

- Consolidated middleware session refresh and user validation into one verified
  `getUser()` call. Redirects now preserve refreshed or cleared auth cookies.
- Allowed the legacy Stripe webhook to reach its signature-verifying handler
  without a browser login. Favicon and manifest requests bypass auth middleware.
- Keyed the client analysis cache by passage ID, source text, and constraint,
  limited it to 20 entries per mounted hook, and canceled obsolete requests.
  Late responses cannot replace the current exercise or leave cached views loading.
- Released audio objects and blob URLs on stop, unmount, completion, playback
  error, and rejected playback. Aborted requests cannot reset a newer request.
- Replaced the sidebar's cross-account trial cache and separate user request
  with an auth-state subscription. Hoisted the static passage lookup out of
  submission-list renders and stabilized the sidebar context value.
- Removed four lint errors around state updates in effects. Onboarding restores
  scroll state on unmount and remains dismissible if browser storage is blocked.
  Username editing now closes after each successful save, including repeat saves.
- Allowed Next's dynamic-rendering signal to propagate from the root layout,
  eliminating misleading auth-error logs during prerender checks.
- Updated Next.js and its ESLint configuration from 16.1.6 to 16.3.4, then applied
  compatible dependency advisory fixes. `npm audit fix --ignore-scripts` reported
  zero known vulnerabilities across the resulting dependency tree. This is an
  advisory scan, not evidence that the app has no security bugs.
- Added mocked middleware and React hook regression tests, and replaced the
  prototype README with current architecture, setup, and verification guidance.
  The environment example now includes Supabase, AI, analytics, and email keys.

## Verification

- All 37 tests pass, up from 16 before this pass.
- TypeScript checking and the Next.js 16.3.4 production build pass.
- ESLint reports zero errors and 12 warnings in existing image, checkout, and
  unused-variable code. The build retains the middleware-to-proxy deprecation
  warning; that runtime migration was not included.
- The locally served production build returns 200 for the homepage and manifest,
  redirects an anonymous profile request to signup with its destination intact,
  and rejects an unsigned Stripe webhook with 400 at signature verification.
- No interactive browser or authenticated purchase flow was exercised. Hook
  tests simulate DOM and audio behavior; they do not measure real audio quality
  or provider latency.

## Highest-value remaining work

1. **Enforce AI budgets atomically on the server.** `app/api/feedback/route.ts`
   records usage after generation, but does not check or reserve quota before the
   provider call. `app/api/chat/route.ts` accepts an unbounded message history.
   Define allowances for each feature, enforce input and conversation limits,
   and use a transactional reservation with refunds for failed generations.
   Validate against the actual database RPC definitions before changing billing
   behavior. Client-side gating alone does not enforce a usage budget.

2. **Paginate the community feed in Postgres.** Both `lib/explore-feed.ts` and
   `app/api/explore/route.ts` fetch public submissions, sort in JavaScript, and
   only then take a page. This transfers unnecessary writing text and can produce
   incomplete rankings when the API's row limit is reached. Use one shared query
   backed by an RLS-respecting view or RPC, database ordering by vote count,
   completion time and ID, and pagination before transferring full text. Test
   with more rows than the configured API cap and tied vote/time values.

3. **Validate the shared AI cache at its boundary.** `app/api/analyse/route.ts`
   accepts the passage ID and source text from the caller, while its database
   cache is keyed only by ID and normalized constraint. Resolve curated passages
   on the server, include a source/prompt version in cache identity, validate the
   returned JSON structure, and coalesce simultaneous misses. The client cache
   fix in this pass does not change that server cache contract.

4. **Make the database reproducible.** The repository contains incremental
   migrations, but not the full base schema and RPC definitions represented by
   `types/database.types.ts`. Establish a baseline in a disposable development
   database, preserve RLS and grants, and add migration checks before making
   feed or quota changes. No production schema changes were made in this pass.

The existing checkout, OAuth, profile, and styling edits were preserved. No
deployment, production data mutation, or live paid-provider test was performed.

## Reference material

- [Supabase SSR clients and session handling](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [React effect cleanup and stale-response handling](https://react.dev/reference/react/useEffect)
- [Next.js 16.3.4 release](https://github.com/vercel/next.js/releases/tag/v16.3.4)

No latency percentage is claimed: the improvements are supported by removed
work, resource-lifecycle checks, and regression tests, not a production benchmark.
