import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Check, LoaderCircle, Mail, Package, Plus, RefreshCw, Save, Search, ShieldCheck, Trash2, Upload, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { LanguageCode } from '@/lib/i18n';
import { getPetVisual } from '@/lib/petAssets';
import type { CloudPetDefinition } from '@/lib/catalog';

const rarities = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'] as const;
type Draft = {
  id: string;
  name: string;
  rarity: typeof rarities[number];
  coinPrice: number;
  gemPrice: number;
  premiumOnly: boolean;
  purchasable: boolean;
  eventOnly: boolean;
  imageUrl: string;
  sortOrder: number;
};
type SupportSettings = { email: string; whatsapp: string; telegram: string; message: string };
type Props = { language: LanguageCode };
type Filter = 'all' | 'premium' | 'standard' | 'archived';

const emptyDraft = (): Draft => ({
  id: '',
  name: '',
  rarity: 'Common',
  coinPrice: 100,
  gemPrice: 0,
  premiumOnly: false,
  purchasable: true,
  eventOnly: false,
  imageUrl: '',
  sortOrder: 0,
});
const emptySupport = (): SupportSettings => ({ email: '', whatsapp: '', telegram: '', message: '' });

function slug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function getFailureMessage(error: unknown, ar: boolean) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('admin_required') || message.includes('permission denied')) {
    return ar ? 'حسابك لا يملك صلاحية الإدارة. سجّل الخروج ثم ادخل بحساب مشرف.' : 'This account does not have admin access. Sign out and use an admin account.';
  }
  if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
    return ar ? 'تعذر الاتصال بالخادم. تحقق من الإنترنت ثم أعد المحاولة.' : 'Could not reach the server. Check your connection and try again.';
  }
  return ar ? 'لم يتم حفظ التغيير. راجع صلاحيات الإدارة وحالة الاتصال ثم أعد المحاولة.' : 'The change was not saved. Check admin access and your connection, then try again.';
}

export default function AdminDashboard({ language }: Props) {
  const ar = language === 'ar';
  const copy = ar
    ? {
        title: 'مركز إدارة StudyQuest', subtitle: 'إدارة الكتالوج وقنوات الدعم من مكان واحد.',
        catalog: 'كتالوج الرفاق', search: 'ابحث بالاسم أو المعرّف', all: 'الكل', premium: 'Premium', standard: 'عادي', archived: 'مؤرشف',
        newItem: 'عنصر جديد', edit: 'تفاصيل العنصر', name: 'الاسم', id: 'المعرّف', rarity: 'الندرة', sort: 'ترتيب العرض',
        coins: 'كوينز', gems: 'جواهر', premiumOnly: 'يتطلب Premium', purchasable: 'متاح للشراء', eventOnly: 'عنصر موسمي',
        image: 'رابط الصورة', upload: 'رفع صورة', save: 'حفظ التغييرات', archive: 'إيقاف العنصر', reactivate: 'إعادة التفعيل',
        preview: 'معاينة', contact: 'قنوات الدعم', contactHint: 'تظهر هذه البيانات في واجهة التطبيق.',
        email: 'بريد الدعم', whatsapp: 'رابط WhatsApp', telegram: 'رابط Telegram', message: 'رسالة الدعم',
        refresh: 'تحديث', loading: 'جارٍ تحميل بيانات الإدارة…', empty: 'لا توجد عناصر تطابق البحث.', saved: 'تم حفظ التغييرات.',
        deleteItem: 'حذف الحيوان نهائيًا', deleteConfirm: 'هل تريد حذف هذا الحيوان نهائيًا من الكتالوج؟', deleteInUse: 'لا يمكن حذف هذا الحيوان لأن هناك مستخدمين يملكونه. أوقفه من الشراء بدلًا من ذلك.', deleted: 'تم حذف الحيوان من الكتالوج.',
        uploaded: 'تم رفع الصورة.', uploadFailed: 'تعذر رفع الصورة.', badImage: 'اختر صورة PNG أو JPEG أو WebP حتى 6MB.',
        badUrl: 'استخدم رابط HTTPS صالحًا للصورة.', badPrice: 'الأسعار والترتيب يجب أن تكون أرقامًا صحيحة غير سالبة.',
        badId: 'استخدم حروفًا إنجليزية صغيرة وأرقامًا وشرطات فقط.', required: 'أدخل الاسم والمعرّف.', supportSaved: 'تم حفظ قنوات الدعم.',
        emailInvalid: 'أدخل بريدًا إلكترونيًا صالحًا.', linkInvalid: 'أدخل رابط HTTPS صالحًا.', items: 'عنصر', retry: 'إعادة المحاولة',
        choose: 'اختر عنصرًا لتعديله أو ابدأ عنصرًا جديدًا.', status: 'حالة الاتصال', connected: 'متصل', offline: 'إعداد Supabase غير مكتمل',
      }
    : {
        title: 'StudyQuest Control Center', subtitle: 'Manage the catalog and support channels in one place.',
        catalog: 'Companion catalog', search: 'Search by name or ID', all: 'All', premium: 'Premium', standard: 'Standard', archived: 'Archived',
        newItem: 'New item', edit: 'Item details', name: 'Name', id: 'ID', rarity: 'Rarity', sort: 'Display order',
        coins: 'Coins', gems: 'Gems', premiumOnly: 'Premium required', purchasable: 'Available to buy', eventOnly: 'Seasonal item',
        image: 'Image URL', upload: 'Upload image', save: 'Save changes', archive: 'Archive item', reactivate: 'Reactivate',
        preview: 'Preview', contact: 'Support channels', contactHint: 'These details appear in the app.',
        email: 'Support email', whatsapp: 'WhatsApp URL', telegram: 'Telegram URL', message: 'Support message',
        refresh: 'Refresh', loading: 'Loading admin data…', empty: 'No items match your search.', saved: 'Changes saved.',
        deleteItem: 'Delete permanently', deleteConfirm: 'Permanently delete this animal from the catalog?', deleteInUse: 'This animal is owned by users and cannot be deleted. Disable it for purchase instead.', deleted: 'Animal removed from the catalog.',
        uploaded: 'Image uploaded.', uploadFailed: 'Image upload failed.', badImage: 'Choose a PNG, JPEG, or WebP image under 6MB.',
        badUrl: 'Use a valid HTTPS image URL.', badPrice: 'Prices and display order must be non-negative whole numbers.',
        badId: 'Use lowercase English letters, numbers, and hyphens only.', required: 'Enter a name and ID.', supportSaved: 'Support channels saved.',
        emailInvalid: 'Enter a valid email address.', linkInvalid: 'Enter a valid HTTPS URL.', items: 'items', retry: 'Try again',
        choose: 'Choose an item to edit, or start a new one.', status: 'Connection', connected: 'Connected', offline: 'Supabase is not configured', checking: 'Connecting…', failed: 'Connection failed',
      };

  const [pets, setPets] = useState<CloudPetDefinition[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [support, setSupport] = useState<SupportSettings>(emptySupport);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [connectionState, setConnectionState] = useState<'loading' | 'connected' | 'offline' | 'error'>('loading');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const isEditing = Boolean(draft.id && pets.some((pet) => pet.id === draft.id));

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setErrorMessage(copy.offline);
      setConnectionState('offline');
      setLoading(false);
      return;
    }
    setLoading(true);
    setConnectionState('loading');
    setErrorMessage('');
    try {
      const [catalogResult, settingsResult] = await Promise.all([
        supabase.from('catalog_items')
          .select('item_id,name,rarity,coin_price,gem_price,purchasable,event_only,image_url,premium_only,sort_order')
          .eq('item_type', 'pet')
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
        supabase.from('site_settings').select('key,value'),
      ]);
      if (catalogResult.error) throw catalogResult.error;
      if (settingsResult.error) throw settingsResult.error;
      setPets((catalogResult.data ?? []).map((row) => ({
        id: row.item_id,
        name: row.name,
        rarity: row.rarity as CloudPetDefinition['rarity'],
        emoji: '',
        unlockedByDefault: false,
        coinPrice: Number(row.coin_price ?? 0),
        gemPrice: Number(row.gem_price ?? 0),
        purchasable: Boolean(row.purchasable),
        eventOnly: Boolean(row.event_only),
        imageUrl: row.image_url,
        premiumOnly: Boolean(row.premium_only),
        sortOrder: Number(row.sort_order ?? 0),
      })));
      const next = emptySupport();
      for (const row of settingsResult.data ?? []) {
        if (row.key === 'support_email') next.email = row.value;
        if (row.key === 'support_whatsapp') next.whatsapp = row.value;
        if (row.key === 'support_telegram') next.telegram = row.value;
        if (row.key === 'support_message') next.message = row.value;
      }
      setSupport(next);
      setConnectionState('connected');
    } catch (error) {
      setConnectionState('error');
      setErrorMessage(getFailureMessage(error, ar));
    } finally {
      setLoading(false);
    }
  }, [ar, copy.offline]);

  useEffect(() => { void refresh(); }, [refresh]);

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return pets.filter((pet) => {
      const archived = !pet.purchasable || pet.eventOnly;
      const matchesFilter =
        filter === 'all' ? true :
        filter === 'premium' ? pet.premiumOnly && !archived :
        filter === 'standard' ? !pet.premiumOnly && !archived :
        archived;
      const matchesQuery = !normalizedQuery || pet.name.toLowerCase().includes(normalizedQuery) || pet.id.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [pets, filter, query]);

  const select = (pet: CloudPetDefinition) => setDraft({
    id: pet.id,
    name: pet.name,
    rarity: pet.rarity,
    coinPrice: pet.coinPrice,
    gemPrice: pet.gemPrice,
    premiumOnly: Boolean(pet.premiumOnly),
    purchasable: pet.purchasable !== false,
    eventOnly: Boolean(pet.eventOnly),
    imageUrl: pet.imageUrl ?? '',
    sortOrder: pet.sortOrder ?? 0,
  });

  const updateDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      if (key === 'name' && !isEditing && (!current.id || current.id === slug(current.name))) next.id = slug(String(value));
      return next;
    });
  };

  const savePet = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    const normalizedId = draft.id.trim();
    if (!normalizedId || !draft.name.trim()) { setErrorMessage(copy.required); return; }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedId)) { setErrorMessage(copy.badId); return; }
    if (![draft.coinPrice, draft.gemPrice, draft.sortOrder].every((value) => Number.isSafeInteger(value) && value >= 0)) {
      setErrorMessage(copy.badPrice);
      return;
    }
    if (draft.imageUrl) {
      try {
        if (new URL(draft.imageUrl).protocol !== 'https:') throw new Error('invalid');
      } catch { setErrorMessage(copy.badUrl); return; }
    }

    setSaving(true);
    try {
      const { error } = await supabase.rpc('admin_upsert_catalog_item', {
        p_item_id: normalizedId,
        p_name: draft.name.trim(),
        p_rarity: draft.rarity,
        p_coin_price: draft.coinPrice,
        p_gem_price: draft.gemPrice,
        p_premium_only: draft.premiumOnly,
        p_purchasable: draft.purchasable,
        p_event_only: draft.eventOnly,
        p_image_url: draft.imageUrl || null,
        p_sort_order: draft.sortOrder,
      });
      if (error) throw error;
      await refresh();
      setSuccessMessage(copy.saved);
    } catch (error) {
      setErrorMessage(getFailureMessage(error, ar));
    } finally {
      setSaving(false);
    }
  };

  const saveSupport = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (support.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(support.email.trim())) {
      setErrorMessage(copy.emailInvalid);
      return;
    }
    for (const link of [support.whatsapp, support.telegram]) {
      if (!link.trim()) continue;
      try { if (new URL(link).protocol !== 'https:') throw new Error('invalid'); }
      catch { setErrorMessage(copy.linkInvalid); return; }
    }
    if (support.message.length > 280) { setErrorMessage(ar ? 'رسالة الدعم يجب ألا تتجاوز 280 حرفًا.' : 'Keep the support message under 280 characters.'); return; }

    setSaving(true);
    try {
      const entries = Object.entries({
        support_email: support.email.trim(),
        support_whatsapp: support.whatsapp.trim(),
        support_telegram: support.telegram.trim(),
        support_message: support.message.trim(),
      });
      const results = await Promise.all(entries.map(([key, value]) => supabase.rpc('admin_update_site_setting', { p_key: key, p_value: value })));
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
      setSuccessMessage(copy.supportSaved);
    } catch (error) {
      setErrorMessage(getFailureMessage(error, ar));
    } finally {
      setSaving(false);
    }
  };

  const archivePet = async () => {
    if (!isEditing) return;
    setErrorMessage('');
    setSuccessMessage('');
    setSaving(true);
    try {
      const { error } = await supabase.rpc('admin_upsert_catalog_item', {
        p_item_id: draft.id,
        p_name: draft.name.trim(),
        p_rarity: draft.rarity,
        p_coin_price: draft.coinPrice,
        p_gem_price: draft.gemPrice,
        p_premium_only: draft.premiumOnly,
        p_purchasable: false,
        p_event_only: true,
        p_image_url: draft.imageUrl || null,
        p_sort_order: draft.sortOrder,
      });
      if (error) throw error;
      setDraft((current) => ({ ...current, purchasable: false, eventOnly: true }));
      await refresh();
      setSuccessMessage(copy.saved);
    } catch (error) {
      setErrorMessage(getFailureMessage(error, ar));
    } finally {
      setSaving(false);
    }
  };

  const deletePet = async () => {
    if (!isEditing || saving || !window.confirm(copy.deleteConfirm)) return;
    setErrorMessage('');
    setSuccessMessage('');
    setSaving(true);
    try {
      const { error } = await supabase.rpc('admin_delete_catalog_pet', { p_item_id: draft.id });
      if (error) throw error;
      setDraft(emptyDraft());
      await refresh();
      setSuccessMessage(copy.deleted);
    } catch (error) {
      const raw = error instanceof Error ? error.message.toLowerCase() : '';
      setErrorMessage(raw.includes('catalog_item_in_use') ? copy.deleteInUse : getFailureMessage(error, ar));
    } finally {
      setSaving(false);
    }
  };
  const upload = async (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 6 * 1024 * 1024) {
      setErrorMessage(copy.badImage);
      return;
    }
    setUploading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
      const path = 'pets/' + (slug(draft.id) || crypto.randomUUID()) + '.' + extension;
      const { error } = await supabase.storage.from('catalog-assets').upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from('catalog-assets').getPublicUrl(path);
      updateDraft('imageUrl', data.publicUrl);
      setSuccessMessage(copy.uploaded);
    } catch (error) {
      setErrorMessage(getFailureMessage(error, ar) || copy.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  const archivedCount = pets.filter((pet) => !pet.purchasable || pet.eventOnly).length;
  const premiumCount = pets.filter((pet) => pet.premiumOnly && pet.purchasable && !pet.eventOnly).length;
  const standardCount = pets.filter((pet) => !pet.premiumOnly && pet.purchasable && !pet.eventOnly).length;
  const visual = getPetVisual(draft.id || 'sparky');

  return (
    <div className="admin-dashboard w-full space-y-6 pb-10" dir={ar ? 'rtl' : 'ltr'}>
      <section className="admin-hero rounded-[1.75rem] p-5 md:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-700">
              <ShieldCheck className="h-4 w-4" /> {copy.title}
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--sq-muted)]">{copy.subtitle}</p>
          </div>
          <div className={'admin-connection self-start sm:self-auto ' + (connectionState === 'connected' ? 'is-connected' : connectionState === 'error' || connectionState === 'offline' ? 'is-error' : 'is-loading')}>
            <span className="h-2 w-2 rounded-full" /> {copy.status}: {connectionState === 'connected' ? copy.connected : connectionState === 'offline' ? copy.offline : connectionState === 'error' ? copy.failed : copy.checking}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: copy.catalog, value: pets.length, icon: Package },
            { label: copy.premium, value: premiumCount, icon: BadgeCheck },
            { label: copy.standard, value: standardCount, icon: Check },
            { label: copy.archived, value: archivedCount, icon: X },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="admin-stat">
              <Icon className="h-4 w-4 text-cyan-700" />
              <div><div className="text-lg font-black text-[var(--sq-heading)]">{loading ? '—' : value}</div><div className="text-[11px] text-[var(--sq-muted)]">{label}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel rounded-[1.5rem] p-4 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-[var(--sq-heading)]">{copy.catalog}</h2>
            <p className="mt-1 text-sm text-[var(--sq-muted)]">{visible.length} {copy.items}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="admin-search flex items-center gap-2 rounded-xl px-3">
              <Search className="h-4 w-4 shrink-0 text-[var(--sq-muted)]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-[var(--sq-heading)] outline-none" />
            </label>
            <button type="button" onClick={() => void refresh()} disabled={loading} className="admin-secondary inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold">
              <RefreshCw className={'h-4 w-4' + (loading ? ' animate-spin' : '')} /> {copy.refresh}
            </button>
            <button type="button" onClick={() => setDraft(emptyDraft())} className="admin-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold">
              <Plus className="h-4 w-4" /> {copy.newItem}
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label={copy.catalog}>
          {(['all', 'premium', 'standard', 'archived'] as const).map((option) => (
            <button key={option} type="button" role="tab" aria-selected={filter === option} onClick={() => setFilter(option)} className={'admin-filter rounded-full px-3.5 py-2 text-xs font-bold ' + (filter === option ? 'is-active' : '')}>
              {copy[option]}
            </button>
          ))}
        </div>
        {errorMessage && <div role="alert" className="admin-feedback admin-feedback--error mt-4">{errorMessage}<button type="button" onClick={() => void refresh()} className="ms-auto text-xs font-bold underline">{copy.retry}</button></div>}
        {successMessage && <div role="status" className="admin-feedback admin-feedback--success mt-4">{successMessage}<button type="button" aria-label="Dismiss" onClick={() => setSuccessMessage('')} className="ms-auto"><X className="h-4 w-4" /></button></div>}
        {loading ? (
          <div className="grid gap-3 py-6 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="admin-skeleton h-24 rounded-2xl" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="admin-empty mt-5 rounded-2xl p-8 text-center text-sm text-[var(--sq-muted)]">{copy.empty}</div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((pet) => {
              const petVisual = getPetVisual(pet.id);
              const selected = draft.id === pet.id;
              return (
                <button key={pet.id} type="button" aria-pressed={selected} onClick={() => select(pet)} className={'admin-pet-row flex min-w-0 items-center gap-3 rounded-2xl p-3 text-start' + (selected ? ' is-selected' : '')}>
                  <span className="admin-pet-thumb"><img src={pet.imageUrl || petVisual.asset} alt="" style={{ filter: petVisual.filter }} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-[var(--sq-heading)]">{pet.name}</span>
                    <span className="mt-1 block truncate text-[11px] text-[var(--sq-muted)]">{pet.id} · {pet.rarity}</span>
                    <span className="mt-1 block text-[11px] font-semibold text-[var(--sq-muted-strong)]">{pet.coinPrice.toLocaleString()} C · {pet.gemPrice.toLocaleString()} G</span>
                  </span>
                  <span className={'admin-badge ' + (pet.premiumOnly ? 'is-premium' : 'is-standard')}>{pet.premiumOnly ? 'PREMIUM' : copy.standard}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="admin-editor mt-6 grid gap-5 rounded-2xl p-4 md:p-5 xl:grid-cols-[minmax(0,1fr)_17rem]">
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><h3 className="font-black text-[var(--sq-heading)]">{copy.edit}</h3><p className="mt-1 text-xs text-[var(--sq-muted)]">{isEditing ? draft.id : copy.choose}</p></div>
              {isEditing && <button type="button" onClick={() => setDraft(emptyDraft())} className="admin-icon-button" aria-label={copy.newItem}><Plus className="h-4 w-4" /></button>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="admin-field">{copy.name}<input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} maxLength={48} /></label>
              <label className="admin-field">{copy.id}<input value={draft.id} onChange={(event) => updateDraft('id', event.target.value)} maxLength={50} autoCapitalize="none" disabled={isEditing} /></label>
              <label className="admin-field">{copy.rarity}<select value={draft.rarity} onChange={(event) => updateDraft('rarity', event.target.value as Draft['rarity'])}>{rarities.map((rarity) => <option key={rarity} value={rarity}>{rarity}</option>)}</select></label>
              <label className="admin-field">{copy.sort}<input type="number" min="0" step="1" value={draft.sortOrder} onChange={(event) => updateDraft('sortOrder', Number(event.target.value))} /></label>
              <label className="admin-field">{copy.coins}<input type="number" min="0" step="1" value={draft.coinPrice} onChange={(event) => updateDraft('coinPrice', Number(event.target.value))} /></label>
              <label className="admin-field">{copy.gems}<input type="number" min="0" step="1" value={draft.gemPrice} onChange={(event) => updateDraft('gemPrice', Number(event.target.value))} /></label>
              <label className="admin-field sm:col-span-2">{copy.image}<input value={draft.imageUrl} onChange={(event) => updateDraft('imageUrl', event.target.value.trim())} placeholder="https://…" /></label>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {([
                ['premiumOnly', copy.premiumOnly],
                ['purchasable', copy.purchasable],
                ['eventOnly', copy.eventOnly],
              ] as const).map(([key, label]) => (
                <label key={key} className="admin-toggle"><input type="checkbox" checked={draft[key]} onChange={(event) => updateDraft(key, event.target.checked)} /><span>{label}</span></label>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <label className="admin-upload inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold">
                {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {copy.upload}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={uploading} onChange={(event) => { void upload(event.target.files?.[0]); event.currentTarget.value = ''; }} />
              </label>
              <button type="button" onClick={() => void savePet()} disabled={saving || uploading || !draft.name.trim() || !draft.id.trim()} className="admin-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {copy.save}
              </button>
              {isEditing && (
                <button type="button" onClick={() => void archivePet()} disabled={saving} className="admin-danger disabled:opacity-50 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold">
                  <Trash2 className="h-4 w-4" /> {copy.archive}
                </button>
              )}
              {isEditing && (
                <button type="button" onClick={() => void deletePet()} disabled={saving} className="admin-danger disabled:opacity-50 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold">
                  <Trash2 className="h-4 w-4" /> {copy.deleteItem}
                </button>
              )}
            </div>
          </div>
          <aside className="admin-preview rounded-2xl p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--sq-muted)]">{copy.preview}</p>
            <div className="admin-preview-art"><img src={draft.imageUrl || visual.asset} alt="" style={{ filter: visual.filter }} /></div>
            <h4 className="mt-3 truncate text-base font-black text-[var(--sq-heading)]">{draft.name || 'StudyQuest'}</h4>
            <p className="mt-1 text-xs text-[var(--sq-muted)]">{draft.rarity} · {draft.premiumOnly ? 'PREMIUM' : copy.standard}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {draft.purchasable && !draft.eventOnly ? <span className="admin-badge is-standard">{copy.purchasable}</span> : <span className="admin-badge is-archived">{copy.archived}</span>}
              {draft.premiumOnly && <span className="admin-badge is-premium">PREMIUM</span>}
            </div>
          </aside>
        </div>
      </section>

      <section className="admin-panel rounded-[1.5rem] p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-cyan-700" />
          <div><h2 className="text-xl font-black text-[var(--sq-heading)]">{copy.contact}</h2><p className="mt-1 text-sm text-[var(--sq-muted)]">{copy.contactHint}</p></div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label className="admin-field">{copy.email}<input type="email" value={support.email} onChange={(event) => setSupport((current) => ({ ...current, email: event.target.value }))} /></label>
          <label className="admin-field">{copy.whatsapp}<input type="url" value={support.whatsapp} onChange={(event) => setSupport((current) => ({ ...current, whatsapp: event.target.value }))} /></label>
          <label className="admin-field">{copy.telegram}<input type="url" value={support.telegram} onChange={(event) => setSupport((current) => ({ ...current, telegram: event.target.value }))} /></label>
          <label className="admin-field md:col-span-2">{copy.message}<textarea rows={3} maxLength={280} value={support.message} onChange={(event) => setSupport((current) => ({ ...current, message: event.target.value }))} /><span className="text-end text-[10px] font-medium text-[var(--sq-muted)]">{support.message.length}/280</span></label>
        </div>
        <button type="button" onClick={() => void saveSupport()} disabled={saving} className="admin-primary mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50">
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {copy.save}
        </button>
      </section>
    </div>
  );
}
