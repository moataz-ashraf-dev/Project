
interface Props {
  isSyncing: boolean;
  isOnline: boolean;
  syncingLabel: string;
  offlineLabel: string;
  rewardToast: string | null;
  rewardToastIsError: boolean;
  language: string;
}

export default function AppStatus({ isSyncing, isOnline, syncingLabel, offlineLabel, rewardToast, rewardToastIsError, language }: Props) {
  const direction = language === 'ar' ? 'rtl' : 'ltr';
  return (
    <>
      {(isSyncing || !isOnline) && (
        <div className="fixed top-14 md:top-16 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/10 text-xs">
          {isSyncing ? <><span className="w-3 h-3 rounded-full border border-neon-cyan/40 border-t-neon-cyan animate-spin" /><span className="text-gray-400">{syncingLabel}</span></> : <><span className="w-2 h-2 rounded-full bg-neon-amber animate-pulse" /><span className="text-neon-amber/80">{offlineLabel}</span></>}
        </div>
      )}
      {rewardToast && (
        <div className={`sq-toast sq-toast--standalone ${rewardToastIsError ? 'sq-toast--error' : 'sq-toast--success'}`} dir={direction} role={rewardToastIsError ? 'alert' : 'status'} aria-live={rewardToastIsError ? 'assertive' : 'polite'}>
          <span className="sq-toast__icon" aria-hidden="true">{rewardToastIsError ? '!' : '✓'}</span>
          <span className="sq-toast__message">{rewardToast}</span>
        </div>
      )}
    </>
  );
}
