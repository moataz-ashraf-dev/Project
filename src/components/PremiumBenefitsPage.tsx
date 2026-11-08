import { Crown, Sparkles } from 'lucide-react';
import type { LanguageCode } from '@/lib/i18n';
import PremiumLearningHub from './PremiumLearningHub';

type Props = { language: LanguageCode; premiumActive: boolean; userId?: string };

const COPY: Record<LanguageCode, { title: string; body: string }> = {
  ar: { title: 'مميزات البرايم', body: 'مساحة مخصصة لتفعيل أدواتك الدراسية ومتابعة تقدمك.' },
  en: { title: 'Premium benefits', body: 'Your dedicated space for using study tools and tracking progress.' },
  de: { title: 'Premium-Vorteile', body: 'Dein Bereich für Lernwerkzeuge und deinen persönlichen Fortschritt.' },
  fr: { title: 'Avantages Premium', body: 'Ton espace dédié aux outils d’étude et au suivi de tes progrès.' },
  ja: { title: 'Premium 特典', body: '学習ツールを使い、進捗を確認するための専用ページです。' },
};

export default function PremiumBenefitsPage({ language, premiumActive, userId }: Props) {
  const copy = COPY[language];

  return (
    <div className="premium-benefits-page flex flex-col gap-6 animate-fade-in pb-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="premium-benefits-hero">
        <div className="premium-benefits-mark"><Crown aria-hidden="true" /></div>
        <div>
          <span><Sparkles size={15} /> StudyQuest Premium</span>
          <h1>{copy.title}</h1>
          <p>{copy.body}</p>
        </div>
      </header>
      <PremiumLearningHub language={language} premiumActive={premiumActive} userId={userId} />
    </div>
  );
}

