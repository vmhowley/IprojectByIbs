-- Add 'support_agent' to allowed roles
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_role_check
CHECK (role IN ('admin', 'user', 'guest', 'support_agent'));

-- Update Helper Function (if needed, but we'll use RLS directly)
create or replace function public.is_support_staff()
returns boolean as $$
begin
  return exists (
    select 1 from public.user_profiles
    where id = auth.uid()
    and role = 'support_agent'
  );
end;
$$ language plpgsql security definer;

-- Update RLS Policies for SUPPORT CHATS
-- Update Admin policy to include support_agents
drop policy if exists "Admins can view all support chats" on support_chats;
create policy "Staff can view all support chats" on support_chats
for select
to authenticated
using (
  public.is_support_staff()
  OR
  auth.uid() = user_id -- Users still see their own
);

drop policy if exists "Admins can update all support chats" on support_chats;
create policy "Staff can update all support chats" on support_chats
for update
to authenticated
using (
  public.is_support_staff()
);

-- SUPPORT MESSAGES
drop policy if exists "Admins can view all support messages" on support_messages;
create policy "Staff can view all support messages" on support_messages
for select
to authenticated
using (
  public.is_support_staff()
  OR
  exists ( -- Users see their own chat messages
     select 1 from support_chats c
     where c.id = support_messages.chat_id
     and c.user_id = auth.uid()
  )
);

drop policy if exists "Admins can send messages to all support chats" on support_messages;
create policy "Staff can send messages to all support chats" on support_messages
for insert
to authenticated
with check (
  public.is_support_staff() 
);
