create policy "store owners update own store"
  on public.stores for update
  to authenticated
  using (owner_uid = private.firebase_uid())
  with check (owner_uid = private.firebase_uid());
