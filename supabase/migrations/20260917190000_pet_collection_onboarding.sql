-- StudyQuest v7: 40-companion collection + gentle onboarding.
-- New accounts begin without a companion; the first starter companion is earned after two verified study days.

alter table public.user_equipment alter column equipped_pet_id drop not null;
alter table public.user_equipment alter column equipped_pet_id drop default;

create or replace function public.ensure_user_game_defaults()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.economy_accounts(user_id, coins, gems, stars)
  values (new.id, 0, 0, 0)
  on conflict (user_id) do nothing;
  insert into public.user_equipment(user_id, equipped_pet_id)
  values (new.id, null)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Keep existing accounts intact; only remove the automatic starter grant from future signups.

insert into public.catalog_items(item_type,item_id,name,rarity,coin_price,gem_price,purchasable,event_only) values
('pet','sparky','Sparky','Common',0,0,false,false),
('pet','aqua-turtle','Aqua Turtle','Common',250,0,true,false),
('pet','meadow-bunny','Meadow Bunny','Common',300,0,true,false),
('pet','cozy-otter','Cozy Otter','Common',350,0,true,false),
('pet','sunny-chick','Sunny Chick','Common',400,0,true,false),
('pet','mint-gecko','Mint Gecko','Common',450,0,true,false),
('pet','pebble-pup','Pebble Pup','Common',500,0,true,false),
('pet','cloud-mouse','Cloud Mouse','Common',550,0,true,false),
('pet','frost-kit','Frost Fox','Rare',700,0,true,false),
('pet','coral-otter','Coral Otter','Rare',750,0,true,false),
('pet','ember-lynx','Ember Lynx','Rare',800,0,true,false),
('pet','moon-rabbit','Moon Rabbit','Rare',850,0,true,false),
('pet','ocean-koi','Ocean Koi','Rare',900,0,true,false),
('pet','moss-deer','Moss Deer','Rare',950,0,true,false),
('pet','crystal-owl','Crystal Owl','Rare',1000,0,true,false),
('pet','thunder-pup','Thunder Pup','Rare',1050,0,true,false),
('pet','shadow-wyrm','Shadow Wolf','Epic',0,25,true,false),
('pet','lunar-fox','Lunar Fox','Epic',0,30,true,false),
('pet','aurora-lynx','Aurora Lynx','Epic',0,35,true,false),
('pet','crystal-panda','Crystal Panda','Epic',0,40,true,false),
('pet','starlight-unicorn','Starlight Unicorn','Epic',0,45,true,false),
('pet','nebula-cat','Nebula Cat','Epic',0,50,true,false),
('pet','jade-griffin','Jade Griffin','Epic',0,55,true,false),
('pet','twilight-manta','Twilight Manta','Epic',0,60,true,false),
('pet','celestial-phoenix','Phoenix','Legendary',0,70,true,false),
('pet','frost-dragon','Frost Dragon','Legendary',0,80,true,false),
('pet','solar-tiger','Solar Tiger','Legendary',0,90,true,false),
('pet','celestial-deer','Celestial Deer','Legendary',0,100,true,false),
('pet','storm-griffin','Storm Griffin','Legendary',0,110,true,false),
('pet','glacial-whale','Glacial Whale','Legendary',0,120,true,false),
('pet','crimson-kitsune','Crimson Kitsune','Legendary',0,130,true,false),
('pet','astral-tiger','Astral Tiger','Legendary',0,140,true,false),
('pet','void-dragon','Void Dragon','Mythic',0,180,true,false),
('pet','aurora-seraph','Aurora Seraph','Mythic',0,200,true,false),
('pet','cosmic-kitsune','Cosmic Kitsune','Mythic',0,220,true,false),
('pet','eternal-phoenix','Eternal Phoenix','Mythic',0,240,true,false),
('pet','starfall-leviathan','Starfall Leviathan','Mythic',0,260,true,false),
('pet','dreamweaver-fox','Dreamweaver Fox','Mythic',0,280,true,false),
('pet','celestial-kirin','Celestial Kirin','Mythic',0,300,true,false),
('pet','infinity-wolf','Infinity Wolf','Mythic',0,320,true,false)
on conflict (item_type,item_id) do update set
  name=excluded.name, rarity=excluded.rarity, coin_price=excluded.coin_price,
  gem_price=excluded.gem_price, purchasable=excluded.purchasable, event_only=excluded.event_only;

create or replace function public.claim_starter_companion()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_days integer;
  v_has boolean;
  v_coins bigint;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;

  select exists(select 1 from public.user_inventory where user_id=v_user and item_type='pet' and item_id='sparky') into v_has;
  if v_has then
    select coins into v_coins from public.economy_accounts where user_id=v_user;
    return jsonb_build_object('claimed',true,'already_claimed',true,'coins',coalesce(v_coins,0),'pet_id','sparky');
  end if;

  select count(*) into v_days
  from (select date(created_at) as study_day from public.study_sessions where user_id=v_user and completed=true and verification_method='server' group by date(created_at)) d;

  if v_days < 2 then
    return jsonb_build_object('claimed',false,'eligible',false,'study_days',v_days);
  end if;

  insert into public.user_inventory(user_id,item_type,item_id,acquired_via)
  values (v_user,'pet','sparky','starter_companion')
  on conflict do nothing;

  insert into public.user_equipment(user_id,equipped_pet_id)
  values (v_user,'sparky')
  on conflict (user_id) do update set equipped_pet_id='sparky', updated_at=now();

  update public.economy_accounts
  set coins=coins+250, updated_at=now()
  where user_id=v_user
  returning coins into v_coins;

  insert into public.economy_transactions(user_id,idempotency_key,transaction_type,coins_delta,metadata)
  values (v_user,'starter-companion:sparky','event_reward',250,jsonb_build_object('pet_id','sparky','study_days',v_days))
  on conflict (user_id,idempotency_key) do nothing;

  return jsonb_build_object('claimed',true,'already_claimed',false,'coins',v_coins,'pet_id','sparky','study_days',v_days);
end;
$$;
revoke all on function public.claim_starter_companion() from public;
grant execute on function public.claim_starter_companion() to authenticated;
