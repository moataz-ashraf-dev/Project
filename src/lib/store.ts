import { isSupabaseConfigured, supabase, type AppState, type StreakDay, type StudySession, type Subject } from './supabase';
import { getActiveUserId, getUserStorageKey } from './storageIdentity';

const STORAGE_KEY = 'studyquest_data_v2';
const SYNC_QUEUE_KEY = 'studyquest_sync_queue_v2';
const MAX_RETRIES = 5;

type LocalData = {
  subjects: Subject[];
  streakDays: StreakDay[];
  appState: AppState;
  sessions: StudySession[];
};

type SyncEntry = {
  id: string;
  userId: string;
  table: 'subjects' | 'study_sessions' | 'streak_days' | 'app_state';
  operation: 'upsert' | 'insert';
  record: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  lastError?: string;
};

const makeId = () => {
  try { return crypto.randomUUID(); } catch { return `sq-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
};

const now = () => new Date().toISOString();

const DEFAULT_SUBJECTS: Subject[] = [
  { id: makeId(), name: 'Mathematics', icon: '📐', color: 'cyan', duration_minutes: 25, position: 0, created_at: now() },
  { id: makeId(), name: 'Computer Science', icon: '💻', color: 'emerald', duration_minutes: 30, position: 1, created_at: now() },
  { id: makeId(), name: 'Physics', icon: '⚛️', color: 'amber', duration_minutes: 20, position: 2, created_at: now() },
  { id: makeId(), name: 'Arabic', icon: '📖', color: 'rose', duration_minutes: 15, position: 3, created_at: now() },
];

const DEFAULT_APP_STATE: AppState = {
  id: 1, coins: 0, gems: 5, pet_name: 'Sparky', pet_level: 1, pet_xp: 0, pet_xp_max: 100,
  ambient_sound: 'none', active_subject_id: null, updated_at: now(),
};

const defaultStreakDays = (): StreakDay[] => Array.from({ length: 7 }, (_, day) => ({
  id: makeId(), day_of_week: day, completed: false, updated_at: now(),
}));

function getDefaultData(): LocalData {
  return {
    subjects: DEFAULT_SUBJECTS.map((s) => ({ ...s })),
    streakDays: defaultStreakDays(),
    appState: { ...DEFAULT_APP_STATE },
    sessions: [],
  };
}

function normalizeData(parsed: Partial<LocalData>): LocalData {
  const defaults = getDefaultData();

  const subjects = (parsed.subjects ?? defaults.subjects).map((subject, index) => ({
    ...defaults.subjects[index % defaults.subjects.length],
    ...subject,
    id: subject.id || makeId(),
    position: Number.isFinite(subject.position) ? subject.position : index,
    duration_minutes: Math.max(
      5,
      Math.min(120, Number(subject.duration_minutes) || 25),
    ),
  }));

  const appState = {
    ...defaults.appState,
    ...(parsed.appState ?? {}),
  };

  const hasLocalStudyHistory = (parsed.sessions ?? []).length > 0;

  if (!hasLocalStudyHistory && Number(appState.coins) === 1200) {
    appState.coins = 0;
  }

  return {
    subjects,
    streakDays: (parsed.streakDays ?? defaults.streakDays).map((d, i) => ({
      ...defaults.streakDays[i % 7],
      ...d,
      id: d.id || makeId(),
      day_of_week: Math.max(
        0,
        Math.min(6, Number(d.day_of_week) || 0),
      ),
    })),
    appState: {
      ...appState,
      active_subject_id: appState.active_subject_id ?? null,
      coins: Math.max(0, appState.coins),
      gems: Math.max(0, appState.gems),
    },
    sessions: parsed.sessions ?? [],
  };
}

function readLocal(userId = getActiveUserId()): LocalData {
  try {
    const raw = localStorage.getItem(getUserStorageKey(STORAGE_KEY, userId));
    return raw ? normalizeData(JSON.parse(raw) as Partial<LocalData>) : getDefaultData();
  } catch { return getDefaultData(); }
}

function writeLocal(data: LocalData, userId = getActiveUserId()): void {
  try { localStorage.setItem(getUserStorageKey(STORAGE_KEY, userId), JSON.stringify(data)); } catch { /* best effort */ }
}

function readQueue(userId = getActiveUserId()): SyncEntry[] {
  try {
    const raw = localStorage.getItem(getUserStorageKey(SYNC_QUEUE_KEY, userId));
    return raw ? JSON.parse(raw) as SyncEntry[] : [];
  } catch { return []; }
}

function writeQueue(queue: SyncEntry[], userId = getActiveUserId()): void {
  try { localStorage.setItem(getUserStorageKey(SYNC_QUEUE_KEY, userId), JSON.stringify(queue)); } catch { /* best effort */ }
}

function cloudAppStatePatch(state: AppState, userId: string): Record<string, unknown> {
  return {
    id: 1,
    user_id: userId,
    pet_name: state.pet_name,
    ambient_sound: state.ambient_sound,
    active_subject_id: state.active_subject_id,
  };
}

function enqueue(userId: string, table: SyncEntry['table'], operation: SyncEntry['operation'], record: Record<string, unknown>): void {
  if (userId === 'guest' || !isSupabaseConfigured) return;
  const queue = readQueue(userId);
  queue.push({ id: makeId(), userId, table, operation, record, createdAt: now(), retryCount: 0 });
  writeQueue(queue, userId);
}

async function flushQueue(userId: string): Promise<void> {
  if (!isSupabaseConfigured || userId === 'guest' || !navigator.onLine) return;
  const { data } = await supabase.auth.getUser();
  if (data.user?.id !== userId) return;

  const queue = readQueue(userId);
  const remaining: SyncEntry[] = [];
  for (const entry of queue) {
    // Old clients could queue client-authored competitive rows. Drop those
    // entries instead of retrying writes that the hardened database rejects.
    if (entry.table === 'study_sessions' || entry.table === 'streak_days') continue;
    if (entry.userId !== userId || entry.retryCount >= MAX_RETRIES) { remaining.push(entry); continue; }
    try {
      let error;
      if (entry.table === 'subjects') {
        ({ error } = await supabase.from('subjects').upsert(entry.record, { onConflict: 'id' }));
      } else if (entry.table === 'app_state') {
        // Only non-authoritative app-state fields may be synced from the client.
        ({ error } = await supabase.from('app_state').upsert(cloudAppStatePatch(entry.record as AppState, userId), { onConflict: 'user_id,id' }));
      }
      if (error) throw error;
    } catch (error) {
      entry.retryCount += 1;
      entry.lastError = error instanceof Error ? error.message : 'Sync failed';
      remaining.push(entry);
    }
  }
  writeQueue(remaining, userId);
}

async function syncCloud(userId: string): Promise<LocalData> {
  const local = readLocal(userId);
  if (!isSupabaseConfigured || userId === 'guest' || !navigator.onLine) return local;

  const { data: auth } = await supabase.auth.getUser();
  if (auth.user?.id !== userId) return local;

  await flushQueue(userId);
  const pendingAfterFlush = readQueue(userId);

  const [subjectsRes, streaksRes, stateRes, sessionsRes, economyRes] = await Promise.all([
    supabase.from('subjects').select('*').eq('user_id', userId).order('position'),
    supabase.from('streak_days').select('*').eq('user_id', userId).order('day_of_week'),
    supabase.from('app_state').select('*').eq('user_id', userId).eq('id', 1).maybeSingle(),
    supabase.from('study_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(500),
    supabase.from('economy_accounts').select('coins,gems').eq('user_id', userId).maybeSingle(),
  ]);

  if (subjectsRes.error || streaksRes.error || stateRes.error || sessionsRes.error || economyRes.error) {
    throw subjectsRes.error ?? streaksRes.error ?? stateRes.error ?? sessionsRes.error ?? economyRes.error;
  }

  const cloudSubjects = (subjectsRes.data ?? []) as Subject[];
  const cloudStreaks = (streaksRes.data ?? []) as StreakDay[];
  const cloudState = stateRes.data as AppState | null;
  const cloudSessions = (sessionsRes.data ?? []) as StudySession[];
  const cloudEconomy = economyRes.data as { coins: number; gems: number } | null;

  // First login: create a private cloud copy of the local profile/game state.
  if (cloudSubjects.length === 0) {
    const subjects = local.subjects.map((s, i) => ({ ...s, id: makeId(), user_id: userId, position: i }));
    const idMap = new Map(local.subjects.map((s, i) => [s.id, subjects[i].id]));
    const streaks = local.streakDays;
    const appState = { ...local.appState, id: 1, user_id: userId, coins: Number(cloudEconomy?.coins ?? 0), gems: Number(cloudEconomy?.gems ?? 0), active_subject_id: local.appState.active_subject_id ? (idMap.get(local.appState.active_subject_id) ?? null) : null };
    const results = await Promise.all([
      supabase.from('subjects').insert(subjects),
      supabase.from('app_state').upsert(cloudAppStatePatch(appState, userId), { onConflict: 'user_id,id' }),
    ]);
    const failed = results.find((r) => r.error)?.error;
    if (failed) throw failed;
    const merged = { ...local, subjects, streakDays: streaks, appState: { ...appState, coins: Number(cloudEconomy?.coins ?? appState.coins), gems: Number(cloudEconomy?.gems ?? appState.gems) }, sessions: local.sessions };
    writeLocal(merged, userId);
    return merged;
  }

  const merged: LocalData = {
    ...local,
    subjects: pendingAfterFlush.some((q) => q.table === 'subjects') ? local.subjects : (cloudSubjects.length ? cloudSubjects : local.subjects),
    streakDays: pendingAfterFlush.some((q) => q.table === 'streak_days') ? local.streakDays : (cloudStreaks.length ? cloudStreaks : local.streakDays),
    appState: { ...(pendingAfterFlush.some((q) => q.table === 'app_state') ? local.appState : (cloudState ?? local.appState)), coins: Number(cloudEconomy?.coins ?? cloudState?.coins ?? local.appState.coins), gems: Number(cloudEconomy?.gems ?? cloudState?.gems ?? local.appState.gems) },
    sessions: pendingAfterFlush.some((q) => q.table === 'study_sessions') ? local.sessions : (cloudSessions.length ? cloudSessions : local.sessions),
  };
  writeLocal(merged, userId);
  return merged;
}

export const store = {
  load(userId = getActiveUserId()): LocalData { return readLocal(userId); },
  getSessions(userId = getActiveUserId()): StudySession[] { return readLocal(userId).sessions; },
  save(data: LocalData, userId = getActiveUserId()): void { writeLocal(data, userId); },

  setLocalAppState(updates: Partial<AppState>): void {
    const userId = getActiveUserId();
    const data = readLocal(userId);
    data.appState = { ...data.appState, ...updates, updated_at: now() };
    writeLocal(data, userId);
  },


  async claimDailyStudyBonus(durationMinutes: number): Promise<{ claimed: boolean; coins: number; bonus: number; reason?: string } | null> {
    if (!isSupabaseConfigured || getActiveUserId() === 'guest' || !navigator.onLine || durationMinutes < 25) return null;
    const { data, error } = await supabase.rpc('claim_daily_study_bonus');
    if (error) throw error;
    return data as { claimed: boolean; coins: number; bonus: number; reason?: string };
  },

  saveAppState(updates: Partial<AppState>): void {
    const userId = getActiveUserId(); const data = readLocal(userId);
    data.appState = { ...data.appState, ...updates, updated_at: now() };
    writeLocal(data, userId);
    enqueue(userId, 'app_state', 'upsert', cloudAppStatePatch(data.appState, userId));
  },

  updateSubject(subjectId: string, updates: Partial<Subject>): void {
    const userId = getActiveUserId(); const data = readLocal(userId);
    data.subjects = data.subjects.map((s) => s.id === subjectId ? { ...s, ...updates } : s);
    writeLocal(data, userId);
    const subject = data.subjects.find((s) => s.id === subjectId);
    if (subject) enqueue(userId, 'subjects', 'upsert', { ...subject, user_id: userId === 'guest' ? undefined : userId });
  },

  addSession(session: Omit<StudySession, 'id' | 'created_at'>): void {
    const userId = getActiveUserId(); const data = readLocal(userId);
    const full = { ...session, id: makeId(), created_at: now() };
    data.sessions.unshift(full); writeLocal(data, userId);
    // Offline sessions are deliberately local-only. Uploading a client-created
    // completed row would let a modified browser manufacture competitive study time.
  },

  markStreakComplete(dayId: string): void {
    const userId = getActiveUserId(); const data = readLocal(userId);
    const updatedAt = now();
    data.streakDays = data.streakDays.map((d) => d.id === dayId ? { ...d, completed: true, updated_at: updatedAt } : d);
    writeLocal(data, userId);
    const day = data.streakDays.find((d) => d.id === dayId);
    if (day) enqueue(userId, 'streak_days', 'upsert', { ...day, user_id: userId === 'guest' ? undefined : userId });
  },

  async syncFromCloud(userId = getActiveUserId()): Promise<LocalData> { return syncCloud(userId); },
  async trySync(userId = getActiveUserId()): Promise<void> { try { await syncCloud(userId); } catch { /* offline-first: keep local data */ } },
  isOnline(): boolean { return typeof navigator === 'undefined' || navigator.onLine; },
  onOnline(callback: () => void): () => void { window.addEventListener('online', callback); return () => window.removeEventListener('online', callback); },
};

export type { LocalData };
