create extension if not exists pgcrypto;

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friend_requests_no_self check (sender_id <> receiver_id),
  constraint friend_requests_unique_pending unique (sender_id, receiver_id, status)
);

alter table public.friend_requests enable row level security;

drop policy if exists "friend_requests_select_participant" on public.friend_requests;
create policy "friend_requests_select_participant" on public.friend_requests
for select to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "friend_requests_insert_sender" on public.friend_requests;
create policy "friend_requests_insert_sender" on public.friend_requests
for insert to authenticated
with check (auth.uid() = sender_id and sender_id <> receiver_id and status = 'pending');

drop policy if exists "friend_requests_update_participant" on public.friend_requests;
create policy "friend_requests_update_participant" on public.friend_requests
for update to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id)
with check (auth.uid() = sender_id or auth.uid() = receiver_id);

create index if not exists friend_requests_receiver_status_idx on public.friend_requests(receiver_id, status, created_at desc);
create index if not exists friend_requests_sender_status_idx on public.friend_requests(sender_id, status, created_at desc);
