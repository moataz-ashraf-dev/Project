import { useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Star, Sparkles, Coins, Gem, Clock3, Timer, ImagePlus } from 'lucide-react';
import { store } from '@/lib/store';
import { profileStore, PET_CATALOG, type ProfileData } from '@/lib/profileStore';
import { type LanguageCode, type TranslationKey, translatePetId, translateRarity } from '@/lib/i18n';
import ProfileAvatar, { AVATAR_THEMES, type AvatarPetPosition, type AvatarTheme, avatarThemeDef } from '@/components/ProfileAvatar';
import { getPetAsset } from '@/lib/petAssets';
import { getUserStorageKey } from '@/lib/storageIdentity';
import { useAuth } from '@/auth/useAuth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { loadPetCatalog, type CloudPetDefinition } from '@/lib/catalog';

import { announceCommerce } from '@/lib/notifications';

type RarityKey = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
const RARITY_ORDER: RarityKey[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];

const RARITY_STYLES: Record<string, string> = {
  Common: 'text-gray-400 border-gray-400/30 bg-gray-400/5',
  Rare: 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/5',
  Epic: 'text-neon-violet border-neon-violet/30 bg-neon-violet/5',
  Legendary: 'text-neon-amber border-neon-amber/30 bg-neon-amber/5',
  Mythic: 'text-neon-rose border-neon-rose/30 bg-neon-rose/5',
};

const RARITY_GLOW: Record<string, string> = {
  Common: '',
  Rare: 'group-hover:border-neon-cyan/50 group-hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]',
  Epic: 'group-hover:border-neon-violet/50 group-hover:shadow-[0_0_20px_rgba(177,77,255,0.15)]',
  Legendary: 'group-hover:border-neon-amber/50 group-hover:shadow-[0_0_20px_rgba(255,170,0,0.15)]',
  Mythic: 'group-hover:border-neon-rose/50 group-hover:shadow-[0_0_20px_rgba(255,61,113,0.15)]',
};

const RARITY_TEXT_GLOW: Record<string, string> = {
  Common: '',
  Rare: 'text-neon-cyan',
  Epic: 'text-neon-violet',
  Legendary: 'text-neon-amber',
  Mythic: 'text-neon-rose',
};

const RARITY_CHIP_ACTIVE: Record<string, string> = {
  Common: 'border-gray-400/50 bg-gray-400/10 text-gray-300',
  Rare: 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan',
  Epic: 'border-neon-violet/50 bg-neon-violet/10 text-neon-violet',
  Legendary: 'border-neon-amber/50 bg-neon-amber/10 text-neon-amber',
  Mythic: 'border-neon-rose/50 bg-neon-rose/10 text-neon-rose',
};
const STARS_PER_COMPLETED_SESSION = 5;
const STARS_PER_LEVEL = 50;
const STUDY_HOURS_GOAL = 20;

const PROFILE_HEADER_KEY = 'studyquest_profile_header_v1';

function loadHeaderState(): { name: string; selectedAvatar: string } {
  try {
    const raw = localStorage.getItem(getUserStorageKey(PROFILE_HEADER_KEY));
    if (raw) return JSON.parse(raw) as { name: string; selectedAvatar: string };
  } catch { /* ignore */ }
  return { name: 'StudyHero', selectedAvatar: 'sparky' };
}

type Props = { language: LanguageCode; t: (key: TranslationKey) => string };

export default function ProfilePage({ language, t }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [coins, setCoins] = useState(0);
  const [gems, setGems] = useState(0);
  const [studyMinutes, setStudyMinutes] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [profile, setProfile] = useState<ProfileData>(() => profileStore.load());
  const [name, setName] = useState(() => loadHeaderState().name);
  const [selectedAvatar, setSelectedAvatar] = useState(() => loadHeaderState().selectedAvatar);
  const [premiumActive, setPremiumActive] = useState(false);
  const [countryCode, setCountryCode] = useState('');
  const [city, setCity] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [stars, setStars] = useState(0);
  const [serverLevel, setServerLevel] = useState(1);
  const [shopMessage, setShopMessage] = useState('');
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [cloudPets, setCloudPets] = useState<CloudPetDefinition[]>(PET_CATALOG.map(p => ({...p, premiumOnly:false})));
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarMessage, setAvatarMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadPetCatalog().then(items => { if (!cancelled) setCloudPets(items); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const local = store.load();
    setCoins(local.appState.coins); setGems(local.appState.gems);
    const completed = local.sessions.filter((s) => s.completed);
    setCompletedSessions(completed.length); setStudyMinutes(completed.reduce((sum, s) => sum + s.duration_minutes, 0));

    if (!user || !isSupabaseConfigured || !navigator.onLine) return;
    Promise.all([
      supabase.from('profiles').select('display_name,total_xp,level,country_code,city').eq('id', user.id).maybeSingle(),
      supabase.from('economy_accounts').select('coins,gems,stars').eq('user_id', user.id).maybeSingle(),
      supabase.from('study_sessions').select('duration_minutes').eq('user_id', user.id).eq('completed', true).eq('verification_method', 'server'),
      profileStore.loadCloud(),
      supabase.from('premium_entitlements').select('status,current_period_end').eq('user_id', user.id).eq('status', 'active').order('current_period_end', { ascending: false }).limit(1).maybeSingle(),
    ]).then(([profileRes, economyRes, sessionsRes, cloudProfile, premiumRes]) => {
      if (!profileRes.error && profileRes.data) {
        setServerLevel(profileRes.data.level ?? 1);
        if (profileRes.data.display_name) setName(profileRes.data.display_name);
        setCountryCode(profileRes.data.country_code ?? '');
        setCity(profileRes.data.city ?? '');
      }
      if (!economyRes.error && economyRes.data) {
        setCoins(Number(economyRes.data.coins ?? 0)); setGems(Number(economyRes.data.gems ?? 0)); setStars(Number(economyRes.data.stars ?? 0));
      }
      if (!sessionsRes.error && sessionsRes.data) {
        setCompletedSessions(sessionsRes.data.length);
        setStudyMinutes(sessionsRes.data.reduce((sum, row) => sum + Number(row.duration_minutes ?? 0), 0));
      }
      if (cloudProfile) setProfile(cloudProfile);
      const entitlement = premiumRes.data as { status?: string; current_period_end?: string | null } | null;
      setPremiumActive(Boolean(entitlement?.status === 'active' && (!entitlement.current_period_end || new Date(entitlement.current_period_end).getTime() > Date.now())));
    }).catch(() => { setPremiumActive(false); });
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    const header = loadHeaderState();
    setName(header.name);
    setSelectedAvatar(header.selectedAvatar);
    setProfile(profileStore.load());
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    localStorage.setItem(getUserStorageKey(PROFILE_HEADER_KEY), JSON.stringify({ name, selectedAvatar }));
    if (!user || !isSupabaseConfigured || !navigator.onLine || !name.trim()) return;
    const timer = window.setTimeout(() => {
      supabase.from('profiles').update({ display_name: name.trim().slice(0, 20), country_code: countryCode.trim().toUpperCase().slice(0, 2) || null, city: city.trim().slice(0, 80) || null }).eq('id', user.id).then(() => undefined);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [authLoading, name, selectedAvatar, countryCode, city, user?.id]);

  const studyHours = useMemo(() => Math.round((studyMinutes / 60) * 10) / 10, [studyMinutes]);
  const lifetimeStars = stars || completedSessions * STARS_PER_COMPLETED_SESSION;
  const studentLevel = user ? serverLevel : 1 + Math.floor(lifetimeStars / STARS_PER_LEVEL);

  const buyItem = async (itemType: 'pet', itemId: string, coinPrice: number, gemPrice: number, currency: 'coins' | 'gems') => {
    // Guests can use the local training economy. Signed-in users must use the
    // server-authoritative economy when connected; never create an offline
    // client-side purchase for a real account.
    if (user && isSupabaseConfigured && !navigator.onLine) {
      setShopMessage('Connect to the internet to purchase with your account.');
      return;
    }
    setBusyItem(`${itemType}:${itemId}`); setShopMessage('');
    try {
      const result = await profileStore.purchase(itemType, itemId, currency);
      setCoins(Number(result.coins)); setGems(Number(result.gems));
      setProfile(profileStore.load());
      setShopMessage(language === 'ar' ? 'ألف مبروك! تم فتح العنصر بنجاح.' : language === 'ja' ? 'おめでとうございます！アイテムを正常に解放しました。' : language === 'de' ? 'Glückwunsch! Der Artikel wurde erfolgreich freigeschaltet.' : language === 'fr' ? 'Félicitations ! L’article a été débloqué avec succès.' : 'Congratulations! The item was unlocked successfully.');
      if (itemType === 'pet') { const pet = cloudPets.find(x => x.id === itemId) ?? PET_CATALOG.find(x => x.id === itemId); announceCommerce(language, 'pet', pet?.name || itemId); }
      window.dispatchEvent(new CustomEvent('studyquest:economy-updated'));
    } catch (error) {
      const code = error instanceof Error ? error.message : 'purchase_failed';
      const messages: Record<string, string> = language === 'ar' ? {
        insufficient_coins: 'رصيد الكوينز غير كافٍ.',
        insufficient_gems: 'رصيد الجواهر غير كافٍ.',
        item_already_owned: 'العنصر مفتوح بالفعل.',
        connect_to_purchase: 'اتصل بالإنترنت لإتمام الشراء على حسابك.',
        not_authenticated: 'سجّل الدخول لإتمام شراء سحابي.',
        item_not_purchasable: 'العنصر غير متاح للشراء.',
        premium_required: 'هذا الإطار يحتاج اشتراك Premium فعال.',
        purchase_failed: 'فشل الشراء. حاول مرة أخرى.',
      } : {
        insufficient_coins: 'Not enough Coins.',
        insufficient_gems: 'Not enough Gems.',
        item_already_owned: 'This item is already unlocked.',
        connect_to_purchase: 'Connect to the internet to purchase on your account.',
        not_authenticated: 'Sign in to complete a cloud purchase.',
        item_not_purchasable: 'This item is not available for purchase.',
        premium_required: 'This frame requires an active Premium membership.',
        purchase_failed: 'Purchase failed. Try again.',
      };
      setShopMessage(messages[code] ?? code.replace(/_/g, ' '));
    } finally { setBusyItem(null); }
  };

  const availableRarities = useMemo(() => {
    const set = new Set<string>();
    cloudPets.forEach((p) => set.add(p.rarity));
    return RARITY_ORDER.filter((r) => set.has(r));
  }, [cloudPets]);

  const filteredPets = useMemo(() =>
    cloudPets.filter((p) => p.purchasable !== false && !p.eventOnly && (rarityFilter === 'all' || p.rarity === rarityFilter)),
  [rarityFilter, cloudPets]);
  const ownedPets = useMemo(() => cloudPets.filter((pet) => profile.unlockedPetIds.includes(pet.id)), [profile.unlockedPetIds, cloudPets]);
  const avatarTheme = avatarThemeDef(profile.avatarTheme);


  const handleAvatarUpload = async (file?: File) => {
    if (!file) return;
    setAvatarMessage('');
    try {
      const next = await profileStore.uploadAvatar(file);
      setProfile(next);
      setAvatarMessage(language === 'ar' ? 'تم تحديث صورة البروفايل.' : 'Profile picture updated.');
    } catch (error) {
      const code = error instanceof Error ? error.message : 'upload_failed';
      const messages: Record<string, string> = language === 'ar' ? { invalid_image: 'اختار صورة صالحة.', image_too_large: 'الصورة كبيرة جدًا. الحد 6MB.', connect_to_upload: 'اتصل بالإنترنت لرفع الصورة على حسابك.', upload_failed: 'تعذر رفع الصورة.' } : { invalid_image: 'Choose a valid image.', image_too_large: 'Image is too large. Maximum 6MB.', connect_to_upload: 'Connect to the internet to upload to your account.', upload_failed: 'Could not upload the image.' };
      setAvatarMessage(messages[code] ?? messages.upload_failed);
    } finally { if (avatarInputRef.current) avatarInputRef.current.value = ''; }
  };

  const handleAvatarRemove = async () => {
    if (!profile.avatarUrl) return;
    if (!window.confirm(language === 'ar' ? 'هل تريد حذف صورة البروفايل؟' : 'Remove your profile picture?')) return;
    setAvatarMessage('');
    try {
      const next = await profileStore.removeAvatar();
      setProfile(next);
      setAvatarMessage(language === 'ar' ? 'تم حذف صورة البروفايل.' : 'Profile picture removed.');
    } catch {
      setAvatarMessage(language === 'ar' ? 'تعذر حذف الصورة. تحقق من اتصال الإنترنت.' : 'Could not remove the picture. Check your internet connection.');
    }
  };

  const setAvatarTheme = async (theme: AvatarTheme) => {
    try { setProfile(await profileStore.updateAvatarSettings({ avatarTheme: theme })); } catch { setAvatarMessage(language === 'ar' ? 'تعذر حفظ الثيم.' : 'Could not save theme.'); }
  };
  const setAvatarPetPosition = async (position: AvatarPetPosition) => {
    try { setProfile(await profileStore.updateAvatarSettings({ avatarPetPosition: position })); } catch { setAvatarMessage(language === 'ar' ? 'تعذر حفظ مكان رمز الحيوان.' : 'Could not save pet badge position.'); }
  };

  return (
    <div className="w-full animate-fade-in pb-8">
      <div className="min-w-0 space-y-10">
      <section className="w-full flex flex-col items-center gap-5">
        <div className="w-full max-w-2xl rounded-3xl glass border border-white/10 p-5 md:p-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-80" style={{ background: `radial-gradient(circle at 50% 0%, ${avatarTheme.glow.replace('0.34','0.10')}, transparent 62%)` }} />
          <div className="relative flex flex-col md:flex-row items-center gap-5">
            <ProfileAvatar avatarUrl={profile.avatarUrl} fallbackPetId={profile.equippedPetId || selectedAvatar || 'sparky'} petPosition={profile.avatarPetPosition} theme={profile.avatarTheme} frameId={profile.equippedSkins.frame} size="lg" onUpload={() => avatarInputRef.current?.click()} />
            <div className="flex-1 min-w-0 text-center md:text-right">
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-[0.22em] text-neon-cyan">{language === 'ar' ? 'هوية StudyQuest' : 'StudyQuest Identity'}</span>
                <span className="px-2 py-0.5 rounded-full border border-neon-amber/25 bg-neon-amber/5 text-neon-amber text-[10px] font-bold">{language === 'ar' ? `يمتلك ${ownedPets.length} حيوان` : `${ownedPets.length} pets owned`}</span>
              </div>
              <h2 className="mt-1 text-2xl font-display font-black text-gray-100 truncate">{name || 'StudyHero'}</h2>
              <p className="mt-1 text-xs text-gray-500">{countryCode || city ? `${countryCode || '—'}${city ? ` · ${city}` : ''}` : (language === 'ar' ? 'أضف الدولة والمدينة ليظهر ترتيبك الإقليمي.' : 'Add your country and city for regional ranking.')}</p>
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                <button type="button" onClick={() => avatarInputRef.current?.click()} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan text-xs font-bold"><ImagePlus className="w-4 h-4" />{language === 'ar' ? 'إضافة صورة من الجهاز' : 'Add photo from device'}</button>
                {profile.avatarUrl && <button type="button" onClick={handleAvatarRemove} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-400/40 bg-red-500/10 text-red-300 text-xs font-bold hover:bg-red-500/20">{language === 'ar' ? 'حذف الصورة' : 'Remove photo'}</button>}
                <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-white/10 bg-white/[.03] text-xs text-gray-400"><Sparkles className="w-3.5 h-3.5 text-neon-violet" />{language === 'ar' ? `ثيم ${avatarTheme.ar}` : `${avatarTheme.label} theme`}</span>{profile.equippedSkins.frame && <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-neon-amber/20 bg-neon-amber/5 text-xs text-neon-amber">♛ {language === 'ar' ? 'إطار مجهز حول الصورة' : 'Equipped frame around photo'}</span>}
              </div>
              {avatarMessage && <p className="mt-2 text-[11px] text-neon-emerald">{avatarMessage}</p>}
            </div>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />

          <div className="relative mt-6 pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">{language === 'ar' ? 'ثيم صورة البروفايل' : 'Profile avatar theme'}</p>
              <div className="grid grid-cols-5 gap-2">
                {AVATAR_THEMES.map((theme) => <button key={theme.id} type="button" onClick={() => setAvatarTheme(theme.id)} title={language === 'ar' ? theme.ar : theme.label} className={`h-11 rounded-xl border bg-gradient-to-br ${theme.frame} ${profile.avatarTheme === theme.id ? 'border-neon-cyan/60 ring-1 ring-neon-cyan/30 scale-[1.03]' : 'border-white/10 opacity-75 hover:opacity-100'}`}><span className="text-[9px] font-bold text-white/90">{language === 'ar' ? theme.ar : theme.label}</span></button>)}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">{language === 'ar' ? 'زاوية رمز الحيوان' : 'Pet badge corner'}</p>
              <div className="grid grid-cols-4 gap-2">
                {(['top-right','top-left','bottom-right','bottom-left'] as AvatarPetPosition[]).map((position) => <button key={position} type="button" onClick={() => setAvatarPetPosition(position)} className={`h-11 rounded-xl border text-[10px] font-bold ${profile.avatarPetPosition === position ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan' : 'border-white/10 bg-white/[.03] text-gray-500 hover:text-gray-200'}`}>{language === 'ar' ? ({ 'top-right':'فوق يمين', 'top-left':'فوق شمال', 'bottom-right':'تحت يمين', 'bottom-left':'تحت شمال' }[position]) : position}</button>)}
              </div>
            </div>
          </div>
        </div>

          {user && (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5"><span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Country</span><input value={countryCode} onChange={(e) => setCountryCode(e.target.value.slice(0, 2).toUpperCase())} maxLength={2} placeholder="EG" className="w-full px-3 py-2.5 rounded-xl glass border border-white/10 text-sm text-gray-200 bg-transparent outline-none focus:border-neon-cyan/40" /></label>
              <label className="flex flex-col gap-1.5"><span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">City</span><input value={city} onChange={(e) => setCity(e.target.value.slice(0, 80))} maxLength={80} placeholder="Alexandria" className="w-full px-3 py-2.5 rounded-xl glass border border-white/10 text-sm text-gray-200 bg-transparent outline-none focus:border-neon-cyan/40" /></label>
            </div>
          )}

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10"><Sparkles className="w-4 h-4 text-neon-cyan" /><span className="text-xs text-gray-500">{t('studentLevel')}</span><span className="font-mono font-bold text-sm text-neon-cyan neon-text-cyan">{studentLevel}</span></div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10"><Star className="w-4 h-4 text-neon-amber fill-neon-amber" /><span className="text-xs text-gray-500">{t('lifetimeGoldenStars')}</span><span className="font-mono font-bold text-sm text-neon-amber neon-text-amber">{lifetimeStars.toLocaleString()}</span></div>
        </div>
      </section>

      <section className="w-full">
        <h2 className="font-display font-bold text-lg text-gray-200 mb-4">{t('interactiveStats')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="group relative rounded-2xl glass border border-white/10 p-5 overflow-hidden transition-all duration-500 hover:border-neon-emerald/40 hover:scale-[1.02]">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(0, 255, 157, 0.10), transparent 70%)' }} />
            <div className="relative flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-neon-emerald/10 border border-neon-emerald/20 flex items-center justify-center"><Timer className="w-5 h-5 text-neon-emerald" /></div>
                  <div className="flex flex-col">
                    <span className="font-display font-bold text-sm text-gray-200">{t('studyHoursGoal')}</span>
                    <span className="text-[10px] text-gray-500">{t('studyHoursSubtitle')}</span>
                  </div>
                </div>
                <span className="text-2xl">⏱️</span>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="font-mono font-bold text-2xl text-neon-emerald neon-text-emerald">{studyHours.toLocaleString()}h</span>
                <span className="text-xs text-gray-500 mb-1">/ {STUDY_HOURS_GOAL}h</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-neon-emerald to-neon-cyan transition-all duration-700" style={{ width: `${Math.min(100, (studyHours / STUDY_HOURS_GOAL) * 100)}%`, boxShadow: '0 0 12px rgba(0, 255, 157, 0.5)' }} />
                </div>
                <span className="text-[10px] text-gray-500">{t('goalProgress')}: {Math.min(100, Math.round((studyHours / STUDY_HOURS_GOAL) * 100))}%</span>
              </div>
            </div>
          </div>

          <div className="group relative rounded-2xl glass border border-white/10 p-5 overflow-hidden transition-all duration-500 hover:border-neon-amber/40 hover:scale-[1.02]">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(255, 170, 0, 0.10), transparent 70%)' }} />
            <div className="relative flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-neon-amber/10 border border-neon-amber/20 flex items-center justify-center"><Coins className="w-5 h-5 text-neon-amber" /></div>
                  <div className="flex flex-col">
                    <span className="font-display font-bold text-sm text-gray-200">{t('coinsEarned')}</span>
                    <span className="text-[10px] text-gray-500">{t('coinsEarnedSubtitle')}</span>
                  </div>
                </div>
                <Coins className="w-6 h-6 text-neon-amber" />
              </div>
              <span className="font-mono font-bold text-2xl text-neon-amber neon-text-amber">{coins.toLocaleString()}</span>
              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-neon-amber to-neon-rose transition-all duration-700" style={{ width: `${Math.min(100, (coins / 5000) * 100)}%`, boxShadow: '0 0 12px rgba(255, 170, 0, 0.4)' }} />
              </div>
            </div>
          </div>

          <div className="group relative rounded-2xl glass border border-white/10 p-5 overflow-hidden transition-all duration-500 hover:border-neon-cyan/40 hover:scale-[1.02]">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(0, 240, 255, 0.10), transparent 70%)' }} />
            <div className="relative flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center"><Gem className="w-5 h-5 text-neon-cyan" /></div>
                  <div className="flex flex-col">
                    <span className="font-display font-bold text-sm text-gray-200">{t('gemsCollected')}</span>
                    <span className="text-[10px] text-gray-500">{t('gemsCollectedSubtitle')}</span>
                  </div>
                </div>
                <Gem className="w-6 h-6 text-neon-cyan" />
              </div>
              <span className="font-mono font-bold text-2xl text-neon-cyan neon-text-cyan" style={{ textShadow: '0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.2), 0 -4px 12px rgba(0, 240, 255, 0.15)' }}>{gems.toLocaleString()}</span>
              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-emerald transition-all duration-700" style={{ width: `${Math.min(100, (gems / 50) * 100)}%`, boxShadow: '0 0 12px rgba(0, 240, 255, 0.4)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full">
        <h2 className="font-display font-bold text-lg text-gray-200 mb-4">{t('resourceWealth')}</h2>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="rounded-2xl border border-white/10 bg-ink-700/40 p-4 md:p-5 flex flex-col items-center gap-1.5 text-center"><Coins className="w-5 h-5 text-neon-amber mb-1" /><span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">{t('points')}</span><span className="font-mono font-bold text-lg md:text-xl text-neon-amber neon-text-amber flex items-center gap-1"><Coins className="w-5 h-5" />{coins.toLocaleString()}</span></div>
          <div className="rounded-2xl border border-white/10 bg-ink-700/40 p-4 md:p-5 flex flex-col items-center gap-1.5 text-center"><Gem className="w-5 h-5 text-neon-cyan mb-1" /><span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">{t('gems')}</span><span className="font-mono font-bold text-lg md:text-xl text-neon-cyan neon-text-cyan flex items-center gap-1"><Gem className="w-5 h-5" />{gems.toLocaleString()}</span></div>
          <div className="rounded-2xl border border-white/10 bg-ink-700/40 p-4 md:p-5 flex flex-col items-center gap-1.5 text-center"><Clock3 className="w-5 h-5 text-neon-emerald mb-1" /><span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">{t('studyHours')}</span><span className="font-mono font-bold text-lg md:text-xl text-neon-emerald neon-text-emerald">{studyHours.toLocaleString()}h</span></div>
        </div>
      </section>

      <section className="w-full flex flex-col gap-5">
        {shopMessage && <p className="text-xs text-neon-amber" role="status">{shopMessage}</p>}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-display font-bold text-lg text-gray-200">{t('inventorySection')}</h2>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-neon-amber/20 bg-neon-amber/5 text-neon-amber">{user ? 'Account economy' : 'Local training economy'}</span>
          <div className="inline-flex p-1 rounded-xl glass border border-white/10">
            <button
              type="button"
              onClick={() => setRarityFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 bg-neon-cyan/10 text-neon-cyan neon-border-cyan`}
            >
              <Sparkles className="w-4 h-4" />
              {t('companionsTab')}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setRarityFilter('all')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-300 ${rarityFilter === 'all' ? 'border-white/30 bg-white/10 text-gray-200' : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'}`}
          >
            {t('rarityAll')}
          </button>
          {availableRarities.map((rarity) => (
            <button
              key={rarity}
              type="button"
              onClick={() => setRarityFilter(rarity)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-300 ${rarityFilter === rarity ? (RARITY_CHIP_ACTIVE[rarity] ?? '') : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'}`}
            >
              {translateRarity(rarity, language)}
            </button>
          ))}
        </div>

        <div className="mb-6 rounded-3xl border border-neon-cyan/15 bg-neon-cyan/[.025] p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div><h3 className="font-display font-black text-base text-gray-200">{language === 'ar' ? '🏆 معرض الحيوانات المملوكة' : '🏆 Owned Pet Gallery'}</h3><p className="text-[11px] text-gray-500 mt-1">{language === 'ar' ? 'كل حيوان اشتريته أو فتحته يظهر هنا كشارة إنجاز في بروفايلك.' : 'Every pet you unlock or purchase becomes a visible achievement on your profile.'}</p></div>
                <span className="shrink-0 px-3 py-1.5 rounded-full border border-neon-cyan/25 bg-neon-cyan/10 text-neon-cyan text-xs font-bold">{ownedPets.length} {language === 'ar' ? 'حيوان' : 'pets'}</span>
              </div>
              {ownedPets.length ? <div className="flex flex-wrap gap-3">{ownedPets.map((pet) => <div key={pet.id} className={`relative w-20 h-24 rounded-2xl border ${profile.equippedPetId === pet.id ? 'border-neon-cyan/50 bg-neon-cyan/10' : 'border-white/10 bg-white/[.03]'} p-2 flex flex-col items-center justify-center`} title={translatePetId(pet.id, language)}><img src={pet.imageUrl || getPetAsset(pet.id)} alt="" className="w-12 h-12 object-contain rounded-xl"/><span className="mt-1 w-full text-[9px] leading-3 text-gray-300 text-center break-words line-clamp-2">{translatePetId(pet.id, language)}</span>{profile.equippedPetId === pet.id && <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-neon-cyan text-ink-900 grid place-items-center text-[9px] font-black">✓</span>}</div>)}</div> : <div className="rounded-2xl border border-dashed border-white/10 py-8 text-center text-xs text-gray-500">{language === 'ar' ? 'لسه مفيش حيوانات مملوكة. ابدأ أول عملية شراء من المتجر.' : 'No pets owned yet. Start your first unlock from the store.'}</div>}
            </div>
            <h3 className="font-display font-bold text-sm text-gray-400 mb-3">{language === 'ar' ? 'متجر الحيوانات' : 'Pet Store'}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredPets.map((pet) => {
              const unlocked = profile.unlockedPetIds.includes(pet.id);
              const isEquipped = profile.equippedPetId === pet.id;
              const rarityStyle = RARITY_STYLES[pet.rarity] ?? RARITY_STYLES.Common;
              const glowClass = RARITY_GLOW[pet.rarity] ?? '';
              const textGlow = RARITY_TEXT_GLOW[pet.rarity] ?? '';
              return (
                <div
                  key={pet.id}
                  className={`group relative rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all duration-300 ${!unlocked ? ((pet.coinPrice > 0 || pet.gemPrice > 0) ? 'border-neon-amber/20 bg-white/[0.025]' : 'border-white/5 bg-white/[0.02] opacity-50') : isEquipped ? `${rarityStyle} cursor-pointer` : `border-white/10 bg-ink-700/40 cursor-pointer ${glowClass} hover:scale-[1.03]`}`}
                >
                  {pet.premiumOnly && (
  <div className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-full border border-violet-300/40 bg-violet-950/95 px-2 py-1 text-[10px] font-black text-violet-200 shadow-lg shadow-violet-500/20">
    <span aria-hidden="true">♛</span>
    <span>PREMIUM</span>
  </div>
)}
{!unlocked && !pet.premiumOnly && (
  <div className="absolute top-2 right-2 text-gray-500">
    <Lock className="w-3.5 h-3.5" />
  </div>
)}
                  {isEquipped && <div className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">{t('equipped')}</div>}
                  <div className={`pet-3d-card-art w-20 h-20 mt-2 overflow-hidden rounded-2xl shrink-0 ${!unlocked ? 'grayscale' : ''} ${isEquipped ? 'is-equipped' : ''}`}><img src={pet.imageUrl || getPetAsset(pet.id)} alt="" className="pet-3d-card-img w-full h-full object-cover" loading="lazy" /></div>
                  <span className={`w-full min-w-0 text-xs leading-4 font-medium text-center break-words ${isEquipped ? textGlow : 'text-gray-200'}`}>{translatePetId(pet.id, language)}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rarityStyle}`}>{translateRarity(pet.rarity, language)}</span>
                  {unlocked && !isEquipped && (
                    <button
                      type="button"
                      onClick={() => profileStore.equipPet(pet.id).then(setProfile).catch(() => undefined)}
                      className="mt-1 w-full px-3 py-1.5 rounded-lg text-[11px] font-bold border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      {t('equip')}
                    </button>
                  )}
                  {isEquipped && (
                    <button
                      type="button"
                      disabled
                      className="mt-1 w-full px-3 py-1.5 rounded-lg text-[11px] font-bold border border-neon-cyan/40 bg-neon-cyan/15 text-neon-cyan cursor-default"
                    >
                      {t('equipped')}
                    </button>
                  )}
                  {!unlocked && (pet.coinPrice > 0 || pet.gemPrice > 0) && (
                    Boolean(pet.premiumOnly) && !premiumActive ? (
                      <div className="mt-1 w-full rounded-lg border border-neon-violet/30 bg-neon-violet/10 px-2 py-2 text-center text-[10px] font-bold text-neon-violet">🔒 Premium</div>
                    ) : (
                      <div className="mt-1 grid grid-cols-2 gap-1.5 w-full">
                        {pet.coinPrice > 0 && <button type="button" disabled={(Boolean(user) && isSupabaseConfigured && !navigator.onLine) || busyItem === `pet:${pet.id}`} onClick={() => buyItem('pet', pet.id, pet.coinPrice, pet.gemPrice, 'coins')} className="px-2 py-1.5 rounded-lg text-[10px] font-bold border border-neon-amber/30 bg-neon-amber/10 text-neon-amber disabled:opacity-40">{busyItem === `pet:${pet.id}` ? '...' : `${pet.coinPrice} Coins`}</button>}
                        {pet.gemPrice > 0 && <button type="button" disabled={(Boolean(user) && isSupabaseConfigured && !navigator.onLine) || busyItem === `pet:${pet.id}`} onClick={() => buyItem('pet', pet.id, pet.coinPrice, pet.gemPrice, 'gems')} className="px-2 py-1.5 rounded-lg text-[10px] font-bold border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 disabled:opacity-40">{pet.gemPrice} Gems</button>}
                      </div>
                    )
                  )}
                </div>
              );
            })}
            </div>

      </section>
      </div>

    </div>
  );
}
