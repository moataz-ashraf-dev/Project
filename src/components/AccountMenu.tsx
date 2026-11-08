import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { User, LogOut, Mail, Lock, X, Loader2, KeyRound } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/auth/useAuth';
import type { TranslationKey } from '@/lib/i18n';

type Props = {
  t: (key: TranslationKey) => string;
  required?: boolean;
};

type Mode = 'signin' | 'signup' | 'resetRequest' | 'resetPassword';
type Status = 'idle' | 'submitting' | 'success' | 'error';

/** Translate a Supabase auth error into a safe, user-friendly message. */
function mapAuthError(message: string, t: (key: TranslationKey) => string): string {
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) return t('authErrorInvalidCredentials');
  if (lower.includes('email not confirmed')) return t('authErrorEmailNotConfirmed');
  if (lower.includes('already registered') || lower.includes('already exists') || lower.includes('user already')) {
    return t('authErrorEmailInUse');
  }
  if (lower.includes('password') && (lower.includes('at least') || lower.includes('6 characters'))) {
    return t('authErrorPasswordTooShort');
  }
  if (lower.includes('email') && (lower.includes('invalid') || lower.includes('valid'))) {
    return t('authErrorInvalidEmail');
  }
  if (lower.includes('expired') || lower.includes('invalid') && lower.includes('token')) {
    return t('authErrorResetExpired');
  }

  return t('authErrorGeneric');
}

function getPasswordResetRedirectUrl(): string {
  const configured = String(import.meta.env.VITE_PASSWORD_RESET_REDIRECT_URL ?? '').trim();
  if (configured) return configured;
  return `${window.location.origin}/`;
}

// Supabase can consume the recovery URL before React subscribes to auth events.
// Capture the recovery intent immediately so the reset form still opens.
const recoveryUrlDetected = (() => {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return hash.includes('type=recovery') || params.get('type') === 'recovery';
})();

export default function AccountMenu({ t, required = false }: Props) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const isSubmitting = status === 'submitting';

  useEffect(() => {
    if (required && !loading && !user) {
      setOpen(true);
    }
  }, [required, loading, user]);

  useEffect(() => {
    let cancelled = false;

    const openRecoveryForm = (recoveryEmail?: string | null) => {
      if (cancelled) return;
      if (recoveryEmail) setEmail(recoveryEmail);
      setMode('resetPassword');
      setStatus('idle');
      setMessage('');
      setPassword('');
      setConfirmPassword('');
      setOpen(true);
    };

    // Handle the normal Supabase PASSWORD_RECOVERY event.
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        openRecoveryForm(nextSession?.user?.email);
      }
    });

    // Fallback for localhost/dev URLs where the SDK may consume the recovery
    // hash before this component subscribes to the auth event.
    if (recoveryUrlDetected) {
      supabase.auth.getSession().then(({ data: sessionData }) => {
        if (sessionData.session) openRecoveryForm(sessionData.session.user.email);
      }).catch(() => {
        // The SDK will surface any invalid/expired recovery token through its auth flow.
      });
    }

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const openModal = () => {
    setStatus('idle');
    setMessage('');
    setMode(user ? 'signin' : 'signin');
    setOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting || (required && !user)) return;
    setOpen(false);
    setStatus('idle');
    setMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setStatus('idle');
    setMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setStatus('submitting');
    setMessage('');

    if (!isSupabaseConfigured) {
      setStatus('error');
      setMessage('Local mode is active. Add your real Supabase Project URL and publishable/anon key to enable accounts and cloud sync.');
      return;
    }

    try {
      if (mode === 'resetRequest') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: getPasswordResetRedirectUrl(),
        });
        if (error) throw error;
        setStatus('success');
        setMessage(t('resetLinkSent'));
        return;
      }

      if (mode === 'resetPassword') {
        if (password !== confirmPassword) {
          setStatus('error');
          setMessage(t('passwordsDoNotMatch'));
          return;
        }

        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;

        setStatus('success');
        setMessage(t('passwordUpdated'));
        setPassword('');
        setConfirmPassword('');
        await supabase.auth.signOut();
        setMode('signin');
        return;
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setStatus('success');
        setMessage(t('authSignUpSuccess'));
        setPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setStatus('success');
        setMessage(t('authSignInSuccess'));
        setPassword('');
        setOpen(false);
      }
    } catch (error) {
      setStatus('error');
      setMessage(mapAuthError(error instanceof Error ? error.message : '', t));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    setStatus('idle');
    setMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : '?';
  const isResetRequest = mode === 'resetRequest';
  const isResetPassword = mode === 'resetPassword';
  const isAuthForm = mode === 'signin' || mode === 'signup';

  return (
    <>
      {loading ? (
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-gray-500"
          aria-hidden="true"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : user ? (
        <button
          type="button"
          onClick={openModal}
          title={user.email ?? t('account')}
          aria-label={t('account')}
          className="flex items-center justify-center w-10 h-10 rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan font-display font-bold text-sm hover:bg-neon-cyan/20 transition-all duration-200"
        >
          {initial}
        </button>
      ) : (
        <button
          type="button"
          onClick={openModal}
          aria-label={t('signIn')}
          className="studyquest-control flex items-center gap-2 h-10 px-2.5 lg:px-3 rounded-xl border text-xs font-semibold transition-all duration-200"
        >
          <User className="w-4 h-4" />
          <span className="hidden lg:inline">{t('signIn')}</span>
        </button>
      )}

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative w-full max-w-sm rounded-2xl glass border border-white/10 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                    {isResetRequest || isResetPassword ? (
                      <KeyRound className="w-5 h-5 text-neon-cyan" />
                    ) : (
                      <User className="w-5 h-5 text-neon-cyan" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-display font-bold text-sm text-gray-200">
                      {isResetRequest || isResetPassword ? t('resetPasswordTitle') : t('account')}
                    </span>
                    <span className="text-[11px] text-gray-500 truncate">
                      {user ? `${t('signedInAs')} ${user.email ?? ''}` : t('guest')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label={t('close')}
                  className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {user && !isResetPassword ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-neon-rose/30 bg-neon-rose/10 text-neon-rose text-sm font-bold hover:bg-neon-rose/20 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  {t('signOut')}
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {isAuthForm && (
                    <div className="inline-flex p-1 rounded-xl glass border border-white/10 self-center">
                      <button
                        type="button"
                        onClick={() => switchMode('signin')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                          mode === 'signin' ? 'bg-neon-cyan/10 text-neon-cyan' : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {t('signIn')}
                      </button>
                      <button
                        type="button"
                        onClick={() => switchMode('signup')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                          mode === 'signup' ? 'bg-neon-emerald/10 text-neon-emerald' : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {t('signUp')}
                      </button>
                    </div>
                  )}

                  {isResetRequest && (
                    <p className="text-xs leading-5 text-gray-400">{t('resetPasswordBody')}</p>
                  )}

                  {isResetPassword && (
                    <p className="text-xs leading-5 text-gray-400">{t('resetPasswordTitle')}</p>
                  )}

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('email')}</span>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 w-4 h-4 text-gray-600 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required={!isResetPassword}
                        autoComplete="email"
                        disabled={isResetPassword}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl glass border border-white/10 text-sm text-gray-200 bg-transparent outline-none focus:border-neon-cyan/40 transition-colors disabled:opacity-60"
                        placeholder="you@example.com"
                      />
                    </div>
                  </label>

                  {!isResetRequest && (
                    <>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {isResetPassword ? t('newPassword') : t('password')}
                        </span>
                        <div className="relative flex items-center">
                          <Lock className="absolute left-3 w-4 h-4 text-gray-600 pointer-events-none" />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete={isResetPassword ? 'new-password' : mode === 'signup' ? 'new-password' : 'current-password'}
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl glass border border-white/10 text-sm text-gray-200 bg-transparent outline-none focus:border-neon-cyan/40 transition-colors"
                            placeholder="••••••••"
                          />
                        </div>
                      </label>

                      {isResetPassword && (
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('confirmPassword')}</span>
                          <div className="relative flex items-center">
                            <Lock className="absolute left-3 w-4 h-4 text-gray-600 pointer-events-none" />
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                              minLength={6}
                              autoComplete="new-password"
                              className="w-full pl-10 pr-3 py-2.5 rounded-xl glass border border-white/10 text-sm text-gray-200 bg-transparent outline-none focus:border-neon-cyan/40 transition-colors"
                              placeholder="••••••••"
                            />
                          </div>
                        </label>
                      )}
                    </>
                  )}

                  {isAuthForm && mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => switchMode('resetRequest')}
                      className="self-end text-xs font-semibold text-neon-cyan hover:text-white transition-colors"
                    >
                      {t('forgotPassword')}
                    </button>
                  )}

                  {message && (
                    <p
                      className={`text-xs font-medium ${status === 'error' ? 'text-neon-rose' : 'text-neon-emerald'}`}
                      role={status === 'error' ? 'alert' : 'status'}
                    >
                      {message}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan text-sm font-bold hover:bg-neon-cyan/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('authSubmitting')}
                      </>
                    ) : isResetRequest ? (
                      t('sendResetLink')
                    ) : isResetPassword ? (
                      t('updatePassword')
                    ) : mode === 'signup' ? (
                      t('createAccount')
                    ) : (
                      t('signIn')
                    )}
                  </button>

                  {(isResetRequest || isResetPassword) && (
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-200 transition-colors"
                    >
                      {t('backToSignIn')}
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
