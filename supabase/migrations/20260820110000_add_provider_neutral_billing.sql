-- Keep legacy Stripe records readable while allowing Whop to become the active
-- checkout and subscription provider.
alter table public.subscriptions
  add column billing_provider text not null default 'stripe',
  add column external_customer_id text,
  add column external_subscription_id text,
  add column external_plan_id text,
  add column manage_url text,
  add column provider_updated_at timestamptz;

alter table public.subscriptions
  add constraint subscriptions_billing_provider_check
  check (billing_provider in ('stripe', 'whop'));

update public.subscriptions
set
  external_customer_id = stripe_customer_id,
  external_subscription_id = stripe_subscription_id,
  external_plan_id = stripe_price_id
where billing_provider = 'stripe';

create unique index subscriptions_provider_external_id_key
  on public.subscriptions (billing_provider, external_subscription_id)
  where external_subscription_id is not null;

create table public.billing_webhook_events (
  id text primary key,
  provider text not null check (provider in ('stripe', 'whop')),
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.billing_webhook_events enable row level security;

comment on table public.billing_webhook_events is
  'Service-role-only webhook idempotency ledger.';
