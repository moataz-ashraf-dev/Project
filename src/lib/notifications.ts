import type { LanguageCode } from './i18n';

const copyFor = (language: LanguageCode) => ({
  en: {
    title: 'StudyQuest', start: 'Focus session started. Stay locked in!', five: 'Five minutes left. Keep going!', one: 'One minute left. Finish strong!', ten: 'Ten seconds left!', complete: 'Session complete! Great work. Your rewards have been added.',
  },
  ar: {
    title: 'StudyQuest', start: 'بدأت جلسة التركيز. شد حيلك!', five: 'فاضل 5 دقايق. كمّل!', one: 'فاضل دقيقة واحدة. خلّص بقوة!', ten: 'فاضل 10 ثواني!', complete: 'خلصت الجلسة! شغل ممتاز. تمت إضافة مكافآتك.',
  },
  de: { title: 'StudyQuest', start: 'Fokus-Session gestartet. Bleib dran!', five: 'Noch fünf Minuten. Weiter so!', one: 'Noch eine Minute. Stark beenden!', ten: 'Noch zehn Sekunden!', complete: 'Session abgeschlossen! Deine Belohnungen wurden hinzugefügt.' },
  ja: { title: 'StudyQuest', start: '集中セッションを開始しました。頑張ろう！', five: '残り5分。もう少し！', one: '残り1分。最後まで！', ten: '残り10秒！', complete: 'セッション完了！報酬が追加されました。' },
  fr: { title: 'StudyQuest', start: 'Session de concentration commencée. Courage !', five: 'Plus que cinq minutes. Continue !', one: 'Plus qu’une minute. Termine fort !', ten: 'Plus que dix secondes !', complete: 'Session terminée ! Tes récompenses ont été ajoutées.' },
} as const)[language] ?? ({ title: 'StudyQuest', start: 'Focus session started. Stay locked in!', five: 'Five minutes left. Keep going!', one: 'One minute left. Finish strong!', ten: 'Ten seconds left!', complete: 'Session complete! Great work. Your rewards have been added.' });

function speak(text: string, language: LanguageCode) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'ar' ? 'ar-EG' : language === 'ja' ? 'ja-JP' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US';
    utterance.rate = language === 'ar' ? 0.95 : 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  } catch { /* speech is best-effort */ }
}

function notify(title: string, body: string, language: LanguageCode, voice = true) {
  if (voice) speak(body, language);
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
  try { new Notification(title, { body, icon: '/icons/icon-192.png', tag: 'studyquest-timer' }); } catch { /* browser notification is best-effort */ }
}

export async function requestStudyNotifications(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

export function announceStudyTimer(language: LanguageCode, event: 'start' | 'five' | 'one' | 'ten' | 'complete') {
  const copy = copyFor(language);
  notify(copy.title, copy[event], language, true);
}

export type StudyQuestEvent =
  | 'session_started'
  | 'session_blocked'
  | 'session_completed'
  | 'task_deleted'
  | 'plan_created'
  | 'task_completed'
  | 'reward_received'
  | 'action_failed';

const eventCopy: Record<LanguageCode, Record<StudyQuestEvent, string>> = {
  en: {
    session_started: 'Your focus session has started. Stay locked in!',
    session_blocked: 'You already have an active focus session. Finish it before starting another task.',
    session_completed: 'Focus session completed. Great work!',
    task_deleted: 'The task was deleted successfully.',
    plan_created: 'Your AI study plan has been created successfully.',
    task_completed: 'The task was completed successfully.',
    reward_received: 'Your rewards have been added successfully.',
    action_failed: 'That action could not be completed.',
  },
  ar: {
    session_started: 'بدأت جلسة التركيز. شد حيلك!',
    session_blocked: 'عندك جلسة تركيز شغالة. كمّلها الأول عشان تبدأ مهمة جديدة.',
    session_completed: 'خلصت جلسة التركيز. شغل ممتاز!',
    task_deleted: 'تم حذف المهمة بنجاح.',
    plan_created: 'تم إنشاء خطة المذاكرة بالذكاء الاصطناعي بنجاح.',
    task_completed: 'تم إكمال المهمة بنجاح.',
    reward_received: 'تمت إضافة مكافآتك بنجاح.',
    action_failed: 'مقدرناش نكمل العملية دي.',
  },
  de: {
    session_started: 'Deine Fokus-Session hat begonnen. Bleib konzentriert!',
    session_blocked: 'Du hast bereits eine aktive Fokus-Session. Beende sie, bevor du eine neue Aufgabe startest.',
    session_completed: 'Fokus-Session abgeschlossen. Gute Arbeit!',
    task_deleted: 'Die Aufgabe wurde erfolgreich gelöscht.',
    plan_created: 'Dein KI-Lernplan wurde erfolgreich erstellt.',
    task_completed: 'Die Aufgabe wurde erfolgreich abgeschlossen.',
    reward_received: 'Deine Belohnungen wurden erfolgreich hinzugefügt.',
    action_failed: 'Diese Aktion konnte nicht abgeschlossen werden.',
  },
  ja: {
    session_started: '集中セッションが始まりました。頑張って！',
    session_blocked: 'すでに集中セッションが進行中です。別のタスクを始める前に完了してください。',
    session_completed: '集中セッションが完了しました。よく頑張りました！',
    task_deleted: 'タスクを削除しました。',
    plan_created: 'AI学習プランを正常に作成しました。',
    task_completed: 'タスクを正常に完了しました。',
    reward_received: '報酬が正常に追加されました。',
    action_failed: 'この操作を完了できませんでした。',
  },
  fr: {
    session_started: 'Ta session de concentration a commencé. Reste concentré !',
    session_blocked: 'Tu as déjà une session de concentration active. Termine-la avant de commencer une autre tâche.',
    session_completed: 'Session de concentration terminée. Bravo !',
    task_deleted: 'La tâche a été supprimée avec succès.',
    plan_created: 'Ton plan d’étude IA a été créé avec succès.',
    task_completed: 'La tâche a été terminée avec succès.',
    reward_received: 'Tes récompenses ont été ajoutées avec succès.',
    action_failed: 'Cette action n’a pas pu être terminée.',
  },
};

export function announceStudyQuestEvent(language: LanguageCode, event: StudyQuestEvent): void {
  const message = eventCopy[language]?.[event] ?? eventCopy.en[event];
  notify('StudyQuest', message, language, true);
}

export function schedulePlanReminder(hour = 20, minute = 0, language: LanguageCode = 'en'): number | null {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return null;
  const copy = {
    en: ['StudyQuest', 'Plan tomorrow so your next study session is ready.'], ar: ['StudyQuest', 'خطط لبكرا عشان جلسة مذاكرتك الجاية تكون جاهزة.'], de: ['StudyQuest', 'Plane morgen, damit deine nächste Lerneinheit bereit ist.'], ja: ['StudyQuest', '明日の計画を立てて、次の学習セッションを準備しましょう。'], fr: ['StudyQuest', 'Planifie demain pour préparer ta prochaine session d’étude.'],
  }[language];
  const now = new Date(); const target = new Date(now); target.setHours(hour, minute, 0, 0); if (target <= now) target.setDate(target.getDate() + 1);
  return window.setTimeout(() => new Notification(copy[0], { body: copy[1] }), target.getTime() - now.getTime());
}


export function notifyPlanOverdue(language: LanguageCode, taskTitle: string): void {
  const body = language === 'ar' ? `اتأخرت عن مهمة «${taskTitle}». افتح الكارت وابدأها لما تكون جاهز.` : `You are behind on “${taskTitle}”. Open the card and start it when you are ready.`;
  notify('StudyQuest', body, language, true);
}

export function notifyStudyMilestone(language: LanguageCode, milestone: 'first' | 'second'): void {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
  const copy = {
    en: milestone === 'first' ? 'Great first day! One more study day unlocks your starter companion.' : 'Two study days complete! Your starter companion is ready.',
    ar: milestone === 'first' ? 'بداية ممتازة! يوم مذاكرة كمان ورفيق البداية هيتفتح لك.' : 'أكملت يومين من المذاكرة! رفيق البداية جاهز.',
    de: milestone === 'first' ? 'Starker erster Tag! Ein weiterer Lerntag schaltet deinen Startbegleiter frei.' : 'Zwei Lerntage geschafft! Dein Startbegleiter ist bereit.',
    ja: milestone === 'first' ? '初日クリア！もう1日学習すると最初の仲間を解放できます。' : '2日間の学習を達成！最初の仲間が準備できました。',
    fr: milestone === 'first' ? 'Super premier jour ! Encore un jour d’étude pour débloquer ton compagnon.' : 'Deux jours d’étude terminés ! Ton compagnon de départ est prêt.',
  }[language];
  new Notification('StudyQuest', { body: copy });
}


export function announceCommerce(language: LanguageCode, event: 'pet' | 'premium' | 'gems', nameOrAmount?: string | number): void {
  const messages = {
    en: { pet: `Congratulations! ${String(nameOrAmount || 'Companion')} was unlocked successfully.`, premium: 'Congratulations! Premium was activated successfully.', gems: `Gems charged successfully: +${Number(nameOrAmount || 0).toLocaleString()} Gems.` },
    ar: { pet: `ألف مبروك! تم فتح ${String(nameOrAmount || 'الحيوان')} بنجاح.`, premium: 'ألف مبروك! تم تفعيل Premium بنجاح.', gems: `تم شحن الجواهر بنجاح: +${Number(nameOrAmount || 0).toLocaleString()} جوهرة.` },
    de: { pet: `Glückwunsch! ${String(nameOrAmount || 'Begleiter')} wurde erfolgreich freigeschaltet.`, premium: 'Glückwunsch! Premium wurde erfolgreich aktiviert.', gems: `Gems erfolgreich gutgeschrieben: +${Number(nameOrAmount || 0).toLocaleString()}.` },
    ja: { pet: `おめでとうございます！${String(nameOrAmount || 'コンパニオン')}を正常に解放しました。`, premium: 'おめでとうございます！Premiumが正常に有効化されました。', gems: `ジェムのチャージが完了しました：+${Number(nameOrAmount || 0).toLocaleString()} ジェム。` },
    fr: { pet: `Félicitations ! ${String(nameOrAmount || 'compagnon')} a été débloqué avec succès.`, premium: 'Félicitations ! Premium a été activé avec succès.', gems: `Gemmes créditées avec succès : +${Number(nameOrAmount || 0).toLocaleString()}.` },
  } as const;
  const copy = messages[language] ?? messages.en;
  const body = copy[event];
  notify(copy[event] ? 'StudyQuest' : 'StudyQuest', body, language, true);
}
