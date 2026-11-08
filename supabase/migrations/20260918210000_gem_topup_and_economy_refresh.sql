-- StudyQuest: transparent Gem top-up and refreshed economy.
-- Regular/Rare companions can use either currency; Gem prices are roughly half the Coin price.
update public.catalog_items set gem_price = case item_id
  when 'velvet-cat' then 25 when 'moon-rabbit' then 28 when 'ember-pup' then 30 when 'pearl-hamster' then 33
  when 'suncrest-parrot' then 35 when 'ice-penguin' then 40 when 'sage-turtle' then 45 when 'cobalt-donkey' then 50
  when 'aurora-fox' then 75 when 'river-otter' then 100 when 'ruby-red-panda' then 125 when 'mist-raccoon' then 150
  when 'willow-deer' then 175 when 'coral-seal' then 200 when 'crystal-owl' then 225 when 'golden-capybara' then 250
  else gem_price end
where item_type='pet' and item_id not in ('sparky');

-- Premium prices rise with rarity; every Premium companion remains 100+ Gems and 1,000–2,000 Coins.
update public.catalog_items set coin_price = case item_id
  when 'shadow-wolf' then 1000 when 'snow-leopard' then 1050 when 'storm-eagle' then 1100 when 'solar-tiger' then 1200
  when 'royal-lion' then 1250 when 'jade-crocodile' then 1300 when 'abyss-shark' then 1350 when 'twilight-manta' then 1400
  when 'jade-griffin' then 1450 when 'crimson-kitsune' then 1500 when 'starlight-unicorn' then 1550 when 'sky-pegasus' then 1600
  when 'eternal-phoenix' then 1650 when 'storm-wyvern' then 1700 when 'frost-dragon' then 1750 when 'crystal-dragon' then 1800
  when 'void-dragon' then 1850 when 'celestial-whale' then 1750 when 'starfall-leviathan' then 1900 when 'celestial-seraph' then 1925
  when 'dreamweaver-kirin' then 1950 when 'cosmic-serpent' then 1975 when 'chrono-dragon' then 2000
  when 'frost-raptor' then 1800 when 'magma-trex' then 1900 else coin_price end,
  gem_price = case item_id
  when 'shadow-wolf' then 110 when 'snow-leopard' then 115 when 'storm-eagle' then 120 when 'solar-tiger' then 130
  when 'royal-lion' then 135 when 'jade-crocodile' then 140 when 'abyss-shark' then 150 when 'twilight-manta' then 160
  when 'jade-griffin' then 170 when 'crimson-kitsune' then 180 when 'starlight-unicorn' then 195 when 'sky-pegasus' then 210
  when 'eternal-phoenix' then 225 when 'storm-wyvern' then 240 when 'frost-dragon' then 260 when 'crystal-dragon' then 280
  when 'void-dragon' then 300 when 'celestial-whale' then 320 when 'starfall-leviathan' then 340 when 'celestial-seraph' then 360
  when 'dreamweaver-kirin' then 380 when 'cosmic-serpent' then 400 when 'chrono-dragon' then 450
  when 'frost-raptor' then 275 when 'magma-trex' then 325 else gem_price end
where item_type='pet' and item_id in (
  'shadow-wolf','snow-leopard','storm-eagle','solar-tiger','royal-lion','jade-crocodile','abyss-shark','twilight-manta','jade-griffin','crimson-kitsune','starlight-unicorn','sky-pegasus','eternal-phoenix','storm-wyvern','frost-dragon','crystal-dragon','void-dragon','celestial-whale','starfall-leviathan','celestial-seraph','dreamweaver-kirin','cosmic-serpent','chrono-dragon','frost-raptor','magma-trex');

-- Allow the same payment ledger to represent Premium or Gem top-ups.
alter table public.payment_orders drop constraint if exists payment_orders_plan_check;
alter table public.payment_orders add constraint payment_orders_plan_check check (plan in ('monthly','yearly','gems_120','gems_300','gems_700','gems_1600'));
alter table public.payment_orders add column if not exists purchase_type text not null default 'premium' check (purchase_type in ('premium','gems'));
alter table public.payment_orders add column if not exists gem_amount integer check (gem_amount is null or gem_amount > 0);

-- Ensure old rows are explicitly marked as Premium.
update public.payment_orders set purchase_type='premium' where purchase_type is null;

-- Keep gem top-ups server-authoritative and idempotent.
create unique index if not exists payment_orders_gem_paid_tx_idx on public.payment_orders(provider_transaction_id) where provider_transaction_id is not null;


-- Atomic, idempotent credit for a successful paid Gem order.
create or replace function public.credit_gems_from_payment(p_user_id uuid, p_order_id uuid, p_gem_amount integer)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gems bigint;
  v_inserted boolean := false;
begin
  if p_user_id is null or p_order_id is null or p_gem_amount is null or p_gem_amount <= 0 then
    raise exception 'invalid_gem_credit';
  end if;

  insert into public.economy_accounts(user_id, coins, gems, stars)
  values (p_user_id, 0, 0, 0)
  on conflict (user_id) do nothing;

  insert into public.economy_transactions(user_id, idempotency_key, transaction_type, coins_delta, gems_delta, stars_delta, reference_id, metadata)
  values (p_user_id, 'paymob-gems:' || p_order_id::text, 'purchase', 0, p_gem_amount, 0, p_order_id, jsonb_build_object('provider','paymob','order_id',p_order_id,'gem_amount',p_gem_amount))
  on conflict (user_id, idempotency_key) do nothing;
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
revoke all on function public.credit_gems_from_payment(uuid,uuid,integer) from public;
