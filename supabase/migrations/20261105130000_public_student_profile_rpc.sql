-- Public profile details are available only for accounts visible on the leaderboard.
-- Balances are intentionally public in this profile because the product displays them.
create or replace function public.get_public_student_profile(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_profile jsonb;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select jsonb_build_object(
    'user_id', lp.user_id,
    'display_name', lp.display_name,
    'country_code', lp.country_code,
    'city', lp.city,
    'total_xp', lp.total_xp,
    'level', lp.level,
    'current_streak', lp.current_streak,
    'longest_streak', lp.longest_streak,
    'avatar_url', lp.avatar_url,
    'avatar_theme', lp.avatar_theme,
    'avatar_pet_position', lp.avatar_pet_position,
    'equipped_pet_id', lp.equipped_pet_id,
    'equipped_frame_id', ue.equipped_skins->>'frame',
    'owned_pet_count', lp.owned_pet_count,
    'coins', coalesce(ea.coins, 0),
    'gems', coalesce(ea.gems, 0),
    'pets', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ui.item_id,
        'name', coalesce(ci.name, initcap(replace(ui.item_id, '-', ' '))),
        'rarity', coalesce(ci.rarity, 'Common'),
        'image_url', ci.image_url
      ) order by ci.sort_order nulls last, ci.name, ui.item_id)
      from public.user_inventory ui
      left join public.catalog_items ci on ci.item_type = 'pet' and ci.item_id = ui.item_id
      where ui.user_id = lp.user_id and ui.item_type = 'pet'
    ), '[]'::jsonb)
  ) into v_profile
  from public.leaderboard_profiles lp
  left join public.economy_accounts ea on ea.user_id = lp.user_id
  left join public.user_equipment ue on ue.user_id = lp.user_id
  where lp.user_id = p_user_id
    and lp.leaderboard_visible = true;

  if v_profile is null then
    raise exception 'profile_not_public';
  end if;
  return v_profile;
end;
$$;

revoke all on function public.get_public_student_profile(uuid) from public;
grant execute on function public.get_public_student_profile(uuid) to authenticated;
