-- StudyQuest: real text study rooms.
-- Voice is intentionally out of scope here; rooms provide membership + moderated text chat.

create table if not exists public.study_rooms (
  id text primary key,
  name text not null,
  description text not null,
  subject text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.study_room_members (
  room_id text not null references public.study_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.study_room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.study_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists study_room_members_user_idx on public.study_room_members(user_id);
create index if not exists study_room_messages_room_time_idx on public.study_room_messages(room_id, created_at desc);

alter table public.study_rooms enable row level security;
alter table public.study_room_members enable row level security;
alter table public.study_room_messages enable row level security;

revoke all on public.study_rooms from anon, authenticated;
revoke all on public.study_room_members from anon, authenticated;
revoke all on public.study_room_messages from anon, authenticated;
grant select on public.study_rooms to authenticated;
grant select, insert, update, delete on public.study_room_members to authenticated;
grant select, insert on public.study_room_messages to authenticated;

drop policy if exists study_rooms_read on public.study_rooms;
create policy study_rooms_read on public.study_rooms for select to authenticated using (true);

drop policy if exists room_members_read_own on public.study_room_members;
create policy room_members_read_own on public.study_room_members for select to authenticated using (user_id = auth.uid());
drop policy if exists room_members_insert_own on public.study_room_members;
create policy room_members_insert_own on public.study_room_members for insert to authenticated with check (user_id = auth.uid());
drop policy if exists room_members_update_own on public.study_room_members;
create policy room_members_update_own on public.study_room_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists room_members_delete_own on public.study_room_members;
create policy room_members_delete_own on public.study_room_members for delete to authenticated using (user_id = auth.uid());

drop policy if exists room_messages_read_member on public.study_room_messages;
create policy room_messages_read_member on public.study_room_messages for select to authenticated using (
  exists (select 1 from public.study_room_members m where m.room_id = study_room_messages.room_id and m.user_id = auth.uid())
);
drop policy if exists room_messages_insert_member on public.study_room_messages;
create policy room_messages_insert_member on public.study_room_messages for insert to authenticated with check (
  user_id = auth.uid()
  and exists (select 1 from public.study_room_members m where m.room_id = study_room_messages.room_id and m.user_id = auth.uid())
);

insert into public.study_rooms(id,name,description,subject) values
('physics','Physics Masterminds Room','Solve and review physics problems with focus.','Physics'),
('calculus','Advanced Calculus Hub','Advanced calculus practice and exam review.','Calculus'),
('javascript','JavaScript Builders Room','Build and review JavaScript projects together.','JavaScript'),
('english','English Conversation Study Room','Practice English conversation in a study-first room.','English'),
('chemistry','Chemistry Focus Room','Review chemistry laws and solve problems.','Chemistry'),
('exam','Exam Preparation Room','Quiet exam preparation and review planning.','Exam Prep')
on conflict (id) do update set name=excluded.name, description=excluded.description, subject=excluded.subject;
