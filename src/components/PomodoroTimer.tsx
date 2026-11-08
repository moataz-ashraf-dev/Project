import { Play, Pause, RotateCcw } from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n';

type Props = {
  durationMinutes: number;
  remainingSeconds: number;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  subjectName: string | null;
  t: (key: TranslationKey) => string;
};

export default function PomodoroTimer({
  durationMinutes,
  remainingSeconds,
  isRunning,
  onStart,
  onPause,
  onReset,
  subjectName,
  t,
}: Props) {
  const totalSeconds = durationMinutes * 60;
  const remaining = Math.max(0, Math.min(totalSeconds, remainingSeconds));

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;
  const circumference = 2 * Math.PI * 140;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-[min(320px,calc(100vw-3rem))] aspect-square flex items-center justify-center">
        {/* Rotating neon border when running */}
        {isRunning && (
          <div className="absolute inset-0 rounded-full rotate-border"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, var(--sq-accent-cyan) 25%, transparent 50%, var(--sq-accent-green) 75%, transparent 100%)',
              padding: '3px',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              borderRadius: '9999px',
            }}
          />
        )}

        {/* Static glow ring */}
        <div
          className={`absolute inset-2 rounded-full border-2 transition-all duration-500 ${
            isRunning ? 'border-neon-cyan/40' : 'border-white/10'
          }`}
          style={{
            boxShadow: isRunning
              ? '0 0 22px color-mix(in srgb, var(--sq-accent-cyan) 22%, transparent), inset 0 0 22px color-mix(in srgb, var(--sq-accent-cyan) 6%, transparent)'
              : 'none',
          }}
        />

        {/* SVG progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 320 320">
          <circle
            cx="160" cy="160" r="140"
            fill="none"
            stroke="var(--sq-ring-track)"
            strokeWidth="6"
          />
          <circle
            cx="160" cy="160" r="140"
            fill="none"
            stroke={isRunning ? 'var(--sq-accent-cyan)' : 'var(--sq-ring-idle)'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease',
              filter: isRunning ? 'drop-shadow(0 0 5px color-mix(in srgb, var(--sq-accent-cyan) 28%, transparent))' : 'none',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">
            {subjectName ?? t('selectSubjectHint')}
          </span>
          <span className={`font-mono text-6xl font-bold tracking-tight ${
            isRunning ? 'text-neon-cyan neon-text-cyan' : 'text-gray-200'
          }`}>
            {timeString}
          </span>
          <span className="text-xs font-medium text-gray-600 uppercase tracking-widest">
            {isRunning ? t('inFocus') : t('ready')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {!isRunning ? (
          <button
            onClick={onStart}
            disabled={!subjectName}
            className="group flex items-center gap-2 px-8 py-3.5 rounded-2xl font-display font-bold text-base focus-primary
              bg-gradient-to-r from-neon-cyan/20 to-neon-emerald/20 border border-neon-cyan/40
              text-neon-cyan hover:from-neon-cyan/30 hover:to-neon-emerald/30
              transition-all duration-300 hover:scale-105 active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Play className="w-5 h-5 fill-current" />
            Start Focus
          </button>
        ) : (
          <button
            onClick={onPause}
            className="group flex items-center gap-2 px-8 py-3.5 rounded-2xl font-display font-bold text-base focus-pause
              bg-gradient-to-r from-neon-amber/20 to-neon-rose/20 border border-neon-amber/40
              text-neon-amber hover:from-neon-amber/30 hover:to-neon-rose/30
              transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Pause className="w-5 h-5 fill-current" />
            Pause
          </button>
        )}
        <button
          onClick={onReset}
          className="focus-reset p-3.5 rounded-2xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5
            transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
