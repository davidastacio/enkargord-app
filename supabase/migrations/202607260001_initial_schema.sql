create extension if not exists pgcrypto;
create extension if not exists postgis with schema extensions;

create schema if not exists private;

create or replace function private.firebase_uid()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '');
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  firebase_uid text primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  store_id text,
  courier_id text,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  role text not null
    check (role in ('Admin', 'Tienda', 'Motorista', 'Cliente')),
  status text not null default 'active'
    check (status in ('active', 'pending', 'suspended', 'inactive')),
  courier_mode_enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  firebase_uid text not null references public.user_profiles(firebase_uid) on delete cascade,
  role text not null
    check (role in ('owner', 'admin', 'store', 'courier', 'viewer')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'suspended', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, firebase_uid)
);

create or replace function private.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_org
      and m.firebase_uid = private.firebase_uid()
      and m.status = 'active'
  );
$$;

create or replace function private.has_org_role(target_org uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_org
      and m.firebase_uid = private.firebase_uid()
      and m.status = 'active'
      and m.role = any(allowed_roles)
  );
$$;

create table if not exists public.stores (
  id text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_uid text references public.user_profiles(firebase_uid) on delete set null,
  commercial_name text not null,
  legal_name text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'inactive')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.couriers (
  id text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_uid text unique references public.user_profiles(firebase_uid) on delete set null,
  full_name text not null,
  email text not null default '',
  phone text not null default '',
  operational_type text not null default 'courier'
    check (operational_type in ('courier', 'admin_courier')),
  vehicle_type text not null default '',
  vehicle_plate text not null default '',
  vehicle_model text not null default '',
  vehicle_color text not null default '',
  status text not null default 'available'
    check (status in ('available', 'on_route', 'offline', 'suspended')),
  active boolean not null default true,
  current_order_count integer not null default 0 check (current_order_count >= 0),
  completed_order_count integer not null default 0 check (completed_order_count >= 0),
  commission_type text not null default 'fixed'
    check (commission_type in ('fixed', 'percentage')),
  commission_value numeric(12, 2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key
    check (id ~ '^ENK-[0-9]{8}-[A-Z0-9]{5}$'),
  tracking text not null unique
    check (tracking = id),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  store_id text references public.stores(id) on delete restrict,
  created_by_uid text not null,
  courier_id text references public.couriers(id) on delete set null,
  courier_uid text,
  courier_name text not null default '',
  courier_type text not null default 'courier',
  status text not null default 'pending',
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null default '',
  province_name text not null default '',
  municipality_name text not null default '',
  sector_name text not null default '',
  street text not null default '',
  reference text not null default '',
  formatted_address text not null default '',
  delivery_location extensions.geography(point, 4326),
  location_verified boolean not null default false,
  package_type text not null default 'Paquete',
  package_quantity integer not null default 1 check (package_quantity > 0),
  package_description text not null default '',
  requires_cash_on_delivery boolean not null default false,
  collection_amount numeric(12, 2) not null default 0,
  shipping_cost numeric(12, 2) not null default 0,
  payment_method text not null default 'cash',
  requires_fulfillment boolean not null default false,
  fulfillment_data jsonb,
  route_order integer,
  settlement_status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz
);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  order_id text not null references public.orders(id) on delete cascade,
  event_type text not null,
  previous_status text,
  new_status text,
  actor_uid text not null,
  actor_role text not null,
  courier_id text,
  note text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.courier_locations (
  courier_id text primary key references public.couriers(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  courier_uid text not null,
  location extensions.geography(point, 4326) not null,
  heading numeric(6, 2),
  speed numeric(8, 2),
  accuracy numeric(8, 2),
  tracking_status text not null default 'active',
  updated_at timestamptz not null default now()
);

create table if not exists public.courier_routes (
  id text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  courier_id text not null references public.couriers(id) on delete cascade,
  courier_uid text not null,
  status text not null default 'active'
    check (status in ('active', 'completed', 'cancelled')),
  order_ids text[] not null default '{}',
  current_order_index integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settlements (
  id text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id text references public.stores(id) on delete set null,
  courier_id text references public.couriers(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'submitted', 'approved', 'rejected', 'paid')),
  order_ids text[] not null default '{}',
  gross_amount numeric(12, 2) not null default 0,
  shipping_amount numeric(12, 2) not null default 0,
  commission_amount numeric(12, 2) not null default 0,
  net_amount numeric(12, 2) not null default 0,
  created_by_uid text not null,
  approved_by_uid text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.audit_logs (
  id text primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  action text not null,
  actor_uid text not null,
  actor_role text not null,
  target_type text not null,
  target_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_profiles_organization_idx
  on public.user_profiles (organization_id, role);
create index if not exists stores_organization_idx
  on public.stores (organization_id, status);
create index if not exists couriers_organization_status_idx
  on public.couriers (organization_id, status);
create index if not exists orders_organization_created_idx
  on public.orders (organization_id, created_at desc);
create index if not exists orders_store_created_idx
  on public.orders (organization_id, store_id, created_at desc);
create index if not exists orders_courier_status_idx
  on public.orders (organization_id, courier_id, status);
create index if not exists order_events_order_created_idx
  on public.order_events (order_id, created_at desc);
create index if not exists courier_locations_geo_idx
  on public.courier_locations using gist (location);
create index if not exists settlements_organization_status_idx
  on public.settlements (organization_id, status, created_at desc);

alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.stores enable row level security;
alter table public.couriers enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.courier_locations enable row level security;
alter table public.courier_routes enable row level security;
alter table public.settlements enable row level security;
alter table public.audit_logs enable row level security;

create policy "members read organizations"
  on public.organizations for select
  to authenticated
  using (private.is_org_member(id));

create policy "users read own profile"
  on public.user_profiles for select
  to authenticated
  using (
    firebase_uid = private.firebase_uid()
    or private.has_org_role(organization_id, array['owner', 'admin'])
  );

create policy "users update own profile"
  on public.user_profiles for update
  to authenticated
  using (firebase_uid = private.firebase_uid())
  with check (firebase_uid = private.firebase_uid());

create policy "members read memberships"
  on public.organization_members for select
  to authenticated
  using (
    firebase_uid = private.firebase_uid()
    or private.has_org_role(organization_id, array['owner', 'admin'])
  );

create policy "admins manage memberships"
  on public.organization_members for all
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']))
  with check (private.has_org_role(organization_id, array['owner', 'admin']));

create policy "members read stores"
  on public.stores for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy "admins manage stores"
  on public.stores for all
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']))
  with check (private.has_org_role(organization_id, array['owner', 'admin']));

create policy "members read couriers"
  on public.couriers for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy "admins manage couriers"
  on public.couriers for all
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']))
  with check (private.has_org_role(organization_id, array['owner', 'admin']));

create policy "members read orders"
  on public.orders for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy "admins and stores create orders"
  on public.orders for insert
  to authenticated
  with check (
    private.has_org_role(organization_id, array['owner', 'admin', 'store'])
    and created_by_uid = private.firebase_uid()
  );

create policy "operations update orders"
  on public.orders for update
  to authenticated
  using (
    private.has_org_role(organization_id, array['owner', 'admin'])
    or (
      private.has_org_role(organization_id, array['courier'])
      and courier_uid = private.firebase_uid()
    )
    or (
      private.has_org_role(organization_id, array['store'])
      and created_by_uid = private.firebase_uid()
    )
  )
  with check (private.is_org_member(organization_id));

create policy "admins delete orders"
  on public.orders for delete
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

create policy "members read order events"
  on public.order_events for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy "members create order events"
  on public.order_events for insert
  to authenticated
  with check (
    private.is_org_member(organization_id)
    and actor_uid = private.firebase_uid()
  );

create policy "members read locations"
  on public.courier_locations for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy "couriers update own location"
  on public.courier_locations for all
  to authenticated
  using (
    courier_uid = private.firebase_uid()
    or private.has_org_role(organization_id, array['owner', 'admin'])
  )
  with check (
    courier_uid = private.firebase_uid()
    or private.has_org_role(organization_id, array['owner', 'admin'])
  );

create policy "members read routes"
  on public.courier_routes for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy "couriers manage own routes"
  on public.courier_routes for all
  to authenticated
  using (
    courier_uid = private.firebase_uid()
    or private.has_org_role(organization_id, array['owner', 'admin'])
  )
  with check (
    courier_uid = private.firebase_uid()
    or private.has_org_role(organization_id, array['owner', 'admin'])
  );

create policy "members read settlements"
  on public.settlements for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy "admins manage settlements"
  on public.settlements for all
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']))
  with check (private.has_org_role(organization_id, array['owner', 'admin']));

create policy "admins read audit logs"
  on public.audit_logs for select
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.couriers;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.courier_locations;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.courier_routes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.order_events;
exception when duplicate_object then null;
end $$;

