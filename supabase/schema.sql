-- RSO database schema — run this in the Supabase SQL editor.
-- Row Level Security is enabled on every table.
-- NFL stats stay in the app's mock data layer; everything here is user/editor data.

-- ===========================================================================
-- profiles
-- ===========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  favorite_team_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- fan_ballots / fan_ballot_picks  (one ballot per user per position per week)
-- ===========================================================================
create table if not exists public.fan_ballots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  position text not null,
  ballot_type text not null check (ballot_type in ('top10', 'top20')),
  week int not null,
  created_at timestamptz not null default now(),
  unique (user_id, position, week)
);

alter table public.fan_ballots enable row level security;

create policy "Users manage their own ballots"
  on public.fan_ballots for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.fan_ballot_picks (
  ballot_id uuid not null references public.fan_ballots(id) on delete cascade,
  player_id text not null,
  slot int not null check (slot between 1 and 20),
  primary key (ballot_id, slot)
);

alter table public.fan_ballot_picks enable row level security;

create policy "Users manage their own ballot picks"
  on public.fan_ballot_picks for all
  using (exists (
    select 1 from public.fan_ballots b
    where b.id = ballot_id and b.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.fan_ballots b
    where b.id = ballot_id and b.user_id = auth.uid()
  ));

-- Aggregated fan ranking (every visitor sees the same result). Security-definer
-- so it can read all ballots while RLS still restricts direct table access.
-- Top 20: 1st = 20 … 20th = 1.  Top 10: 1st = 10 … 10th = 1.
create or replace function public.fan_ranking(p_position text, p_week int)
returns table (player_id text, points bigint)
language sql security definer set search_path = '' as $$
  select pk.player_id,
         sum(
           case when b.ballot_type = 'top20' then (21 - pk.slot)
                else (11 - pk.slot) end
         )::bigint as points
  from public.fan_ballot_picks pk
  join public.fan_ballots b on b.id = pk.ballot_id
  where b.position = p_position
    and b.week = p_week
    and ((b.ballot_type = 'top20' and pk.slot <= 20)
      or (b.ballot_type = 'top10' and pk.slot <= 10))
  group by pk.player_id
  order by points desc;
$$;

grant execute on function public.fan_ranking(text, int) to anon, authenticated;

-- ===========================================================================
-- media_rankings / media_power_rankings  (editor-maintained, admin-only writes)
-- ===========================================================================
create table if not exists public.media_rankings (
  id uuid primary key default gen_random_uuid(),
  position text not null,
  week int not null,
  player_ids text[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique (position, week)
);

alter table public.media_rankings enable row level security;

create policy "Media rankings readable by everyone"
  on public.media_rankings for select using (true);

create policy "Only admins write media rankings"
  on public.media_rankings for all
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create table if not exists public.media_power_rankings (
  id uuid primary key default gen_random_uuid(),
  week int not null unique,
  team_ids text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.media_power_rankings enable row level security;

create policy "Power rankings readable by everyone"
  on public.media_power_rankings for select using (true);

create policy "Only admins write power rankings"
  on public.media_power_rankings for all
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

-- ===========================================================================
-- fantasy_teams / fantasy_roster
-- ===========================================================================
create table if not exists public.fantasy_teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  league_name text,
  created_at timestamptz not null default now()
);

alter table public.fantasy_teams enable row level security;

create policy "Users manage their own fantasy teams"
  on public.fantasy_teams for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.fantasy_roster (
  team_id uuid not null references public.fantasy_teams(id) on delete cascade,
  player_id text not null,
  slot text,
  is_starter boolean not null default false,
  primary key (team_id, player_id)
);

alter table public.fantasy_roster enable row level security;

create policy "Users manage their own roster"
  on public.fantasy_roster for all
  using (exists (
    select 1 from public.fantasy_teams t
    where t.id = team_id and t.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.fantasy_teams t
    where t.id = team_id and t.user_id = auth.uid()
  ));

-- ===========================================================================
-- Seed your own account as admin (after signing up once):
--   update public.profiles set role = 'admin' where id = '<your-auth-user-id>';
-- ===========================================================================
