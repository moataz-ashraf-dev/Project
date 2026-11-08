-- Profile frames are removed from the product UI for now.
-- Keep historical inventory/catalog data intact, but prevent any new frame purchases.
update public.catalog_items
set purchasable = false
where item_type = 'skin';
