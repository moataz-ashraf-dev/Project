import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Loader2, Sparkles } from 'lucide-react';
import { generateTomorrowPlan, loadPlan, localCalendarDate, type StudyPlan } from '@/lib/planner';
import type { LanguageCode, TranslationKey } from '@/lib/i18n';

type Props = { language: LanguageCode; t: (key: TranslationKey) => string; onPlanReady?: (plan: StudyPlan | null) => void };

function tomorrowDate() { return localCalendarDate(1); }

export default function TomorrowPlanner({ language, onPlanReady }: Props) {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [existingPlan, setExistingPlan] = useState<StudyPlan | null>(null);
  const date = useMemo(tomorrowDate, []);

  useEffect(() => { loadPlan(date).then(setExistingPlan).catch(() => undefined); }, [date]);

  const generate = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true); setMessage('');
    try {
      const next = await generateTomorrowPlan(prompt.trim(), date, Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', language);
      setExistingPlan(next); onPlanReady?.(next); setPrompt('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not create the plan.'); }
    finally { setBusy(false); }
  };

  return (
    <section className="w-full rounded-3xl sq-shell-card border border-neon-violet/15 p-5 md:p-6">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl grid place-items-center bg-neon-violet/10 border border-neon-violet/20 shrink-0"><CalendarClock className="w-5 h-5 text-neon-violet" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><h2 className="font-display font-black text-lg text-[var(--sq-heading)]">{({en:'Tomorrow Planner',ar:'مخطط بكرة',ja:'明日のプランナー',fr:'Planificateur de demain',de:'Morgenplaner'} as Record<LanguageCode,string>)[language]}</h2><Sparkles className="w-4 h-4 text-neon-violet" /></div>
          <p className="text-xs text-[var(--sq-muted)] mt-1">{({ar:'اكتب المهام الجديدة اللي عايز تضيفها لخطة بكرة. هتتضاف على المهام الموجودة من غير ما تمسحها.',en:'Write new tasks to add to tomorrow. Existing tasks will stay in place.',ja:'明日やることをまとめて入力すると、AIが時間と所要時間つきのカードに整理します。カードからタイマーを開始できます。',fr:'Écrivez tout ce que vous devez faire demain. L’IA transforme la liste en cartes avec heure et durée, prêtes à lancer le minuteur.',de:'Schreibe alles für morgen in eine Nachricht. Die KI erstellt Karten mit Uhrzeit und Dauer, die den Timer starten können.'} as Record<LanguageCode,string>)[language]}</p>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value.slice(0, 5000))} rows={3} maxLength={5000}
            placeholder={({ar:'مثال: رياضيات ساعتين، حل واجب الفيزياء، أراجع الإنجليزي 45 دقيقة بعد 7...',en:'Example: two hours of math, finish physics homework, review English for 45 minutes after 7...',ja:'例：数学2時間、物理の宿題、7時以降に英語45分…',fr:'Exemple : deux heures de maths, devoir de physique, anglais 45 min après 19 h…',de:'Beispiel: zwei Stunden Mathe, Physik-Hausaufgaben, Englisch 45 Minuten nach 19 Uhr…'} as Record<LanguageCode,string>)[language]}
            className="mt-4 w-full rounded-2xl bg-black/10 border border-white/10 px-4 py-3 text-sm text-[var(--sq-heading)] outline-none focus:border-neon-violet/40 resize-y" />
          <div className="flex items-center justify-between gap-3 mt-3">
            <span className="text-[10px] text-[var(--sq-muted)]">{date}</span>
            <button type="button" onClick={generate} disabled={busy || !prompt.trim()} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 border border-neon-violet/30 bg-neon-violet/10 text-neon-violet text-sm font-black disabled:opacity-40">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {busy ? ({ar:'جاري ترتيب يومك...',en:'Building your day...',ja:'予定を作成中…',fr:'Organisation de votre journée…',de:'Dein Tag wird geplant…'} as Record<LanguageCode,string>)[language] : (existingPlan?.tasks?.length ? ({ar:'ضيف مهام',en:'Add tasks',ja:'タスクを追加',fr:'Ajouter des tâches',de:'Aufgaben hinzufügen'} as Record<LanguageCode,string>)[language] : ({ar:'ظبط بكرة',en:'Build tomorrow',ja:'明日を組み立てる',fr:'Planifier demain',de:'Morgen planen'} as Record<LanguageCode,string>)[language])}
            </button>
          </div>
          {message && <p className="text-xs text-neon-rose mt-3" role="alert">{message}</p>}
        </div>
      </div>
    </section>
  );
}
