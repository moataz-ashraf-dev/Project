-- Profile Frames: lightweight CSS-rendered avatar borders stored as skin items.
-- Standard frames are available to everyone; premium frames require active Premium.

insert into public.catalog_items(item_type,item_id,name,rarity,coin_price,gem_price,purchasable,event_only,image_url,premium_only,sort_order)
values
  ('skin','frame-ocean-glass','Ocean Glass Frame','Rare',700,35,true,false,null,false,100),
  ('skin','frame-ember-line','Ember Line Frame','Rare',900,45,true,false,null,false,110),
  ('skin','frame-forest-crest','Forest Crest Frame','Epic',1400,65,true,false,null,false,120),
  ('skin','frame-night-prism','Night Prism Frame','Epic',1800,80,true,false,null,false,130),
  ('skin','frame-solar-edge','Solar Edge Frame','Legendary',2300,95,true,false,null,false,140),
  ('skin','frame-royal-arc','Royal Arc Frame','Legendary',2800,115,true,false,null,false,150),
  ('skin','frame-aurora-crown','Aurora Crown Frame','Legendary',3200,135,true,false,null,false,160),
  ('skin','frame-crystal-halo','Crystal Halo Frame','Mythic',3800,160,true,false,null,false,170),
  ('skin','frame-premium-frost','Frost Royal Frame','Legendary',4200,190,true,false,null,true,200),
  ('skin','frame-premium-inferno','Inferno Crown Frame','Legendary',4500,210,true,false,null,true,210),
  ('skin','frame-premium-celestial','Celestial Halo Frame','Mythic',4800,240,true,false,null,true,220),
  ('skin','frame-premium-void','Void Prism Frame','Mythic',5000,270,true,false,null,true,230)
on conflict (item_type,item_id) do update set
  name=excluded.name, rarity=excluded.rarity, coin_price=excluded.coin_price, gem_price=excluded.gem_price,
  purchasable=excluded.purchasable, event_only=excluded.event_only, premium_only=excluded.premium_only, sort_order=excluded.sort_order;

create or replace function public.enforce_premium_companion_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_premium boolean; v_active boolean;
begin
  if new.item_type in ('pet','skin') and new.acquired_via='purchase' then
    select premium_only into v_premium
    from public.catalog_items
    where item_type=new.item_type and item_id=new.item_id;
    if coalesce(v_premium,false) then
      select exists(
        select 1 from public.premium_entitlements pe
        where pe.user_id=new.user_id and pe.status='active'
          and (pe.current_period_end is null or pe.current_period_end>now())
      ) into v_active;
      if not v_active then raise exception 'premium_required'; end if;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_premium_companion_purchase() from public;
