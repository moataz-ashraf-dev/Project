-- Premium creature/economy refresh.
-- Regular companions stay inexpensive; higher rarities require a longer study journey.
update public.catalog_items
set coin_price = case item_id
  when 'velvet-cat' then 50 when 'moon-rabbit' then 55 when 'ember-pup' then 60 when 'pearl-hamster' then 65
  when 'suncrest-parrot' then 70 when 'ice-penguin' then 80 when 'sage-turtle' then 90 when 'cobalt-donkey' then 100
  when 'aurora-fox' then 150 when 'river-otter' then 200 when 'ruby-red-panda' then 250 when 'mist-raccoon' then 300
  when 'willow-deer' then 350 when 'coral-seal' then 400 when 'crystal-owl' then 450 when 'golden-capybara' then 500
  else coin_price end
where item_type='pet';

-- Curated Premium collection: every item has a 100+ Gem prestige price and a 1,000–2,000 Coin alternative.
insert into public.catalog_items(item_type,item_id,name,rarity,coin_price,gem_price,purchasable,event_only) values
('pet','shadow-wolf','Shadow Wolf','Epic',1000,110,true,false),
('pet','snow-leopard','Snow Leopard','Epic',1100,120,true,false),
('pet','storm-eagle','Storm Eagle','Epic',1200,130,true,false),
('pet','solar-tiger','Solar Tiger','Epic',1300,145,true,false),
('pet','royal-lion','Royal Lion','Epic',1350,155,true,false),
('pet','jade-crocodile','Jade Crocodile','Epic',1400,165,true,false),
('pet','abyss-shark','Abyss Shark','Epic',1450,175,true,false),
('pet','twilight-manta','Twilight Manta','Epic',1500,185,true,false),
('pet','jade-griffin','Jade Griffin','Legendary',1550,195,true,false),
('pet','crimson-kitsune','Crimson Kitsune','Legendary',1600,205,true,false),
('pet','starlight-unicorn','Starlight Unicorn','Legendary',1650,220,true,false),
('pet','sky-pegasus','Sky Pegasus','Legendary',1700,235,true,false),
('pet','eternal-phoenix','Eternal Phoenix','Legendary',1750,250,true,false),
('pet','storm-wyvern','Storm Wyvern','Legendary',1800,265,true,false),
('pet','frost-dragon','Frost Dragon','Legendary',1850,280,true,false),
('pet','crystal-dragon','Crystal Dragon','Legendary',1900,300,true,false),
('pet','void-dragon','Void Dragon','Mythic',1950,320,true,false),
('pet','celestial-whale','Celestial Whale','Mythic',1500,340,true,false),
('pet','starfall-leviathan','Starfall Leviathan','Mythic',1700,365,true,false),
('pet','celestial-seraph','Celestial Seraph','Mythic',1800,390,true,false),
('pet','dreamweaver-kirin','Dreamweaver Kirin','Mythic',1850,420,true,false),
('pet','cosmic-serpent','Cosmic Serpent','Mythic',1900,450,true,false),
('pet','chrono-dragon','Chrono Dragon','Mythic',2000,500,true,false),
('pet','frost-raptor','Frost Raptor','Mythic',1600,275,true,false),
('pet','magma-trex','Magma T-Rex','Mythic',1750,295,true,false)
on conflict (item_type,item_id) do update set
  name=excluded.name, rarity=excluded.rarity, coin_price=excluded.coin_price,
  gem_price=excluded.gem_price, purchasable=excluded.purchasable, event_only=excluded.event_only;

-- Keep Premium enforcement aligned with the client catalog.
create or replace function public.enforce_premium_companion_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  premium_ids text[] := array[
    'shadow-wolf','snow-leopard','storm-eagle','solar-tiger','royal-lion','jade-crocodile','abyss-shark','twilight-manta',
    'jade-griffin','crimson-kitsune','starlight-unicorn','sky-pegasus','eternal-phoenix','storm-wyvern','frost-dragon','crystal-dragon',
    'void-dragon','celestial-whale','starfall-leviathan','celestial-seraph','dreamweaver-kirin','cosmic-serpent','chrono-dragon','frost-raptor','magma-trex'
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
