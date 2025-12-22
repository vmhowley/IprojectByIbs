-- Fix Foreign Key for channel_messages to point to user_profiles (public)
-- This allows PostgREST to join with user details (name, avatar)

alter table channel_messages
  drop constraint if exists channel_messages_user_id_fkey;

alter table channel_messages
  add constraint channel_messages_user_id_fkey
  foreign key (user_id)
  references public.user_profiles(id)
  on delete cascade;
