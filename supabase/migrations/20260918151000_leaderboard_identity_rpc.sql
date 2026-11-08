-- Expose only the public-safe identity projection needed by the leaderboard.
drop function if exists public.get_leaderboard(text, integer);

create function public.get_leaderboard(p_scope text default 'global', p_limit integer default 50)
returns table(
  user_id uuid,
  display_name text,
  country_code text,
  city text,
  total_xp bigint,
  level integer,
  current_streak integer,
  longest_streak integer,
  avatar_url text,
  avatar_theme text,
  avatar_pet_position text,
  equipped_frame_id text,
  equipped_pet_id text,
  owned_pet_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_country text;
  v_city text;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if p_scope not in ('global','international','city') then raise exception 'invalid_scope'; end if;
  if p_limit < 1 or p_limit > 100 then raise exception 'invalid_limit'; end if;
  select lp.country_code, lp.city into v_country, v_city from public.leaderboard_profiles lp where lp.user_id=v_user;

  return query
  select lp.user_id, lp.display_name, lp.country_code, lp.city, lp.total_xp, lp.level, lp.current_streak, lp.longest_streak,
         lp.avatar_url, lp.avatar_theme, lp.avatar_pet_position,
         coalesce(ue.equipped_skins->>'frame', null) as equipped_frame_id,
         lp.equipped_pet_id, lp.owned_pet_count
  from public.leaderboard_profiles lp
  left join public.user_equipment ue on ue.user_id = lp.user_id
  where lp.leaderboard_visible = true
    and (p_scope='global'
      or (p_scope='international' and v_country is not null and lp.country_code=v_country)
      or (p_scope='city' and v_country is not null and v_city is not null and lp.country_code=v_country and lower(lp.city)=lower(v_city)))
  order by lp.total_xp desc, lp.current_streak desc, lp.user_id
  limit p_limit;
end;
$$;
revoke all on function public.get_leaderboard(text, integer) from public;
grant execute on function public.get_leaderboard(text, integer) to authenticated;
