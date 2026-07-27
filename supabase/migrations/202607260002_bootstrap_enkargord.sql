insert into public.organizations (name, slug, status)
values ('EnkargoRD', 'enkargord', 'active')
on conflict (slug) do update
set
  name = excluded.name,
  status = excluded.status,
  updated_at = now();

insert into public.user_profiles (
  firebase_uid,
  organization_id,
  name,
  email,
  phone,
  role,
  status
)
select
  'WLn6BHclMUgMrbmEyIAgxyEIMQi2',
  organization.id,
  'Administrador EnkargoRD',
  '',
  '',
  'Admin',
  'active'
from public.organizations organization
where organization.slug = 'enkargord'
on conflict (firebase_uid) do update
set
  organization_id = excluded.organization_id,
  role = 'Admin',
  status = 'active',
  updated_at = now();

insert into public.organization_members (
  organization_id,
  firebase_uid,
  role,
  status
)
select
  organization.id,
  'WLn6BHclMUgMrbmEyIAgxyEIMQi2',
  'owner',
  'active'
from public.organizations organization
where organization.slug = 'enkargord'
on conflict (organization_id, firebase_uid) do update
set
  role = 'owner',
  status = 'active',
  updated_at = now();
