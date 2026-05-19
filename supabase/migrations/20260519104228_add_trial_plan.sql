-- Add 'trial' plan and tighten the free plan to 3 analyses/week.
--
-- The trial plan is what new users effectively get for their first 7 days.
-- Assignment is currently driven in application code by auth.users.created_at
-- (see isWithinFreeTrial in lib/trial.ts), so no subscription row is created.
-- Adding the row here lets the DB describe the plan's entitlements and lets
-- subscriptions.plan_id eventually reference it if we wire that up later.

insert into public.plans (
  id,
  label,
  price_monthly_cents,
  stripe_lookup_key,
  weekly_analysis_limit,
  extract_access,
  has_playground,
  has_custom_voice
) values (
  'trial',
  'Trial',
  0,
  null,
  null,           -- unlimited analyses during the 7-day window
  'full',
  true,
  true
)
on conflict (id) do update set
  label                 = excluded.label,
  price_monthly_cents   = excluded.price_monthly_cents,
  stripe_lookup_key     = excluded.stripe_lookup_key,
  weekly_analysis_limit = excluded.weekly_analysis_limit,
  extract_access        = excluded.extract_access,
  has_playground        = excluded.has_playground,
  has_custom_voice      = excluded.has_custom_voice;

-- Free post-trial: 3 analyses per week.
-- This matches FREE_WEEKLY_ANALYSIS_LIMIT in lib/plan.ts.
update public.plans
set weekly_analysis_limit = 3
where id = 'free';
