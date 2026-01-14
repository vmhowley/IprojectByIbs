-- Create meetings table
create table if not exists public.meetings (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  date timestamptz not null default now(),
  transcription text,
  summary text,
  action_items jsonb default '[]'::jsonb,
  audio_url text,
  user_id uuid references auth.users(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.meetings enable row level security;

-- Policies for meetings table
drop policy if exists "Users can view their own meetings" on public.meetings;
create policy "Users can view their own meetings"
  on public.meetings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own meetings" on public.meetings;
create policy "Users can insert their own meetings"
  on public.meetings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own meetings" on public.meetings;
create policy "Users can update their own meetings"
  on public.meetings for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own meetings" on public.meetings;
create policy "Users can delete their own meetings"
  on public.meetings for delete
  using (auth.uid() = user_id);

-- Storage bucket for recordings
insert into storage.buckets (id, name, public)
values ('meeting-recordings', 'meeting-recordings', false)
on conflict (id) do nothing;

-- Storage policies
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
