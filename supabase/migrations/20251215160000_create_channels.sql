-- Create Channels Table
create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null, -- Domain this channel belongs to
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz default now()
);

-- Create Messages Table
create table if not exists channel_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references channels(id) on delete cascade not null,
  user_id uuid references auth.users(id) default auth.uid(),
  content text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table channels enable row level security;
alter table channel_messages enable row level security;

-- Enable Realtime for Messages
alter publication supabase_realtime add table channel_messages;

-- RLS Policies for CHANNELS

-- 1. View Channels: Users can see channels that belong to their domain
-- (Excluding public domains unless we want a valid 'public' domain logic, which we handle by forcing domain to be user's domain)
create policy "View channels of same domain" on channels
for select
to authenticated
using (
  domain = get_my_email_domain()
  and not is_public_domain(domain)
);

-- 2. Create Channels: Users can create channels for their own domain
create policy "Create channels for same domain" on channels
for insert
to authenticated
with check (
  domain = get_my_email_domain()
  and not is_public_domain(domain)
);

-- RLS Policies for MESSAGES

-- 1. View Messages: If user has access to the channel (same domain)
create policy "View messages of accessible channels" on channel_messages
for select
to authenticated
using (
  exists (
    select 1 from channels c
    where c.id = channel_messages.channel_id
    and c.domain = get_my_email_domain()
  )
);

-- 2. Insert Messages: If user has access to the channel
create policy "Send messages to accessible channels" on channel_messages
for insert
to authenticated
with check (
  exists (
    select 1 from channels c
    where c.id = channel_messages.channel_id
    and c.domain = get_my_email_domain()
  )
);
