import { useEffect, useState } from 'react';
import { Coins, Flame, Gem, Loader2, PawPrint, Sparkles, Star, Trophy, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ProfileAvatar, { type AvatarPetPosition, type AvatarTheme } from '@/components/ProfileAvatar';
import { getPetAsset } from '@/lib/petAssets';

type Student = { user_id: string; display_name: string; country_code: string | null; city: string | null; total_xp: number; level: number; current_streak: number; longest_streak: number; avatar_url?: string | null; avatar_theme?: string | null; avatar_pet_position?: string | null; equipped_pet_id?: string | null; equipped_frame_id?: string | null; owned_pet_count?: number | null; golden_star_count?: number | null };
type Pet = { id: string; name: string; rarity: string; image_url: string | null };
type PublicProfile = Student & { coins: number; gems: number; pets: Pet[] };

export default function PublicStudentProfileModal({ student, language, onClose, t }: { student: Student; language: string; onClose: () => void; t: (key: string) => string }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const ar = language === 'ar';
  useEffect(() => {
    let cancelled = false;
    supabase.rpc('get_public_student_profile', { p_user_id: student.user_id }).then(({ data, error: rpcError }) => {
      if (cancelled) return;
      if (rpcError || !data) setError(true);
      else setProfile(data as PublicProfile);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [student.user_id]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={ar ? 'الملف الشخصي للطالب' : 'Student profile'}>
    <button type="button" className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={onClose} aria-label={t('close')} />
    <div className="rank-profile-modal relative w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-[1.75rem] border shadow-2xl shadow-black/50">
      <button type="button" onClick={onClose} aria-label={t('close')} className="absolute top-4 end-4 z-10 rounded-full border border-white/10 bg-black/20 p-2 text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
      {loading ? <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-neon-cyan" /></div> : error || !profile ? <p role="alert" className="p-12 text-center text-sm text-neon-rose">{ar ? 'تعذر تحميل الملف الشخصي. قد يكون الحساب أخفى بياناته.' : 'Could not load the profile. It may no longer be public.'}</p> : <>
        <div className="relative overflow-hidden px-6 pb-6 pt-9 text-center"><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(76,202,240,.17),transparent_68%)]" />
          <div className="relative mx-auto mb-4 w-fit"><ProfileAvatar avatarUrl={profile.avatar_url} fallbackPetId={profile.equipped_pet_id || 'sparky'} petPosition={(profile.avatar_pet_position as AvatarPetPosition) || 'bottom-right'} theme={(profile.avatar_theme as AvatarTheme) || 'ice'} frameId={profile.equipped_frame_id} size="lg" /></div>
          <h2 className="rank-profile-name relative font-display text-2xl font-black">{profile.display_name}</h2>
          <p className="relative mt-1 text-xs text-gray-400">{t('level')} {profile.level} · {profile.current_streak} {t('days')}{(profile.country_code || profile.city) ? ` · ${profile.city || profile.country_code}` : ''}</p>
          <div className="relative mt-4 inline-flex items-center gap-2 rounded-full border border-neon-cyan/20 bg-neon-cyan/5 px-4 py-2 text-sm font-black text-neon-cyan"><Trophy className="h-4 w-4" />{profile.total_xp.toLocaleString()} XP <span className="text-gray-600">·</span><Flame className="h-4 w-4 text-orange-300" />{profile.longest_streak} {ar ? 'أفضل سلسلة' : 'best streak'}</div>
        </div>
        <div className="grid grid-cols-1 gap-3 px-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-4"><div className="flex items-center gap-2 text-[11px] text-gray-400"><Star className="h-4 w-4 text-amber-300" />{ar ? 'النجوم الذهبية' : 'Golden stars'}</div><div className="mt-2 font-mono text-xl font-extrabold text-amber-200">{Number(profile.golden_star_count ?? 0).toLocaleString()}</div></div>
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-4"><div className="flex items-center gap-2 text-[11px] text-gray-400"><Gem className="h-4 w-4 text-cyan-300" />{ar ? 'الجواهر' : 'Gems'}</div><div className="mt-2 font-mono text-xl font-extrabold text-cyan-200">{Number(profile.gems ?? 0).toLocaleString()}</div></div>
          <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4"><div className="flex items-center gap-2 text-[11px] text-gray-400"><Coins className="h-4 w-4 text-amber-300" />{ar ? 'العملات' : 'Coins'}</div><div className="mt-2 font-mono text-xl font-extrabold text-amber-200">{Number(profile.coins ?? 0).toLocaleString()}</div></div>
        </div>
        <div className="px-5 pb-6 pt-6"><div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-bold text-gray-100"><PawPrint className="h-4 w-4 text-neon-violet" />{ar ? 'مجموعة الحيوانات' : 'Pet collection'}</h3><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-gray-400">{profile.pets?.length ?? 0}</span></div>
          {!profile.pets?.length ? <div className="rounded-2xl border border-dashed border-white/10 py-8 text-center text-xs text-gray-500">{ar ? 'لا توجد حيوانات في المجموعة حتى الآن' : 'No pets in this collection yet'}</div> : <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">{profile.pets.map((pet) => { const asset = getPetAsset(pet.id); return <div key={pet.id} className="rank-pet-tile rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 text-center"><div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/[0.07] to-transparent">{pet.image_url ? <img src={pet.image_url} alt="" className="h-14 w-14 object-contain" loading="lazy" /> : asset ? <img src={asset} alt="" className="h-14 w-14 object-contain" loading="lazy" /> : <Sparkles className="h-6 w-6 text-neon-violet" />}</div><div className="truncate text-xs font-bold text-gray-200">{pet.name}</div><div className="mt-1 text-[9px] text-gray-500">{pet.rarity}</div></div>; })}</div>}
        </div>
      </>}
    </div>
  </div>;
}
