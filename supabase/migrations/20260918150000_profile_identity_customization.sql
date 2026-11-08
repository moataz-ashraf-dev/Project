-- Profile identity customization: public avatar, avatar theme, pet badge placement,
-- and safe leaderboard projection fields. Avatar binaries live in the public avatars bucket;
-- the profiles row stores only the resulting public URL and presentation settings.

alter table public.profiles add column if not exists avatar_theme text not null default 'ice'
  check (avatar_theme in ('ice','fire','aurora','royal','void'));
alter table public.profiles add column if not exists avatar_pet_position text not null default 'bottom-right'
  check (avatar_pet_position in ('top-right','top-left','bottom-right','bottom-left'));

-- Public bucket: the URL is intentionally public because leaderboard profiles are public-facing.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif'];

-- Users may manage only objects inside their own folder.
drop policy if exists "StudyQuest avatars insert own" on storage.objects;
create policy "StudyQuest avatars insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "StudyQuest avatars update own" on storage.objects;
create policy "StudyQuest avatars update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "StudyQuest avatars delete own" on storage.objects;
create policy "StudyQuest avatars delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Keep the existing authenticated read policy model intact; public bucket delivery does not
-- require exposing storage.objects rows through a broad authenticated SELECT grant.

alter table public.leaderboard_profiles add column if not exists avatar_url text;
alter table public.leaderboard_profiles add column if not exists avatar_theme text not null default 'ice'
  check (avatar_theme in ('ice','fire','aurora','royal','void'));
alter table public.leaderboard_profiles add column if not exists avatar_pet_position text not null default 'bottom-right'
  check (avatar_pet_position in ('top-right','top-left','bottom-right','bottom-left'));
alter table public.leaderboard_profiles add column if not exists equipped_pet_id text;
alter table public.leaderboard_profiles add column if not exists owned_pet_count integer not null default 0 check (owned_pet_count >= 0);

create or replace function public.sync_leaderboard_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owned_pet_count integer;
  v_equipped_pet text;
begin
  select count(*)::integer into v_owned_pet_count
  from public.user_inventory
  where user_id = new.id and item_type = 'pet';

  select equipped_pet_id into v_equipped_pet
  from public.user_equipment
  where user_id = new.id;

  insert into public.leaderboard_profiles(
    user_id, display_name, country_code, city, total_xp, level, current_streak, longest_streak,
    leaderboard_visible, avatar_url, avatar_theme, avatar_pet_position, equipped_pet_id, owned_pet_count, updated_at
  ) values (
    new.id,
    coalesce(nullif(new.display_name,''), 'StudyHero'),
    new.country_code,
    new.city,
    coalesce(new.total_xp,0),
    greatest(1, coalesce(new.level,1)),
    greatest(0, coalesce(new.current_streak,0)),
    greatest(0, coalesce(new.longest_streak,0)),
    coalesce(new.leaderboard_visible,true),
    new.avatar_url,
    coalesce(new.avatar_theme,'ice'),
    coalesce(new.avatar_pet_position,'bottom-right'),
    v_equipped_pet,
    coalesce(v_owned_pet_count,0),
    now()
  )
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    country_code = excluded.country_code,
    city = excluded.city,
    total_xp = excluded.total_xp,
    level = excluded.level,
    current_streak = excluded.current_streak,
    longest_streak = excluded.longest_streak,
    leaderboard_visible = excluded.leaderboard_visible,
    avatar_url = excluded.avatar_url,
    avatar_theme = excluded.avatar_theme,
    avatar_pet_position = excluded.avatar_pet_position,
    equipped_pet_id = excluded.equipped_pet_id,
    owned_pet_count = excluded.owned_pet_count,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_sync_leaderboard on public.profiles;
create trigger profiles_sync_leaderboard
after insert or update of display_name, country_code, city, total_xp, level, current_streak, longest_streak, leaderboard_visible, avatar_url, avatar_theme, avatar_pet_position
on public.profiles
for each row execute function public.sync_leaderboard_profile();

-- Backfill the projection, including existing inventory/equipment.
insert into public.leaderboard_profiles(
  user_id, display_name, country_code, city, total_xp, level, current_streak, longest_streak,
  leaderboard_visible, avatar_url, avatar_theme, avatar_pet_position, equipped_pet_id, owned_pet_count, updated_at
)
select p.id, coalesce(nullif(p.display_name,''),'StudyHero'), p.country_code, p.city,
       coalesce(p.total_xp,0), greatest(1,coalesce(p.level,1)), greatest(0,coalesce(p.current_streak,0)),
       greatest(0,coalesce(p.longest_streak,0)), coalesce(p.leaderboard_visible,true), p.avatar_url,
       coalesce(p.avatar_theme,'ice'), coalesce(p.avatar_pet_position,'bottom-right'), ue.equipped_pet_id,
       coalesce((select count(*)::integer from public.user_inventory ui where ui.user_id=p.id and ui.item_type='pet'),0), now()
from public.profiles p
left join public.user_equipment ue on ue.user_id=p.id
on conflict (user_id) do update set
  display_name=excluded.display_name, country_code=excluded.country_code, city=excluded.city,
  total_xp=excluded.total_xp, level=excluded.level, current_streak=excluded.current_streak,
  longest_streak=excluded.longest_streak, leaderboard_visible=excluded.leaderboard_visible,
  avatar_url=excluded.avatar_url, avatar_theme=excluded.avatar_theme, avatar_pet_position=excluded.avatar_pet_position,
  equipped_pet_id=excluded.equipped_pet_id, owned_pet_count=excluded.owned_pet_count, updated_at=now();

-- Keep public projection in sync after purchases/equipment changes too.
create or replace function public.refresh_leaderboard_collection_identity(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
  v_equipped text;
begin
  select count(*)::integer into v_count from public.user_inventory where user_id=p_user_id and item_type='pet';
  select equipped_pet_id into v_equipped from public.user_equipment where user_id=p_user_id;
  update public.leaderboard_profiles
  set owned_pet_count=coalesce(v_count,0), equipped_pet_id=v_equipped, updated_at=now()
  where user_id=p_user_id;
end;
$$;
revoke all on function public.refresh_leaderboard_collection_identity(uuid) from public;

-- Trigger only observes writes made by trusted server-side RPCs because client writes to these tables are revoked.
create or replace function public.sync_collection_identity_after_inventory()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.refresh_leaderboard_collection_identity(case when TG_OP='DELETE' then old.user_id else new.user_id end);
  if TG_OP='DELETE' then return old; else return new; end if;
end;
$$;
drop trigger if exists user_inventory_sync_leaderboard_identity on public.user_inventory;
create trigger user_inventory_sync_leaderboard_identity
after insert or update or delete on public.user_inventory
for each row execute function public.sync_collection_identity_after_inventory();

create or replace function public.sync_collection_identity_after_equipment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.refresh_leaderboard_collection_identity(case when TG_OP='DELETE' then old.user_id else new.user_id end);
  if TG_OP='DELETE' then return old; else return new; end if;
end;
$$;
drop trigger if exists user_equipment_sync_leaderboard_identity on public.user_equipment;
create trigger user_equipment_sync_leaderboard_identity
after insert or update or delete on public.user_equipment
for each row execute function public.sync_collection_identity_after_equipment();

-- Ensure the new profile fields are writable by the profile owner only.
revoke update on public.profiles from authenticated;
grant update (username, display_name, avatar_url, avatar_theme, avatar_pet_position, locale, country_code, city, timezone) on public.profiles to authenticated;

-- Re-define the refresh helper so collection writes also create the public projection
-- if an older account somehow has no leaderboard row yet.
create or replace function public.refresh_leaderboard_collection_identity(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
  v_equipped text;
begin
  select count(*)::integer into v_count from public.user_inventory where user_id=p_user_id and item_type='pet';
  select equipped_pet_id into v_equipped from public.user_equipment where user_id=p_user_id;
  update public.leaderboard_profiles
  set owned_pet_count=coalesce(v_count,0), equipped_pet_id=v_equipped, updated_at=now()
  where user_id=p_user_id;
  if not found then
    insert into public.leaderboard_profiles(user_id, display_name, country_code, city, total_xp, level, current_streak, longest_streak, leaderboard_visible, avatar_url, avatar_theme, avatar_pet_position, equipped_pet_id, owned_pet_count)
    select p.id, coalesce(nullif(p.display_name,''),'StudyHero'), p.country_code, p.city,
           coalesce(p.total_xp,0), greatest(1,coalesce(p.level,1)), greatest(0,coalesce(p.current_streak,0)), greatest(0,coalesce(p.longest_streak,0)),
           coalesce(p.leaderboard_visible,true), p.avatar_url, coalesce(p.avatar_theme,'ice'), coalesce(p.avatar_pet_position,'bottom-right'), v_equipped, coalesce(v_count,0)
    from public.profiles p where p.id=p_user_id
    on conflict (user_id) do update set owned_pet_count=excluded.owned_pet_count, equipped_pet_id=excluded.equipped_pet_id, updated_at=now();
  end if;
end;
$$;
revoke all on function public.refresh_leaderboard_collection_identity(uuid) from public;
