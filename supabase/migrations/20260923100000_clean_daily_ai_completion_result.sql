begin;

drop function if exists public.complete_study_plan_task(uuid, uuid);

create function public.complete_study_plan_task(
  p_task_id uuid,
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_task public.study_plan_tasks%rowtype;
  v_session public.study_sessions%rowtype;
  v_daily jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select *
  into v_task
  from public.study_plan_tasks
  where id = p_task_id
    and user_id = v_user
  for update;

  if not found then
    raise exception 'task_not_owned';
  end if;

  select *
  into v_session
  from public.study_sessions
  where id = p_session_id
    and user_id = v_user
  for update;

  if not found then
    raise exception 'session_not_owned';
  end if;

  if not v_session.completed
     or v_session.verification_method <> 'server' then
    raise exception 'session_not_verified';
  end if;

  if v_task.subject_id is not null
     and v_session.subject_id is distinct from v_task.subject_id then
    raise exception 'task_subject_mismatch';
  end if;

  if v_session.duration_minutes <> v_task.duration_minutes then
    raise exception 'task_duration_mismatch';
  end if;

  perform set_config('studyquest.trusted','1',true);

  update public.study_plan_tasks
  set status = 'completed',
      completed_at = coalesce(completed_at, now()),
      updated_at = now()
  where id = v_task.id;

  v_daily := public.finalize_daily_ai_plan(v_task.plan_id);

  return coalesce(
    v_daily,
    jsonb_build_object(
      'correct', false,
      'completed_tasks', 0,
      'total_tasks', 0,
      'coin_reward', 0,
      'golden_star_awarded', false,
      'correct_days', 0
    )
  );
end;
$$;

revoke all on function public.complete_study_plan_task(uuid, uuid) from public;
grant execute on function public.complete_study_plan_task(uuid, uuid) to authenticated;

commit;
