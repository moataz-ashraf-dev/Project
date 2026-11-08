-- StudyQuest Admin Control Center
-- Admins are users whose Supabase Auth app_metadata contains {"role":"admin"}.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.catalog_items add column if not exists image_url text;
alter table public.catalog_items add column if not exists premium_only boolean not null default false;
alter table public.catalog_items add column if not exists sort_order integer not null default 0;

update public.catalog_items set premium_only = true
where item_type='pet' and item_id in (
  'frost-dragon','starlight-unicorn','solar-tiger','magma-trex','storm-eagle','shadow-wolf',
  'frost-raptor','void-dragon','crimson-kitsune','jade-griffin','snow-leopard','chrono-dragon','crystal-dragon',
  'ember-raptor','azure-drake','crimson-phoenix','storm-griffin','frost-wolf','jade-triceratops','lunar-wyvern','sunfire-tiger'
);

create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read on public.site_settings for select to anon, authenticated using (true);

insert into public.site_settings(key,value) values
  ('support_email',''),
  ('support_whatsapp',''),
  ('support_telegram',''),
  ('support_message','')
on conflict (key) do nothing;

create or replace function public.admin_upsert_catalog_item(
  p_item_id text,
  p_name text,
  p_rarity text,
  p_coin_price bigint,
  p_gem_price bigint,
  p_premium_only boolean,
  p_purchasable boolean,
  p_event_only boolean,
  p_image_url text default null,
  p_sort_order integer default 0
)
returns public.catalog_items
language plpgsql
security definer
set search_path = public
as $$
declare v_row public.catalog_items;
begin
  if not public.is_admin() then raise exception 'admin_required'; end if;
  if nullif(trim(p_item_id),'') is null then raise exception 'invalid_item_id'; end if;
  if p_rarity not in ('Common','Rare','Epic','Legendary','Mythic') then raise exception 'invalid_rarity'; end if;
  insert into public.catalog_items(item_type,item_id,name,rarity,coin_price,gem_price,purchasable,event_only,image_url,premium_only,sort_order)
  values ('pet',trim(p_item_id),trim(p_name),p_rarity,greatest(0,p_coin_price),greatest(0,p_gem_price),p_purchasable,p_event_only,nullif(trim(coalesce(p_image_url,'')),''),p_premium_only,p_sort_order)
  on conflict (item_type,item_id) do update set
    name=excluded.name, rarity=excluded.rarity, coin_price=excluded.coin_price, gem_price=excluded.gem_price,
    purchasable=excluded.purchasable, event_only=excluded.event_only, image_url=excluded.image_url,
    premium_only=excluded.premium_only, sort_order=excluded.sort_order;
  select * into v_row from public.catalog_items where item_type='pet' and item_id=trim(p_item_id);
  return v_row;
end;
$$;
revoke all on function public.admin_upsert_catalog_item(text,text,text,bigint,bigint,boolean,boolean,boolean,text,integer) from public;
grant execute on function public.admin_upsert_catalog_item(text,text,text,bigint,bigint,boolean,boolean,boolean,text,integer) to authenticated;

create or replace function public.admin_update_site_setting(p_key text, p_value text)
returns public.site_settings
language plpgsql
security definer
set search_path = public
as $$
declare v_row public.site_settings;
begin
  if not public.is_admin() then raise exception 'admin_required'; end if;
  if p_key not in ('support_email','support_whatsapp','support_telegram','support_message') then raise exception 'invalid_setting'; end if;
  insert into public.site_settings(key,value,updated_at) values (p_key,coalesce(p_value,''),now())
  on conflict (key) do update set value=excluded.value, updated_at=now();
  select * into v_row from public.site_settings where key=p_key;
  return v_row;
end;
$$;
revoke all on function public.admin_update_site_setting(text,text) from public;
grant execute on function public.admin_update_site_setting(text,text) to authenticated;

create or replace function public.enforce_premium_companion_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_premium boolean; v_active boolean;
begin
  if new.item_type='pet' and new.acquired_via='purchase' then
    select premium_only into v_premium from public.catalog_items where item_type='pet' and item_id=new.item_id;
    if coalesce(v_premium,false) then
      select exists(select 1 from public.premium_entitlements pe where pe.user_id=new.user_id and pe.status='active' and (pe.current_period_end is null or pe.current_period_end>now())) into v_active;
      if not v_active then raise exception 'premium_required'; end if;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_premium_companion_purchase() from public;

insert into storage.buckets(id,name,public)
values('catalog-assets','catalog-assets',true)
on conflict(id) do update set public=true;

drop policy if exists "StudyQuest catalog admin insert" on storage.objects;
create policy "StudyQuest catalog admin insert" on storage.objects for insert to authenticated
with check (bucket_id='catalog-assets' and public.is_admin());
drop policy if exists "StudyQuest catalog admin update" on storage.objects;
create policy "StudyQuest catalog admin update" on storage.objects for update to authenticated
using (bucket_id='catalog-assets' and public.is_admin()) with check (bucket_id='catalog-assets' and public.is_admin());
drop policy if exists "StudyQuest catalog admin delete" on storage.objects;
create policy "StudyQuest catalog admin delete" on storage.objects for delete to authenticated
using (bucket_id='catalog-assets' and public.is_admin());

-- Public catalog reads now include admin-managed fields.
-- Mutations remain blocked except through the admin security-definer RPC.
