-- Hikes
create table if not exists hikes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  distance_km float,
  elevation_gain_m float,
  status text default 'draft' check (status in ('draft', 'planned', 'completed')),
  metadata jsonb default '{}'
);

-- Waypoints stockés en jsonb dans hikes pour simplicité
-- (pas de table séparée pour le MVP)

-- Gear items
create table if not exists gear_items (
  id uuid primary key default gen_random_uuid(),
  hike_id uuid references hikes(id) on delete cascade,
  name text not null,
  category text not null,
  weight_grams int,
  quantity int default 1,
  packed boolean default false,
  created_at timestamptz default now()
);

-- Tracks (enregistrements GPS)
create table if not exists tracks (
  id uuid primary key default gen_random_uuid(),
  hike_id uuid references hikes(id) on delete set null,
  name text,
  start_time timestamptz,
  end_time timestamptz,
  points jsonb default '[]',
  notes jsonb default '[]',
  created_at timestamptz default now()
);

-- RLS : désactiver pour le MVP (pas d'auth)
alter table hikes disable row level security;
alter table gear_items disable row level security;
alter table tracks disable row level security;
