import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import {
  Brain,
  ImagePlus,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { LanguageCode } from '@/lib/i18n';
import { askStudyAssistant, type AssistantResult } from '@/lib/studyAssistant';
import {
  createAssistantSpeechRecognition,
  isSpeechRecognitionSupported,
  speakAssistantAnswer,
  stopAssistantSpeech,
} from '@/lib/assistantVoice';

type Props = { language: LanguageCode };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('image_read_failed'));
    reader.readAsDataURL(file);
  });
}

export default function StudyAssistant({ language }: Props) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [image, setImage] = useState<{ file: File; data: string } | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<ReturnType<typeof createAssistantSpeechRecognition> | null>(null);

  const rtl = language === 'ar';

  const COPY: Record<
    LanguageCode,
    {
      title: string;
      desc: string;
      placeholder: string;
      image: string;
      ask: string;
      assistant: string;
      sources: string;
      listen: string;
      stop: string;
      speak: string;
      listening: string;
      imageError: string;
      readError: string;
      errors: Record<string, string>;
    }
  > = {
    ar: {
      title: 'مساعد الدراسة الذكي',
      desc: 'اسأله في أي حاجة واقف فيها، أو صوّر المسألة. المساعد يشرح ويتحقق من المصادر عند الحاجة.',
      placeholder: 'مثال: مش فاهم قانون نيوتن الثاني...',
      image: 'صورة',
      ask: 'اسأل',
      assistant: 'المساعد',
      sources: 'مصادر التحقق',
      listen: 'استمع للإجابة',
      stop: 'إيقاف الصوت',
      speak: 'تحدث مع المساعد',
      listening: 'جاري الاستماع...',
      imageError: 'الصورة لازم تكون PNG أو JPG أو WebP وأقل من 3.5MB.',
      readError: 'تعذر قراءة الصورة.',
      errors: {
        not_authenticated: 'سجّل الدخول لاستخدام المساعد الذكي.',
        ai_not_configured: 'المساعد الذكي غير مُفعّل على السيرفر حاليًا.',
        assistant_daily_limit: 'وصلت للحد اليومي للمساعد. جرّب مرة أخرى غدًا.',
        empty_question: 'اكتب سؤالك الأول أو أرفق صورة.',
        image_too_large: 'الصورة كبيرة جدًا. استخدم صورة أصغر من 3.5MB.',
        assistant_provider_error: 'المساعد مشغول حاليًا. جرّب بعد لحظات.',
        assistant_failed: 'حصلت مشكلة أثناء الإجابة. جرّب مرة أخرى.',
      },
    },
    en: {
      title: 'Smart Study Assistant',
      desc: 'Ask what you are stuck on, or send a study image. The assistant explains and checks sources when needed.',
      placeholder: 'Example: I do not understand Newton’s second law...',
      image: 'Image',
      ask: 'Ask',
      assistant: 'Assistant',
      sources: 'Sources used for verification',
      listen: 'Listen',
      stop: 'Stop',
      speak: 'Speak to assistant',
      listening: 'Listening...',
      imageError: 'Use a PNG, JPG, or WebP image smaller than 3.5MB.',
      readError: 'Could not read the image.',
      errors: {
        not_authenticated: 'Sign in to use the Study Assistant.',
        ai_not_configured: 'The Study Assistant is not configured on the server yet.',
        assistant_daily_limit: 'You reached today’s assistant limit. Try again tomorrow.',
        empty_question: 'Write a question or attach an image.',
        image_too_large: 'The image is too large. Use an image under 3.5MB.',
        assistant_provider_error: 'The assistant is busy right now. Try again in a moment.',
        assistant_failed: 'Something went wrong while answering. Try again.',
      },
    },
    ja: {
      title: 'スマート学習アシスタント',
      desc: '分からないことを質問したり、問題の画像を送ったりできます。必要に応じて情報源を確認します。',
      placeholder: '例：ニュートンの第2法則がよく分かりません…',
      image: '画像',
      ask: '質問する',
      assistant: 'アシスタント',
      sources: '確認に使用した情報源',
      listen: '回答を聞く',
      stop: '停止',
      speak: 'アシスタントに話す',
      listening: '聞き取り中...',
      imageError: 'PNG、JPG、WebPで3.5MB未満の画像を使用してください。',
      readError: '画像を読み込めませんでした。',
      errors: {
        not_authenticated: 'アシスタントを使うにはログインしてください。',
        ai_not_configured: 'アシスタントは現在サーバーで設定されていません。',
        assistant_daily_limit: '本日の利用上限に達しました。明日もう一度お試しください。',
        empty_question: '質問を書くか画像を添付してください。',
        image_too_large: '画像が大きすぎます。3.5MB未満にしてください。',
        assistant_provider_error: 'アシスタントが混雑しています。しばらくしてからお試しください。',
        assistant_failed: '回答中に問題が発生しました。もう一度お試しください。',
      },
    },
    fr: {
      title: 'Assistant d’étude intelligent',
      desc: 'Posez une question ou envoyez une image de cours. L’assistant explique et vérifie les sources si nécessaire.',
      placeholder: 'Exemple : je ne comprends pas la deuxième loi de Newton…',
      image: 'Image',
      ask: 'Demander',
      assistant: 'Assistant',
      sources: 'Sources utilisées pour vérification',
      listen: 'Écouter',
      stop: 'Arrêter',
      speak: 'Parler à l’assistant',
      listening: 'Écoute...',
      imageError: 'Utilisez une image PNG, JPG ou WebP de moins de 3,5 Mo.',
      readError: 'Impossible de lire l’image.',
      errors: {
        not_authenticated: 'Connectez-vous pour utiliser l’assistant.',
        ai_not_configured: 'L’assistant n’est pas encore configuré sur le serveur.',
        assistant_daily_limit: 'Vous avez atteint la limite quotidienne. Réessayez demain.',
        empty_question: 'Écrivez une question ou joignez une image.',
        image_too_large: 'L’image est trop grande. Utilisez moins de 3,5 Mo.',
        assistant_provider_error: 'L’assistant est occupé. Réessayez dans un instant.',
        assistant_failed: 'Une erreur est survenue. Réessayez.',
      },
    },
    de: {
      title: 'Intelligenter Lernassistent',
      desc: 'Frage, wobei du festhängst, oder sende ein Lernbild. Der Assistent erklärt und prüft Quellen bei Bedarf.',
      placeholder: 'Beispiel: Ich verstehe Newtons zweites Gesetz nicht…',
      image: 'Bild',
      ask: 'Fragen',
      assistant: 'Assistent',
      sources: 'Zur Prüfung verwendete Quellen',
      listen: 'Antwort anhören',
      stop: 'Stopp',
      speak: 'Mit dem Assistenten sprechen',
      listening: 'Hört zu...',
      imageError: 'Nutze PNG, JPG oder WebP unter 3,5 MB.',
      readError: 'Das Bild konnte nicht gelesen werden.',
      errors: {
        not_authenticated: 'Melde dich an, um den Assistenten zu nutzen.',
        ai_not_configured: 'Der Assistent ist auf dem Server noch nicht eingerichtet.',
        assistant_daily_limit: 'Das Tageslimit ist erreicht. Versuche es morgen erneut.',
        empty_question: 'Schreibe eine Frage oder füge ein Bild hinzu.',
        image_too_large: 'Das Bild ist zu groß. Nutze weniger als 3,5 MB.',
        assistant_provider_error: 'Der Assistent ist gerade ausgelastet. Versuche es gleich erneut.',
        assistant_failed: 'Beim Antworten ist ein Fehler aufgetreten. Versuche es erneut.',
      },
    },
  };

  const copy = COPY[language];

  useEffect(() => {
    setVoiceSupported(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setIsListening(false);

    stopAssistantSpeech();
    setIsSpeaking(false);
  }, [language]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      stopAssistantSpeech();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const interval = window.setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        setIsSpeaking(false);
      }
    }, 300);

    return () => window.clearInterval(interval);
  }, []);

  const pickImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (
      !/^image\/(png|jpeg|jpg|webp|gif)$/i.test(file.type) ||
      file.size > 3_500_000
    ) {
      setError(copy.imageError);
      return;
    }

    try {
      setImage({
        file,
        data: await fileToBase64(file),
      });
      setError('');
    } catch {
      setError(copy.readError);
    }
  };

  const toggleListening = () => {
    if (!voiceSupported || busy) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = createAssistantSpeechRecognition(
      language,
      (text) => {
        if (!text.trim()) return;

        setQuestion((current) => {
          const separator = current.trim() ? ' ' : '';
          return `${current}${separator}${text}`.slice(0, 4000);
        });

        setError('');
      },
      () => {
        setIsListening(true);
        setError('');
      },
      () => {
        setIsListening(false);
        recognitionRef.current = null;
      },
      (code) => {
        setIsListening(false);
        recognitionRef.current = null;

        if (code !== 'aborted' && code !== 'no-speech') {
          setError(
            language === 'ar'
              ? 'تعذر استخدام الميكروفون. تأكد من السماح بالوصول للميكروفون.'
              : 'Could not use the microphone. Check your microphone permission.',
          );
        }
      },
    );

    if (!recognition) return;

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if ((!question.trim() && !image) || busy) return;

    setBusy(true);
    setError('');
    stopAssistantSpeech();
    setIsSpeaking(false);

    try {
      const next = await askStudyAssistant(
        question || copy.placeholder,
        language,
        image
          ? {
              mimeType: image.file.type,
              data: image.data,
              name: image.file.name,
            }
          : undefined,
      );

      setResult(next);
      setQuestion('');
      setImage(null);

      const started = speakAssistantAnswer(next.answer, language);
      setIsSpeaking(started);
    } catch (err) {
      const code = err instanceof Error ? err.message : 'assistant_failed';
      setError(copy.errors[code] ?? copy.errors.assistant_failed);
    } finally {
      setBusy(false);
    }
  };

  const readAnswer = () => {
    if (!result?.answer) return;

    const started = speakAssistantAnswer(result.answer, language);
    setIsSpeaking(started);
  };

  const stopReading = () => {
    stopAssistantSpeech();
    setIsSpeaking(false);
  };

  return (
    <section className="w-full rounded-2xl glass border border-neon-emerald/15 p-5 md:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl grid place-items-center bg-neon-emerald/10 border border-neon-emerald/20 shrink-0">
          <Brain className="w-5 h-5 text-neon-emerald" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-neon-emerald">
            <h2 className="font-display font-bold text-lg">{copy.title}</h2>
            <Sparkles className="w-4 h-4 text-neon-violet" />
          </div>

          <p className="text-xs text-gray-500 mt-1">{copy.desc}</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, 4000))}
              placeholder={isListening ? copy.listening : copy.placeholder}
              className="w-full rounded-xl bg-black/10 border border-white/10 px-4 py-3 pr-12 text-sm text-gray-200 outline-none focus:border-neon-emerald/40"
            />

            {voiceSupported && (
              <button
                type="button"
                onClick={toggleListening}
                disabled={busy}
                title={isListening ? copy.stop : copy.speak}
                aria-label={isListening ? copy.stop : copy.speak}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg grid place-items-center transition ${
                  isListening
                    ? 'bg-neon-rose/15 text-neon-rose border border-neon-rose/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:text-neon-cyan'
                } disabled:opacity-40`}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 border border-white/10 bg-white/5 text-[var(--sq-heading)] text-sm font-bold"
          >
            <ImagePlus className="w-4 h-4" />
            {copy.image}
          </button>

          <button
            type="submit"
            disabled={busy || (!question.trim() && !image)}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 border border-neon-emerald/30 bg-neon-emerald/10 text-neon-emerald text-sm font-bold disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {copy.ask}
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={pickImage}
        />

        {image && (
          <div className="flex items-center gap-2 rounded-xl border border-neon-cyan/15 bg-neon-cyan/5 px-3 py-2 text-xs">
            <Paperclip className="w-3.5 h-3.5 text-neon-cyan" />
            <span className="truncate flex-1">{image.file.name}</span>

            <button
              type="button"
              onClick={() => setImage(null)}
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </form>

      {error && (
        <p className="text-xs text-neon-rose mt-3" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.03] p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-[10px] uppercase tracking-wider text-neon-cyan font-black">
              {copy.assistant}
            </p>

            <div className="flex items-center gap-1.5">
              {isSpeaking ? (
                <button
                  type="button"
                  onClick={stopReading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neon-rose/20 bg-neon-rose/10 px-2.5 py-1.5 text-[10px] font-bold text-neon-rose"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  {copy.stop}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={readAnswer}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neon-cyan/20 bg-neon-cyan/10 px-2.5 py-1.5 text-[10px] font-bold text-neon-cyan"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {copy.listen}
                </button>
              )}
            </div>
          </div>

          <div
            dir={rtl ? 'rtl' : 'ltr'}
            className="text-sm leading-7 text-[var(--sq-heading)] whitespace-pre-wrap"
          >
            {result.answer}
          </div>

          {result.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-[10px] font-black text-neon-violet mb-2">
                {copy.sources}
              </p>

              <div className="flex flex-wrap gap-2">
                {result.sources.map((source, index) => (
                  <a
                    key={`${source.uri}-${index}`}
                    href={source.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-neon-cyan hover:bg-white/5"
                  >
                    {source.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
