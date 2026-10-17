# ChargeWise — Supabase setup

ChargeWise uses Supabase Auth plus five tables protected by Row Level Security.
Only the **anon (public) key** is used in the frontend. Never put the service-role key in the app.

## 1. Connect the project

Provide `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, or paste the URL and anon key into
`utils/supabase.ts` (`FALLBACK_URL`, `FALLBACK_ANON_KEY`).

In **Authentication → URL Configuration**, add your site URL and these redirect URLs:

- `https://<your-site>/welcome` (email confirmation)
- `https://<your-site>/reset-password` (password recovery)

Email confirmation and password-reset emails only work if email is enabled in your Supabase project.

## 2. Run this SQL (SQL Editor)

```sql
-- Profiles ---------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  onboarding_done boolean not null default false,
  created_at timestamptz not null default now()
);

-- Vehicles ---------------------------------------------------------------
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preset_id text,
  brand text not null,
  model text not null,
  battery_kwh numeric check (battery_kwh is null or battery_kwh between 5 and 200),
  efficiency_kwh_100km numeric check (efficiency_kwh_100km is null or efficiency_kwh_100km between 5 and 40),
  connectors text[] not null default '{}',
  battery_pct int check (battery_pct is null or battery_pct between 0 and 100),
  reserve_pct int not null default 15 check (reserve_pct between 0 and 60),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vehicles_user_idx on public.vehicles(user_id);

-- Preferences ------------------------------------------------------------
create table if not exists public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark' check (theme in ('dark','light')),
  priority_mode text not null default 'balanced' check (priority_mode in ('balanced','cost','wait','fast')),
  default_reserve int not null default 15 check (default_reserve between 0 and 60),
  sound_on boolean not null default false
);

-- Saved stations ---------------------------------------------------------
create table if not exists public.saved_stations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  station_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, station_id)
);

-- Journey history --------------------------------------------------------
create table if not exists public.journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  origin_name text not null,
  destination_name text not null,
  summary jsonb not null,
  feasible boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists journeys_user_idx on public.journeys(user_id, created_at desc);

-- Row Level Security: owners only ----------------------------------------
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.preferences enable row level security;
alter table public.saved_stations enable row level security;
alter table public.journeys enable row level security;

create policy "profiles_owner" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "vehicles_owner" on public.vehicles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "preferences_owner" on public.preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "saved_stations_owner" on public.saved_stations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "journeys_owner" on public.journeys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Create a profile row on signup ------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Self-service account deletion (only ever deletes the caller) -----------
create or replace function public.delete_own_account()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
```

Deleting the auth user cascades to every table above.

## Notes

- XP and badges are stored in the browser per account, not in the database.
- Station, price, availability and wait data come from the simulated network model in `data/stations.ts` — the database never stores or serves station data.
