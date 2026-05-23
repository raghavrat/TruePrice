-- TruePrice Supabase schema.
-- Run in the Supabase SQL editor (or `supabase db push`).

-- =====================================================================
-- Global domain profiles cache (shared across all users).
-- Written only by the /api/ai/profile route via the service role.
-- =====================================================================
create table if not exists public.domain_profiles (
  domain                text primary key,
  category              text not null default 'generic',
  wh_per_minute_active  double precision not null default 0,
  wh_per_mb_transferred double precision not null default 0.81,
  co2_multiplier        double precision not null default 1,
  water_multiplier      double precision not null default 1,
  land_multiplier       double precision not null default 1,
  confidence            double precision not null default 0.5,
  source                text not null default 'ai',
  created_at            timestamptz not null default now()
);

alter table public.domain_profiles enable row level security;

-- Anyone may read profiles (they contain no user data); writes go through
-- the service role, which bypasses RLS.
drop policy if exists "domain_profiles_read" on public.domain_profiles;
create policy "domain_profiles_read"
  on public.domain_profiles for select
  using (true);

-- =====================================================================
-- Global product footprint cache (Amazon overlay). Shared across users.
-- Written only by the /api/ai/product route via the service role.
-- =====================================================================
create table if not exists public.product_profiles (
  title_hash  text primary key,
  title       text not null,
  category    text not null default 'other',
  co2_kg      double precision not null default 0,
  water_l     double precision not null default 0,
  energy_kwh  double precision not null default 0,
  confidence  double precision not null default 0.5,
  source      text not null default 'ai',
  created_at  timestamptz not null default now()
);

alter table public.product_profiles enable row level security;

drop policy if exists "product_profiles_read" on public.product_profiles;
create policy "product_profiles_read"
  on public.product_profiles for select
  using (true);

-- =====================================================================
-- Per-user, per-day, per-category aggregates (cloud sync).
-- =====================================================================
create table if not exists public.daily_aggregates (
  user_id      uuid not null references auth.users (id) on delete cascade,
  day          date not null,
  category     text not null,
  kwh          double precision not null default 0,
  gco2         double precision not null default 0,
  liters_water double precision not null default 0,
  m2_land      double precision not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (user_id, day, category)
);

alter table public.daily_aggregates enable row level security;

drop policy if exists "daily_aggregates_owner" on public.daily_aggregates;
create policy "daily_aggregates_owner"
  on public.daily_aggregates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================================================================
-- Per-user, per-day, per-domain aggregates. Domain is hashed so the DB
-- never stores raw hostnames against a user.
-- =====================================================================
create table if not exists public.domain_aggregates (
  user_id        uuid not null references auth.users (id) on delete cascade,
  day            date not null,
  domain_hash    text not null,
  category       text not null,
  visit_count    integer not null default 0,
  active_seconds double precision not null default 0,
  bytes          double precision not null default 0,
  kwh            double precision not null default 0,
  gco2           double precision not null default 0,
  updated_at     timestamptz not null default now(),
  primary key (user_id, day, domain_hash)
);

alter table public.domain_aggregates enable row level security;

drop policy if exists "domain_aggregates_owner" on public.domain_aggregates;
create policy "domain_aggregates_owner"
  on public.domain_aggregates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
