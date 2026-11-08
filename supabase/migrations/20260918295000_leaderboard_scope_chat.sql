-- Small, study-focused chat attached to local/international leaderboard views.
create table if not exists public.leaderboard_scope_messages (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('international','city')),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 240),
  created_at timestamptz not null default now()
);

alter table public.leaderboard_scope_messages enable row level security;

drop policy if exists "leaderboard_scope_messages_select_authenticated" on public.leaderboard_scope_messages;
create policy "leaderboard_scope_messages_select_authenticated"
on public.leaderboard_scope_messages for select
to authenticated using (true);

drop policy if exists "leaderboard_scope_messages_insert_self" on public.leaderboard_scope_messages;
create policy "leaderboard_scope_messages_insert_self"
on public.leaderboard_scope_messages for insert
to authenticated with check (auth.uid() = user_id);

create index if not exists leaderboard_scope_messages_scope_created_idx
  on public.leaderboard_scope_messages(scope, created_at desc);
