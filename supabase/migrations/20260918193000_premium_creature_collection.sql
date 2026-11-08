-- Premium creature refresh: only the curated mythic collection is shown/sold
-- from the Premium page. Existing ordinary/legacy creatures remain available
-- wherever the regular catalog uses them, but are not Premium companions.

insert into public.catalog_items(item_type,item_id,name,rarity,coin_price,gem_price,purchasable,event_only) values
('pet','frost-dragon','Frost Dragon','Legendary',0,195,true,false),
('pet','starlight-unicorn','Starlight Unicorn','Legendary',0,124,true,false),
('pet','solar-tiger','Solar Tiger','Epic',0,176,true,false),
('pet','magma-trex','Magma T-Rex','Mythic',0,275,true,false),
('pet','storm-eagle','Storm Eagle','Epic',0,140,true,false),
('pet','shadow-wolf','Shadow Wolf','Epic',0,148,true,false),
('pet','frost-raptor','Frost Raptor','Mythic',0,235,true,false),
('pet','void-dragon','Void Dragon','Mythic',0,240,true,false),
('pet','crimson-kitsune','Crimson Kitsune','Legendary',0,158,true,false),
('pet','jade-griffin','Jade Griffin','Legendary',0,154,true,false),
('pet','snow-leopard','Snow Leopard','Epic',0,180,true,false),
('pet','chrono-dragon','Chrono Dragon','Mythic',0,420,true,false)
on conflict (item_type,item_id) do update set
  name=excluded.name,
  rarity=excluded.rarity,
  coin_price=excluded.coin_price,
  gem_price=excluded.gem_price,
  purchasable=excluded.purchasable,
  event_only=excluded.event_only;

-- A Premium companion can only be acquired after a real Premium entitlement
-- is active. This is enforced server-side so the client cannot bypass it.
create or replace function public.enforce_premium_companion_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  premium_ids text[] := array[
    'frost-dragon','starlight-unicorn','solar-tiger','magma-trex',
    'storm-eagle','shadow-wolf','frost-raptor','void-dragon',
    'crimson-kitsune','jade-griffin','snow-leopard','chrono-dragon'
  ];
  v_active boolean;
begin
  if new.item_type = 'pet' and new.item_id = any(premium_ids) and new.acquired_via = 'purchase' then
    select exists (
      select 1 from public.premium_entitlements pe
      where pe.user_id = new.user_id
        and pe.status = 'active'
        and (pe.current_period_end is null or pe.current_period_end > now())
    ) into v_active;
    if not v_active then
      raise exception 'premium_required';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_require_premium_for_premium_companions on public.user_inventory;
create trigger tr_require_premium_for_premium_companions
before insert on public.user_inventory
for each row execute function public.enforce_premium_companion_purchase();

revoke all on function public.enforce_premium_companion_purchase() from public;
