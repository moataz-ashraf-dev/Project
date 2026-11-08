import { supabase, isSupabaseConfigured } from './supabase';
import { PET_CATALOG, type PetDefinition, type PetRarity } from './profileStore';

export type CloudPetDefinition = PetDefinition & {
  imageUrl?: string | null;
  premiumOnly?: boolean;
  purchasable?: boolean;
  eventOnly?: boolean;
  sortOrder?: number;
};

export async function loadPetCatalog(): Promise<CloudPetDefinition[]> {
  const fallback: CloudPetDefinition[] = PET_CATALOG.map((p) => ({ ...p, premiumOnly: false, purchasable: true, eventOnly: false }));
  if (!isSupabaseConfigured || !navigator.onLine) return fallback;
  const { data, error } = await supabase.from('catalog_items')
    .select('item_id,name,rarity,coin_price,gem_price,purchasable,event_only,image_url,premium_only,sort_order')
    .eq('item_type','pet').order('sort_order',{ascending:true}).order('name',{ascending:true});
  if (error || !data) return fallback;
  const staticById = new Map(PET_CATALOG.map((p) => [p.id,p]));
  return data.map((row) => {
    const base = staticById.get(row.item_id);
    return {
      id: row.item_id, name: row.name, rarity: row.rarity as PetRarity, emoji: base?.emoji ?? '',
      unlockedByDefault: base?.unlockedByDefault ?? false, coinPrice: Number(row.coin_price ?? 0), gemPrice: Number(row.gem_price ?? 0),
      imageUrl: row.image_url, premiumOnly: Boolean(row.premium_only), purchasable: Boolean(row.purchasable), eventOnly: Boolean(row.event_only), sortOrder: Number(row.sort_order ?? 0),
    };
  });
}
