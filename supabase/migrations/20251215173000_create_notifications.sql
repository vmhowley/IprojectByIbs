-- Create Notifications Table
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  type text not null check (type in ('info', 'assignment', 'comment', 'system', 'mention')),
  title text not null,
  content text,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table notifications enable row level security;

-- Enable Realtime
alter publication supabase_realtime add table notifications;

-- RLS Policies

-- 1. View Notifications: Users can see their own notifications
create policy "View own notifications" on notifications
for select
to authenticated
using (
  auth.uid() = user_id
);

-- 2. Update Notifications: Users can update their own notifications (e.g. mark as read)
create policy "Update own notifications" on notifications
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

-- 3. Insert Notifications: 
-- Option A: Only Service Role can insert (System notifications).
-- Option B: Authenticated users can insert IF they are assigning someone else (e.g. peer assignment).
-- Let's go with Option B for flexibility, but maybe ensure they can't spam? 
-- For now, allow authenticated insert for any user_id (collaborative app style).
create policy "Insert notifications" on notifications
for insert
to authenticated
with check (
  true
);
