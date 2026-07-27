-- Migration 202607260006: Allow store owners and admins to insert collaborator profiles & memberships

-- 1. Allow inserting user profiles if creating own profile or if caller is an org member (store owner/admin)
drop policy if exists "users insert own or org profiles" on public.user_profiles;
create policy "users insert own or org profiles"
  on public.user_profiles for insert
  to authenticated
  with check (
    firebase_uid = private.firebase_uid()
    or private.has_org_role(organization_id, array['owner', 'admin', 'store'])
  );

-- 2. Allow inserting organization members for store owners and admins
drop policy if exists "stores insert organization members" on public.organization_members;
create policy "stores insert organization members"
  on public.organization_members for insert
  to authenticated
  with check (
    private.has_org_role(organization_id, array['owner', 'admin', 'store'])
  );
