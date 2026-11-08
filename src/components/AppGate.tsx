import AccountMenu from '@/components/AccountMenu';
import type { TranslationKey } from '@/lib/i18n';

type Props = {
  isLoading: boolean;
  loadingLabel: string;
  t: (key: TranslationKey) => string;
};

export default function AppGate({ isLoading, loadingLabel, t }: Props) {
  if (isLoading) {
    return (
      <div className="studyquest-app min-h-screen overflow-hidden bg-ink-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
          <div className="w-12 h-12 rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan animate-spin" aria-hidden="true" />
          <p className="text-sm text-gray-500 font-mono">{loadingLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="studyquest-app min-h-screen bg-ink-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 w-20 h-20 rounded-3xl border border-neon-cyan/30 bg-neon-cyan/10 flex items-center justify-center shadow-2xl" aria-hidden="true">
          <span className="font-display font-black text-3xl text-neon-cyan">SQ</span>
        </div>
        <h1 className="font-display text-3xl font-black text-white">StudyQuest</h1>
        <p className="mt-2 text-sm text-gray-400">Sign in or create your account to continue. Your progress will be saved to your account.</p>
        <div className="mt-6 flex justify-center">
          <AccountMenu t={t} required />
        </div>
      </div>
    </div>
  );
}
