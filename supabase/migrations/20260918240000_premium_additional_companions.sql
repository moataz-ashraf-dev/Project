-- Move the eight newly illustrated high-quality companions into Premium-only collection.
-- Their existing individual artwork is already part of the app assets; no montage/sheet is added.
-- The catalog remains purchasable so the normal purchase RPC can reach the server-side
-- Premium entitlement trigger; non-Premium users are blocked there and in the UI.

update public.catalog_items
set purchasable = true
where item_type = 'pet'
  and item_id in (
    'ember-raptor','azure-drake','crimson-phoenix','storm-griffin',
    'frost-wolf','jade-triceratops','lunar-wyvern','sunfire-tiger'
  );

-- Keep the same high-quality companions available in the shared catalog so the
-- Premium page can render their names/prices, while the server trigger below
-- prevents non-Premium purchase attempts.
update public.catalog_items
set coin_price = 5000
where item_type = 'pet'
  and item_id in (
    'ember-raptor','azure-drake','crimson-phoenix','storm-griffin',
    'frost-wolf','jade-triceratops','lunar-wyvern','sunfire-tiger'
  );

create or replace function public.enforce_premium_companion_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  premium_ids text[] := array[
    'frost-dragon','starlight-unicorn','solar-tiger','magma-trex','storm-eagle','shadow-wolf',
    'frost-raptor','void-dragon','crimson-kitsune','jade-griffin','snow-leopard','chrono-dragon','crystal-dragon',
    'ember-raptor','azure-drake','crimson-phoenix','storm-griffin','frost-wolf','jade-triceratops','lunar-wyvern','sunfire-tiger'
  ];
  v_active boolean;
begin
  if new.item_type = 'pet' and new.item_id = any(premium_ids) and new.acquired_via = 'purchase' then
    select exists (
      select 1 from public.premium_entitlements pe
      where pe.user_id = new.user_id and pe.status = 'active'
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
