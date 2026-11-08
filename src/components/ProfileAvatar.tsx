import { Camera, Sparkles } from 'lucide-react';
import type { CSSProperties } from 'react';
import { getPetAsset } from '@/lib/petAssets';

export type AvatarTheme = 'ice' | 'fire' | 'aurora' | 'royal' | 'void';
export type AvatarPetPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export const AVATAR_THEMES: Array<{ id: AvatarTheme; label: string; ar: string; frame: string; glow: string }> = [
  { id: 'ice', label: 'Ice', ar: 'ثلجي', frame: 'from-cyan-300/30 via-sky-400/15 to-violet-400/30', glow: 'rgba(0,240,255,.34)' },
  { id: 'fire', label: 'Fire', ar: 'ناري', frame: 'from-amber-300/35 via-red-500/20 to-rose-500/35', glow: 'rgba(255,90,45,.34)' },
  { id: 'aurora', label: 'Aurora', ar: 'شفق', frame: 'from-emerald-300/30 via-cyan-400/15 to-violet-500/30', glow: 'rgba(0,255,157,.30)' },
  { id: 'royal', label: 'Royal', ar: 'ملكي', frame: 'from-amber-300/35 via-fuchsia-400/15 to-violet-500/35', glow: 'rgba(255,170,0,.30)' },
  { id: 'void', label: 'Void', ar: 'فوضى', frame: 'from-violet-500/35 via-indigo-500/20 to-black/50', glow: 'rgba(120,80,255,.34)' },
];

export function avatarThemeDef(theme: string) {
  return AVATAR_THEMES.find((item) => item.id === theme) ?? AVATAR_THEMES[0];
}

type Props = {
  avatarUrl?: string | null;
  fallbackPetId: string;
  petPosition: AvatarPetPosition;
  theme: AvatarTheme;
  /** The equipped profile-frame id from the user's cloud/local equipment. */
  frameId?: string | null;
  size?: 'sm' | 'md' | 'lg';
  onUpload?: () => void;
};

/**
 * The avatar is intentionally built from layers around the photo rather than
 * from a rectangular/cropped frame asset. This keeps the user's photo clean
 * and lets every frame wrap the circular profile consistently at any size.
 */
export default function ProfileAvatar({ avatarUrl, fallbackPetId, petPosition, theme, frameId, size = 'md', onUpload }: Props) {
  const def = avatarThemeDef(theme);
  const sizeClass = size === 'lg' ? 'w-44 h-44 md:w-48 md:h-48' : size === 'sm' ? 'w-12 h-12' : 'w-28 h-28';
  const petClass = size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-5 h-5' : 'w-8 h-8';
  const positionClass = {
    'top-right': '-top-2 -right-2',
    'top-left': '-top-2 -left-2',
    'bottom-right': '-bottom-2 -right-2',
    'bottom-left': '-bottom-2 -left-2',
  }[petPosition];

  const frame = frameId ?? '';
  const isPremium = frame.includes('premium-');
  const frameKind = frame.includes('frost') ? 'frost'
    : frame.includes('phoenix') || frame.includes('inferno') ? 'fire'
    : frame.includes('void') || frame.includes('obsidian') ? 'void'
    : frame.includes('astral') || frame.includes('sky') ? 'astral'
    : frame.includes('emerald') || frame.includes('nature') ? 'nature'
    : frame.includes('infinity') ? 'infinity'
    : frame.includes('royal') || frame.includes('golden') || frame.includes('crown') ? 'royal'
    : 'theme';

  const frameStyles: Record<string, { ring: string; glow: string; accent: string }> = {
    frost: { ring: 'from-cyan-100 via-sky-400 to-blue-700', glow: 'rgba(56,189,248,.45)', accent: 'text-cyan-200' },
    fire: { ring: 'from-yellow-200 via-orange-500 to-red-600', glow: 'rgba(249,115,22,.48)', accent: 'text-orange-200' },
    void: { ring: 'from-violet-200 via-violet-600 to-indigo-950', glow: 'rgba(139,92,246,.48)', accent: 'text-violet-200' },
    astral: { ring: 'from-sky-100 via-indigo-400 to-violet-600', glow: 'rgba(99,102,241,.45)', accent: 'text-sky-200' },
    nature: { ring: 'from-lime-200 via-emerald-500 to-green-800', glow: 'rgba(34,197,94,.40)', accent: 'text-lime-200' },
    infinity: { ring: 'from-amber-200 via-orange-500 to-cyan-500', glow: 'rgba(245,158,11,.45)', accent: 'text-amber-200' },
    royal: { ring: 'from-yellow-100 via-amber-500 to-orange-700', glow: 'rgba(245,158,11,.52)', accent: 'text-yellow-200' },
    theme: { ring: 'from-cyan-200 via-sky-500 to-violet-500', glow: def.glow, accent: 'text-cyan-200' },
  };
  const selectedFrame = frameStyles[frameKind];

  return (
    <div className="relative shrink-0 grid place-items-center" aria-label="Profile picture">
      <div
        className={`${sizeClass} relative grid place-items-center`}
        style={{ '--avatar-glow': selectedFrame.glow } as CSSProperties}
      >
        {/* Decorative frame: it sits outside the photo and never cuts/crops it. */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${selectedFrame.ring} p-[3px] opacity-95 shadow-[0_0_34px_var(--avatar-glow)]`}>
          <div className="h-full w-full rounded-full bg-[#061725]" />
        </div>
        <div className="absolute inset-[5%] rounded-full border border-white/15" />
        <div className="absolute inset-[9%] rounded-full border border-white/10" />
        <div className={`absolute inset-[2%] rounded-full border ${isPremium ? 'border-white/30' : 'border-white/15'} animate-[spin_18s_linear_infinite]`} />

        {/* Small orbit nodes make the frame feel like a crafted game cosmetic. */}
        <span className={`absolute top-[2%] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-br ${selectedFrame.ring} border border-white/50 shadow-[0_0_12px_var(--avatar-glow)]`} />
        <span className={`absolute bottom-[2%] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-br ${selectedFrame.ring} border border-white/50 shadow-[0_0_12px_var(--avatar-glow)]`} />
        <span className={`absolute left-[2%] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-br ${selectedFrame.ring} border border-white/40`} />
        <span className={`absolute right-[2%] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-br ${selectedFrame.ring} border border-white/40`} />

        {/* Crown/crest only for royal-style frames; it remains outside the image. */}
        {['royal', 'fire'].includes(frameKind) && size !== 'sm' && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl drop-shadow-[0_0_12px_rgba(255,190,50,.75)]" aria-hidden="true">♛</div>
        )}

        <div className="absolute inset-[12%] overflow-hidden rounded-full bg-ink-800/95 border border-white/10 shadow-inner">
          {avatarUrl ? <img src={avatarUrl} alt="Profile avatar" className="w-full h-full object-cover" /> : <img src={getPetAsset(fallbackPetId)} alt="" className="w-full h-full object-cover" />}
          {onUpload && <button type="button" onClick={onUpload} aria-label="Change profile picture" className="absolute inset-0 grid place-items-center rounded-full bg-black/0 hover:bg-black/35 transition-colors group"><Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 drop-shadow-lg" /></button>}
        </div>
      </div>

      <div className={`absolute ${positionClass} ${petClass} rounded-full p-0.5 bg-ink-900 border-2 border-white/20 shadow-[0_0_18px_var(--avatar-glow)] z-20`} style={{ '--avatar-glow': selectedFrame.glow } as CSSProperties}>
        <img src={getPetAsset(fallbackPetId)} alt="" className="w-full h-full object-cover rounded-full" />
      </div>
      {size !== 'sm' && <div className="absolute -right-3 -bottom-3 rounded-full px-2 py-1 bg-ink-900/95 border border-white/10 text-[8px] font-bold text-gray-300 flex items-center gap-1 z-20"><Sparkles className={`w-2.5 h-2.5 ${selectedFrame.accent}`} />{def.ar}</div>}
    </div>
  );
}
