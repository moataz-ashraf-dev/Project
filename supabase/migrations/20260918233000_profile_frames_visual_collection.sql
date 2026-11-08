-- Final visual frame collection matching the approved Profile Frames page.
alter table public.catalog_items add column if not exists image_url text;
alter table public.catalog_items add column if not exists premium_only boolean not null default false;
alter table public.catalog_items add column if not exists sort_order integer not null default 0;

insert into public.catalog_items(item_type,item_id,name,rarity,coin_price,gem_price,purchasable,event_only,image_url,premium_only,sort_order)
values
('skin','frame-royal-crown','Royal Crown Frame','Legendary',500,125,true,false,'/frames/frame-royal-crown.png',false,180),
('skin','frame-sky-dragon','Sky Dragon Frame','Legendary',400,115,true,false,'/frames/frame-sky-dragon.png',false,190),
('skin','frame-hope','Hope Frame','Rare',400,105,true,false,'/frames/frame-hope.png',false,195)
on conflict (item_type,item_id) do update set
  name=excluded.name, rarity=excluded.rarity, coin_price=excluded.coin_price, gem_price=excluded.gem_price,
  purchasable=excluded.purchasable, event_only=excluded.event_only, image_url=excluded.image_url,
  premium_only=excluded.premium_only, sort_order=excluded.sort_order;

update public.catalog_items
set image_url = case item_id
  when 'frame-inferno-drake' then '/frames/frame-inferno-drake.png'
  when 'frame-frost-wyvern' then '/frames/frame-frost-wyvern.png'
  when 'frame-solar-phoenix' then '/frames/frame-solar-phoenix.png'
  when 'frame-storm-eagle' then '/frames/frame-storm-eagle.png'
  when 'frame-glacial-wolf' then '/frames/frame-glacial-wolf.png'
  when 'frame-emerald-guardian' then '/frames/frame-emerald-guardian.png'
  when 'frame-astral-wyrm' then '/frames/frame-astral-wyrm.png'
  when 'frame-golden-tiger' then '/frames/frame-golden-tiger.png'
  when 'frame-royal-crown' then '/frames/frame-royal-crown.png'
  when 'frame-sky-dragon' then '/frames/frame-sky-dragon.png'
  when 'frame-hope' then '/frames/frame-hope.png'
  when 'frame-premium-royal-dragon' then '/frames/frame-premium-royal-dragon.png'
  when 'frame-premium-divine-phoenix' then '/frames/frame-premium-divine-phoenix.png'
  when 'frame-premium-celestial-crown' then '/frames/frame-premium-celestial-crown.png'
  when 'frame-premium-obsidian-king' then '/frames/frame-premium-obsidian-king.png'
  when 'frame-premium-astral-sovereign' then '/frames/frame-premium-astral-sovereign.png'
  when 'frame-premium-golden-reign' then '/frames/frame-premium-golden-reign.png'
  when 'frame-premium-frost-emperor' then '/frames/frame-premium-frost-emperor.png'
  when 'frame-premium-infinity-royal' then '/frames/frame-premium-infinity-royal.png'
  else image_url end
where item_type='skin'
  and item_id in (
    'frame-inferno-drake','frame-frost-wyvern','frame-solar-phoenix','frame-storm-eagle',
    'frame-glacial-wolf','frame-emerald-guardian','frame-astral-wyrm','frame-golden-tiger',
    'frame-royal-crown','frame-sky-dragon','frame-hope',
    'frame-premium-royal-dragon','frame-premium-divine-phoenix','frame-premium-celestial-crown',
    'frame-premium-obsidian-king','frame-premium-astral-sovereign','frame-premium-golden-reign',
    'frame-premium-frost-emperor','frame-premium-infinity-royal'
  );
