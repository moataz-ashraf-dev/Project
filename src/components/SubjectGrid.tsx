import { Lock, Clock } from 'lucide-react';
import type { Subject } from '@/lib/supabase';
import type { TranslationKey } from '@/lib/i18n';

type Props = {
  subjects: Subject[];
  activeSubjectId: string | null;
  isRunning: boolean;
  onSelect: (subject: Subject) => void;
  onEditDuration: (subjectId: string, minutes: number) => void;
  onEditName: (subjectId: string, name: string) => void;
  t: (key: TranslationKey) => string;
};

const COLOR_MAP: Record<string, { text: string; border: string; bg: string; shadow: string; ring: string }> = {
  cyan: {
    text: 'text-neon-cyan',
    border: 'border-neon-cyan/40',
    bg: 'bg-neon-cyan/5',
    shadow: 'neon-border-cyan',
    ring: 'ring-neon-cyan/30',
  },
  emerald: {
    text: 'text-neon-emerald',
    border: 'border-neon-emerald/40',
    bg: 'bg-neon-emerald/5',
    shadow: 'neon-border-emerald',
    ring: 'ring-neon-emerald/30',
  },
  amber: {
    text: 'text-neon-amber',
    border: 'border-neon-amber/40',
    bg: 'bg-neon-amber/5',
    shadow: 'neon-border-amber',
    ring: 'ring-neon-amber/30',
  },
  rose: {
    text: 'text-neon-rose',
    border: 'border-neon-rose/40',
    bg: 'bg-neon-rose/5',
    shadow: 'neon-border-rose',
    ring: 'ring-neon-rose/30',
  },
};

export default function SubjectGrid({ subjects, activeSubjectId, isRunning, onSelect, onEditDuration, onEditName, t }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {subjects.map((subject, index) => {
        const colors = COLOR_MAP[subject.color] ?? COLOR_MAP.cyan;
        const isActive = activeSubjectId === subject.id;
        const isLocked = isRunning && !isActive;

        return (
          <div
            key={subject.id}
            className={`relative rounded-2xl border p-5 transition-all duration-300 cursor-pointer
              ${
                isLocked
                  ? 'border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed'
                  : isActive
                  ? `${colors.border} ${colors.bg} ${colors.shadow} ring-1 ${colors.ring}`
                  : `${colors.border} ${colors.bg} hover:scale-[1.02]`
              }`}
            onClick={() => !isLocked && onSelect(subject)}
          >
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-ink-800/50 z-10">
                <Lock className="w-6 h-6 text-gray-600" />
              </div>
            )}

            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${colors.border} ${colors.bg} ${isActive ? colors.shadow : ''} shrink-0 transition-all duration-300`}>
                  <span className={`font-mono font-bold text-lg ${colors.text}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    type="text"
                    value={subject.name}
                    disabled={isRunning}
                    onChange={(e) => {
                      e.stopPropagation();
                      onEditName(subject.id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`font-display font-bold text-base bg-transparent border-b border-transparent focus:border-white/20 focus:outline-none transition-colors w-full ${isActive ? colors.text : 'text-gray-200'} disabled:opacity-70`}
                  />
                  <p className="text-xs text-gray-500 mt-0.5">{t('studyGoal')}</p>
                </div>
              </div>
              {isActive && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border} shrink-0`}>
                  ACTIVE
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <input
                type="number"
                min={5}
                max={120}
                value={subject.duration_minutes}
                disabled={isRunning}
                onChange={(e) => {
                  e.stopPropagation();
                  onEditDuration(subject.id, parseInt(e.target.value) || 25);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-14 bg-transparent text-gray-300 font-mono font-bold border-b border-white/10 focus:border-neon-cyan focus:outline-none text-center transition-colors disabled:opacity-50"
              />
              <span className="text-gray-500">{t('min')}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
