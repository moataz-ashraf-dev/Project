-- Final profile-frame collection.
-- Eight standard frames + eight Premium frames. Decorations are CSS-only and never cover the avatar center.
-- Retire the previous 4 Premium frame IDs from the shop; existing owners keep their inventory.
update public.catalog_items
set purchasable = false
where item_type='skin'
  and item_id in ('frame-premium-frost','frame-premium-inferno','frame-premium-celestial','frame-premium-void');

insert into public.catalog_items(item_type,item_id,name,rarity,coin_price,gem_price,purchasable,event_only,image_url,premium_only,sort_order)
values
('skin','frame-inferno-drake','Inferno Drake Frame','Epic',2600,75,true,false,null,false,100),
('skin','frame-frost-wyvern','Frost Wyvern Frame','Epic',2800,80,true,false,null,false,110),
('skin','frame-solar-phoenix','Solar Phoenix Frame','Legendary',3200,95,true,false,null,false,120),
('skin','frame-storm-eagle','Storm Eagle Frame','Legendary',3500,105,true,false,null,false,130),
('skin','frame-glacial-wolf','Glacial Wolf Frame','Legendary',3700,115,true,false,null,false,140),
('skin','frame-emerald-guardian','Emerald Guardian Frame','Legendary',3900,125,true,false,null,false,150),
('skin','frame-astral-wyrm','Astral Wyrm Frame','Mythic',4300,140,true,false,null,false,160),
('skin','frame-golden-tiger','Golden Tiger Frame','Mythic',4600,155,true,false,null,false,170),
('skin','frame-premium-royal-dragon','Royal Dragon Frame','Mythic',7000,300,true,false,null,true,200),
('skin','frame-premium-divine-phoenix','Divine Phoenix Frame','Mythic',7500,325,true,false,null,true,210),
('skin','frame-premium-celestial-crown','Celestial Crown Frame','Mythic',8000,350,true,false,null,true,220),
('skin','frame-premium-obsidian-king','Obsidian King Frame','Mythic',8500,375,true,false,null,true,230),
('skin','frame-premium-astral-sovereign','Astral Sovereign Frame','Mythic',9000,400,true,false,null,true,240),
('skin','frame-premium-golden-reign','Golden Reign Frame','Mythic',9500,425,true,false,null,true,250),
('skin','frame-premium-frost-emperor','Frost Emperor Frame','Mythic',10000,450,true,false,null,true,260),
('skin','frame-premium-infinity-royal','Infinity Royal Frame','Mythic',11000,500,true,false,null,true,270)
on conflict (item_type,item_id) do update set
  name=excluded.name, rarity=excluded.rarity, coin_price=excluded.coin_price, gem_price=excluded.gem_price,
  purchasable=excluded.purchasable, event_only=excluded.event_only, image_url=excluded.image_url,
  premium_only=excluded.premium_only, sort_order=excluded.sort_order;
