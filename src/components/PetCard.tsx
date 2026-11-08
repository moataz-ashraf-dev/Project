import { Sparkles, LockKeyhole } from 'lucide-react';
import { type LanguageCode, type TranslationKey } from '@/lib/i18n';
import { getPetVisual } from '@/lib/petAssets';

type Props = {
  petName: string;
  petId?: string;
  petXp: number;
  petXpMax: number;
  language: LanguageCode;
  t: (key: TranslationKey) => string;
};

export default function PetCard({ petName, petId, petXp, petXpMax, t }: Props) {
  const hasPet = Boolean(petId && petName);
  const visual = getPetVisual(petId || 'sparky');
  const xpPercent = Math.min(100, (petXp / Math.max(1, petXpMax)) * 100);
  return (
    <div className="group relative rounded-3xl sq-shell-card border border-white/10 bg-ink-700/40 p-5 overflow-hidden transition-all duration-500 hover:border-neon-cyan/30 hover:-translate-y-0.5">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 18% 45%, rgba(0,240,255,.10), transparent 34%), radial-gradient(circle at 85% 15%, rgba(125,85,255,.08), transparent 28%)' }} />
      <div className="relative flex items-center gap-4">
        <div className="relative shrink-0 w-24 h-24 rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-cyan-300/10 via-blue-500/5 to-violet-500/10 overflow-hidden shadow-[0_0_30px_rgba(0,210,255,.10)]">
          <img src={visual.asset} alt="" className="w-full h-full object-cover mix-blend-screen transition-transform duration-500 group-hover:scale-110" style={{ filter: visual.filter }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent pointer-events-none" />
          {!hasPet && <div className="absolute inset-0 grid place-items-center bg-slate-950/30"><LockKeyhole className="w-7 h-7 text-cyan-100/80" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="font-display font-bold text-sm text-[var(--sq-heading)] truncate">{hasPet ? petName : t('starterCompanionTitle')}</h3>
            <Sparkles className="w-3.5 h-3.5 text-neon-amber shrink-0" />
          </div>
          <p className="text-xs text-[var(--sq-muted)] mb-2">{hasPet ? t('companion') : t('starterCompanionBody')}</p>
          {hasPet ? <>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-emerald transition-all duration-500" style={{ width: `${xpPercent}%` }} /></div>
            <div className="flex justify-between mt-1"><span className="text-[10px] font-mono text-[var(--sq-muted)]">{petXp} {t('xp')}</span><span className="text-[10px] font-mono text-[var(--sq-muted)]">{petXpMax} {t('xp')}</span></div>
          </> : <div className="mt-3 inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-black border border-cyan-300/20 bg-cyan-300/5 text-cyan-200">{t('starterCompanionRequirement')}</div>}
        </div>
      </div>
    </div>
  );
}
