import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { store } from '@/lib/store';
import { focusTimer } from '@/lib/focusTimer';
import type { Subject, AppState, StreakDay } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import PomodoroTimer from '@/components/PomodoroTimer';
import SubjectGrid from '@/components/SubjectGrid';
import AmbientSoundWidget, { type AmbientValue } from '@/components/AmbientSound';
import StudyAudio from '@/components/StudyAudio';
import StreakBoard from '@/components/StreakBoard';
import PetCard from '@/components/PetCard';

import AppGate from '@/components/AppGate';
import AppStatus from '@/components/AppStatus';
import StudyTaskDialogs from '@/components/StudyTaskDialogs';

import { completePlanTask, deletePlanTask, getDailyAIStatus, loadPlan, localCalendarDate, markPlanTaskCompletedLocally, setTaskStatus, type DailyAIStatus, type StudyPlan } from '@/lib/planner';
import { LANGUAGES, type LanguageCode, type ThemeMode, type TranslationKey, translateSubjectName, TRANSLATIONS } from '@/lib/i18n';
import { taskDialogI18n } from '@/lib/taskDialogI18n';
import { PET_CATALOG, profileStore } from '@/lib/profileStore';
import { getPetVisual } from '@/lib/petAssets';
import { announceStudyTimer, notifyPlanOverdue, requestStudyNotifications } from '@/lib/notifications';
import { cancelStudyCompletionNotification, requestMobileNotificationPermission, scheduleStudyTimerNotifications } from '@/lib/mobile';

const ProfilePage = lazy(() => import('@/components/ProfilePage'));
const Leaderboard = lazy(() => import('@/components/Leaderboard'));
const TomorrowPlanner = lazy(() => import('@/components/TomorrowPlanner'));
const StudyAssistant = lazy(() => import('@/components/StudyAssistant'));
const AdminDashboard = lazy(() => import('@/components/AdminDashboard'));
const PremiumPage = lazy(() => import('@/components/PremiumPage'));
const PremiumBenefitsPage = lazy(() => import('@/components/PremiumBenefitsPage'));

const MOTIVATIONAL_QUOTES = [
  'Keep grinding, hero! Your pet is proud of you!',
  'Every minute counts. You are building your future!',
  'Knowledge is power. Claim it, one session at a time!',
  'Stay locked in. The streak gods are watching!',
  'Your pet believes in you. Do not let it down!',
];

const THEME_STORAGE_KEY = 'studyquest-theme';
const LANGUAGE_STORAGE_KEY = 'studyquest-language';

/**
 * Complete offline UI dictionary.
 * The translation layer intentionally lives in App.tsx so no API, package,
 * remote font, icon, or translation service is required at runtime.
 */
const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'ice' ? stored : 'ice';
};

const getStoredLanguage = (): LanguageCode => {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return LANGUAGES.some((language) => language.code === stored) ? (stored as LanguageCode) : 'en';
};

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [streakDays, setStreakDays] = useState<StreakDay[]>([]);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRunning, setIsRunning] = useState(false);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [currentDuration, setCurrentDuration] = useState(25);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const [language, setLanguage] = useState<LanguageCode>(getStoredLanguage);
  const dialogText = taskDialogI18n[language];
  const [tomorrowPlan, setTomorrowPlan] = useState<StudyPlan | null>(null);
  const [planDateLabel, setPlanDateLabel] = useState<'today' | 'tomorrow'>('tomorrow');
  const [equippedPetId, setEquippedPetId] = useState(() => profileStore.load().equippedPetId || '');
  const [activePlanTaskId, setActivePlanTaskId] = useState<string | null>(null);
  const [dailyAIStatus, setDailyAIStatus] = useState<DailyAIStatus | null>(null);
  const [rewardToast, setRewardToast] = useState<string | null>(null);
  const [premiumAccess, setPremiumAccess] = useState(false);

  const rewardToastIsError =
    !!rewardToast &&
    /فشل|تعذر|لم تكتمل|لم يؤكد|خطأ|failed|could not|cannot|not complete|not confirmed|error/i.test(rewardToast);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [switchTaskId, setSwitchTaskId] = useState<string | null>(null);
  const t = useCallback((key: TranslationKey) => TRANSLATIONS[language][key], [language]);
  useEffect(() => {
    if (!premiumAccess && activeTab === 'premium-benefits') setActiveTab('skins');
  }, [activeTab, premiumAccess]);

  useEffect(() => {
    let cancelled = false;
    setPremiumAccess(false);
    if (!user?.id) return () => { cancelled = true; };
    void (async () => {
      try {
        const { data, error } = await supabase.from('premium_entitlements').select('status,current_period_end').eq('user_id', user.id).maybeSingle();
        if (cancelled || error) return;
        setPremiumAccess(data?.status === 'active' && (!data.current_period_end || new Date(data.current_period_end).getTime() > Date.now()));
      } catch {
        if (!cancelled) setPremiumAccess(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const isAdmin = user?.app_metadata?.role === 'admin';
  const markTodayStreak = useCallback(() => {
    const day = store.load().streakDays.find((item) => item.day_of_week === new Date().getDay());
    if (!day) return;
    store.markStreakComplete(day.id);
    const updatedAt = new Date().toISOString();
    setStreakDays((current) => current.map((item) => item.id === day.id
      ? { ...item, completed: true, updated_at: updatedAt }
      : item));
  }, []);

  const finishPendingServerSession = useCallback(async () => {
    if (!navigator.onLine) return;
    const pending = focusTimer.load();
    if (pending.status !== 'paused' || pending.remainingSeconds > 0 || !pending.serverBacked || !pending.operationId) return;
    try {
      const result = await focusTimer.complete();
      if (!result.reward) return;
      markTodayStreak();
      store.setLocalAppState({ coins: result.reward.coins, gems: result.reward.gems });
      setAppState((current) => current ? { ...current, coins: result.reward!.coins, gems: result.reward!.gems } : current);
      if (pending.taskId) {
        markPlanTaskCompletedLocally(pending.taskId);
        const daily = await completePlanTask(pending.taskId, result.reward.session_id);
        if (daily) {
          store.setLocalAppState({ coins: daily.coins });
          setAppState((current) => current ? { ...current, coins: daily.coins } : current);

          if (daily.golden_star_awarded || daily.correct) {
            setRewardToast(daily.golden_star_awarded
              ? (language === 'ar' ? '⭐ نجمة ذهبية! أكملت 26 يومًا صحيحًا' : '⭐ Golden Star! 26 correct days completed')
              : (language === 'ar' ? '🎉 يوم صحيح! +30 كوين' : '🎉 Perfect day! +30 Coins'));
            window.setTimeout(() => setRewardToast(null), 5200);
          }
        }
        const [todayPlan, tomorrowPlan] = await Promise.all([loadPlan(localCalendarDate(0)), loadPlan(localCalendarDate(1))]);
        const updatedPlan = [todayPlan, tomorrowPlan].find((plan) => plan?.tasks?.some((task) => task.id === pending.taskId));
        if (updatedPlan) {
          setTomorrowPlan(updatedPlan);
          setPlanDateLabel(updatedPlan.plan_date === localCalendarDate(0) ? 'today' : 'tomorrow');
          void getDailyAIStatus(updatedPlan.plan_date).then((planStatus) => { if (planStatus) setDailyAIStatus(planStatus); }).catch(() => undefined);
        }
      }
      setRewardToast(language === 'ar' ? 'تمت المزامنة واستلام المكافأة من السيرفر' : 'Synced successfully; server rewards received');
      window.setTimeout(() => setRewardToast(null), 4500);
    } catch (error) {
      console.error('[StudyQuest] pending server session sync failed:', error);
    }
  }, [language, markTodayStreak]);

  // Persist theme + language locally and update the document without any network dependency.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const selectedLanguage = LANGUAGES.find((item) => item.code === language) ?? LANGUAGES[0];
    document.documentElement.lang = selectedLanguage.locale;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  // Rotate motivational quote every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load from localStorage instantly, then try cloud sync
  useEffect(() => {
    const refreshEconomy = () => {
      if (store.isOnline()) {
        store.syncFromCloud()
          .then((synced) => {
            setAppState((prev) =>
              prev
                ? { ...prev, coins: synced.appState.coins, gems: synced.appState.gems }
                : synced.appState,
            );
          })
          .catch(() => {});
        return;
      }

      const local = store.load();
      setAppState((prev) =>
        prev
          ? { ...prev, coins: local.appState.coins, gems: local.appState.gems }
          : local.appState,
      );
    };
    window.addEventListener('studyquest:economy-updated', refreshEconomy);
    return () => window.removeEventListener('studyquest:economy-updated', refreshEconomy);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const local = store.load();
    setEquippedPetId(profileStore.load().equippedPetId);
    setSubjects(local.subjects);
    setStreakDays(local.streakDays);
    setAppState(local.appState);
    const restoredTimer = focusTimer.load();
    const restoredSubjectId =
      restoredTimer.subjectId ?? local.appState.active_subject_id ?? null;

    setActiveSubjectId(restoredSubjectId);
    setActivePlanTaskId(restoredTimer.taskId);

    const restoredDuration =
      restoredTimer.durationSeconds > 0
        ? restoredTimer.durationSeconds / 60
        : local.subjects.find((s) => s.id === restoredSubjectId)?.duration_minutes ?? 25;

    setCurrentDuration(restoredDuration);
    setRemainingSeconds(
      restoredTimer.status === 'idle'
        ? restoredDuration * 60
        : restoredTimer.remainingSeconds,
    );
    setIsRunning(
      restoredTimer.status === 'running' &&
      restoredTimer.remainingSeconds > 0,
    );
    setLoading(false);

    // Attempt background cloud sync if online
    if (navigator.onLine) {
      setIsSyncing(true);
      store.syncFromCloud()
        .then((synced) => {
          setSubjects(synced.subjects);
          setStreakDays(synced.streakDays);
          setAppState(synced.appState);
        })
        .catch(() => {})
        .finally(() => setIsSyncing(false));
    }
  }, [authLoading, user?.id]);

  useEffect(() => {
    const refreshPet = () => setEquippedPetId(profileStore.load().equippedPetId);
    window.addEventListener('studyquest:profile-updated', refreshPet);
    return () => window.removeEventListener('studyquest:profile-updated', refreshPet);
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    if (authLoading) return;

    const handleOnline = () => {
      setIsOnline(true);
      void finishPendingServerSession();
      setIsSyncing(true);
      store.syncFromCloud()
        .then((synced) => {
          setSubjects(synced.subjects);
          setStreakDays(synced.streakDays);
          setAppState(synced.appState);
        })
        .catch(() => {})
        .finally(() => setIsSyncing(false));
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [authLoading, user?.id, finishPendingServerSession]);

  useEffect(() => {
    if (!user || !isOnline) return;
    void finishPendingServerSession();
    let cancelled = false;
    Promise.all([loadPlan(localCalendarDate(0)), loadPlan(localCalendarDate(1))]).then(([today, tomorrow]) => {
      if (cancelled) return;
      const todayHasTasks = Boolean(today?.tasks?.length);
      setTomorrowPlan(todayHasTasks ? today : tomorrow);
      setPlanDateLabel(todayHasTasks ? 'today' : 'tomorrow');
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [user?.id, isOnline, finishPendingServerSession]);

  useEffect(() => {
    if (!user || !isOnline) return;
    getDailyAIStatus(tomorrowPlan?.plan_date ?? localCalendarDate(0)).then(setDailyAIStatus).catch(() => undefined);
  }, [user?.id, isOnline, tomorrowPlan?.plan_date]);

  useEffect(() => {
    if (!tomorrowPlan?.tasks?.length || planDateLabel !== 'today') return;
    const warned = new Set<string>();
    const check = () => {
      const now = Date.now();
      tomorrowPlan.tasks?.forEach((task) => {
        if (task.status !== 'pending' || !task.start_at || warned.has(task.id)) return;
        const start = new Date(task.start_at).getTime();
        if (Number.isFinite(start) && start + 2 * 60_000 < now) {
          warned.add(task.id);
          notifyPlanOverdue(language, task.title);
        }
      });
    };
    check();
    const timer = window.setInterval(check, 60_000);
    return () => window.clearInterval(timer);
  }, [tomorrowPlan, planDateLabel, language]);

  const nextPlanTask = tomorrowPlan?.tasks?.find((task) => task.status === 'pending' || task.status === 'in_progress') ?? null;

  const activeSubject = subjects.find((s) => s.id === activeSubjectId) ?? null;
  const displaySubjects = subjects.map((subject) => ({
    ...subject,
    name: translateSubjectName(subject.name, language),
  }));
  const displayActiveSubject = activeSubject
    ? { ...activeSubject, name: translateSubjectName(activeSubject.name, language) }
    : null;
  const activePlanTask =
    tomorrowPlan?.tasks?.find((task) => task.id === activePlanTaskId) ?? null;
  const timerDisplayName =
    activePlanTask?.title ?? displayActiveSubject?.name ?? null;

  // Update app state locally + queue sync
  const updateAppState = useCallback((updates: Partial<AppState>) => {
    store.saveAppState(updates);
    setAppState((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  // Handle subject selection.
  const handleSelectSubject = useCallback(async (subject: Subject) => {
    if (isRunning) return;

    const timer = focusTimer.load();

    if (timer.status === 'paused') {
      await focusTimer.cancel().catch(() => undefined);
      setActivePlanTaskId(null);
    }

    setActiveSubjectId(subject.id);
    setCurrentDuration(subject.duration_minutes);
    setRemainingSeconds(subject.duration_minutes * 60);
    updateAppState({ active_subject_id: subject.id });
  }, [isRunning, updateAppState]);

  // Handle duration edit
  const handleEditDuration = useCallback((subjectId: string, minutes: number) => {
    const clamped = Math.max(5, Math.min(120, minutes));
    store.updateSubject(subjectId, { duration_minutes: clamped });
    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, duration_minutes: clamped } : s))
    );
    if (subjectId === activeSubjectId) setCurrentDuration(clamped);
  }, [activeSubjectId]);

  // Handle subject name edit
  const handleEditName = useCallback((subjectId: string, name: string) => {
    store.updateSubject(subjectId, { name });
    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, name } : s))
    );
  }, []);

  // Start / resume focus using one absolute end timestamp.
  const handleStart = useCallback(async () => {
    if (!activeSubjectId) return;

    requestStudyNotifications().catch(() => undefined);
    requestMobileNotificationPermission().catch(() => undefined);
    announceStudyTimer(language, 'start');

    try {
      const current = focusTimer.load();

      const next =
        current.status === 'paused' &&
        current.subjectId === activeSubjectId
          ? await focusTimer.resume()
          : await focusTimer.start(
              activeSubjectId,
              currentDuration,
              activePlanTaskId,
            );

      if (activePlanTaskId) {
        await setTaskStatus(activePlanTaskId, 'in_progress').catch(() => undefined);
      }

      setActiveSubjectId(next.subjectId);
      setActivePlanTaskId(next.taskId);
      setCurrentDuration(next.durationSeconds / 60);
      setRemainingSeconds(next.remainingSeconds);
      setIsRunning(next.status === 'running');

      setRewardToast(
        language === 'ar'
          ? 'بدأت جلسة التركيز'
          : 'Focus session started',
      );

      window.setTimeout(() => setRewardToast(null), 2600);

      scheduleStudyTimerNotifications(
        language,
        next.remainingSeconds,
      ).catch(() => undefined);
    } catch {
      setRewardToast(
        language === 'ar'
          ? 'تعذر بدء جلسة التركيز'
          : 'Could not start the focus session',
      );

      window.setTimeout(() => setRewardToast(null), 3200);
    }
  }, [activeSubjectId, currentDuration, activePlanTaskId, language]);

  // Pause focus.
  const handlePause = useCallback(async () => {
    cancelStudyCompletionNotification().catch(() => undefined);

    try {
      const next = await focusTimer.pause();

      setRemainingSeconds(next.remainingSeconds);
      setIsRunning(next.status === 'running');
    } catch {
      setRewardToast(
        language === 'ar'
          ? 'تعذر إيقاف الجلسة مؤقتًا'
          : 'Could not pause the session',
      );

      window.setTimeout(() => setRewardToast(null), 3200);
    }
  }, [language]);

  // Reset / cancel focus with no reward.
  const handleReset = useCallback(async () => {
    cancelStudyCompletionNotification().catch(() => undefined);

    await focusTimer.cancel();

    setIsRunning(false);
    setActivePlanTaskId(null);
    setActiveSubjectId(null);
    setCurrentDuration(25);
    setRemainingSeconds(25 * 60);

    updateAppState({ active_subject_id: null });
  }, [updateAppState]);

  // Complete session.
  const handleComplete = useCallback(async () => {
    const timerBeforeComplete = focusTimer.load();
    const completedSubject = activeSubject ?? subjects.find((subject) => subject.id === timerBeforeComplete.subjectId) ?? null;
    const completedTaskId = activePlanTaskId ?? timerBeforeComplete.taskId;
    if (!completedSubject) {
      setRewardToast(language === 'ar' ? 'تعذر العثور على المادة المرتبطة بالمؤقت' : 'Could not find the subject linked to this timer');
      window.setTimeout(() => setRewardToast(null), 5000);
      return;
    }

    await cancelStudyCompletionNotification();

    try {
      const result = await focusTimer.complete();
      markTodayStreak();

      if (result.reward) {
        const previousCoins = appState?.coins ?? result.reward.coins;
        const rewardCoins = result.reward.coins;

        store.setLocalAppState({
          coins: rewardCoins,
          gems: result.reward.gems,
        });

        setAppState((prev) =>
          prev
            ? {
                ...prev,
                coins: rewardCoins,
                gems: result.reward!.gems,
              }
            : prev,
        );

        const gained = Math.max(0, rewardCoins - previousCoins);
        const awarded = Number(result.reward.coins_awarded ?? gained);

        setRewardToast(
          awarded > 0
            ? `+${awarded} Coins`
            : (
                language === 'ar'
                  ? 'وصلت للحد اليومي للكوينز'
                  : 'Daily Coin cap reached'
              ),
        );

        window.setTimeout(() => setRewardToast(null), 4200);

        if (completedTaskId && result.reward.session_id) {
          markPlanTaskCompletedLocally(completedTaskId);
          setTomorrowPlan((current) => current ? {
            ...current,
            tasks: (current.tasks ?? []).map((task) => task.id === completedTaskId
              ? { ...task, status: 'completed', completed_at: task.completed_at ?? new Date().toISOString(), updated_at: new Date().toISOString() }
              : task),
          } : current);
          try {
            const daily = await completePlanTask(
              completedTaskId,
              result.reward.session_id,
            );

            if (daily) {
              // Daily completion rewards are credited separately from session rewards.
              store.setLocalAppState({ coins: daily.coins });
              setAppState((current) => current ? { ...current, coins: daily.coins } : current);

              if (daily.golden_star_awarded) {
                setRewardToast(
                  language === 'ar'
                    ? '⭐ نجمة ذهبية! أكملت 26 يومًا صحيحًا'
                    : '⭐ Golden Star! 26 correct days completed',
                );
                window.setTimeout(() => setRewardToast(null), 5200);
              } else if (daily.correct) {
                setRewardToast(
                  language === 'ar'
                    ? '🎉 يوم صحيح! +30 كوين'
                    : '🎉 Perfect day! +30 Coins',
                );
                window.setTimeout(() => setRewardToast(null), 4200);
              }
            }
          } catch (error) {
            console.error('[StudyQuest] planned task completion failed:', error);

            const message =
              error instanceof Error
                ? error.message
                : String(error);

            setRewardToast(
              language === 'ar'
                ? `الجلسة اكتملت لكن تعذر تعليم المهمة كمكتملة: ${message}`
                : `Session completed, but the task could not be marked complete: ${message}`
            );

            window.setTimeout(() => setRewardToast(null), 7000);
          }

          Promise.all([
            loadPlan(localCalendarDate(0)),
            loadPlan(localCalendarDate(1)),
          ])
            .then(([todayPlan, tomorrowPlan]) => {
              const updatedPlan = [todayPlan, tomorrowPlan].find(
                (plan) => plan?.tasks?.some((task) => task.id === completedTaskId),
              );

              if (updatedPlan) {
                setTomorrowPlan(updatedPlan);
                setPlanDateLabel(
                  updatedPlan.plan_date === localCalendarDate(0) ? 'today' : 'tomorrow',
                );
              }
            })
            .catch(() => undefined);
        }
      } else {
        if (completedTaskId) {
          markPlanTaskCompletedLocally(completedTaskId);
          setTomorrowPlan((current) => current ? {
            ...current,
            tasks: (current.tasks ?? []).map((task) => task.id === completedTaskId
              ? { ...task, status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
              : task),
          } : current);
        }
        if (timerBeforeComplete.serverBacked && timerBeforeComplete.operationId) {
          setRewardToast(language === 'ar'
            ? 'المهمة اكتملت واتحفظت محليًا؛ المكافأة هتتأكد وتتزامن لما الإنترنت يرجع'
            : 'Task completed locally; the server reward will sync when internet returns');
          window.setTimeout(() => setRewardToast(null), 6000);
        } else {
        store.addSession({
          subject_id: completedSubject.id,
          duration_minutes: completedSubject.duration_minutes,
          completed: true,
        });

        if (appState) {
          const todayKey = new Date().toDateString();

          const earnedTodayIncludingCurrent = store
            .getSessions()
            .filter(
              (session) =>
                session.completed &&
                new Date(session.created_at).toDateString() === todayKey,
            )
            .reduce(
              (sum, session) =>
                sum +
                Math.max(
                  0,
                  Number(session.duration_minutes) || 0,
                ),
              0,
            );

          const earnedTodayBeforeCurrent = Math.max(
            0,
            earnedTodayIncludingCurrent -
              completedSubject.duration_minutes,
          );

          const coinsEarned = Math.max(
            0,
            Math.min(
              completedSubject.duration_minutes,
              60 - earnedTodayBeforeCurrent,
            ),
          );

          updateAppState({
            coins: appState.coins + coinsEarned,
            gems:
              appState.gems +
              (completedSubject.duration_minutes >= 45 ? 1 : 0),
          });

          setRewardToast(
            coinsEarned > 0
              ? `+${coinsEarned} Coins`
              : (
                  language === 'ar'
                    ? 'وصلت للحد اليومي للكوينز'
                    : 'Daily Coin cap reached'
                ),
          );

          window.setTimeout(
            () => setRewardToast(null),
            4200,
          );
        }

        markTodayStreak();
        }
      }
    } catch (error) {
      if (completedTaskId && timerBeforeComplete.remainingSeconds <= 0) {
        markPlanTaskCompletedLocally(completedTaskId);
        setTomorrowPlan((current) => current ? {
          ...current,
          tasks: (current.tasks ?? []).map((task) => task.id === completedTaskId
            ? { ...task, status: 'completed', completed_at: task.completed_at ?? new Date().toISOString(), updated_at: new Date().toISOString() }
            : task),
        } : current);
      }
      console.error('[StudyQuest] focus session completion failed:', error);
      if (timerBeforeComplete.serverBacked && timerBeforeComplete.operationId && navigator.onLine) {
        window.setTimeout(() => { void finishPendingServerSession(); }, 2500);
      }
      const serverReason = error instanceof Error ? error.message.replace(/_/g, ' ') : 'unknown server error';
      setRewardToast(
        language === 'ar'
          ? `المهمة محفوظة محليًا، لكن السيرفر لم يؤكد المكافأة: ${serverReason}`
          : `Task saved locally; the server has not confirmed the reward: ${serverReason}`,
      );
      window.setTimeout(() => setRewardToast(null), 6000);
      if (timerBeforeComplete.remainingSeconds > 0) return;
    }

    setIsRunning(false);
    setActivePlanTaskId(null);
    setActiveSubjectId(null);
    setCurrentDuration(25);
    setRemainingSeconds(25 * 60);

    updateAppState({ active_subject_id: null });
  }, [
    activeSubject,
    subjects,
    finishPendingServerSession,
    markTodayStreak,
    appState,
    activePlanTaskId,
    updateAppState,
    language,
  ]);

  // One countdown source: persisted absolute end time.
  useEffect(() => {
    if (!isRunning) return;

    const refresh = () => {
      const snapshot = focusTimer.load();

      setRemainingSeconds(snapshot.remainingSeconds);

      if (
        snapshot.status === 'running' &&
        snapshot.remainingSeconds <= 0
      ) {
        setIsRunning(false);
        void handleComplete();
      }
    };

    refresh();

    const interval = window.setInterval(refresh, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, handleComplete]);

  const startPlannedTask = useCallback(async (task: NonNullable<StudyPlan['tasks']>[number]) => {
    const subject =
      subjects.find((item) => item.id === task.subject_id) ??
      subjects.find(
        (item) =>
          task.subject_name &&
          item.name.toLowerCase().includes(task.subject_name.toLowerCase())
      ) ??
      subjects[0];

    if (!subject) return;

    const duration = Math.max(5, Math.min(120, task.duration_minutes));

    try {
      const currentTimer = focusTimer.load();

      if (currentTimer.status !== 'idle') {
        await focusTimer.cancel().catch(() => undefined);
      }

      const started = await focusTimer.start(
        subject.id,
        duration,
        task.id,
      );

      setActiveSubjectId(started.subjectId);
      setActivePlanTaskId(started.taskId);
      setCurrentDuration(started.durationSeconds / 60);
      setRemainingSeconds(started.remainingSeconds);
      setIsRunning(true);
      updateAppState({ active_subject_id: subject.id });

      requestMobileNotificationPermission().catch(() => undefined);
      requestStudyNotifications().catch(() => undefined);
      announceStudyTimer(language, 'start');
      scheduleStudyTimerNotifications(
        language,
        started.remainingSeconds,
      ).catch(() => undefined);

      await setTaskStatus(task.id, 'in_progress').catch(() => undefined);

      setRewardToast(
        language === 'ar'
          ? `بدأت المهمة: ${task.title}`
          : `Started: ${task.title}`
      );
      window.setTimeout(() => setRewardToast(null), 2800);

      setSwitchTaskId(null);
    } catch (error) {
      console.error('[StudyQuest] planned task start failed:', error);

      setRewardToast(
        language === 'ar'
          ? 'تعذر بدء المهمة. حاول مرة أخرى.'
          : 'Could not start the task. Please try again.'
      );
      window.setTimeout(() => setRewardToast(null), 5000);
    }
  }, [
    subjects,
    updateAppState,
    language,
  ]);

  // Ambient sound change
  const handleSoundChange = useCallback((sound: AmbientValue) => {
    updateAppState({ ambient_sound: sound });
  }, [updateAppState]);

  const handleDeleteTask = useCallback(async (task: NonNullable<StudyPlan['tasks']>[number]) => {
    try {
      await deletePlanTask(task.id);
      setTomorrowPlan((current) => current ? { ...current, tasks: (current.tasks ?? []).filter((item) => item.id !== task.id) } : current);
      if (activePlanTaskId === task.id) setActivePlanTaskId(null);
      setDeleteTaskId(null);
      setRewardToast(dialogText.deleteSuccess);
      window.setTimeout(() => setRewardToast(null), 2600);
    } catch (error) {
      console.error('[StudyQuest] delete task failed:', error);
      setDeleteTaskId(null);
      setRewardToast(dialogText.deleteError);
      window.setTimeout(() => setRewardToast(null), 5000);
    }
  }, [activePlanTaskId, dialogText.deleteError, dialogText.deleteSuccess]);

  if (loading || !user) {
    return <AppGate isLoading={loading} loadingLabel={TRANSLATIONS[language].loadingStudyQuest} t={t} />;
  }

  return (
    <div className={`studyquest-app relative min-h-screen overflow-x-hidden text-gray-200 theme-${theme}`} data-theme={theme}>
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-neon-cyan/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-neon-emerald/5 blur-[100px]" />
      </div>

      <div className="relative z-50">
        <Navbar
          coins={appState?.coins ?? 0}
          gems={appState?.gems ?? 0}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          language={language}
          languages={LANGUAGES}
          onLanguageChange={setLanguage}
          theme={theme}
          onThemeChange={setTheme}
          t={t}
          isAdmin={isAdmin}
          isPremium={premiumAccess}
        />
      </div>

      <AppStatus
        isSyncing={isSyncing}
        isOnline={isOnline}
        syncingLabel={TRANSLATIONS[language].syncing}
        offlineLabel={TRANSLATIONS[language].offline}
        rewardToast={rewardToast}
        rewardToastIsError={rewardToastIsError}
        language={language}
      />
      <StudyTaskDialogs
        language={language}
        copy={dialogText}
        deleteTask={tomorrowPlan?.tasks?.find((item) => item.id === deleteTaskId) ?? null}
        switchTask={tomorrowPlan?.tasks?.find((item) => item.id === switchTaskId) ?? null}
        runningTitle={tomorrowPlan?.tasks?.find((item) => item.id === activePlanTaskId)?.title ?? displayActiveSubject?.name ?? dialogText.currentTaskFallback}
        onDismissDelete={() => setDeleteTaskId(null)}
        onConfirmDelete={handleDeleteTask}
        onDismissSwitch={() => setSwitchTaskId(null)}
        onConfirmSwitch={startPlannedTask}
      />

      <main className="relative pt-20 md:pt-20 lg:pt-8 pb-24 md:pb-0 px-4 md:px-6 lg:px-10 lg:pl-[18rem]">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto">
          {/* Dashboard tab */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col items-center gap-8 animate-fade-in">
              {/* Timer section */}
              <div className="w-full grid gap-5 xl:grid-cols-[minmax(360px,.92fr)_minmax(0,1.08fr)] xl:items-stretch">
                <section className="focus-stage w-full flex flex-col items-center gap-5 rounded-3xl p-5 md:p-7">
                  <div className="w-full flex items-center justify-between gap-3 border-b border-[var(--sq-border-soft)] pb-3">
                    <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--sq-muted)]">{language === 'ar' ? 'جلسة التركيز' : language === 'fr' ? 'Session de concentration' : language === 'de' ? 'Fokus-Sitzung' : language === 'ja' ? '集中セッション' : 'Focus session'}</p><p className="mt-1 text-sm font-semibold text-[var(--sq-heading)]">{timerDisplayName || t('selectSubjectHint')}</p></div>
                    <span className={'focus-status ' + (isRunning ? 'is-running' : '')}>{isRunning ? t('inFocus') : t('ready')}</span>
                  </div>
                  <PomodoroTimer
                    t={t}
                    durationMinutes={currentDuration}
                    remainingSeconds={remainingSeconds}
                    isRunning={isRunning}
                    onStart={handleStart}
                    onPause={handlePause}
                    onReset={handleReset}
                    subjectName={timerDisplayName}
                  />
                  <div className="w-full max-w-2xl border-t border-[var(--sq-border-soft)] pt-4">
                    <StudyAudio language={language} />
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="text-xs font-medium text-[var(--sq-muted)]">{TRANSLATIONS[language].ambient}</span>
                      <AmbientSoundWidget
                        language={language}
                        t={t}
                        value={appState?.ambient_sound ?? 'none'}
                        onChange={handleSoundChange}
                      />
                    </div>
                  </div>
                </section>

                <Suspense fallback={<div role="status" className="w-full rounded-2xl sq-shell-card p-5 text-sm text-[var(--sq-muted)]">{language === 'ar' ? 'جارٍ تحميل أدوات الدراسة…' : 'Loading study tools…'}</div>}>
                  <div className="flex w-full flex-col gap-5">
                    <TomorrowPlanner language={language} t={t} onPlanReady={(plan) => { setTomorrowPlan(plan); setPlanDateLabel(plan?.plan_date === localCalendarDate(0) ? 'today' : 'tomorrow'); }} />
                    <StudyAssistant language={language} />
                  </div>
                </Suspense>
              </div>

              {tomorrowPlan?.tasks?.length ? (
                <section className="w-full rounded-3xl sq-shell-card border border-violet-300/15 p-4 md:p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-neon-violet font-bold">{planDateLabel === 'today' ? (language === 'ar' ? 'خطة اليوم' : 'Today’s plan') : t('planCards')}</p>
                      <h3 className="font-display font-bold text-lg text-[var(--sq-heading)] mt-1 truncate">{tomorrowPlan.title}</h3>
                    </div>
                    <span className="premium-tag shrink-0">{t('aiGenerated')}</span>
                  </div>
                  {(() => {
                    const completedTasks =
                      dailyAIStatus?.completed_tasks ??
                      tomorrowPlan.tasks.filter((task) => task.status === 'completed').length;

                    const totalTasks =
                      dailyAIStatus?.total_tasks ??
                      tomorrowPlan.tasks.length;

                    const taskProgress =
                      totalTasks > 0
                        ? Math.min(100, Math.round((completedTasks / totalTasks) * 100))
                        : 0;

                    const correctDays = Math.min(
                      26,
                      Math.max(0, dailyAIStatus?.correct_days ?? 0),
                    );

                    const dayCorrect = Boolean(dailyAIStatus?.correct);

                    return (
                      <div className="mb-4 rounded-3xl border border-violet-300/15 bg-gradient-to-br from-violet-400/[0.07] via-slate-950/20 to-cyan-400/[0.04] p-4 md:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">
                              {planDateLabel === 'today' ? (language === 'ar' ? 'تقدم اليوم' : 'Today’s progress') : (language === 'ar' ? 'تقدم خطة بكرة' : 'Tomorrow’s plan progress')}
                            </p>

                            <h4 className="mt-1 flex items-center gap-2 text-base md:text-lg font-black text-[var(--sq-heading)]">
                              <span aria-label={dayCorrect ? (language === 'ar' ? 'اكتملت مهام اليوم' : 'Day tasks complete') : (language === 'ar' ? 'مهام اليوم لم تكتمل بعد' : 'Day tasks not complete yet')} className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border text-sm ${dayCorrect ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300' : 'border-white/15 bg-white/5 text-[var(--sq-muted)]'}`}>{dayCorrect ? '✓' : '□'}</span>
                              {dayCorrect
                                ? (language === 'ar'
                                    ? '⭐ يوم صحيح — أنجزت كل المهام'
                                    : t('dailyCorrectTitle'))
                                : (language === 'ar'
                                    ? '🎯 كمّل مهام اليوم'
                                    : t('dailyIncompleteBody'))}
                            </h4>

                            <p className="mt-1 text-xs text-[var(--sq-muted)]">
                              {completedTasks}/{totalTasks}
                              {' '}
                              {language === 'ar' ? 'مهام مكتملة' : 'tasks completed'}
                            </p>
                          </div>

                          <div className="shrink-0 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--sq-muted)]">
                              {language === 'ar' ? 'التقدم إلى النجمة الذهبية' : 'Golden Star progress'}
                            </p>
                            <p className="mt-1 text-2xl font-black text-neon-amber">
                              ⭐ {correctDays}/26
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300 transition-all duration-500"
                              style={{ width: `${taskProgress}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-wider text-neon-amber">
                                {t('dailyBonus')}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-[var(--sq-muted)]">
                                {t('dailyBonusBody')}
                              </p>
                            </div>

                            <div className="shrink-0 text-xs font-black text-neon-amber">
                              1 min = 1 🪙 · max 60/day
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {[15, 25, 45, 60].map((minutes) => {
                              const coins = Math.min(60, minutes);

                              return (
                                <div
                                  key={minutes}
                                  className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-center"
                                >
                                  <p className="text-[10px] font-bold text-[var(--sq-muted)]">
                                    {minutes} {t('minutes')}
                                  </p>
                                  <p className="mt-1 text-sm font-black text-neon-amber">
                                    +{coins} {t('coinsShort')}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="grid gap-3">
                    {tomorrowPlan.tasks.map((task, index) => {
                      const isNext = task.id === nextPlanTask?.id;
                      const isActive = task.id === activePlanTaskId;
                      const isDone = task.status === 'completed';
                      return (
                        <article key={task.id} className={`plan-task-card ${isActive || isNext ? 'is-current' : ''} ${isDone ? 'is-complete' : ''}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="plan-task-index">{index + 1}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-sm md:text-base text-[var(--sq-heading)]">{task.title}</h4>
                                {(isActive || isNext) && <span className="premium-tag">{isActive ? 'Running' : t('currentTask')}</span>}
                                {isDone && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-black text-emerald-300"><span aria-hidden="true">✓</span>{t('completedTask')}</span>}
                              </div>
                              <p className="text-xs text-[var(--sq-muted)] mt-1">{task.duration_minutes} {t('minutes')}{task.start_at ? ` · ${new Date(task.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</p>
                              {task.notes && <p className="text-xs text-[var(--sq-muted-strong)] mt-1 line-clamp-2">{task.notes}</p>}
                            </div>
                            {!isDone && (
                            <button
                              type="button"
                              onClick={async () => {
                                setDeleteTaskId(task.id);
                                return;
                                try {
                                  await deletePlanTask(task.id);
                                  setTomorrowPlan((current) =>
                                    current
                                      ? {
                                          ...current,
                                          tasks: (current.tasks ?? []).filter(
                                            (item) => item.id !== task.id
                                          ),
                                        }
                                      : current
                                  );

                                  if (activePlanTaskId === task.id) {
                                    setActivePlanTaskId(null);
                                  }
                                } catch (error) {
                                  console.error('[StudyQuest] delete task failed:', error);
                                  setRewardToast(
                                    language === 'ar'
                                      ? 'تعذر حذف المهمة. حاول مرة أخرى.'
                                      : 'Could not delete the task. Please try again.'
                                  );
                                  window.setTimeout(() => setRewardToast(null), 5000);
                                }
                              }}
                              className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold"
                              style={{
                                backgroundColor: 'rgba(248, 113, 113, 0.10)',
                                border: '1px solid rgba(252, 165, 165, 0.25)',
                                color: '#fca5a5',
                              }}
                            >
                              {language === 'ar' ? 'حذف' : 'Delete'}
                            </button>
                            )}
                            {!isDone && <button type="button" onClick={async () => {
                              const currentTimer = focusTimer.load();

                              if (
                                currentTimer.status !== 'idle' &&
                                currentTimer.taskId !== task.id
                              ) {
                                setSwitchTaskId(task.id);
                                return;
                              }

                              await startPlannedTask(task);
                            }} className="shrink-0 px-4 py-2.5 rounded-xl bg-neon-violet/10 border border-neon-violet/30 text-neon-violet text-sm font-bold">{t('startPlannedTask')}</button>}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {isOnline && user && (
                <section className="w-full rounded-2xl sq-shell-card border border-amber-300/15 p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-[11px] text-neon-amber uppercase tracking-wider font-black">Coin Economy</p>
                      <h3 className="mt-1 text-sm md:text-base font-black text-[var(--sq-heading)]">60 Coins maximum from study rewards each day</h3>
                      <p className="mt-1 text-[11px] text-[var(--sq-muted)]">1 verified study minute = 1 Coin, until the daily cap is reached. Coins are earned through study, not handed out for opening the app.</p>
                    </div>
                    <div className="shrink-0 rounded-xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-center">
                      <p className="text-[10px] text-[var(--sq-muted)]">Daily cap</p>
                      <p className="text-2xl font-black text-neon-amber">50 🪙</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {[25, 45, 60].map((minutes) => (
                      <div key={minutes} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-center">
                        <p className="text-[10px] text-[var(--sq-muted)]">{minutes} {t('minutes')}</p>
                        <p className="mt-1 text-xs font-black text-neon-amber">+{Math.min(60, minutes)} {t('coinsShort')}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Manual subjects remain available when no AI plan has been created. */}
              {!tomorrowPlan?.tasks?.length && (
                <section className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-bold text-lg text-gray-200">{TRANSLATIONS[language].dailyStudyGoals}</h2>
                    {isRunning && (
                      <span className="text-xs font-medium text-neon-amber px-3 py-1 rounded-full bg-neon-amber/10 border border-neon-amber/20 neon-text-amber">
                        {TRANSLATIONS[language].lockInActive}
                      </span>
                    )}
                  </div>
                  <SubjectGrid
                    t={t}
                    subjects={displaySubjects}
                    activeSubjectId={activeSubjectId}
                    isRunning={isRunning}
                    onSelect={handleSelectSubject}
                    onEditDuration={handleEditDuration}
                    onEditName={handleEditName}
                  />
                </section>
              )}

              {/* Streak + Pet */}
              <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <StreakBoard streakDays={streakDays} language={language} t={t} />
                <PetCard
                  language={language}
                  t={t}
                  petId={equippedPetId || undefined}
                  petName={equippedPetId ? (equippedPetId === 'sparky' ? (appState?.pet_name ?? 'Sparky') : (PET_CATALOG.find((p) => p.id === equippedPetId)?.name ?? '')) : ''}
                  petXp={equippedPetId ? (appState?.pet_xp ?? 0) : 0}
                  petXpMax={equippedPetId ? (appState?.pet_xp_max ?? 100) : 100}
                />
                <section className="relative overflow-hidden rounded-3xl sq-shell-card border border-cyan-300/15 p-5">
                  <div className="absolute -right-8 -bottom-10 w-40 h-40 rounded-full bg-cyan-300/10 blur-3xl pointer-events-none" />
                  <div className="relative flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-cyan-300/20 bg-cyan-300/5 shrink-0"><img src={getPetVisual('frost-kit').asset} alt="" className="w-full h-full object-cover mix-blend-screen" style={{filter:getPetVisual('frost-kit').filter}} /></div>
                    <div className="min-w-0"><p className="text-[11px] uppercase tracking-[.18em] text-neon-amber font-black">{t('coinGuideTitle')}</p><p className="mt-1 text-sm font-bold text-[var(--sq-heading)]">{t('coinGuideBody')}</p><p className="mt-2 text-xs text-[var(--sq-muted)]">{streakDays.filter((d) => d.completed).length < 2 ? (streakDays.some((d) => d.completed) ? t('firstDayMessage') : t('starterCompanionBody')) : t('secondDayMessage')}</p></div>
                  </div>
                </section>
              </section>
            </div>
          )}

          {/* Profile */}
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-6">
              <Suspense fallback={<div role="status" className="sq-shell-card rounded-2xl p-5 text-sm text-[var(--sq-muted)]">{language === 'ar' ? 'جارٍ تحميل الملف الشخصي…' : 'Loading profile…'}</div>}><ProfilePage language={language} t={t} /></Suspense>
            </div>
          )}

          {/* Leaderboard + Safe Study Lounge */}
          {activeTab === 'leaderboards' && <Suspense fallback={<div role="status" className="sq-shell-card rounded-2xl p-5 text-sm text-[var(--sq-muted)]">{language === 'ar' ? 'جارٍ تحميل لوحة الترتيب…' : 'Loading leaderboard…'}</div>}><Leaderboard language={language} t={(key) => TRANSLATIONS[language][key as TranslationKey]} /></Suspense>}

          {/* Premium world */}
          {activeTab === 'premium-benefits' && premiumAccess && <Suspense fallback={<div role="status" className="sq-shell-card rounded-2xl p-5 text-sm text-[var(--sq-muted)]">{language === 'ar' ? 'جارٍ تحميل المزايا…' : 'Loading Premium benefits…'}</div>}><PremiumBenefitsPage language={language} premiumActive={premiumAccess} userId={user.id} /></Suspense>}
          {activeTab === 'skins' && <Suspense fallback={<div role="status" className="sq-shell-card rounded-2xl p-5 text-sm text-[var(--sq-muted)]">{language === 'ar' ? 'جارٍ تحميل Premium…' : 'Loading Premium…'}</div>}><PremiumPage language={language} t={t} /></Suspense>}
          {activeTab === 'admin' && isAdmin && <Suspense fallback={<div role="status" className="sq-shell-card rounded-2xl p-5 text-sm text-[var(--sq-muted)]">{language === 'ar' ? 'جارٍ تحميل لوحة التحكم…' : 'Loading admin dashboard…'}</div>}><AdminDashboard language={language} /></Suspense>}
        </div>
      </main>

      <Footer t={t} language={language} />
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} t={t} isAdmin={isAdmin} isPremium={premiumAccess} />

      {/* Mobile motivational quote */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-4 pointer-events-none">
        <p className="text-center text-xs font-display font-bold text-neon-emerald/70 neon-text-emerald truncate">
          {TRANSLATIONS[language][(['keepGrinding', 'everyMinute', 'knowledgePower', 'stayLocked', 'petBelieves'] as TranslationKey[])[quoteIndex]]}
        </p>
      </div>
    </div>
  );
}
