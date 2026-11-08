import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { LanguageCode } from '@/lib/i18n';

export type AssistantImage = { mimeType: string; data: string; name?: string };
export type AssistantSource = { title: string; uri: string };
export type AssistantResult = { answer: string; sources: AssistantSource[] };

export async function askStudyAssistant(question: string, language: LanguageCode, image?: AssistantImage): Promise<AssistantResult> {
  const clean = question.trim().slice(0, 4000);
  if (!clean) throw new Error('empty_question');
  if (!isSupabaseConfigured) throw new Error('ai_not_configured');
  if (image && (!/^image\/(png|jpeg|jpg|webp|gif)$/i.test(image.mimeType) || image.data.length > 5_000_000)) throw new Error('image_too_large');
  const { data, error } = await supabase.functions.invoke('study-assistant', {
    body: { question: clean, language, image: image ? { mime_type: image.mimeType, data: image.data, name: image.name } : undefined },
  });
  if (error) throw error;
  if (!data?.answer) throw new Error(data?.error ?? 'assistant_failed');
  return { answer: String(data.answer), sources: Array.isArray(data.sources) ? data.sources : [] };
}
