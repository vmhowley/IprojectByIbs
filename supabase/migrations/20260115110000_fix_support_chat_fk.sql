-- Fix FK on support_chats to point to public.user_profiles to allow PostgREST embedding

DO $$
BEGIN
    -- Try to drop the constraint if it exists with the default name
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_chats_user_id_fkey') THEN
        ALTER TABLE support_chats DROP CONSTRAINT support_chats_user_id_fkey;
    END IF;
END $$;

-- Drop the column constraint if it was created inline unnamed (it usually gets a name like user_id_fkey)
-- We'll just try to add the new one. If the old one persists, it's just redundant but might not clash if names differ.
-- ideally we want to replace it.

-- Let's assume we can just alter the column type essentially? No.
-- Safer way:
alter table support_chats
  drop constraint if exists support_chats_user_id_fkey,
  add constraint support_chats_user_id_fkey
  foreign key (user_id)
  references public.user_profiles(id)
  on delete cascade;
