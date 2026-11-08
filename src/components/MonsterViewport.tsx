import { useCallback, useRef, useState, type PointerEvent } from 'react';
import { Crown, Car, Shirt, Glasses } from 'lucide-react';
import type { PetDefinition, SkinDefinition } from '@/lib/profileStore';
import { type LanguageCode, type TranslationKey, translateRarity } from '@/lib/i18n';
import { getPetAsset } from '@/lib/petAssets';

type Props = {
  pet: PetDefinition;
  equippedSkins: (SkinDefinition | null)[];
  language: LanguageCode;
  t: (key: TranslationKey) => string;
};

export default function MonsterViewport({ pet, equippedSkins, language }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const crown = equippedSkins.find((s) => s?.category === 'crown') ?? null;
  const glasses = equippedSkins.find((s) => s?.category === 'glasses') ?? null;
  const clothes = equippedSkins.find((s) => s?.category === 'clothes') ?? null;
  const vehicle = equippedSkins.find((s) => s?.category === 'vehicle') ?? null;

  const handlePointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -18, y: px * 18 });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={viewportRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full max-w-sm mx-auto aspect-square rounded-3xl border border-white/10
        bg-gradient-to-b from-ink-600 to-ink-800 overflow-hidden select-none"
      style={{ perspective: '800px' }}
    >
      {/* Ambient scene glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(0, 240, 255, 0.16), transparent 60%), radial-gradient(circle at 50% 90%, rgba(0, 255, 157, 0.12), transparent 65%)',
        }}
      />

      {/* Rotating neon ring pedestal */}
      <div className="absolute left-1/2 bottom-[14%] -translate-x-1/2 w-[62%] aspect-[3/1]">
        <div className="absolute inset-0 rounded-[50%] border-2 border-neon-cyan/30 animate-spin-slow" />
        <div className="absolute inset-[15%] rounded-[50%] border border-neon-emerald/20" />
        <div className="absolute inset-0 rounded-[50%] bg-neon-cyan/10 blur-xl" />
      </div>

      {/* 3D companion stage */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        <div className="relative flex flex-col items-center animate-float">
          {/* Crown slot */}
          {crown && (
            <div className="absolute -top-7 text-3xl drop-shadow-[0_0_10px_rgba(255,170,0,0.6)] z-30">
              <Crown className="w-9 h-9 text-neon-amber fill-current/20" />
            </div>
          )}

          {/* Vehicle slot (mount, sits behind/below) */}
          {vehicle && (
            <div className="absolute bottom-[-14px] text-4xl opacity-90 drop-shadow-[0_0_10px_rgba(0,240,255,0.4)] z-0">
              <Car className="w-11 h-11 text-neon-cyan" />
            </div>
          )}

          {/* Clothes slot (worn body accent) */}
          {clothes && (
            <div className="absolute bottom-2 right-[-6px] text-2xl drop-shadow-[0_0_8px_rgba(0,255,157,0.5)] z-20">
              <Shirt className="w-8 h-8 text-neon-emerald" />
            </div>
          )}

          {/* The monster itself */}
          <div className="pet-3d-stage relative w-48 h-48 md:w-56 md:h-56 z-10" style={{ transform: 'translateZ(40px)' }}>
            <div className="pet-3d-shadow" />
            <img src={getPetAsset(pet.id)} alt="" className="pet-3d-hero w-full h-full object-cover rounded-[2rem] mix-blend-screen" />
          </div>

          {/* Glasses slot (face accent) */}
          {glasses && (
            <div className="absolute top-[30%] text-xl z-20"><Glasses className="w-7 h-7 text-white/90" /></div>
          )}
        </div>
      </div>

      {/* Pet name plate */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full glass border border-white/10 z-20">
        <span className="text-xs font-display font-bold text-gray-200">{pet.name}</span>
        <span className="ml-1.5 text-[10px] text-neon-cyan/80">· {translateRarity(pet.rarity, language)}</span>
      </div>
    </div>
  );
}
