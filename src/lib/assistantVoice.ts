import type { LanguageCode } from '@/lib/i18n';

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<{
      isFinal: boolean;
      0: { transcript: string };
    }>;
  }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;

  const browserWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return (
    browserWindow.SpeechRecognition ??
    browserWindow.webkitSpeechRecognition ??
    null
  );
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

export function speechLanguage(language: LanguageCode): string {
  switch (language) {
    case 'ar':
      return 'ar-EG';
    case 'ja':
      return 'ja-JP';
    case 'de':
      return 'de-DE';
    case 'fr':
      return 'fr-FR';
    default:
      return 'en-US';
  }
}

export function createAssistantSpeechRecognition(
  language: LanguageCode,
  onTranscript: (text: string, isFinal: boolean) => void,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: string) => void,
): SpeechRecognitionInstance | null {
  const Constructor = getSpeechRecognitionConstructor();
  if (!Constructor) return null;

  const recognition = new Constructor();

  recognition.lang = speechLanguage(language);
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => {
    onStart?.();
  };

  recognition.onend = () => {
    onEnd?.();
  };

  recognition.onerror = (event) => {
    onError?.(event.error ?? 'speech_recognition_error');
  };

  recognition.onresult = (event) => {
    for (
      let index = event.resultIndex;
      index < event.results.length;
      index += 1
    ) {
      const result = event.results[index];

      if (!result.isFinal) continue;

      const transcript = result[0]?.transcript?.trim() ?? '';

      if (transcript) {
        onTranscript(transcript, true);
      }
    }
  };

  return recognition;
}

function cleanTextForSpeech(text: string): string {
  return text
    // Markdown links: [text](https://...)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

    // URLs
    .replace(/https?:\/\/\S+/gi, '')

    // Code blocks
    .replace(/```[\s\S]*?```/g, '')

    // Inline code
    .replace(/`([^`]+)`/g, '$1')

    // Bold / italic Markdown
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, '$1')

    // Markdown headings
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')

    // Bullet points
    .replace(/^\s*[-*+]\s+/gm, '')

    // Numbered list markers
    .replace(/^\s*\d+[.)]\s+/gm, '')

    // Horizontal rules
    .replace(/^\s*[-_*]{3,}\s*$/gm, '')

    // Common decorative separators
    .replace(/[•●▪◦]/g, ' ')

    // Repeated punctuation / formatting symbols
    .replace(/([~^#*_=`|\\])+/g, ' ')

    // Excessive whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')

    .trim();
}

export function speakAssistantAnswer(
  text: string,
  language: LanguageCode,
): boolean {
  if (
    typeof window === 'undefined' ||
    !('speechSynthesis' in window) ||
    !text.trim()
  ) {
    return false;
  }

  const cleanText = cleanTextForSpeech(text);

  if (!cleanText) return false;

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = speechLanguage(language);
    utterance.rate = language === 'ar' ? 0.95 : 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);

    return true;
  } catch {
    return false;
  }
}

export function stopAssistantSpeech(): void {
  if (
    typeof window === 'undefined' ||
    !('speechSynthesis' in window)
  ) {
    return;
  }

  try {
    window.speechSynthesis.cancel();
  } catch {
    // Speech is best-effort.
  }
}
