-- Rank students by the first-achieved 26-correct-day Golden Star, collection,
-- XP, Coins, then Gems. Currency values stay private until a profile is opened.
drop function if exists public.get_leaderboard(text, integer);
create function public.get_leaderboard(p_scope text default 'global', p_limit integer default 50)
returns table(
  user_id uuid, display_name text, country_code text, city text, total_xp bigint,
  level integer, current_streak integer, longest_streak integer, avatar_url text,
  avatar_theme text, avatar_pet_position text, equipped_frame_id text,
  equipped_pet_id text, owned_pet_count integer, golden_star_count integer,
  rank_position integer
)
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_country text;
  v_city text;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if p_scope not in ('global','international','city') then raise exception 'invalid_scope'; end if;
  if p_limit < 1 or p_limit > 100 then raise exception 'invalid_limit'; end if;

  select lp.country_code, lp.city into v_country, v_city
  from public.leaderboard_profiles lp where lp.user_id = v_user;

  return query
  with scoped_students as (
    select lp.user_id, lp.display_name, lp.country_code, lp.city, lp.total_xp, lp.level,
           lp.current_streak, lp.longest_streak, lp.avatar_url, lp.avatar_theme,
           lp.avatar_pet_position, ue.equipped_skins->>'frame' as equipped_frame_id,
           lp.equipped_pet_id, coalesce(pet_counts.owned_pet_count, 0)::integer as owned_pet_count,
           case when exists (
             select 1 from public.economy_transactions et
             where et.user_id = lp.user_id
               and et.idempotency_key = 'golden-star:26-correct-days'
               and et.stars_delta > 0
           ) then 1 else 0 end::integer as golden_star_count,
           coalesce(ea.coins, 0)::bigint as coins_for_sort,
           coalesce(ea.gems, 0)::bigint as gems_for_sort
    from public.leaderboard_profiles lp
    left join public.user_equipment ue on ue.user_id = lp.user_id
    left join public.economy_accounts ea on ea.user_id = lp.user_id
    left join lateral (
      select count(*)::integer as owned_pet_count
      from public.user_inventory ui
      where ui.user_id = lp.user_id and ui.item_type = 'pet'
    ) pet_counts on true
    where lp.leaderboard_visible = true
      and (p_scope = 'global'
        or (p_scope = 'international' and v_country is not null and lp.country_code = v_country)
        or (p_scope = 'city' and v_country is not null and v_city is not null and lp.country_code = v_country and lower(lp.city) = lower(v_city)))
  ), ranked_students as (
    select scoped_students.*,
           rank() over (
             order by golden_star_count desc, owned_pet_count desc, total_xp desc,
                      coins_for_sort desc, gems_for_sort desc
           )::integer as rank_position
    from scoped_students
  )
  select rs.user_id, rs.display_name, rs.country_code, rs.city, rs.total_xp, rs.level,
         rs.current_streak, rs.longest_streak, rs.avatar_url, rs.avatar_theme,
         rs.avatar_pet_position, rs.equipped_frame_id, rs.equipped_pet_id,
         rs.owned_pet_count, rs.golden_star_count, rs.rank_position
  from ranked_students rs
  order by rs.rank_position, rs.user_id
  limit p_limit;
end;
$$;
revoke all on function public.get_leaderboard(text, integer) from public;
grant execute on function public.get_leaderboard(text, integer) to authenticated;

-- Show private balances and the owned collection only inside the requested
-- profile detail view for leaderboard-visible accounts.
create or replace function public.get_public_student_profile(p_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare v_profile jsonb;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select jsonb_build_object(
    'user_id', lp.user_id, 'display_name', lp.display_name,
    'country_code', lp.country_code, 'city', lp.city, 'total_xp', lp.total_xp,
    'level', lp.level, 'current_streak', lp.current_streak, 'longest_streak', lp.longest_streak,
    'avatar_url', lp.avatar_url, 'avatar_theme', lp.avatar_theme,
    'avatar_pet_position', lp.avatar_pet_position, 'equipped_pet_id', lp.equipped_pet_id,
    'equipped_frame_id', ue.equipped_skins->>'frame',
    'owned_pet_count', (select count(*)::integer from public.user_inventory ui where ui.user_id=lp.user_id and ui.item_type='pet'),
    'golden_star_count', case when exists (
      select 1 from public.economy_transactions et where et.user_id=lp.user_id
        and et.idempotency_key='golden-star:26-correct-days' and et.stars_delta>0
    ) then 1 else 0 end,
    'coins', coalesce(ea.coins, 0), 'gems', coalesce(ea.gems, 0),
    'pets', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ui.item_id, 'name', coalesce(ci.name, initcap(replace(ui.item_id, '-', ' '))),
        'rarity', coalesce(ci.rarity, 'Common'), 'image_url', ci.image_url
      ) order by ci.sort_order nulls last, ci.name, ui.item_id)
      from public.user_inventory ui
      left join public.catalog_items ci on ci.item_type='pet' and ci.item_id=ui.item_id
      where ui.user_id=lp.user_id and ui.item_type='pet'
    ), '[]'::jsonb)
  ) into v_profile
  from public.leaderboard_profiles lp
  left join public.economy_accounts ea on ea.user_id=lp.user_id
  left join public.user_equipment ue on ue.user_id=lp.user_id
  where lp.user_id=p_user_id and lp.leaderboard_visible=true;
  if v_profile is null then raise exception 'profile_not_public'; end if;
  return v_profile;
end;
$$;
revoke all on function public.get_public_student_profile(uuid) from public;
grant execute on function public.get_public_student_profile(uuid) to authenticated;
