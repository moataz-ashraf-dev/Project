-- Premium catalog cleanup + configurable payment gross-up.
-- Premium UI now shows only the curated high-quality companion set.

update public.catalog_items
set purchasable = false
where item_type = 'pet'
  and item_id in (
    'celestial-whale','starfall-leviathan','celestial-seraph','dreamweaver-kirin',
    'cosmic-serpent','royal-lion','jade-crocodile','abyss-shark','twilight-manta',
    'sky-pegasus','storm-wyvern'
  );

insert into public.catalog_items(item_type,item_id,name,rarity,coin_price,gem_price,purchasable,event_only) values
('pet','frost-dragon','Frost Dragon','Legendary',1850,280,true,false),
('pet','starlight-unicorn','Starlight Unicorn','Legendary',1650,220,true,false),
('pet','solar-tiger','Cosmic Tiger','Legendary',1500,210,true,false),
('pet','magma-trex','Magma T-Rex','Mythic',1900,325,true,false),
('pet','storm-eagle','Storm Eagle','Legendary',1450,205,true,false),
('pet','shadow-wolf','Shadow Wolf','Epic',1100,150,true,false),
('pet','frost-raptor','Frost Raptor','Mythic',1800,275,true,false),
('pet','void-dragon','Void Dragon','Mythic',2000,340,true,false),
('pet','crimson-kitsune','Crimson Kitsune','Legendary',1600,230,true,false),
('pet','jade-griffin','Jade Griffin','Legendary',1550,220,true,false),
('pet','snow-leopard','Snow Leopard','Epic',1250,165,true,false),
('pet','chrono-dragon','Chrono Dragon','Mythic',2000,500,true,false),
('pet','crystal-dragon','Crystal Dragon','Mythic',1950,390,true,false)
on conflict (item_type,item_id) do update set
  name=excluded.name, rarity=excluded.rarity, coin_price=excluded.coin_price,
  gem_price=excluded.gem_price, purchasable=excluded.purchasable, event_only=excluded.event_only;

create or replace function public.enforce_premium_companion_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  premium_ids text[] := array[
    'frost-dragon','starlight-unicorn','solar-tiger','magma-trex','storm-eagle','shadow-wolf',
    'frost-raptor','void-dragon','crimson-kitsune','jade-griffin','snow-leopard','chrono-dragon','crystal-dragon'
  ];
  v_active boolean;
begin
  if new.item_type = 'pet' and new.item_id = any(premium_ids) and new.acquired_via = 'purchase' then
    select exists (
      select 1 from public.premium_entitlements pe
      where pe.user_id = new.user_id and pe.status = 'active'
        and (pe.current_period_end is null or pe.current_period_end > now())
    ) into v_active;
    if not v_active then raise exception 'premium_required'; end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_require_premium_for_premium_companions on public.user_inventory;
create trigger tr_require_premium_for_premium_companions
before insert on public.user_inventory
for each row execute function public.enforce_premium_companion_purchase();
revoke all on function public.enforce_premium_companion_purchase() from public;

-- The payment ledger can be used by more than one provider in future.
alter table public.payment_orders drop constraint if exists payment_orders_provider_check;
alter table public.payment_orders add constraint payment_orders_provider_check check (provider in ('paymob','paypal','stripe','adyen'));
