create extension if not exists pgcrypto;

create table if not exists public.billing_profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan_key text not null default 'free',
  subscription_status text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  is_gifted_lifetime boolean not null default false,
  is_owner boolean not null default false,
  raw_subscription jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_profiles_email_idx on public.billing_profiles (email);
create index if not exists billing_profiles_plan_key_idx on public.billing_profiles (plan_key);
create index if not exists billing_profiles_status_idx on public.billing_profiles (subscription_status);

create or replace function public.set_updated_at_billing_profiles()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_billing_profiles ON public.billing_profiles;
create trigger trg_set_updated_at_billing_profiles
before update on public.billing_profiles
for each row execute procedure public.set_updated_at_billing_profiles();
