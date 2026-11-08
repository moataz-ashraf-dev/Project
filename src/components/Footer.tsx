import { HelpCircle, Shield, Mail, Heart, X, BookOpen, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { TranslationKey } from '@/lib/i18n';

type Props = {
  t: (key: TranslationKey) => string;
  language?: string;
};

const MOTIVATIONAL_KEYS: TranslationKey[] = ['keepGrinding', 'everyMinute', 'knowledgePower', 'stayLocked', 'petBelieves'];

const CONTENT = {
  en: {
    helpTitle: 'StudyQuest Help Center', helpBody: 'Study with the timer, organize your subjects, complete verified sessions, and earn Coins as you make progress. Your study progress and account can sync securely when cloud sync is available.',
    privacyTitle: 'Privacy', privacyBody: 'StudyQuest may store study and account information to provide your profile, progress, rewards, and cloud sync. Payment information is handled by our payment provider; StudyQuest does not display or store your full card details.',
    contactTitle: 'Contact StudyQuest', contactBody: 'Need help? Contact the StudyQuest support team using one of the available channels below. If you report a problem, include a short description of what happened so we can help you faster.',
    close: 'Close', support: 'Support email', notConfigured: 'Support email is not configured yet.'
  },
  ar: {
    helpTitle: 'مركز مساعدة StudyQuest', helpBody: 'استخدم مؤقت المذاكرة، ونظّم المواد، وأكمل جلسات المذاكرة الموثقة لتحصل على الكوينز مع تقدمك. يمكن مزامنة بيانات حسابك وتقدمك سحابيًا عند توفر المزامنة.',
    privacyTitle: 'الخصوصية', privacyBody: 'قد يحتفظ StudyQuest ببيانات المذاكرة وبيانات الحساب اللازمة لتشغيل ملفك الشخصي وتقدمك والمكافآت والمزامنة السحابية. بيانات الدفع الحساسة تتم معالجتها بواسطة مزود الدفع، ولا يعرض StudyQuest بيانات بطاقتك الكاملة أو يخزنها.',
    contactTitle: 'تواصل مع StudyQuest', contactBody: 'لو محتاج مساعدة، تواصل مع فريق دعم StudyQuest من إحدى وسائل التواصل المتاحة بالأسفل. ولو فيه مشكلة، اكتب وصفًا مختصرًا لما حدث عشان نقدر نساعدك أسرع.',
    close: 'إغلاق', support: 'بريد الدعم', notConfigured: 'لم يتم إعداد بريد الدعم بعد.'
  },
  fr: {
    helpTitle: 'Centre d’aide StudyQuest', helpBody: 'Utilisez le minuteur, organisez vos matières et terminez des sessions vérifiées pour gagner des pièces et progresser. La synchronisation du compte peut être utilisée lorsque le cloud est disponible.',
    privacyTitle: 'Confidentialité', privacyBody: 'StudyQuest peut conserver les données nécessaires à votre profil, votre progression, vos récompenses et la synchronisation. Les informations de paiement sensibles sont traitées par notre prestataire de paiement.',
    contactTitle: 'Contacter StudyQuest', contactBody: 'Besoin d’aide ? Contactez l’équipe StudyQuest via l’un des canaux disponibles ci-dessous. Décrivez brièvement le problème pour obtenir une aide plus rapide.',
    close: 'Fermer', support: 'E-mail du support', notConfigured: 'L’e-mail du support n’est pas encore configuré.'
  },
  de: {
    helpTitle: 'StudyQuest Hilfe', helpBody: 'Nutze den Lerntimer, organisiere deine Fächer und schließe verifizierte Sessions ab, um Coins zu verdienen und Fortschritte zu machen. Die Kontosynchronisierung ist verfügbar, wenn der Cloud-Dienst aktiv ist.',
    privacyTitle: 'Datenschutz', privacyBody: 'StudyQuest kann die für Profil, Fortschritt, Belohnungen und Synchronisierung erforderlichen Daten speichern. Sensible Zahlungsdaten werden von unserem Zahlungsanbieter verarbeitet.',
    contactTitle: 'StudyQuest kontaktieren', contactBody: 'Brauchst du Hilfe? Kontaktiere das StudyQuest-Supportteam über einen der unten verfügbaren Kanäle. Beschreibe das Problem kurz, damit wir schneller helfen können.',
    close: 'Schließen', support: 'Support-E-Mail', notConfigured: 'Noch keine Support-E-Mail konfiguriert.'
  },
  ja: {
    helpTitle: 'StudyQuest ヘルプ', helpBody: '学習タイマーで科目を整理し、認証済みセッションを完了するとコインを獲得できます。クラウド同期が利用できる場合は、アカウントの進捗も同期されます。',
    privacyTitle: 'プライバシー', privacyBody: 'StudyQuest はプロフィール、進捗、報酬、同期に必要なデータを保存する場合があります。決済の機密情報は決済事業者によって処理されます。',
    contactTitle: 'StudyQuest に連絡', contactBody: 'サポートが必要な場合は、下記の連絡手段からStudyQuestサポートへご連絡ください。問題の内容を簡単に書いていただくと、より早く対応できます。',
    close: '閉じる', support: 'サポートメール', notConfigured: 'サポートメールはまだ設定されていません。'
  }
} as const;

export default function Footer({ t, language = 'en' }: Props) {
  const [panel, setPanel] = useState<'help' | 'privacy' | 'contact' | null>(null);
  const copy = CONTENT[language as keyof typeof CONTENT] ?? CONTENT.en;
  const [cloudContact, setCloudContact] = useState({email:'',whatsapp:'',telegram:'',message:''});
  useEffect(() => { if(!isSupabaseConfigured) return; let cancelled=false; supabase.from('site_settings').select('key,value').then(({data})=>{ if(cancelled)return; const next={email:'',whatsapp:'',telegram:'',message:''}; (data??[]).forEach(x=>{if(x.key==='support_email')next.email=x.value;if(x.key==='support_whatsapp')next.whatsapp=x.value;if(x.key==='support_telegram')next.telegram=x.value;if(x.key==='support_message')next.message=x.value}); setCloudContact(next); }); return ()=>{cancelled=true}; }, []);
  const supportEmail = cloudContact.email || (typeof import.meta !== 'undefined' ? import.meta.env.VITE_SUPPORT_EMAIL : '');

  const open = (next: 'help' | 'privacy' | 'contact') => setPanel(next);

  return (
    <>
      <footer className="app-footer hidden md:block mt-10 lg:pl-[18rem]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="app-footer__inner max-w-[1440px] mx-auto px-5 md:px-8 py-5">
          <div className="app-footer__brand">
            <span className="app-footer__mark" aria-hidden="true"><BookOpen className="w-4 h-4" /></span>
            <div className="app-footer__brand-copy">
              <strong>StudyQuest</strong>
              <span>{t('madeWith')} <Heart className="app-footer__heart" /></span>
            </div>
          </div>
          <p className="app-footer__quote">
            <span className="app-footer__quote-dot" aria-hidden="true" />
            {t(MOTIVATIONAL_KEYS[Math.floor(Date.now() / 5000) % MOTIVATIONAL_KEYS.length])}
          </p>
          <nav className="app-footer__links" aria-label={language === 'ar' ? 'روابط المساعدة' : 'Help and policies'}>
            <button type="button" onClick={() => open('help')}><HelpCircle className="w-4 h-4" /> {t('help')}</button>
            <button type="button" onClick={() => open('privacy')}><Shield className="w-4 h-4" /> {t('privacy')}</button>
            <button type="button" onClick={() => open('contact')}><Mail className="w-4 h-4" /> {t('contact')}</button>
          </nav>
        </div>
      </footer>

      {panel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="footer-panel-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setPanel(null); }}>
          <div className="w-full max-w-xl rounded-3xl border border-neon-cyan/20 bg-[#071426] shadow-[0_25px_100px_rgba(0,0,0,.55)] overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                {panel === 'help' ? <BookOpen className="w-5 h-5 text-neon-cyan" /> : panel === 'privacy' ? <Shield className="w-5 h-5 text-neon-emerald" /> : <MessageCircle className="w-5 h-5 text-neon-amber" />}
                <h2 id="footer-panel-title" className="text-lg font-black text-white">{copy[`${panel}Title` as keyof typeof copy]}</h2>
              </div>
              <button type="button" onClick={() => setPanel(null)} aria-label={copy.close} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-6 space-y-5">
              <p className="text-sm leading-7 text-gray-300">{copy[`${panel}Body` as keyof typeof copy]}</p>
              {panel === 'contact' && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">{copy.support}</p>
                  {supportEmail ? (
                    <div className="space-y-2"><a className="text-neon-cyan hover:underline font-semibold" href={`mailto:${supportEmail}`}>{supportEmail}</a>{cloudContact.whatsapp && <a className="block text-neon-emerald hover:underline font-semibold" href={cloudContact.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>}{cloudContact.telegram && <a className="block text-neon-cyan hover:underline font-semibold" href={cloudContact.telegram} target="_blank" rel="noreferrer">Telegram</a>}{cloudContact.message && <p className="text-xs text-gray-400">{cloudContact.message}</p>}</div>
                  ) : (
                    <p className="text-sm text-gray-400">{copy.notConfigured}</p>
                  )}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-end">
              <button type="button" onClick={() => setPanel(null)} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold">{copy.close}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
