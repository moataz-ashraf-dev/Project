import { useEffect, useRef, useState } from 'react';
import { ChevronDown, CloudRain, Waves, VolumeX, Sparkles } from 'lucide-react';
import { type LanguageCode, type TranslationKey } from '@/lib/i18n';

export type AmbientValue = 'none' | 'rain-quiet' | 'rain-thunder' | 'ocean-waves' | 'ocean-birds';

type Props = {
  value: AmbientValue | string;
  onChange: (sound: AmbientValue) => void;
  language: LanguageCode;
  t: (key: TranslationKey) => string;
};

const OPTIONS = [
  { value: 'none' as const, icon: '🔇', ar: 'بدون صوت', en: 'Silent', url: '' },
  { value: 'rain-quiet' as const, icon: '🌧️', ar: 'مطر هادي', en: 'Quiet Rain', url: encodeURI('/صوت/Rain(chosic.com).mp3') },
  { value: 'rain-thunder' as const, icon: '⛈️', ar: 'مطر ورعد', en: 'Rain & Thunder', url: encodeURI('/صوت/Rain-Sound-and-Rainforest(chosic.com).mp3') },
  { value: 'ocean-waves' as const, icon: '🌊', ar: 'بحر هادئ', en: 'Calm Ocean Waves', url: encodeURI('/صوت/بحرهادء.mp3') },
  { value: 'ocean-birds' as const, icon: '🐦', ar: 'بحر وطيور', en: 'Ocean & Birds', url: encodeURI('/صوت/بحر_طيور.mp3') },
];

// Global audio reference so it persists across page navigation (like the timer)
let globalAudio: HTMLAudioElement | null = null;

export default function AmbientSoundWidget({ value, onChange, language }: Props) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(globalAudio !== null && !globalAudio.paused);
  const ref = useRef<HTMLDivElement>(null);

  const selectedValue = value === 'rain' ? 'rain-quiet' : value === 'ocean' ? 'ocean-waves' : value;
  const current = OPTIONS.find((s) => s.value === selectedValue) ?? OPTIONS[0];

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  // Sync state if sound is already playing globally
  useEffect(() => {
    if (globalAudio && !globalAudio.paused) {
      setRunning(true);
    }
  }, []);

  function stopAudio() {
    if (globalAudio) {
      globalAudio.pause();
      globalAudio = null;
    }
    setRunning(false);
  }

  function startAudio(kind: AmbientValue) {
    stopAudio();
    const selectedOpt = OPTIONS.find(o => o.value === kind);

    if (selectedOpt && selectedOpt.url) {
      const audio = new Audio(selectedOpt.url);
      audio.loop = true;
      audio.volume = 0.7;
      audio.play().catch(e => console.log("Audio play error", e));
      globalAudio = audio;
      setRunning(true);
    }
  }

  function select(kind: AmbientValue) {
    onChange(kind);
    setOpen(false);
    if (kind === 'none') {
      stopAudio();
    } else {
      startAudio(kind);
    }
  }

  return (
    <div ref={ref} className="relative inline-flex">
      <button type="button" onClick={() => setOpen((x) => !x)} className="ambient-trigger flex items-center gap-2 px-3 py-2 rounded-xl">
        {current.value.includes('rain') ? <CloudRain className="w-4 h-4 text-neon-cyan" /> : current.value.includes('ocean') ? <Waves className="w-4 h-4 text-blue-400" /> : current.value === 'none' ? <VolumeX className="w-4 h-4 text-gray-400" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
        <span className="text-lg">{current.icon}</span>
        <span>{language === 'ar' ? current.ar : current.en}</span>
        {running && <span className="ambient-live-dot" aria-label="playing" />}
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-2 left-0 w-64 rounded-2xl glass border border-white/10 shadow-2xl p-2 z-50 bg-slate-950/90 backdrop-blur-md">
          <div className="px-3 py-2 text-[10px] uppercase tracking-[.18em] font-black text-[var(--sq-muted)]">{language === 'ar' ? 'أصوات المذاكرة الفخمة' : 'Ambient sound'}</div>
          {OPTIONS.map((sound) => (
            <button key={sound.value} type="button" onClick={() => select(sound.value)} className={`ambient-option w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${selectedValue === sound.value ? 'is-active bg-blue-600/30 text-blue-300' : 'text-slate-300 hover:bg-slate-800'}`}>
              <span className="text-lg">{sound.icon}</span><span>{language === 'ar' ? sound.ar : sound.en}</span>
              {selectedValue === sound.value && <span className="ml-auto text-neon-cyan text-xs">✓</span>}
            </button>
          ))}
          <p className="px-3 pt-2 pb-1 text-[10px] leading-4 text-[var(--sq-muted)]">{language === 'ar' ? 'أصوات طبيعية تعمل في الخلفية بثبات.' : 'Background persistent audio.'}</p>
        </div>
      )}
    </div>
  );
}
