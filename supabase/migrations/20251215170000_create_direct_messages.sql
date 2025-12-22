-- Create Direct Messages Table
create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) default auth.uid(),
  receiver_id uuid references auth.users(id) not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table direct_messages enable row level security;

-- Enable Realtime
alter publication supabase_realtime add table direct_messages;

-- RLS Policies

-- 1. View Messages: Users can see messages where they are sender or receiver
create policy "View direct messages" on direct_messages
for select
to authenticated
using (
  auth.uid() = sender_id or auth.uid() = receiver_id
);

-- 2. Send Messages: Users can insert messages where they are the sender
create policy "Send direct messages" on direct_messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
);

-- 3. Update Messages (e.g. mark as read): Users can update messages sent to them
create policy "Update direct messages" on direct_messages
for update
to authenticated
using (
  auth.uid() = receiver_id
)
with check (
  auth.uid() = receiver_id
);
