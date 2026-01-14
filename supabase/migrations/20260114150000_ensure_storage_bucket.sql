-- Ensure storage bucket exists

insert into storage.buckets (id, name, public)
values ('meeting-recordings', 'meeting-recordings', false)
on conflict (id) do nothing;

-- Ensure RLS is enabled on objects (usually true by default but good to ensure)
-- alter table storage.objects enable row level security;

-- Policies for the bucket
drop policy if exists "Users can upload meeting recordings" on storage.objects;
create policy "Users can upload meeting recordings"
  on storage.objects for insert
  with check (
    bucket_id = 'meeting-recordings' and
    auth.uid() = owner
  );

drop policy if exists "Users can view their meeting recordings" on storage.objects;
create policy "Users can view their meeting recordings"
  on storage.objects for select
  using (
    bucket_id = 'meeting-recordings' and
    auth.uid() = owner
  );
