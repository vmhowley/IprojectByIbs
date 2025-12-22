create table if not exists ticket_subtasks (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references tickets(id) on delete cascade not null,
  title text not null,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table ticket_subtasks enable row level security;

-- Create policies (drop first to ensure idempotency if desired, or use DO blocks, but simple IF NOT EXISTS is good for tables. Policies might error if they exist, so we can wrap them)
do $$
begin
    if not exists (select 1 from pg_policies where policyname = 'Users can view subtasks for visible tickets' and tablename = 'ticket_subtasks') then
        create policy "Users can view subtasks for visible tickets"
          on ticket_subtasks for select
          using (
            exists (
              select 1 from tickets
              where tickets.id = ticket_subtasks.ticket_id
            )
          );
    end if;

    if not exists (select 1 from pg_policies where policyname = 'Users can create subtasks for visible tickets' and tablename = 'ticket_subtasks') then
        create policy "Users can create subtasks for visible tickets"
          on ticket_subtasks for insert
          with check (
            exists (
              select 1 from tickets
              where tickets.id = ticket_subtasks.ticket_id
            )
          );
    end if;

    if not exists (select 1 from pg_policies where policyname = 'Users can update subtasks for visible tickets' and tablename = 'ticket_subtasks') then
        create policy "Users can update subtasks for visible tickets"
          on ticket_subtasks for update
          using (
            exists (
              select 1 from tickets
              where tickets.id = ticket_subtasks.ticket_id
            )
          );
    end if;

    if not exists (select 1 from pg_policies where policyname = 'Users can delete subtasks for visible tickets' and tablename = 'ticket_subtasks') then
        create policy "Users can delete subtasks for visible tickets"
          on ticket_subtasks for delete
          using (
            exists (
              select 1 from tickets
              where tickets.id = ticket_subtasks.ticket_id
            )
          );
    end if;
end
$$;
