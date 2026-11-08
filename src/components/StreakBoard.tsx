import { Check, Flame } from 'lucide-react';
import { WEEKDAYS, type StreakDay } from '@/lib/supabase';
import { type LanguageCode, type TranslationKey, translateWeekday } from '@/lib/i18n';

type Props = {
  streakDays: StreakDay[];
  language: LanguageCode;
  t: (key: TranslationKey) => string;
};

export default function StreakBoard({ streakDays, language, t }: Props) {
  const now = new Date();
  const today = now.getDay();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() - today);
  const sorted = [...streakDays].sort((a, b) => a.day_of_week - b.day_of_week);
  const isCurrentWeek = (day: StreakDay) => {
    if (!day.completed) return false;
    const updated = new Date(day.updated_at);
    return Number.isFinite(updated.getTime()) && updated >= weekStart && updated <= now;
  };
  const completedCount = sorted.filter(isCurrentWeek).length;
  const progress = Math.round((completedCount / 7) * 100);
  const todayLabel = language === 'ar' ? 'اليوم' : language === 'de' ? 'Heute' : language === 'fr' ? 'Aujourd’hui' : language === 'ja' ? '今日' : 'Today';

  return (
    <section className="weekly-streak-card rounded-2xl border border-white/10 bg-ink-700/40 p-5" aria-label={t('weeklyStreak')}>
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="weekly-streak-flame grid h-10 w-10 place-items-center rounded-xl"><Flame className="h-5 w-5" /></span>
          <div>
            <h3 className="font-display font-bold text-sm text-gray-200">{t('weeklyStreak')}</h3>
            <p className="mt-0.5 text-[11px] text-gray-500">{language === 'ar' ? 'كل يوم مذاكرة يقرّبك من هدفك' : 'Every study day moves you forward'}</p>
          </div>
        </div>
        <div className="weekly-streak-total text-end">
          <span className="block font-mono text-lg font-black text-gray-200">{completedCount}<span className="mx-1 text-gray-500">/</span>7</span>
          <span className="text-[10px] font-bold text-gray-500">{t('days')}</span>
        </div>
      </header>
      <div className="weekly-streak-progress mt-4" role="progressbar" aria-valuemin={0} aria-valuemax={7} aria-valuenow={completedCount} aria-label={`${completedCount}/7`}><span style={{ width: `${progress}%` }} /></div>
      <div className="weekly-streak-days mt-4 grid grid-cols-7 gap-2">
        {sorted.map((day) => {
          const isToday = day.day_of_week === today;
          const completed = isCurrentWeek(day);
          return (
            <div key={day.id} aria-current={isToday ? 'date' : undefined} aria-label={`${translateWeekday(WEEKDAYS[day.day_of_week], language)}${isToday ? `, ${todayLabel}` : ''}${completed ? ', completed' : ''}`} className={`weekly-streak-day flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border px-1 py-3 text-center transition-colors ${completed ? 'is-complete' : ''} ${isToday ? 'is-today' : ''}`}>
              <span className="weekly-streak-label truncate text-[10px] font-bold uppercase tracking-wide">{translateWeekday(WEEKDAYS[day.day_of_week], language)}</span>
              <span className="weekly-streak-mark grid h-8 w-8 place-items-center rounded-xl" aria-hidden="true">{completed && <Check className="h-4 w-4" strokeWidth={3} />}</span>
              {isToday && <span className="weekly-streak-today text-[9px] font-extrabold">{todayLabel}</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
