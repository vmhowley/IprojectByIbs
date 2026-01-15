-- Create Support Chats Table
create table if not exists support_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  status text check (status in ('open', 'closed', 'archived')) default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create Support Messages Table
create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references support_chats(id) on delete cascade not null,
  sender_id uuid references auth.users(id) not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table support_chats enable row level security;
alter table support_messages enable row level security;

-- Enable Realtime
alter publication supabase_realtime add table support_messages;

-- RLS Policies for SUPPORT CHATS

-- 1. View Chats: Users see their own, Admins (service role or specific role) see all
-- For simplicity, assuming any authenticated user can see their own.
-- TODO: Add Admin check policy
create policy "Users can view own support chats" on support_chats
for select
to authenticated
using (
  auth.uid() = user_id
);

-- 2. Create Chats: Users can create their own
create policy "Users can create own support chats" on support_chats
for insert
to authenticated
with check (
  auth.uid() = user_id
);

-- RLS Policies for SUPPORT MESSAGES

-- 1. View Messages: Users see messages of their own chats
create policy "Users can view messages of own support chats" on support_messages
for select
to authenticated
using (
  exists (
    select 1 from support_chats c
    where c.id = support_messages.chat_id
    and c.user_id = auth.uid()
  )
);

-- 2. Send Messages: Users can send messages to their own chats
create policy "Users can send messages to own support chats" on support_messages
for insert
to authenticated
with check (
  exists (
    select 1 from support_chats c
    where c.id = support_messages.chat_id
    and c.user_id = auth.uid()
  )
  and
  auth.uid() = sender_id
);
