-- Per-user daily quota for the Smart Study Assistant.
create table if not exists public.study_assistant_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (user_id, usage_date)
);

alter table public.study_assistant_usage enable row level security;
revoke all on public.study_assistant_usage from anon, authenticated;

create or replace function public.consume_study_assistant_quota(p_limit integer default 100)
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
  if p_limit < 1 or p_limit > 500 then raise exception 'invalid_limit'; end if;
  insert into public.study_assistant_usage(user_id, usage_date, request_count)
  values (v_user, current_date, 1)
  on conflict (user_id, usage_date)
  do update set request_count = public.study_assistant_usage.request_count + 1
  returning request_count into v_count;
  if v_count > p_limit then
    update public.study_assistant_usage set request_count = request_count - 1
    where user_id=v_user and usage_date=current_date;
    return false;
  end if;
  return true;
end;
$$;
revoke all on function public.consume_study_assistant_quota(integer) from public;
grant execute on function public.consume_study_assistant_quota(integer) to authenticated;
