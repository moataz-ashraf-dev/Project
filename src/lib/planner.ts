import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { LanguageCode } from '@/lib/i18n';
import { getActiveUserId, getUserStorageKey } from '@/lib/storageIdentity';

export type StudyPlanTask = {
  id: string;
  plan_id: string;
  user_id: string;
  subject_id: string | null;
  subject_name?: string | null;
  position: number;
  title: string;
  notes: string | null;
  start_at: string | null;
  duration_minutes: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StudyPlan = {
  id: string;
  user_id: string;
  plan_date: string;
  source: 'manual' | 'ai';
  prompt: string | null;
  title: string;
  timezone: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  tasks?: StudyPlanTask[];
};

const PLAN_CACHE_KEY = 'studyquest_plan_cache_v1';

type CachedPlans = Record<string, StudyPlan>;

function readCachedPlans(): CachedPlans {
  try {
    const raw = localStorage.getItem(getUserStorageKey(PLAN_CACHE_KEY, getActiveUserId()));
    return raw ? JSON.parse(raw) as CachedPlans : {};
  } catch {
    return {};
  }
}

function writeCachedPlan(plan: StudyPlan): void {
  try {
    const plans = readCachedPlans();
    plans[plan.plan_date] = plan;
    localStorage.setItem(getUserStorageKey(PLAN_CACHE_KEY, getActiveUserId()), JSON.stringify(plans));
  } catch {
    // Local caching is best effort; server data remains authoritative.
  }
}

export function markPlanTaskCompletedLocally(taskId: string): void {
  const plans = readCachedPlans();
  const completedAt = new Date().toISOString();
  let changed = false;
  for (const [date, plan] of Object.entries(plans)) {
    const tasks = plan.tasks ?? [];
    if (!tasks.some((task) => task.id === taskId)) continue;
    plans[date] = {
      ...plan,
      tasks: tasks.map((task) => task.id === taskId
        ? { ...task, status: 'completed', completed_at: task.completed_at ?? completedAt, updated_at: completedAt }
        : task),
      updated_at: completedAt,
    };
    changed = true;
  }
  if (changed) {
    try {
      localStorage.setItem(getUserStorageKey(PLAN_CACHE_KEY, getActiveUserId()), JSON.stringify(plans));
    } catch {
      // Best effort only.
    }
  }
}

export async function loadPlan(date: string): Promise<StudyPlan | null> {
  const cached = readCachedPlans()[date] ?? null;
  if (!isSupabaseConfigured || (typeof navigator !== 'undefined' && !navigator.onLine)) return cached;
  const { data, error } = await supabase.from('study_plans').select('*, study_plan_tasks(*)').eq('plan_date', date).maybeSingle();
  if (error) {
    if (cached) return cached;
    throw error;
  }
  if (!data) return cached;
  const serverPlan = { ...data, tasks: ((data.study_plan_tasks ?? []) as StudyPlanTask[]).sort((a, b) => a.position - b.position) } as StudyPlan;
  const cachedPlan = cached;
  const cachedTasks = new Map((cachedPlan?.tasks ?? []).map((task) => [task.id, task]));
  const plan: StudyPlan = {
    ...serverPlan,
    tasks: (serverPlan.tasks ?? []).map((task) => {
      const localTask = cachedTasks.get(task.id);
      return localTask?.status === 'completed' && task.status !== 'completed'
        ? { ...task, status: 'completed', completed_at: localTask.completed_at ?? new Date().toISOString(), updated_at: localTask.updated_at }
        : task;
    }),
  };
  writeCachedPlan(plan);
  return plan;
}

export async function generateTomorrowPlan(prompt: string, planDate: string, timezone: string, language: LanguageCode = 'en'): Promise<StudyPlan> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

  const { error } = await supabase.functions.invoke('plan-tomorrow', {
    body: { prompt, plan_date: planDate, timezone, language },
  });

  if (error) throw error;

  const savedPlan = await loadPlan(planDate);

  if (!savedPlan) {
    throw new Error('plan_not_found_after_generation');
  }

  return savedPlan;
}

export async function setTaskStatus(taskId: string, status: Exclude<StudyPlanTask['status'], 'completed'>): Promise<void> {
  const plans = readCachedPlans();
  let changed = false;
  for (const [date, plan] of Object.entries(plans)) {
    if (!(plan.tasks ?? []).some((task) => task.id === taskId)) continue;
    const updatedAt = new Date().toISOString();
    plans[date] = { ...plan, tasks: (plan.tasks ?? []).map((task) => task.id === taskId ? { ...task, status, completed_at: null, updated_at: updatedAt } : task) };
    changed = true;
  }
  if (changed) {
    try { localStorage.setItem(getUserStorageKey(PLAN_CACHE_KEY, getActiveUserId()), JSON.stringify(plans)); } catch { /* Best effort only. */ }
  }
  if (!isSupabaseConfigured || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return;
  const { error } = await supabase.from('study_plan_tasks').update({ status, completed_at: null }).eq('id', taskId).eq('user_id', userId);
  if (error) throw error;
}

export async function completePlanTask(taskId: string, sessionId: string): Promise<DailyAIStatus | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.rpc('complete_study_plan_task', {
    p_task_id: taskId,
    p_session_id: sessionId,
  });

  if (error) throw error;

  return (data ?? null) as DailyAIStatus | null;
}

export async function deletePlanTask(taskId: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('delete_requires_connection');
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('not_authenticated');

  const { data, error } = await supabase.from('study_plan_tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('task_not_found_or_not_deleted');

  const plans = readCachedPlans();
  let changed = false;
  for (const [date, plan] of Object.entries(plans)) {
    const tasks = plan.tasks ?? [];
    if (!tasks.some((task) => task.id === taskId)) continue;
    plans[date] = { ...plan, tasks: tasks.filter((task) => task.id !== taskId), updated_at: new Date().toISOString() };
    changed = true;
  }
  if (changed) {
    try { localStorage.setItem(getUserStorageKey(PLAN_CACHE_KEY, getActiveUserId()), JSON.stringify(plans)); } catch { /* Best effort only. */ }
  }
}export type DailyAIStatus = {
  plan_date: string;
  has_plan: boolean;
  correct: boolean;
  completed_tasks: number;
  total_tasks: number;
  correct_days: number;
  golden_star_awarded: boolean;
  coins: number;
  stars: number;
};

export async function getDailyAIStatus(date: string): Promise<DailyAIStatus | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.rpc('get_daily_ai_status', { p_plan_date: date });
  if (error) throw error;
  return (data ?? null) as DailyAIStatus | null;
}

export async function finalizeDailyAIPlan(planId: string): Promise<DailyAIStatus | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.rpc('finalize_daily_ai_plan', { p_plan_id: planId });
  if (error) throw error;
  return (data ?? null) as DailyAIStatus | null;
}

export function localCalendarDate(offsetDays = 0): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
