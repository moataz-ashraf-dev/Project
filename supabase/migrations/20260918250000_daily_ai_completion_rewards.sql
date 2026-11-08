-- Daily AI plan completion: a day is correct only when every AI-generated task
-- for that calendar day is completed through a verified server study session.
-- A correct day grants 30 Coins. After 26 correct days, grant one Golden Star.
create table if not exists public.daily_ai_completion (
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  plan_id uuid references public.study_plans(id) on delete set null,
  completed boolean not null default false,
  coin_reward integer not null default 0,
  golden_star_awarded boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, plan_date)
);

alter table public.daily_ai_completion enable row level security;
drop policy if exists daily_ai_completion_select_own on public.daily_ai_completion;
create policy daily_ai_completion_select_own on public.daily_ai_completion
for select to authenticated using (user_id = auth.uid());

create index if not exists daily_ai_completion_user_date_idx
  on public.daily_ai_completion(user_id, plan_date desc);

create or replace function public.finalize_daily_ai_plan(
  p_plan_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_plan public.study_plans%rowtype;
  v_total integer;
  v_completed integer;
  v_correct_count integer;
  v_star_awarded boolean := false;
  v_coins bigint;
  v_stars bigint;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;

  select * into v_plan
  from public.study_plans
  where id = p_plan_id and user_id = v_user
  for update;
  if not found then raise exception 'plan_not_owned'; end if;

  select count(*)::integer,
         count(*) filter (where status = 'completed')::integer
  into v_total, v_completed
  from public.study_plan_tasks
  where plan_id = p_plan_id and user_id = v_user;

  -- Empty plans are not valid "correct days".
  if v_total = 0 or v_completed <> v_total then
    return jsonb_build_object(
      'correct', false, 'completed_tasks', v_completed,
      'total_tasks', v_total, 'coin_reward', 0, 'golden_star_awarded', false
    );
  end if;

  insert into public.daily_ai_completion(user_id, plan_date, plan_id, completed)
  values (v_user, v_plan.plan_date, v_plan.id, true)
  on conflict (user_id, plan_date) do update
    set plan_id = excluded.plan_id, completed = true, completed_at = coalesce(public.daily_ai_completion.completed_at, now());

  -- Reward exactly once for this calendar day.
  if not exists (
    select 1 from public.economy_transactions
    where user_id = v_user
      and idempotency_key = 'daily-ai-complete:' || v_plan.plan_date::text
  ) then
    insert into public.economy_accounts(user_id, coins, gems, stars)
    values (v_user, 0, 0, 0)
    on conflict (user_id) do nothing;

    update public.economy_accounts
      set coins = coins + 30, updated_at = now()
      where user_id = v_user
      returning coins, stars into v_coins, v_stars;

    insert into public.economy_transactions(
      user_id, idempotency_key, transaction_type, coins_delta, stars_delta, metadata
    ) values (
      v_user, 'daily-ai-complete:' || v_plan.plan_date::text,
      'event_reward', 30, 0,
      jsonb_build_object('reason','all_ai_tasks_completed','plan_date',v_plan.plan_date)
    );
    update public.daily_ai_completion
      set coin_reward = 30, completed_at = now()
      where user_id = v_user and plan_date = v_plan.plan_date;
  else
    select coins, stars into v_coins, v_stars
    from public.economy_accounts where user_id = v_user;
  end if;

  select count(*)::integer into v_correct_count
  from public.daily_ai_completion
  where user_id = v_user and completed = true;

  -- First Golden Star is earned at 26 correct days, once.
  if v_correct_count >= 26
     and not exists (
       select 1 from public.economy_transactions
       where user_id = v_user and idempotency_key = 'golden-star:26-correct-days'
     ) then
    update public.economy_accounts
      set stars = stars + 1, updated_at = now()
      where user_id = v_user
      returning coins, stars into v_coins, v_stars;

    insert into public.economy_transactions(
      user_id, idempotency_key, transaction_type, coins_delta, stars_delta, metadata
    ) values (
      v_user, 'golden-star:26-correct-days', 'event_reward', 0, 1,
      jsonb_build_object('reason','26_correct_ai_days')
    );
    update public.daily_ai_completion
      set golden_star_awarded = true
      where user_id = v_user and plan_date = v_plan.plan_date;
    v_star_awarded := true;
  end if;

  update public.study_plans
    set status = 'completed', updated_at = now()
    where id = v_plan.id;

  return jsonb_build_object(
    'correct', true,
    'completed_tasks', v_total,
    'total_tasks', v_total,
    'coin_reward', 30,
    'golden_star_awarded', v_star_awarded,
    'correct_days', v_correct_count,
    'coins', coalesce(v_coins,0),
    'stars', coalesce(v_stars,0)
  );
end;
$$;

revoke all on function public.finalize_daily_ai_plan(uuid) from public;
grant execute on function public.finalize_daily_ai_plan(uuid) to authenticated;

-- Final welcome amount: 100 Coins + 5 Gems, exactly once.
create or replace function public.ensure_user_game_defaults()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.economy_accounts(user_id, coins, gems, stars)
  values (new.id, 0, 0, 0)
  on conflict (user_id) do nothing;

  insert into public.user_equipment(user_id, equipped_pet_id)
  values (new.id, 'sparky')
  on conflict (user_id) do nothing;

  insert into public.user_inventory(user_id, item_type, item_id, acquired_via)
  values (new.id, 'pet', 'sparky', 'migration')
  on conflict do nothing;

  insert into public.economy_transactions(user_id, idempotency_key, transaction_type, coins_delta, gems_delta, stars_delta, metadata)
  values (new.id, 'signup-welcome:' || new.id::text, 'event_reward', 100, 5, 0,
    jsonb_build_object('reason','first_registration','coins',100,'gems',5))
  on conflict (user_id, idempotency_key) do nothing;

  if found then
    update public.economy_accounts
      set coins = coins + 100, gems = gems + 5, updated_at = now()
      where user_id = new.id;
  end if;
  return new;
end;
$$;

create or replace function public.get_daily_ai_status(p_plan_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_plan public.study_plans%rowtype;
  v_total integer := 0;
  v_completed integer := 0;
  v_correct boolean := false;
  v_correct_days integer := 0;
  v_golden boolean := false;
  v_coins bigint := 0;
  v_stars bigint := 0;
  v_has_plan boolean := false;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  select * into v_plan from public.study_plans
    where user_id=v_user and plan_date=p_plan_date limit 1;
  if found then
    v_has_plan := true;
    select count(*)::integer, count(*) filter(where status='completed')::integer
      into v_total, v_completed
      from public.study_plan_tasks where plan_id=v_plan.id and user_id=v_user;
    v_correct := v_total > 0 and v_total = v_completed;
  end if;
  select count(*)::integer into v_correct_days from public.daily_ai_completion where user_id=v_user and completed=true;
  select exists(select 1 from public.economy_transactions where user_id=v_user and idempotency_key='golden-star:26-correct-days') into v_golden;
  select coins, stars into v_coins, v_stars from public.economy_accounts where user_id=v_user;
  return jsonb_build_object(
    'plan_date',p_plan_date,'has_plan',v_has_plan,'correct',v_correct,
    'completed_tasks',v_completed,'total_tasks',v_total,'correct_days',v_correct_days,
    'golden_star_awarded',v_golden,'coins',coalesce(v_coins,0),'stars',coalesce(v_stars,0)
  );
end;
$$;
revoke all on function public.get_daily_ai_status(date) from public;
grant execute on function public.get_daily_ai_status(date) to authenticated;

create or replace function public.complete_study_plan_task(
  p_task_id uuid,
  p_session_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_task public.study_plan_tasks%rowtype;
  v_session public.study_sessions%rowtype;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  select * into v_task from public.study_plan_tasks where id=p_task_id and user_id=v_user for update;
  if not found then raise exception 'task_not_owned'; end if;
  select * into v_session from public.study_sessions where id=p_session_id and user_id=v_user for update;
  if not found then raise exception 'session_not_owned'; end if;
  if not v_session.completed or v_session.verification_method <> 'server' then raise exception 'session_not_verified'; end if;
  if v_task.subject_id is not null and v_session.subject_id is distinct from v_task.subject_id then raise exception 'task_subject_mismatch'; end if;
  if v_session.duration_minutes <> v_task.duration_minutes then raise exception 'task_duration_mismatch'; end if;

  perform set_config('studyquest.trusted','1',true);
  update public.study_plan_tasks
    set status='completed', completed_at=coalesce(completed_at,now()), updated_at=now()
    where id=v_task.id;

  perform public.finalize_daily_ai_plan(v_task.plan_id);
  return true;
end;
$$;
revoke all on function public.complete_study_plan_task(uuid,uuid) from public;
grant execute on function public.complete_study_plan_task(uuid,uuid) to authenticated;

-- Retire the old +100 daily study bonus. The only daily-completion reward is
-- the +30 Coins granted when every AI task for the day is completed.
create or replace function public.claim_daily_study_bonus()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_plan public.study_plans%rowtype;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  select * into v_plan from public.study_plans
    where user_id=v_user and plan_date=current_date limit 1;
  if found then
    return public.finalize_daily_ai_plan(v_plan.id);
  end if;
  return jsonb_build_object('claimed',false,'bonus',0,'reason','ai_plan_required');
end;
$$;
revoke all on function public.claim_daily_study_bonus() from public;
grant execute on function public.claim_daily_study_bonus() to authenticated;
