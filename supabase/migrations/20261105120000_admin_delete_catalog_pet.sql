begin;

create or replace function public.admin_delete_catalog_pet(p_item_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admin_required'; end if;
  if nullif(trim(p_item_id), '') is null then raise exception 'invalid_item_id'; end if;

  -- Keep existing user collections intact; they can be archived instead.
  if exists (
    select 1 from public.user_inventory
    where item_type = 'pet' and item_id = trim(p_item_id)
  ) then
    raise exception 'catalog_item_in_use';
  end if;

  delete from public.catalog_items
  where item_type = 'pet' and item_id = trim(p_item_id);
  if not found then raise exception 'catalog_item_not_found'; end if;
end;
$$;

revoke all on function public.admin_delete_catalog_pet(text) from public;
grant execute on function public.admin_delete_catalog_pet(text) to authenticated;

commit;