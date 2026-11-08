-- Premium purchase gift tiers:
-- monthly Premium => 300 Gems, yearly Premium => 800 Gems.
-- The webhook selects the tier from the paid order plan and the grant RPC
-- remains idempotent per payment order.
create or replace function public.grant_premium_purchase_gift(p_user_id uuid, p_order_id uuid, p_gem_amount integer default null)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gems bigint;
  v_inserted boolean;
  v_plan text;
  v_gift integer;
begin
  if p_user_id is null or p_order_id is null then
    raise exception 'invalid_premium_gift';
  end if;

  select plan into v_plan
  from public.payment_orders
  where id = p_order_id
    and user_id = p_user_id
    and purchase_type is distinct from 'gems'
  limit 1;

  if v_plan is null then
    raise exception 'premium_order_not_found';
  end if;

  v_gift := case when v_plan = 'yearly' then 800 else 300 end;
  if p_gem_amount is not null and p_gem_amount <> v_gift then
    raise exception 'invalid_premium_gift_amount';
  end if;

  insert into public.economy_accounts(user_id, coins, gems, stars)
  values (p_user_id, 0, 0, 0)
  on conflict (user_id) do nothing;

  insert into public.economy_transactions(user_id, idempotency_key, transaction_type, coins_delta, gems_delta, stars_delta, reference_id, metadata)
  values (p_user_id, 'premium-gift:' || p_order_id::text, 'event_reward', 0, v_gift, 0, p_order_id,
    jsonb_build_object('reason','premium_purchase_gift','gem_amount',v_gift,'plan',v_plan,'order_id',p_order_id));
  v_inserted := found;

  if v_inserted then
    update public.economy_accounts
    set gems = gems + v_gift, updated_at = now()
    where user_id = p_user_id
    returning gems into v_gems;
  else
    select gems into v_gems from public.economy_accounts where user_id = p_user_id;
  end if;

  return coalesce(v_gems, 0);
end;
$$;
revoke all on function public.grant_premium_purchase_gift(uuid,uuid,integer) from public;
