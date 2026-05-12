create table if not exists public.user_data (
  id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_data enable row level security;

create policy "users_can_view_their_own_data"
on public.user_data
for select
to authenticated
using (auth.uid() = id);

create policy "users_can_insert_their_own_data"
on public.user_data
for insert
to authenticated
with check (auth.uid() = id);

create policy "users_can_update_their_own_data"
on public.user_data
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
