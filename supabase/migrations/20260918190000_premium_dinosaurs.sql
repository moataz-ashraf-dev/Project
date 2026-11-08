-- Premium dinosaur companions: gem-only prestige collectibles.
insert into public.catalog_items(item_type,item_id,name,rarity,coin_price,gem_price,purchasable,event_only) values
('pet','frost-raptor','Frost Raptor','Mythic',0,235,true,false),
('pet','magma-trex','Magma T-Rex','Mythic',0,275,true,false)
on conflict (item_type,item_id) do update set
  name=excluded.name, rarity=excluded.rarity, coin_price=excluded.coin_price, gem_price=excluded.gem_price, purchasable=excluded.purchasable, event_only=excluded.event_only;

-- Let a signed-in user see only their own AI usage meter in Premium.
grant select on public.study_assistant_usage to authenticated;
drop policy if exists study_assistant_usage_select_own on public.study_assistant_usage;
create policy study_assistant_usage_select_own on public.study_assistant_usage
  for select to authenticated using (user_id = auth.uid());
