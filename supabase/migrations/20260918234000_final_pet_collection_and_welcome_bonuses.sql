-- Final companion cleanup: remove the weak placeholder-like fantasy creatures
-- from the visible store and replace them with strong, non-Premium companions.
update public.catalog_items
set purchasable = false
where item_type = 'pet'
  and item_id in ('celestial-whale','starfall-leviathan','celestial-seraph','dreamweaver-kirin','cosmic-serpent','royal-lion','jade-crocodile','abyss-shark','twilight-manta','sky-pegasus','eternal-phoenix','storm-wyvern');

insert into public.catalog_items(item_type,item_id,name,rarity,coin_price,gem_price,purchasable,event_only) values
('pet','ember-raptor','Ember Raptor','Epic',5000,250,true,false),
('pet','azure-drake','Azure Drake','Epic',5000,265,true,false),
('pet','crimson-phoenix','Crimson Phoenix','Epic',5000,280,true,false),
('pet','storm-griffin','Storm Griffin','Epic',5000,295,true,false),
('pet','frost-wolf','Frost Wolf','Legendary',5000,310,true,false),
('pet','jade-triceratops','Jade Triceratops','Legendary',5000,325,true,false),
('pet','lunar-wyvern','Lunar Wyvern','Legendary',5000,340,true,false),
('pet','sunfire-tiger','Sunfire Tiger','Legendary',5000,355,true,false)
on conflict (item_type,item_id) do update set
  name=excluded.name, rarity=excluded.rarity, coin_price=excluded.coin_price,
  gem_price=excluded.gem_price, purchasable=excluded.purchasable, event_only=excluded.event_only;

-- Keep all genuinely high-quality non-Premium companions at the 5,000 Coin threshold.
update public.catalog_items
set coin_price = 5000
where item_type = 'pet'
  and item_id in ('ember-raptor','azure-drake','crimson-phoenix','storm-griffin','frost-wolf','jade-triceratops','lunar-wyvern','sunfire-tiger');

-- New accounts receive a one-time starter economy bonus: 300 Coins + 5 Gems.
-- The idempotency key makes the grant safe if the account-default trigger is retried.
create or replace function public.ensure_user_game_defaults()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.economy_accounts(user_id, coins, gems, stars)
  values (new.id, 0, 0, 0)
  on conflict (user_id) do nothing;

  insert into public.user_equipment(user_id, equipped_pet_id)
  values (new.id, 'sparky')
  on conflict (user_id) do nothing;

  insert into public.user_inventory(user_id, item_type, item_id, acquired_via)
  values (new.id, 'pet', 'sparky', 'migration')
  on conflict do nothing;

  insert into public.economy_transactions(user_id, idempotency_key, transaction_type, coins_delta, gems_delta, stars_delta, metadata)
  values (new.id, 'signup-welcome:' || new.id::text, 'event_reward', 300, 5, 0,
    jsonb_build_object('reason','first_registration','coins',300,'gems',5));

  if found then
    update public.economy_accounts
    set coins = coins + 300, gems = gems + 5, updated_at = now()
    where user_id = new.id;
  end if;

  return new;
end;
$$;

-- Successful Premium purchases grant 300 Gems as a purchase bonus.
-- This is idempotent per paid Premium order and can be safely retried by the webhook.
create or replace function public.grant_premium_purchase_gift(p_user_id uuid, p_order_id uuid, p_gem_amount integer default 300)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gems bigint;
  v_inserted boolean;
begin
  if p_user_id is null or p_order_id is null or p_gem_amount is null or p_gem_amount <= 0 then
    raise exception 'invalid_premium_gift';
  end if;

  insert into public.economy_accounts(user_id, coins, gems, stars)
  values (p_user_id, 0, 0, 0)
  on conflict (user_id) do nothing;

  insert into public.economy_transactions(user_id, idempotency_key, transaction_type, coins_delta, gems_delta, stars_delta, reference_id, metadata)
  values (p_user_id, 'premium-gift:' || p_order_id::text, 'event_reward', 0, p_gem_amount, 0, p_order_id,
    jsonb_build_object('reason','premium_purchase_gift','gem_amount',p_gem_amount,'order_id',p_order_id));
  v_inserted := found;

  if v_inserted then
    update public.economy_accounts
    set gems = gems + p_gem_amount, updated_at = now()
    where user_id = p_user_id
    returning gems into v_gems;
  else
    select gems into v_gems from public.economy_accounts where user_id = p_user_id;
  end if;

  return coalesce(v_gems, 0);
end;
$$;
revoke all on function public.grant_premium_purchase_gift(uuid,uuid,integer) from public;
