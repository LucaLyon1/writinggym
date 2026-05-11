<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into ProseLab. Here is a summary of all changes made:

- **`instrumentation-client.ts`** (new) — Initializes `posthog-js` client-side using the EU host via a reverse proxy (`/ingest`), with exception tracking and debug mode in development.
- **`next.config.ts`** — Added EU reverse proxy rewrites for `/ingest/static/*`, `/ingest/array/*`, and `/ingest/*` paths, plus `skipTrailingSlashRedirect: true`.
- **`lib/posthog-server.ts`** (new) — Server-side PostHog client helper using `posthog-node`, configured for immediate flushing suitable for short-lived Next.js server functions.
- **`components/PostHogIdentify.tsx`** (new) — Client component mounted in the root layout that calls `posthog.identify()` with the Supabase user ID and email on every page load.
- **`app/layout.tsx`** — Added `<PostHogIdentify />` component for client-side user identification.
- **`app/actions/auth.ts`** — Added server-side `posthog.identify()` and `user_signed_up` / `user_logged_in` capture on successful signup and login.
- **`app/api/stripe-webhook/route.ts`** — Added server-side capture for `subscription_activated`, `subscription_canceled`, and `invoice_payment_failed` in the relevant webhook handlers.
- **`app/api/completions/route.ts`** — Added server-side `writing_submitted` capture after a passage completion is saved.
- **`app/api/feedback/route.ts`** — Added `free_analysis_paywall_hit` capture when a free user is blocked, and `writing_analyzed` capture when AI feedback is returned successfully.
- **`components/checkout/CheckoutButton.tsx`** — Added client-side `checkout_initiated` capture when the user clicks the checkout button.
- **`components/checkout/PricingPlans.tsx`** — Added client-side `billing_cycle_toggled` capture when the user switches between yearly and monthly billing.
- **`app/playground/page.tsx`** — Added client-side `playground_writing_submitted` and `playground_analysis_requested` captures in `handleSubmit` and `handleAnalyze`.

## Events

| Event | Description | File |
|-------|-------------|------|
| `user_signed_up` | New user completes signup with email/password | `app/actions/auth.ts` |
| `user_logged_in` | User signs in with email/password | `app/actions/auth.ts` |
| `checkout_initiated` | User clicks checkout button to start Stripe flow | `components/checkout/CheckoutButton.tsx` |
| `billing_cycle_toggled` | User switches between yearly/monthly billing | `components/checkout/PricingPlans.tsx` |
| `subscription_activated` | Stripe webhook confirms new subscription saved to DB | `app/api/stripe-webhook/route.ts` |
| `subscription_canceled` | Stripe webhook confirms subscription deleted | `app/api/stripe-webhook/route.ts` |
| `invoice_payment_failed` | Stripe webhook reports a payment failure | `app/api/stripe-webhook/route.ts` |
| `writing_submitted` | User saves a writing submission for a passage | `app/api/completions/route.ts` |
| `writing_analyzed` | User receives AI feedback on a passage rewrite | `app/api/feedback/route.ts` |
| `free_analysis_paywall_hit` | Free user blocked from analysis — upgrade intent signal | `app/api/feedback/route.ts` |
| `playground_writing_submitted` | User saves writing in the playground | `app/playground/page.tsx` |
| `playground_analysis_requested` | User requests author-style analysis in playground | `app/playground/page.tsx` |

## Next steps

We've built a dashboard and five insights to track key user behavior:

**Dashboard:** [Analytics basics](https://eu.posthog.com/project/174011/dashboard/672732)

**Insights:**
- [Signup → Checkout → Subscription funnel](https://eu.posthog.com/project/174011/insights/lNziGpq6) — 14-day conversion funnel from signup to paid plan
- [New signups over time](https://eu.posthog.com/project/174011/insights/fcp70xX9) — Daily new user registrations
- [Writing activity](https://eu.posthog.com/project/174011/insights/BZQgHz1r) — Daily extract + playground writing submissions (core engagement metric)
- [Paywall hits (free analysis limit)](https://eu.posthog.com/project/174011/insights/Jh22vnxb) — Free users hitting the analysis gate; high counts = strong upgrade signals
- [Subscription activations vs cancellations](https://eu.posthog.com/project/174011/insights/HYdGSLOX) — Weekly churn health: new subscribers vs cancellations

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
