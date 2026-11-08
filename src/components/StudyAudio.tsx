import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Pause, Play, Volume2 } from 'lucide-react';
import type { LanguageCode } from '@/lib/i18n';

const SURAHS_AR = [
'الفاتحة','البقرة','آل عمران','النساء','المائدة','الأنعام','الأعراف','الأنفال','التوبة','يونس','هود','يوسف','الرعد','إبراهيم','الحجر','النحل','الإسراء','الكهف','مريم','طه','الأنبياء','الحج','المؤمنون','النور','الفرقان','الشعراء','النمل','القصص','العنكبوت','الروم','لقمان','السجدة','الأحزاب','سبأ','فاطر','يس','الصافات','ص','الزمر','غافر','فصلت','الشورى','الزخرف','الدخان','الجاثية','الأحقاف','محمد','الفتح','الحجرات','ق','الذاريات','الطور','النجم','القمر','الرحمن','الواقعة','الحديد','المجادلة','الحشر','الممتحنة','الصف','الجمعة','المنافقون','التغابن','الطلاق','التحريم','الملك','القلم','الحاقة','المعارج','نوح','الجن','المزمل','المدثر','القيامة','الإنسان','المرسلات','النبأ','النازعات','عبس','التكوير','الانفطار','المطففين','الانشقاق','البروج','الطارق','الأعلى','الغاشية','الفجر','البلد','الشمس','الليل','الضحى','الشرح','التين','العلق','القدر','البينة','الزلزلة','العاديات','القارعة','التكاثر','العصر','الهمزة','الفيل','قريش','الماعون','الكوثر','الكافرون','النصر','المسد','الإخلاص','الفلق','الناس'
];

const SURAHS_EN = [
'Al-Fatihah','Al-Baqarah','Aal-E-Imran','An-Nisa','Al-Ma’idah','Al-An’am','Al-A’raf','Al-Anfal','At-Tawbah','Yunus','Hud','Yusuf','Ar-Ra’d','Ibrahim','Al-Hijr','An-Nahl','Al-Isra','Al-Kahf','Maryam','Ta-Ha','Al-Anbiya','Al-Hajj','Al-Mu’minun','An-Nur','Al-Furqan','Ash-Shu’ara','An-Naml','Al-Qasas','Al-Ankabut','Ar-Rum','Luqman','As-Sajdah','Al-Ahzab','Saba','Fatir','Ya-Sin','As-Saffat','Sad','Az-Zumar','Ghafir','Fussilat','Ash-Shura','Az-Zukhruf','Ad-Dukhan','Al-Jathiyah','Al-Ahqaf','Muhammad','Al-Fath','Al-Hujurat','Qaf','Adh-Dhariyat','At-Tur','An-Najm','Al-Qamar','Ar-Rahman','Al-Waqi’ah','Al-Hadid','Al-Mujadilah','Al-Hashr','Al-Mumtahanah','As-Saff','Al-Jumu’ah','Al-Munafiqun','At-Taghabun','At-Talaq','At-Tahrim','Al-Mulk','Al-Qalam','Al-Haqqah','Al-Ma’arij','Nuh','Al-Jinn','Al-Muzzammil','Al-Muddaththir','Al-Qiyamah','Al-Insan','Al-Mursalat','An-Naba','An-Nazi’at','Abasa','At-Takwir','Al-Infitar','Al-Mutaffifin','Al-Inshiqaq','Al-Buruj','At-Tariq','Al-A’la','Al-Ghashiyah','Al-Fajr','Al-Balad','Ash-Shams','Al-Layl','Ad-Duha','Ash-Sharh','At-Tin','Al-Alaq','Al-Qadr','Al-Bayyinah','Az-Zalzalah','Al-Adiyat','Al-Qari’ah','At-Takathur','Al-Asr','Al-Humazah','Al-Fil','Quraysh','Al-Ma’un','Al-Kawthar','Al-Kafirun','An-Nasr','Al-Masad','Al-Ikhlas','Al-Falaq','An-Nas'
];


const RECITERS = [
  { id: 'ar.alafasy', names: { ar:'مشاري راشد العفاسي', en:'Mishary Rashid Alafasy', de:'Mishary Rashid Alafasy', fr:'Mishary Rashid Alafasy', ja:'ミシャーリー・ラシド・アル＝アファシー' } },
  { id: 'ar.husary', names: { ar:'محمود خليل الحصري', en:'Mahmoud Khalil Al-Husary', de:'Mahmoud Khalil Al-Husary', fr:'Mahmoud Khalil Al-Husary', ja:'マフムード・ハリール・アル＝フサリー' } },
  { id: 'ar.minshawi', names: { ar:'محمد صديق المنشاوي', en:'Mohamed Siddiq Al-Minshawi', de:'Mohamed Siddiq Al-Minshawi', fr:'Mohamed Siddiq Al-Minshawi', ja:'ムハンマド・シッディーク・アル＝ミンシャーウィー' } },
  { id: 'ar.sudais', names: { ar:'عبدالرحمن السديس', en:'Abdul Rahman Al-Sudais', de:'Abdul Rahman Al-Sudais', fr:'Abdul Rahman Al-Sudais', ja:'アブドゥルラフマーン・アッ＝スダイス' } },
];

export default function StudyAudio({ language = 'ar' }: { language?: LanguageCode }) {
  const copy: Record<LanguageCode, {title:string; silent:string; quran:string; play:string; pause:string; errorPlay:string; errorLoad:string; source:string}> = {
    ar:{title:'قراءة لتحسين المزاج',silent:'بدون صوت',quran:'القرآن',play:'تشغيل',pause:'إيقاف',errorPlay:'اضغط تشغيل مرة ثانية للسماح بتشغيل الصوت.',errorLoad:'تعذر تحميل السورة. جرّب تغيير القارئ أو الاتصال بالإنترنت.',source:'الصوت مقدم عبر Al Quran Cloud CDN؛ راجع شروط المصدر قبل إعادة التوزيع التجاري.'},
    en:{title:'Mood Boost Recitation',silent:'Silent',quran:'Quran',play:'Play',pause:'Pause',errorPlay:'Press play again to allow audio playback.',errorLoad:'Could not load the surah. Try another reciter or check your connection.',source:'Audio served through the Al Quran Cloud CDN; review the source terms before commercial redistribution.'},
    ja:{title:'気分を整える朗誦',silent:'無音',quran:'クルアーン',play:'再生',pause:'一時停止',errorPlay:'もう一度再生を押して音声を許可してください。',errorLoad:'スーラを読み込めません。別の朗誦者か接続を試してください。',source:'音声はAl Quran Cloud CDNから提供されています。商用再配布前に提供元の利用条件を確認してください。'},
    fr:{title:'Récitation pour améliorer l’humeur',silent:'Silencieux',quran:'Coran',play:'Lire',pause:'Pause',errorPlay:'Appuyez à nouveau sur lecture pour autoriser le son.',errorLoad:'Impossible de charger la sourate. Essayez un autre récitant ou vérifiez la connexion.',source:'Audio fourni via le CDN Al Quran Cloud ; vérifiez les conditions de la source avant toute redistribution commerciale.'},
    de:{title:'Rezitation für bessere Stimmung',silent:'Stumm',quran:'Koran',play:'Abspielen',pause:'Pause',errorPlay:'Drücke erneut auf Wiedergabe, um Audio zu erlauben.',errorLoad:'Die Sure konnte nicht geladen werden. Versuche einen anderen Rezitator oder prüfe die Verbindung.',source:'Audio wird über das Al Quran Cloud CDN bereitgestellt; prüfe die Quellenbedingungen vor kommerzieller Weiterverbreitung.'},
  };
  const c = copy[language];
  const [mode, setMode] = useState<'none' | 'quran'>('none');
  const [surah, setSurah] = useState(1);
  const [reciter, setReciter] = useState('ar.alafasy');
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  const audioUrl = useMemo(() => `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${surah}.mp3`, [reciter, surah]);

  useEffect(() => {
    if (mode !== 'quran' || !audioRef.current) return;
    audioRef.current.load();
    if (playing) audioRef.current.play().catch(() => setPlaying(false));
  }, [audioUrl, mode]);

  const toggleQuran = async () => {
    setError('');
    setMode('quran');
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); return; }
    try { await audio.play(); setPlaying(true); } catch { setError(c.errorPlay); }
  };

  const selectSurah = (value: number) => {
    setSurah(value);
    setMode('quran');
    setPlaying(false);
    setTimeout(() => audioRef.current?.play().then(() => setPlaying(true)).catch(() => undefined), 0);
  };

  return (
    <div className="w-full min-w-0 max-w-3xl rounded-2xl glass border border-white/10 p-4 md:p-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-neon-cyan"><Volume2 className="w-5 h-5" /><span className="font-bold">{c.title}</span></div>
        <div className="flex w-full sm:w-auto rounded-xl bg-white/5 border border-white/10 p-1 text-xs overflow-x-auto">
          <button onClick={() => { setMode('none'); audioRef.current?.pause(); setPlaying(false); }} className={`shrink-0 px-3 py-1.5 rounded-lg ${mode === 'none' ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-gray-400'}`}>{c.silent}</button>
          <button onClick={() => setMode('quran')} className={`shrink-0 px-3 py-1.5 rounded-lg ${mode === 'quran' ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-gray-400'}`}>{c.quran}</button>
        </div>
      </div>

      {mode === 'quran' && <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
        <select value={surah} onChange={(e) => selectSurah(Number(e.target.value))} dir={language === 'ar' ? 'rtl' : 'ltr'} className="studyquest-control min-w-0 w-full rounded-xl px-3 py-2 text-sm truncate">
          {SURAHS_AR.map((name, i) => { const label = language === 'ar' ? name : SURAHS_EN[i] ?? name; return <option key={i + 1} value={i + 1}>{i + 1}. {label}</option>; })}
        </select>
        <select value={reciter} onChange={(e) => { setReciter(e.target.value); setPlaying(false); }} dir={language === 'ar' ? 'rtl' : 'ltr'} className="studyquest-control min-w-0 w-full rounded-xl px-3 py-2 text-sm truncate">
          {RECITERS.map((r) => <option key={r.id} value={r.id}>{r.names[language]}</option>)}
        </select>
        <div className="flex min-w-0 gap-2 sm:col-span-2 lg:col-span-1">
          <button onClick={toggleQuran} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan font-bold text-sm">{playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}{playing ? c.pause : c.play}</button>
          <a href={audioUrl} target="_blank" rel="noreferrer" download className="inline-flex items-center justify-center rounded-xl px-3 py-2 bg-white/5 border border-white/10 text-gray-300" title="فتح/تحميل السورة"><Download className="w-4 h-4" /></a>
        </div>
        <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} onError={() => { setPlaying(false); setError(c.errorLoad); }} className="hidden" preload="none" />
      </div>}

      {error && <p className="text-xs text-neon-rose mt-2">{error}</p>}
      {mode === 'quran' && <p className="text-[10px] text-gray-600 mt-2">{c.source}</p>}
    </div>
  );
}
