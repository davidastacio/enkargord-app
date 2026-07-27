create or replace function private.protect_user_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if current_user in ('postgres', 'service_role')
     or coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if new.firebase_uid is distinct from old.firebase_uid
     or new.organization_id is distinct from old.organization_id
     or new.store_id is distinct from old.store_id
     or new.courier_id is distinct from old.courier_id
     or new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.courier_mode_enabled is distinct from old.courier_mode_enabled then
    raise exception 'Privileged profile fields cannot be changed by the authenticated user';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_user_profile_privileges
  on public.user_profiles;

create trigger protect_user_profile_privileges
before update on public.user_profiles
for each row
execute function private.protect_user_profile_privileges();
