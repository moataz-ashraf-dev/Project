-- Profile badge placement uses the four visual corners so the user's uploaded
-- profile picture remains the primary identity surface.
alter table public.profiles drop constraint if exists profiles_avatar_pet_position_check;
alter table public.leaderboard_profiles drop constraint if exists leaderboard_profiles_avatar_pet_position_check;

update public.profiles
set avatar_pet_position = case avatar_pet_position
  when 'top' then 'top-right'
  when 'right' then 'top-right'
  when 'left' then 'bottom-left'
  when 'bottom' then 'bottom-right'
  else avatar_pet_position
end
where avatar_pet_position in ('top','bottom','left','right');

update public.leaderboard_profiles
set avatar_pet_position = case avatar_pet_position
  when 'top' then 'top-right'
  when 'right' then 'top-right'
  when 'left' then 'bottom-left'
  when 'bottom' then 'bottom-right'
  else avatar_pet_position
end
where avatar_pet_position in ('top','bottom','left','right');

alter table public.profiles add constraint profiles_avatar_pet_position_check
  check (avatar_pet_position in ('top-right','top-left','bottom-right','bottom-left'));
alter table public.leaderboard_profiles add constraint leaderboard_profiles_avatar_pet_position_check
  check (avatar_pet_position in ('top-right','top-left','bottom-right','bottom-left'));

alter table public.profiles alter column avatar_pet_position set default 'bottom-right';
alter table public.leaderboard_profiles alter column avatar_pet_position set default 'bottom-right';
