-- Update RLS Policies for Support Tables to include Admins

-- Helper function to check if user is admin
-- (Assuming public.user_profiles has a 'role' column)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.user_profiles
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- SUPPORT CHATS
-- Allow admins to view all chats
create policy "Admins can view all support chats" on support_chats
for select
to authenticated
using (
  public.is_admin()
);

-- Allow admins to update chats (e.g. close them)
create policy "Admins can update all support chats" on support_chats
for update
to authenticated
using (
  public.is_admin()
);

-- SUPPORT MESSAGES
-- Allow admins to view all messages
create policy "Admins can view all support messages" on support_messages
for select
to authenticated
using (
  public.is_admin()
);

-- Allow admins to send messages to any chat
create policy "Admins can send messages to all support chats" on support_messages
for insert
to authenticated
with check (
  public.is_admin()
);
