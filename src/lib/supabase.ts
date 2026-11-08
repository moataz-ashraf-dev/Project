import { createClient } from '@supabase/supabase-js';

const configuredUrl = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const configuredAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
const validProjectUrl = /^https:\/\/[^\s/]+\.supabase\.co(?:\/.*)?$/.test(configuredUrl);
const validKey = /^(eyJ|sb_)/.test(configuredAnonKey);
export const isSupabaseConfigured = validProjectUrl && validKey;

// Always give the SDK a syntactically valid URL so a missing .env never crashes the React app.
export const supabase = createClient(
  isSupabaseConfigured ? configuredUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? configuredAnonKey : 'placeholder-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);

export type Subject = {
  id: string; user_id?: string; name: string; icon: string; color: string;
  duration_minutes: number; position: number; created_at: string;
};

export type StudySession = {
  id: string; user_id?: string; subject_id: string | null; duration_minutes: number;
  completed: boolean; created_at: string; xp_earned?: number;
};

export type StreakDay = { id: string; user_id?: string; day_of_week: number; completed: boolean; updated_at: string };

export type AppState = {
  id: number; user_id?: string; coins: number; gems: number; pet_name: string; pet_level: number;
  pet_xp: number; pet_xp_max: number; ambient_sound: string; active_subject_id: string | null; updated_at: string;
};

export type AmbientSound = 'none' | 'rain' | 'ocean' | 'rain-quiet' | 'rain-thunder' | 'ocean-waves' | 'ocean-birds' | 'focus';
export const AMBIENT_SOUNDS: { value: AmbientSound; label: string; icon: string }[] = [
  { value: 'none', label: 'No Sound', icon: '🔇' },
  { value: 'rain', label: 'Rain', icon: '🌧️' },
  { value: 'ocean', label: 'Soft Ocean', icon: '🌊' },
  { value: 'focus', label: 'Focus Noise', icon: '✨' },
];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
