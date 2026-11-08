-- Make webhook retries safe: a provider callback may be delivered more than once.
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
    jsonb_build_object('reason', 'premium_purchase_gift', 'gem_amount', p_gem_amount, 'order_id', p_order_id))
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
revoke all on function public.grant_premium_purchase_gift(uuid, uuid, integer) from public;
