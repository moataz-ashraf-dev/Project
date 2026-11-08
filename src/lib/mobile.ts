/** Native-capability helpers. The web build keeps working when Capacitor is not present. */
export async function isNativeApp(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function configureMobileShell(): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
      import('@capacitor/app'),
    ]);
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
    await SplashScreen.hide();
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) window.dispatchEvent(new Event('pageshow'));
    });
  } catch {
    // Browser build or optional native capability unavailable.
  }
}

export async function requestMobileNotificationPermission(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return false;
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch {
    return false;
  }
}

const STUDY_TIMER_NOTIFICATION_IDS = {
  five: 74120,
  one: 74121,
  ten: 74122,
  complete: 74123,
};

export async function scheduleStudyTimerNotifications(language: string, remainingSeconds: number): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') return;

    const ar = language === 'ar';
    const title = 'StudyQuest';
    const notifications = [
      remainingSeconds > 5 * 60 ? {
        id: STUDY_TIMER_NOTIFICATION_IDS.five,
        title,
        body: ar ? 'فاضل 5 دقايق على نهاية الجلسة. كمّل!' : 'Five minutes left. Keep going!',
        schedule: { at: new Date(Date.now() + (remainingSeconds - 5 * 60) * 1000) },
      } : null,
      remainingSeconds > 60 ? {
        id: STUDY_TIMER_NOTIFICATION_IDS.one,
        title,
        body: ar ? 'فاضل دقيقة واحدة. خلّص بقوة!' : 'One minute left. Finish strong!',
        schedule: { at: new Date(Date.now() + (remainingSeconds - 60) * 1000) },
      } : null,
      remainingSeconds > 10 ? {
        id: STUDY_TIMER_NOTIFICATION_IDS.ten,
        title,
        body: ar ? 'فاضل 10 ثواني!' : 'Ten seconds left!',
        schedule: { at: new Date(Date.now() + (remainingSeconds - 10) * 1000) },
      } : null,
      {
        id: STUDY_TIMER_NOTIFICATION_IDS.complete,
        title,
        body: ar ? 'خلصت جلسة الدراسة! أحسنت، تمت إضافة مكافآتك.' : 'Study session complete! Great work. Your rewards have been added.',
        schedule: { at: new Date(Date.now() + Math.max(1, remainingSeconds) * 1000) },
      },
    ].filter(Boolean) as Array<{ id: number; title: string; body: string; schedule: { at: Date } }>;

    await LocalNotifications.schedule({ notifications });
  } catch {
    // Best effort: the web timer and voice announcements still work.
  }
}

/** Backwards-compatible helper for callers that only need a completion reminder. */
export async function scheduleStudyCompletionNotification(language: string, delaySeconds = 2): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') return;
    const title = 'StudyQuest';
    const body = language === 'ar' ? 'أحسنت! خذ استراحة قصيرة ثم واصل رحلتك.' : 'Great work! Take a short break, then continue your quest.';
    await LocalNotifications.schedule({ notifications: [{ id: STUDY_TIMER_NOTIFICATION_IDS.complete, title, body, schedule: { at: new Date(Date.now() + delaySeconds * 1000) } }] });
  } catch {
    // Native plugin is optional in the browser build.
  }
}

export async function cancelStudyCompletionNotification(): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: Object.values(STUDY_TIMER_NOTIFICATION_IDS).map((id) => ({ id })) });
  } catch {
    // Best effort: the timer still works if native notifications are unavailable.
  }
}
