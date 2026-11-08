create or replace function public.complete_study_session(
  p_subject_id uuid,
  p_duration_minutes integer,
  p_client_operation_id text,
  p_source text default 'server'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.study_sessions%rowtype;
  v_reward_coins integer;
  v_reward_gems integer;
  v_reward_stars integer;
  v_earned_today bigint;
  v_remaining_today integer;
  v_total_coins bigint;
  v_total_gems bigint;
  v_total_stars bigint;
  v_total_xp bigint;
  v_level integer;
  v_current_streak integer;
  v_last_date date;
  v_existing jsonb;
begin
  if v_user_id is null then raise exception 'not_authenticated'; end if;
  if p_source <> 'server' then raise exception 'invalid_source'; end if;
  if p_client_operation_id is null or char_length(p_client_operation_id) < 8 or char_length(p_client_operation_id) > 100 then
    raise exception 'invalid_operation_id';
  end if;
  if p_duration_minutes < 5 or p_duration_minutes > 120 then raise exception 'invalid_duration'; end if;

  select * into v_session
  from public.study_sessions
  where user_id = v_user_id and client_operation_id = p_client_operation_id
  for update;
  if not found then raise exception 'session_not_started'; end if;
  if v_session.subject_id is distinct from p_subject_id then raise exception 'subject_mismatch'; end if;
  if v_session.duration_minutes <> p_duration_minutes then raise exception 'duration_mismatch'; end if;

  if v_session.completed then
    select coins,gems,stars into v_total_coins,v_total_gems,v_total_stars
    from public.economy_accounts where user_id=v_user_id;
    select total_xp,level into v_total_xp,v_level from public.profiles where id=v_user_id;
    return jsonb_build_object('session_id',v_session.id,'coins',coalesce(v_total_coins,0),'gems',coalesce(v_total_gems,0),'stars',coalesce(v_total_stars,0),'total_xp',coalesce(v_total_xp,0),'level',coalesce(v_level,1));
  end if;

  if v_session.started_at is null or now() < v_session.started_at + make_interval(mins => v_session.duration_minutes) then
    raise exception 'session_not_elapsed';
  end if;

  select coalesce(sum(greatest(coins_delta,0)),0) into v_earned_today
  from public.economy_transactions
  where user_id=v_user_id
    and transaction_type='study_reward'
    and created_at >= current_date
    and created_at < current_date + interval '1 day';

  v_remaining_today := greatest(0, 60 - least(60, v_earned_today)::integer);
  v_reward_coins := least(p_duration_minutes, v_remaining_today);
  v_reward_gems := case when p_duration_minutes >= 45 then 1 else 0 end;
  v_reward_stars := case when p_duration_minutes >= 25 then 1 else 0 end;

  update public.study_sessions
  set completed=true,
      completed_at=now(),
      xp_earned=v_session.duration_minutes,
      verification_method='server'
  where id=v_session.id;

  insert into public.economy_accounts(user_id,coins,gems,stars)
  values(v_user_id,v_reward_coins,v_reward_gems,v_reward_stars)
  on conflict(user_id) do update set
    coins=public.economy_accounts.coins+excluded.coins,
    gems=public.economy_accounts.gems+excluded.gems,
    stars=public.economy_accounts.stars+excluded.stars,
    updated_at=now();

  insert into public.economy_transactions(user_id,idempotency_key,transaction_type,coins_delta,gems_delta,stars_delta,reference_id,metadata)
  values(v_user_id,'study:'||p_client_operation_id,'study_reward',v_reward_coins,v_reward_gems,v_reward_stars,v_session.id,
    jsonb_build_object('duration_minutes',v_session.duration_minutes,'verification_method','server','daily_coin_cap',60,'coins_per_verified_minute',1,'coins_awarded',v_reward_coins));

  select total_xp,level,current_streak,last_study_date
    into v_total_xp,v_level,v_current_streak,v_last_date
  from public.profiles where id=v_user_id for update;

  v_total_xp := coalesce(v_total_xp,0)+v_session.duration_minutes;
  v_current_streak := case
    when v_last_date=current_date then coalesce(v_current_streak,0)
    when v_last_date=current_date-1 then coalesce(v_current_streak,0)+1
    else 1 end;
  v_level := floor(v_total_xp/100)+1;

  perform set_config('studyquest.trusted','1',true);
  update public.profiles
  set total_xp=v_total_xp,level=v_level,current_streak=v_current_streak,
      longest_streak=greatest(coalesce(longest_streak,0),v_current_streak),
      last_study_date=current_date,updated_at=now()
  where id=v_user_id;

  select coins,gems,stars into v_total_coins,v_total_gems,v_total_stars
  from public.economy_accounts where user_id=v_user_id;
  return jsonb_build_object('session_id',v_session.id,'coins',v_total_coins,'gems',v_total_gems,'stars',v_total_stars,'total_xp',v_total_xp,'level',v_level,'coins_awarded',v_reward_coins,'daily_coin_cap',60);
exception when unique_violation then
  select jsonb_build_object('session_id',s.id,'coins',e.coins,'gems',e.gems,'stars',e.stars,'total_xp',pr.total_xp,'level',pr.level)
  into v_existing
  from public.study_sessions s
  join public.economy_accounts e on e.user_id=s.user_id
  join public.profiles pr on pr.id=s.user_id
  where s.user_id=v_user_id and s.client_operation_id=p_client_operation_id;
  return v_existing;
end;
$$;
