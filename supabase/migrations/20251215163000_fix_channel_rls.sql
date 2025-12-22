-- Update RLS Policies for CHANNELS to allow public domains (for testing with Gmail)

-- Drop stricter policies
drop policy if exists "View channels of same domain" on channels;
drop policy if exists "Create channels for same domain" on channels;

-- Re-create policies without "not is_public_domain(domain)" check

-- 1. View Channels
create policy "View channels of same domain" on channels
for select
to authenticated
using (
  domain = get_my_email_domain()
);

-- 2. Create Channels
create policy "Create channels for same domain" on channels
for insert
to authenticated
with check (
  domain = get_my_email_domain()
);
