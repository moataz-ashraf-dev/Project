-- High-quality companions are expensive in the normal economy.
-- Common/Rare companions stay at their existing accessible prices.
-- Epic/Legendary/Mythic companions are set to a 5,000 Coin baseline.
-- Premium companions remain Premium-gated by the existing trigger.

update public.catalog_items
set coin_price = 5000
where item_type = 'pet'
  and rarity in ('Epic','Legendary','Mythic')
  and item_id in (
    'shadow-wolf','snow-leopard','storm-eagle','solar-tiger','royal-lion',
    'jade-crocodile','abyss-shark','twilight-manta','jade-griffin',
    'crimson-kitsune','starlight-unicorn','sky-pegasus','eternal-phoenix',
    'storm-wyvern','frost-dragon','crystal-dragon','void-dragon',
    'celestial-whale','starfall-leviathan','celestial-seraph',
    'dreamweaver-kirin','cosmic-serpent','chrono-dragon','frost-raptor',
    'magma-trex'
  );

-- Keep the curated Premium set explicitly at the same 5,000-Coin baseline
-- in the shared catalog; entitlement enforcement still controls purchase access.
update public.catalog_items
set coin_price = 5000
where item_type = 'pet'
  and item_id in (
    'frost-dragon','starlight-unicorn','solar-tiger','magma-trex','storm-eagle',
    'shadow-wolf','frost-raptor','void-dragon','crimson-kitsune','jade-griffin',
    'snow-leopard','chrono-dragon','crystal-dragon'
  );
