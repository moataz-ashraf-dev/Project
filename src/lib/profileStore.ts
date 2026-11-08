import { isSupabaseConfigured, supabase } from './supabase';
import { getActiveUserId, getUserStorageKey } from './storageIdentity';
import type { AvatarPetPosition, AvatarTheme } from '@/components/ProfileAvatar';

const PROFILE_STORAGE_KEY = 'studyquest_profile_v2';

export type PetRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
export type SkinCategory = 'clothes' | 'glasses' | 'crown' | 'vehicle' | 'frame';

export type PetDefinition = {
  id: string;
  name: string;
  rarity: PetRarity;
  emoji: string;
  unlockedByDefault: boolean;
  coinPrice: number;
  gemPrice: number;
};
export type SkinDefinition = {
  id: string;
  name: string;
  category: SkinCategory;
  rarity: PetRarity;
  emoji: string;
  unlockedByDefault: boolean;
  coinPrice: number;
  gemPrice: number;
};
export type ProfileData = {
  unlockedPetIds: string[];
  unlockedSkinIds: string[];
  equippedPetId: string;
  equippedSkins: Record<SkinCategory, string | null>;
  avatarUrl: string | null;
  avatarTheme: AvatarTheme;
  avatarPetPosition: AvatarPetPosition;
};

export const PET_CATALOG: PetDefinition[] = [
  { id: 'sparky', name: 'Sparky', rarity: 'Common', emoji: '', unlockedByDefault: false, coinPrice: 0, gemPrice: 0 },
  { id: 'velvet-cat', name: 'Velvet Cat', rarity: 'Common', emoji: '', unlockedByDefault: false, coinPrice: 50, gemPrice: 25 },
  { id: 'moon-rabbit', name: 'Moon Rabbit', rarity: 'Common', emoji: '', unlockedByDefault: false, coinPrice: 55, gemPrice: 28 },
  { id: 'ember-pup', name: 'Ember Pup', rarity: 'Common', emoji: '', unlockedByDefault: false, coinPrice: 60, gemPrice: 30 },
  { id: 'pearl-hamster', name: 'Pearl Hamster', rarity: 'Common', emoji: '', unlockedByDefault: false, coinPrice: 65, gemPrice: 33 },
  { id: 'suncrest-parrot', name: 'Suncrest Parrot', rarity: 'Common', emoji: '', unlockedByDefault: false, coinPrice: 70, gemPrice: 35 },
  { id: 'ice-penguin', name: 'Ice Penguin', rarity: 'Common', emoji: '', unlockedByDefault: false, coinPrice: 80, gemPrice: 40 },
  { id: 'sage-turtle', name: 'Sage Turtle', rarity: 'Common', emoji: '', unlockedByDefault: false, coinPrice: 90, gemPrice: 45 },
  { id: 'cobalt-donkey', name: 'Cobalt Donkey', rarity: 'Common', emoji: '', unlockedByDefault: false, coinPrice: 100, gemPrice: 50 },
  { id: 'aurora-fox', name: 'Aurora Fox', rarity: 'Rare', emoji: '', unlockedByDefault: false, coinPrice: 150, gemPrice: 75 },
  { id: 'river-otter', name: 'River Otter', rarity: 'Rare', emoji: '', unlockedByDefault: false, coinPrice: 200, gemPrice: 100 },
  { id: 'ruby-red-panda', name: 'Ruby Red Panda', rarity: 'Rare', emoji: '', unlockedByDefault: false, coinPrice: 250, gemPrice: 125 },
  { id: 'mist-raccoon', name: 'Mist Raccoon', rarity: 'Rare', emoji: '', unlockedByDefault: false, coinPrice: 300, gemPrice: 150 },
  { id: 'willow-deer', name: 'Willow Deer', rarity: 'Rare', emoji: '', unlockedByDefault: false, coinPrice: 350, gemPrice: 175 },
  { id: 'coral-seal', name: 'Coral Seal', rarity: 'Rare', emoji: '', unlockedByDefault: false, coinPrice: 400, gemPrice: 200 },
  { id: 'crystal-owl', name: 'Crystal Owl', rarity: 'Rare', emoji: '', unlockedByDefault: false, coinPrice: 450, gemPrice: 225 },
  { id: 'golden-capybara', name: 'Golden Capybara', rarity: 'Rare', emoji: '', unlockedByDefault: false, coinPrice: 500, gemPrice: 250 },
  { id: 'shadow-wolf', name: 'Shadow Wolf', rarity: 'Epic', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 110 },
  { id: 'snow-leopard', name: 'Snow Leopard', rarity: 'Epic', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 120 },
  { id: 'storm-eagle', name: 'Storm Eagle', rarity: 'Epic', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 130 },
  { id: 'solar-tiger', name: 'Solar Tiger', rarity: 'Epic', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 145 },
  { id: 'jade-griffin', name: 'Jade Griffin', rarity: 'Legendary', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 195 },
  { id: 'crimson-kitsune', name: 'Crimson Kitsune', rarity: 'Legendary', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 205 },
  { id: 'starlight-unicorn', name: 'Starlight Unicorn', rarity: 'Legendary', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 220 },
  { id: 'frost-dragon', name: 'Frost Dragon', rarity: 'Legendary', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 280 },
  { id: 'crystal-dragon', name: 'Crystal Dragon', rarity: 'Legendary', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 300 },
  { id: 'void-dragon', name: 'Void Dragon', rarity: 'Mythic', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 320 },
  { id: 'chrono-dragon', name: 'Chrono Dragon', rarity: 'Mythic', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 500 },
  { id: 'frost-raptor', name: 'Frost Raptor', rarity: 'Mythic', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 275 },
  { id: 'magma-trex', name: 'Magma T-Rex', rarity: 'Mythic', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 295 },
  { id: 'ember-raptor', name: 'Ember Raptor', rarity: 'Epic', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 250 },
  { id: 'azure-drake', name: 'Azure Drake', rarity: 'Epic', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 265 },
  { id: 'crimson-phoenix', name: 'Crimson Phoenix', rarity: 'Epic', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 280 },
  { id: 'storm-griffin', name: 'Storm Griffin', rarity: 'Epic', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 295 },
  { id: 'frost-wolf', name: 'Frost Wolf', rarity: 'Legendary', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 310 },
  { id: 'jade-triceratops', name: 'Jade Triceratops', rarity: 'Legendary', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 325 },
  { id: 'lunar-wyvern', name: 'Lunar Wyvern', rarity: 'Legendary', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 340 },
  { id: 'sunfire-tiger', name: 'Sunfire Tiger', rarity: 'Legendary', emoji: '', unlockedByDefault: false, coinPrice: 5000, gemPrice: 355 },
]

export const SKIN_CATALOG: SkinDefinition[] = [
  // Standard profile frames: premium-looking, but clearly below Premium quality.
  { id: 'frame-inferno-drake', name: 'Inferno Drake Frame', category: 'frame', rarity: 'Epic', emoji: '', unlockedByDefault: false, coinPrice: 2600, gemPrice: 75 },
  { id: 'frame-frost-wyvern', name: 'Frost Wyvern Frame', category: 'frame', rarity: 'Epic', emoji: '', unlockedByDefault: false, coinPrice: 2800, gemPrice: 80 },
  { id: 'frame-solar-phoenix', name: 'Solar Phoenix Frame', category: 'frame', rarity: 'Legendary', emoji: '', unlockedByDefault: false, coinPrice: 3200, gemPrice: 95 },
  { id: 'frame-storm-eagle', name: 'Storm Eagle Frame', category: 'frame', rarity: 'Legendary', emoji: '', unlockedByDefault: false, coinPrice: 3500, gemPrice: 105 },
  { id: 'frame-glacial-wolf', name: 'Glacial Wolf Frame', category: 'frame', rarity: 'Legendary', emoji: '', unlockedByDefault: false, coinPrice: 3700, gemPrice: 115 },
  { id: 'frame-emerald-guardian', name: 'Emerald Guardian Frame', category: 'frame', rarity: 'Legendary', emoji: '', unlockedByDefault: false, coinPrice: 3900, gemPrice: 125 },
  { id: 'frame-astral-wyrm', name: 'Astral Wyrm Frame', category: 'frame', rarity: 'Mythic', emoji: '', unlockedByDefault: false, coinPrice: 4300, gemPrice: 140 },
  { id: 'frame-golden-tiger', name: 'Golden Tiger Frame', category: 'frame', rarity: 'Mythic', emoji: '', unlockedByDefault: false, coinPrice: 4600, gemPrice: 155 },
  { id: 'frame-royal-crown', name: 'Royal Crown Frame', category: 'frame', rarity: 'Legendary', emoji: '', unlockedByDefault: false, coinPrice: 500, gemPrice: 125 },
  { id: 'frame-sky-dragon', name: 'Sky Dragon Frame', category: 'frame', rarity: 'Legendary', emoji: '', unlockedByDefault: false, coinPrice: 400, gemPrice: 115 },
  { id: 'frame-hope', name: 'Hope Frame', category: 'frame', rarity: 'Rare', emoji: '', unlockedByDefault: false, coinPrice: 400, gemPrice: 105 },

  // Premium frames: eight distinct, richer royal designs.
  { id: 'frame-premium-royal-dragon', name: 'Royal Dragon Frame', category: 'frame', rarity: 'Mythic', emoji: '', unlockedByDefault: false, coinPrice: 7000, gemPrice: 300 },
  { id: 'frame-premium-divine-phoenix', name: 'Divine Phoenix Frame', category: 'frame', rarity: 'Mythic', emoji: '', unlockedByDefault: false, coinPrice: 7500, gemPrice: 325 },
  { id: 'frame-premium-celestial-crown', name: 'Celestial Crown Frame', category: 'frame', rarity: 'Mythic', emoji: '', unlockedByDefault: false, coinPrice: 8000, gemPrice: 350 },
  { id: 'frame-premium-obsidian-king', name: 'Obsidian King Frame', category: 'frame', rarity: 'Mythic', emoji: '', unlockedByDefault: false, coinPrice: 8500, gemPrice: 375 },
  { id: 'frame-premium-astral-sovereign', name: 'Astral Sovereign Frame', category: 'frame', rarity: 'Mythic', emoji: '', unlockedByDefault: false, coinPrice: 9000, gemPrice: 400 },
  { id: 'frame-premium-golden-reign', name: 'Golden Reign Frame', category: 'frame', rarity: 'Mythic', emoji: '', unlockedByDefault: false, coinPrice: 9500, gemPrice: 425 },
  { id: 'frame-premium-frost-emperor', name: 'Frost Emperor Frame', category: 'frame', rarity: 'Mythic', emoji: '', unlockedByDefault: false, coinPrice: 10000, gemPrice: 450 },
  { id: 'frame-premium-infinity-royal', name: 'Infinity Royal Frame', category: 'frame', rarity: 'Mythic', emoji: '', unlockedByDefault: false, coinPrice: 11000, gemPrice: 500 },
];

export const SKIN_CATEGORIES: SkinCategory[] = ['frame'];
export const SKIN_CATEGORY_LABELS: Record<SkinCategory, string> = { clothes: 'Clothes', glasses: 'Glasses', crown: 'Crown', vehicle: 'Vehicle', frame: 'Profile Frame' };

function getDefaultProfile(): ProfileData {
  return {
    unlockedPetIds: PET_CATALOG.filter((p) => p.unlockedByDefault).map((p) => p.id),
    unlockedSkinIds: SKIN_CATALOG.filter((s) => s.unlockedByDefault).map((s) => s.id),
    equippedPetId: '',
    equippedSkins: { clothes: null, glasses: null, crown: null, vehicle: null, frame: null },
    avatarUrl: null,
    avatarTheme: 'ice',
    avatarPetPosition: 'bottom-right',
  };
}
function readProfile(): ProfileData {
  try {
    const raw = localStorage.getItem(getUserStorageKey(PROFILE_STORAGE_KEY));
    if (!raw) return getDefaultProfile();
    const parsed = JSON.parse(raw) as Partial<ProfileData>;
    const d = getDefaultProfile();
    return { unlockedPetIds: parsed.unlockedPetIds ?? d.unlockedPetIds, unlockedSkinIds: parsed.unlockedSkinIds ?? d.unlockedSkinIds, equippedPetId: parsed.equippedPetId ?? d.equippedPetId, equippedSkins: { ...d.equippedSkins, ...parsed.equippedSkins }, avatarUrl: parsed.avatarUrl ?? d.avatarUrl, avatarTheme: (parsed.avatarTheme as AvatarTheme) ?? d.avatarTheme, avatarPetPosition: (parsed.avatarPetPosition as AvatarPetPosition) ?? d.avatarPetPosition };
  } catch { return getDefaultProfile(); }
}
function writeProfile(data: ProfileData) { try { localStorage.setItem(getUserStorageKey(PROFILE_STORAGE_KEY), JSON.stringify(data)); window.dispatchEvent(new CustomEvent('studyquest:profile-updated')); } catch { /* Local storage can be unavailable in private or restricted contexts. */ } }

async function loadCloudProfile(): Promise<ProfileData | null> {
  const userId = getActiveUserId();
  if (!isSupabaseConfigured || userId === 'guest' || !navigator.onLine) return null;
  const [{ data: inventory, error: inventoryError }, { data: equipment, error: equipmentError }, { data: cloudUserProfile, error: profileError }] = await Promise.all([
    supabase.from('user_inventory').select('item_type,item_id').eq('user_id', userId),
    supabase.from('user_equipment').select('equipped_pet_id,equipped_skins').eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select('avatar_url,avatar_theme,avatar_pet_position').eq('id', userId).maybeSingle(),
  ]);
  if (inventoryError) throw inventoryError;
  if (equipmentError) throw equipmentError;
  if (profileError) throw profileError;
  const defaults = getDefaultProfile();
  const pets = (inventory ?? []).filter((i) => i.item_type === 'pet').map((i) => i.item_id);
  const skins = (inventory ?? []).filter((i) => i.item_type === 'skin').map((i) => i.item_id);
  const profile: ProfileData = {
    unlockedPetIds: Array.from(new Set(pets.length ? pets : defaults.unlockedPetIds)),
    unlockedSkinIds: Array.from(new Set(skins)),
    equippedPetId: equipment?.equipped_pet_id ?? '',
    equippedSkins: { ...defaults.equippedSkins, ...((equipment?.equipped_skins as Partial<Record<SkinCategory,string|null>>) ?? {}) },
    avatarUrl: cloudUserProfile?.avatar_url ?? null,
    avatarTheme: (cloudUserProfile?.avatar_theme as AvatarTheme) ?? 'ice',
    avatarPetPosition: (cloudUserProfile?.avatar_pet_position as AvatarPetPosition) ?? 'bottom-right',
  };
  writeProfile(profile);
  return profile;
}

function readLocalEconomy(userId: string): { coins: number; gems: number; stars: number } {
  try {
    const key = getUserStorageKey('studyquest_data_v2', userId);
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    const appState = parsed.appState ?? {};
    return { coins: Math.max(0, Number(appState.coins ?? 0)), gems: Math.max(0, Number(appState.gems ?? 0)), stars: Math.max(0, Number(appState.stars ?? 0)) };
  } catch { return { coins: 0, gems: 0, stars: 0 }; }
}

function writeLocalEconomy(data: { coins: number; gems: number; stars: number }, userId: string): void {
  try {
    const key = getUserStorageKey('studyquest_data_v2', userId);
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed.appState = { ...(parsed.appState ?? {}), coins: data.coins, gems: data.gems };
    localStorage.setItem(key, JSON.stringify(parsed));
    window.dispatchEvent(new CustomEvent('studyquest:economy-updated'));
  } catch { /* best effort */ }
}

export const profileStore = {
  load(): ProfileData { return readProfile(); },
  async loadCloud(): Promise<ProfileData | null> { return loadCloudProfile(); },
  setEquippedPet(petId: string): ProfileData {
    const data = readProfile();
    if (!data.unlockedPetIds.includes(petId)) return data;
    data.equippedPetId = petId; writeProfile(data); return data;
  },
  async equipPet(petId: string): Promise<ProfileData> {
    const data = readProfile();
    if (!data.unlockedPetIds.includes(petId)) return data;
    if (isSupabaseConfigured && getActiveUserId() !== 'guest' && navigator.onLine) {
      const { error } = await supabase.rpc('equip_item', { p_item_type: 'pet', p_item_id: petId });
      if (error) throw error;
    }
    data.equippedPetId = petId; writeProfile(data); return data;
  },
  toggleEquipSkin(skinId: string): ProfileData {
    const data = readProfile();
    const def = SKIN_CATALOG.find((s) => s.id === skinId);
    if (!def || !data.unlockedSkinIds.includes(skinId)) return data;
    data.equippedSkins = { ...data.equippedSkins, [def.category]: data.equippedSkins[def.category] === skinId ? null : skinId };
    writeProfile(data); return data;
  },
  async equipSkin(skinId: string): Promise<ProfileData> {
    const data = readProfile();
    const def = SKIN_CATALOG.find((s) => s.id === skinId);
    if (!def || !data.unlockedSkinIds.includes(skinId)) return data;
    if (isSupabaseConfigured && getActiveUserId() !== 'guest' && navigator.onLine) {
      const { error } = await supabase.rpc('equip_item', { p_item_type: 'skin', p_item_id: skinId });
      if (error) throw error;
    }
    data.equippedSkins = { ...data.equippedSkins, [def.category]: data.equippedSkins[def.category] === skinId ? null : skinId };
    writeProfile(data); return data;
  },
  async claimStarterCompanion() {
    if (!isSupabaseConfigured || getActiveUserId() === 'guest' || !navigator.onLine) return null;
    const { data, error } = await supabase.rpc('claim_starter_companion');
    if (error) throw error;
    const result = data as { claimed: boolean; already_claimed?: boolean; coins?: number; pet_id?: string; study_days?: number };
    if (result.claimed && result.pet_id) {
      const profile = readProfile();
      profile.unlockedPetIds = Array.from(new Set([...profile.unlockedPetIds, result.pet_id]));
      profile.equippedPetId = result.pet_id;
      writeProfile(profile);
    }
    return result;
  },
  async updateAvatarSettings(settings: { avatarUrl?: string | null; avatarTheme?: AvatarTheme; avatarPetPosition?: AvatarPetPosition }): Promise<ProfileData> {
    const data = readProfile();
    Object.assign(data, settings);
    if (isSupabaseConfigured && getActiveUserId() !== 'guest' && navigator.onLine) {
      const payload = {
        avatar_url: settings.avatarUrl !== undefined ? settings.avatarUrl : data.avatarUrl,
        avatar_theme: settings.avatarTheme !== undefined ? settings.avatarTheme : data.avatarTheme,
        avatar_pet_position: settings.avatarPetPosition !== undefined ? settings.avatarPetPosition : data.avatarPetPosition,
      };
      const { error } = await supabase.from('profiles').update(payload).eq('id', getActiveUserId());
      if (error) throw error;
    }
    writeProfile(data);
    return data;
  },
  async uploadAvatar(file: File): Promise<ProfileData> {
    if (!file.type.startsWith('image/')) throw new Error('invalid_image');
    if (file.size > 6 * 1024 * 1024) throw new Error('image_too_large');
    const activeUserId = getActiveUserId();
    // Compress locally first for a fast, mobile-friendly profile image.
    const compressed = await new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        try {
          const max = 768; const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
          const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
          const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('image_processing_failed');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('image_processing_failed')), 'image/webp', 0.86);
        } catch (e) { reject(e); } finally { URL.revokeObjectURL(url); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('invalid_image')); };
      img.src = url;
    });
    if (isSupabaseConfigured && activeUserId !== 'guest' && navigator.onLine) {
      const path = `${activeUserId}/avatar-${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, compressed, { contentType: 'image/webp', upsert: false, cacheControl: '31536000' });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
      return this.updateAvatarSettings({ avatarUrl: publicData.publicUrl });
    }
    if (activeUserId !== 'guest') throw new Error('connect_to_upload');
    const localUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('image_processing_failed')); reader.readAsDataURL(compressed); });
    return this.updateAvatarSettings({ avatarUrl: localUrl });
  },

  async removeAvatar(): Promise<ProfileData> {
    const activeUserId = getActiveUserId();
    if (activeUserId !== 'guest' && (!isSupabaseConfigured || !navigator.onLine)) {
      throw new Error('connect_to_remove_avatar');
    }
    return this.updateAvatarSettings({ avatarUrl: null });
  },

  async purchase(itemType: 'pet' | 'skin', itemId: string, currency: 'coins' | 'gems') {
    const def = itemType === 'pet' ? PET_CATALOG.find((item) => item.id === itemId) : SKIN_CATALOG.find((item) => item.id === itemId);
    if (!def) throw new Error('item_not_found');
    const cost = currency === 'coins' ? def.coinPrice : def.gemPrice;
    if (cost <= 0) throw new Error('currency_not_supported');

    // Production accounts use the server-authoritative RPC.
    if (isSupabaseConfigured && getActiveUserId() !== 'guest' && navigator.onLine) {
      const operationId = (() => { try { return crypto.randomUUID(); } catch { return `purchase-${Date.now()}-${Math.random().toString(36).slice(2)}`; } })();
      const { data, error } = await supabase.rpc('purchase_item', { p_item_type: itemType, p_item_id: itemId, p_currency: currency, p_client_operation_id: operationId });
      if (error) throw error;
      const profile = readProfile();
      if (itemType === 'pet') profile.unlockedPetIds = Array.from(new Set([...profile.unlockedPetIds, itemId]));
      else profile.unlockedSkinIds = Array.from(new Set([...profile.unlockedSkinIds, itemId]));
      writeProfile(profile);
      return data as { coins: number; gems: number; stars: number; item_type: string; item_id: string };
    }

    // Only guests use the local training economy. A signed-in account must
    // never fall back to a client-side purchase while offline/unconfigured.
    const activeUserId = getActiveUserId();
    if (activeUserId !== 'guest') throw new Error('connect_to_purchase');
    const userId = activeUserId;
    const data = readLocalEconomy(userId);
    const profile = readProfile();
    const owned = itemType === 'pet' ? profile.unlockedPetIds.includes(itemId) : profile.unlockedSkinIds.includes(itemId);
    if (owned) throw new Error('item_already_owned');
    if (currency === 'coins' && data.coins < cost) throw new Error('insufficient_coins');
    if (currency === 'gems' && data.gems < cost) throw new Error('insufficient_gems');
    if (currency === 'coins') data.coins -= cost; else data.gems -= cost;
    writeLocalEconomy(data, userId);
    if (itemType === 'pet') profile.unlockedPetIds = Array.from(new Set([...profile.unlockedPetIds, itemId]));
    else profile.unlockedSkinIds = Array.from(new Set([...profile.unlockedSkinIds, itemId]));
    writeProfile(profile);
    return { coins: data.coins, gems: data.gems, stars: data.stars, item_type: itemType, item_id: itemId };
  },
};
