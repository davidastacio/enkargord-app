alter table public.courier_routes
  add column if not exists metadata jsonb not null default '{}'::jsonb;
