-- Update meetings RLS for domain-based sharing
drop policy if exists "Users can view their own meetings" on public.meetings;

create policy "Users can view meetings based on domain"
on public.meetings
for select
to authenticated
using (
  auth.uid() = user_id 
  OR 
  (
    NOT is_public_domain(get_my_email_domain()) 
    AND 
    get_user_domain_by_id(user_id) = get_my_email_domain()
  )
);

-- Also allow update/delete for colleagues if needed? 
-- The user said "ver", so we'll stick to select for now.
-- But usually, admins or staff should also see everything. 
-- The get_auth_user_client_id() might also be useful here if we want to follow the project pattern later.
