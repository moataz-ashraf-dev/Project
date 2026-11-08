-- StudyQuest v8: differentiated companion economy + verified daily commitment bonus.
-- Common companions are affordable with Coins; higher rarities scale into Gems.

insert into public.catalog_items(item_type,item_id,name,rarity,coin_price,gem_price,purchasable,event_only) values
('pet','sparky','Sparky','Common',0,0,true,false),
('pet','meadow-finch','Meadow Finch','Common',280,0,true,false),
('pet','pebble-fox','Pebble Fox','Common',320,0,true,false),
('pet','berry-bunny','Berry Bunny','Common',360,0,true,false),
('pet','sunbeam-pup','Sunbeam Pup','Common',400,0,true,false),
('pet','mint-mouse','Mint Mouse','Common',440,0,true,false),
('pet','cloud-panda','Cloud Panda','Common',480,0,true,false),
('pet','copper-gecko','Copper Gecko','Common',520,0,true,false),
('pet','willow-fawn','Willow Fawn','Rare',850,0,true,false),
('pet','coral-seal','Coral Seal','Rare',900,0,true,false),
('pet','moon-moth','Moon Moth','Rare',960,0,true,false),
('pet','river-otter','River Otter','Rare',1020,0,true,false),
('pet','sunset-lynx','Sunset Lynx','Rare',1100,0,true,false),
('pet','crystal-owl','Crystal Owl','Rare',1180,0,true,false),
('pet','thunder-pup','Thunder Pup','Rare',1260,0,true,false),
('pet','emerald-turtle','Emerald Turtle','Rare',1350,0,true,false),
('pet','shadow-wolf','Shadow Wolf','Epic',0,28,true,false),
('pet','lunar-fox','Lunar Fox','Epic',0,32,true,false),
('pet','aurora-lynx','Aurora Lynx','Epic',0,38,true,false),
('pet','crystal-panda','Crystal Panda','Epic',0,44,true,false),
('pet','starlight-unicorn','Starlight Unicorn','Epic',0,50,true,false),
('pet','nebula-cat','Nebula Cat','Epic',0,56,true,false),
('pet','jade-griffin','Jade Griffin','Epic',0,62,true,false),
('pet','twilight-manta','Twilight Manta','Epic',0,68,true,false),
('pet','ember-kitsune','Ember Kitsune','Legendary',0,85,true,false),
('pet','frost-dragon','Frost Dragon','Legendary',0,100,true,false),
('pet','solar-tiger','Solar Tiger','Legendary',0,115,true,false),
('pet','storm-griffin','Storm Griffin','Legendary',0,130,true,false),
('pet','glacial-whale','Glacial Whale','Legendary',0,145,true,false),
('pet','crimson-phoenix','Crimson Phoenix','Legendary',0,160,true,false),
('pet','astral-deer','Astral Deer','Legendary',0,175,true,false),
('pet','prism-serpent','Prism Serpent','Legendary',0,190,true,false),
('pet','void-dragon','Void Dragon','Mythic',0,230,true,false),
('pet','cosmic-kitsune','Cosmic Kitsune','Mythic',0,260,true,false),
('pet','eternal-phoenix','Eternal Phoenix','Mythic',0,290,true,false),
('pet','starfall-leviathan','Starfall Leviathan','Mythic',0,320,true,false),
('pet','dreamweaver-kirin','Dreamweaver Kirin','Mythic',0,350,true,false),
('pet','celestial-seraph','Celestial Seraph','Mythic',0,380,true,false),
('pet','infinity-wolf','Infinity Wolf','Mythic',0,420,true,false),
('pet','chrono-dragon','Chrono Dragon','Mythic',0,450,true,false)
on conflict (item_type,item_id) do update set
  name=excluded.name, rarity=excluded.rarity, coin_price=excluded.coin_price,
  gem_price=excluded.gem_price, purchasable=excluded.purchasable, event_only=excluded.event_only;

create or replace function public.claim_daily_study_bonus()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_day date := current_date;
  v_has_session boolean;
  v_key text := 'daily-commitment:' || v_day::text;
  v_coins bigint;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  select exists(
    select 1 from public.study_sessions
    where user_id=v_user and completed=true and verification_method='server'
      and duration_minutes >= 25 and date(created_at)=v_day
  ) into v_has_session;
  if not v_has_session then
    select coins into v_coins from public.economy_accounts where user_id=v_user;
    return jsonb_build_object('claimed',false,'coins',coalesce(v_coins,0),'bonus',0,'reason','minimum_25_minutes_required');
  end if;
  if exists(select 1 from public.economy_transactions where user_id=v_user and idempotency_key=v_key) then
    select coins into v_coins from public.economy_accounts where user_id=v_user;
    return jsonb_build_object('claimed',false,'coins',coalesce(v_coins,0),'bonus',0,'reason','already_claimed');
  end if;
  update public.economy_accounts set coins=coins+100, updated_at=now() where user_id=v_user returning coins into v_coins;
  insert into public.economy_transactions(user_id,idempotency_key,transaction_type,coins_delta,metadata)
  values(v_user,v_key,'daily_commitment',100,jsonb_build_object('study_date',v_day,'minimum_minutes',25));
  return jsonb_build_object('claimed',true,'coins',v_coins,'bonus',100);
end;
$$;
revoke all on function public.claim_daily_study_bonus() from public;
grant execute on function public.claim_daily_study_bonus() to authenticated;
