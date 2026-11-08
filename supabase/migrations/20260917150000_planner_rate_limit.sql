-- Planner abuse protection: bounded AI requests per user/day.
create table if not exists public.planner_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.planner_usage enable row level security;
revoke all on table public.planner_usage from anon, authenticated;

create or replace function public.consume_planner_quota(p_limit integer default 10)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_count integer;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if p_limit < 1 or p_limit > 100 then raise exception 'invalid_limit'; end if;
  insert into public.planner_usage(user_id, usage_date, request_count)
  values (v_user, current_date, 1)
  on conflict (user_id, usage_date) do update set
    request_count = public.planner_usage.request_count + 1,
    updated_at = now()
  returning request_count into v_count;
  if v_count > p_limit then
    update public.planner_usage set request_count = request_count - 1, updated_at = now()
    where user_id = v_user and usage_date = current_date;
    return false;
  end if;
  return true;
end;
$$;
revoke all on function public.consume_planner_quota(integer) from public;
grant execute on function public.consume_planner_quota(integer) to authenticated;

alter table public.study_plan_tasks
  drop constraint if exists study_plan_tasks_notes_length_check;
alter table public.study_plan_tasks
  add constraint study_plan_tasks_notes_length_check check (notes is null or char_length(notes) <= 1000);
