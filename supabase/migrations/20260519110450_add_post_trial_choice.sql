-- Records when a free user explicitly chose to stay on the free plan after
-- their 7-day trial expired. While null AND the user has no paid subscription
-- AND their trial has expired, the post-trial paywall modal is shown on every
-- page load and blocks interaction until they pick a plan.
--
-- Users who upgrade to Core/Premium bypass this flag — the modal only renders
-- for plan_id='free' users, and a paid subscription removes them from that set.

alter table public.profiles
add column if not exists post_trial_choice_at timestamptz;
