export type ThemeMode = 'dark' | 'light' | 'ice';
export type LanguageCode = 'en' | 'de' | 'ja' | 'ar' | 'fr';

export const LANGUAGES: Array<{ code: LanguageCode; label: string; locale: string }> = [
  { code: 'en', label: 'English', locale: 'en' },
  { code: 'de', label: 'Deutsch', locale: 'de' },
  { code: 'ja', label: '日本語', locale: 'ja' },
  { code: 'ar', label: 'العربية', locale: 'ar' },
  { code: 'fr', label: 'Français', locale: 'fr' },
];

export type TranslationKey =
  | 'dailyBonus' | 'dailyBonusBody' | 'dailyBonusOnce' | 'rewardGuideTitle' | 'sessionRewardRule' | 'withDailyBonus' | 'coinsShort' | 'rewardGuideFootnote' | 'coinsPerDay' | 'planCards' | 'aiGenerated' | 'startPlannedTask' | 'completedTask' | 'minutes' | 'nextTask' | 'currentTask' | 'petUnlockJourney' | 'firstDayReward' | 'secondDayReward'
  | 'loadingStudyQuest' | 'studyDashboard' | 'myProfile' | 'leaderboards' | 'futureSkins' | 'premiumFeatures'
  | 'dashboard' | 'profile' | 'ranks' | 'skins' | 'selectASubject' | 'startFocus' | 'pause'
  | 'reset' | 'inFocus' | 'ready' | 'ambient' | 'dailyStudyGoals' | 'lockInActive'
  | 'studyGoal' | 'min' | 'weeklyStreak' | 'companion' | 'points' | 'gems' | 'syncing'
  | 'offline' | 'help' | 'privacy' | 'contact' | 'madeWith' | 'comingSoon'
  | 'trackStats' | 'competeHeroes' | 'customizePet' | 'keepGrinding' | 'everyMinute'
  | 'knowledgePower' | 'stayLocked' | 'petBelieves' | 'noSound' | 'quranAudio'
  | 'lofiMusic' | 'rainAmbient' | 'sunMode' | 'moonMode' | 'iceMode' | 'language'
  | 'active' | 'days' | 'levelCompanion' | 'xp' | 'daysShort' | 'selectSubjectHint'
  | 'levelPrefix' | 'studentLevel' | 'lifetimeGoldenStars' | 'resourceWealth' | 'studyHours' | 'unlockedPets' | 'equipmentApparel' | 'equipped' | 'leaderboard' | 'globalRank' | 'regionalRank' | 'internationalRanking' | 'regionalRanking'
  | 'topStudents' | 'rank' | 'level' | 'streak' | 'goldenStars' | 'lifetimeStars' | 'region'
  | 'safeStudyLounge' | 'studyRooms' | 'physicsMastermindsRoom' | 'advancedCalculusHub'
  | 'javascriptBuildersRoom' | 'englishConversationStudyRoom' | 'chemistryFocusRoom' | 'examPreparationRoom'
  | 'activeStudents' | 'secureRoom' | 'verifiedStudentsOnly' | 'wordFilterActive' | 'textModerationActive'
  | 'moderationLog' | 'reportDisruptiveBehavior' | 'report' | 'cancel' | 'submitReport' | 'joinRoom'
  | 'joinedOfflineLobby' | 'microphone' | 'speaker' | 'volume' | 'leaveRoom' | 'offlineLobby'
  | 'mockLocalStatus' | 'moderationActive' | 'automatedWordFiltering' | 'reportReason'
  | 'reportSubmitted' | 'selectReason' | 'reasonDisruption' | 'reasonHarassment' | 'reasonSpam'
  | 'localMockNotice' | 'roomDescriptionPhysics' | 'roomDescriptionCalculus' | 'roomDescriptionJavaScript'
  | 'roomDescriptionEnglish' | 'roomDescriptionChemistry' | 'roomDescriptionExam' | 'secureLocalLounge'
  | 'noRealVoiceConnection' | 'globalStudents' | 'regionalStudents'
  | 'displayName' | 'chooseAvatar'
  | 'interactiveStats' | 'studyHoursGoal' | 'studyHoursSubtitle' | 'coinsEarned' | 'coinsEarnedSubtitle' | 'gemsCollected' | 'gemsCollectedSubtitle' | 'goalProgress'
  | 'companionsTab' | 'skinsTab' | 'profileFramesTab' | 'equip' | 'equipped' | 'rarityAll' | 'rarityMythic' | 'inventorySection' | 'skinType' | 'petType' | 'unequip'
  | 'dailyCorrectTitle' | 'dailyCorrectBody' | 'dailyIncompleteBody' | 'goldenStarProgress' | 'account' | 'signIn' | 'signUp' | 'signOut' | 'createAccount' | 'email' | 'password' | 'forgotPassword' | 'resetPasswordTitle' | 'resetPasswordBody' | 'sendResetLink' | 'resetLinkSent' | 'backToSignIn' | 'newPassword' | 'confirmPassword' | 'updatePassword' | 'passwordUpdated' | 'passwordsDoNotMatch' | 'authErrorEmailNotConfirmed' | 'authErrorResetExpired'
  | 'authSubmitting' | 'authSignInSuccess' | 'authSignUpSuccess' | 'authErrorGeneric'
  | 'authErrorInvalidCredentials' | 'authErrorEmailInUse' | 'authErrorInvalidEmail' | 'authErrorPasswordTooShort'
  | 'signedInAs' | 'guest' | 'close' | 'starterCompanionTitle' | 'starterCompanionBody' | 'starterCompanionRequirement' | 'coinGuideTitle' | 'coinGuideBody' | 'firstDayMessage' | 'secondDayMessage' | 'paymentMethods' | 'secureCheckout' | 'parentApproval';

type TranslationDictionary = Record<LanguageCode, Record<TranslationKey, string>>;

export const TRANSLATIONS: TranslationDictionary = {
  en: {
    loadingStudyQuest: 'Loading StudyQuest...', studyDashboard: 'Study Dashboard', myProfile: 'My Profile',
    leaderboards: 'Leaderboards', futureSkins: 'Premium', premiumFeatures: 'Premium benefits', dashboard: 'Dashboard', profile: 'Profile',
    ranks: 'Ranks', skins: 'Skins', selectASubject: 'Select a subject', startFocus: 'Start Focus', pause: 'Pause',
    reset: 'Reset', inFocus: 'In Focus', ready: 'Ready', ambient: 'Ambient', dailyStudyGoals: 'Daily Study Goals',
    lockInActive: 'Lock-In Active', studyGoal: 'Study Goal', min: 'min', weeklyStreak: 'Weekly Streak',
    companion: 'Companion', points: 'Points', gems: 'Gems', syncing: 'Syncing...', offline: 'Offline',
    help: 'Help', privacy: 'Privacy', contact: 'Contact', madeWith: 'Made with', comingSoon: 'Coming soon',
    trackStats: 'track your stats, achievements, and rewards here.', competeHeroes: 'compete with fellow StudyQuest heroes!',
    customizePet: 'customize your pet and unlock new themes!',
    keepGrinding: 'Keep grinding, hero! Your pet is proud of you!',
    everyMinute: 'Every minute counts. You are building your future!',
    knowledgePower: 'Knowledge is power. Claim it, one session at a time!',
    stayLocked: 'Stay locked in. The streak gods are watching!',
    petBelieves: 'Your pet believes in you. Do not let it down!',
    noSound: 'No Sound', quranAudio: 'Quran Audio', lofiMusic: 'Lo-Fi Music', rainAmbient: 'Rain Ambient',
    sunMode: 'Switch to light mode', moonMode: 'Switch to dark mode', iceMode: 'Switch to ice mode', language: 'Language', active: 'ACTIVE', days: 'days', levelCompanion: 'Companion', xp: 'XP', daysShort: 'days', selectSubjectHint: 'Select a subject',
    levelPrefix: 'Lv.', studentLevel: 'Student Level', lifetimeGoldenStars: 'Lifetime Golden Stars', resourceWealth: 'Resource Wealth', studyHours: 'Study Hours', unlockedPets: 'Unlocked Pets', equipmentApparel: 'Equipment & Apparel', equipped: 'EQUIPPED', leaderboard: 'Leaderboard', globalRank: 'Global Rank', regionalRank: 'Regional Rank', internationalRanking: 'International Rankings', regionalRanking: 'Regional Ranking',
    topStudents: 'Top Students', rank: 'Rank', level: 'Level', streak: 'Streak', goldenStars: 'Golden Stars', lifetimeStars: 'Lifetime Stars', region: 'Region',
    safeStudyLounge: 'Safe Study Lounge', studyRooms: 'Study Rooms', physicsMastermindsRoom: 'Physics Masterminds Room', advancedCalculusHub: 'Advanced Calculus Hub',
    javascriptBuildersRoom: 'JavaScript Builders Room', englishConversationStudyRoom: 'English Conversation Study Room', chemistryFocusRoom: 'Chemistry Focus Room', examPreparationRoom: 'Exam Preparation Room',
    activeStudents: 'Active Students', secureRoom: 'Secure Room', verifiedStudentsOnly: 'Verified Students Only', wordFilterActive: 'Word Filter Active', textModerationActive: 'Text Moderation Active',
    moderationLog: 'Moderation Log', reportDisruptiveBehavior: 'Report Disruptive Behavior', report: 'Report', cancel: 'Cancel', submitReport: 'Submit Report', joinRoom: 'Join Room',
    joinedOfflineLobby: 'You joined the offline audio lobby', microphone: 'Microphone', speaker: 'Speaker', volume: 'Volume', leaveRoom: 'Leave Room', offlineLobby: 'Offline Lobby',
    mockLocalStatus: 'Mock / Local Status', moderationActive: 'Moderation Active', automatedWordFiltering: 'Automated Word Filtering: ACTIVE', reportReason: 'Report reason',
    reportSubmitted: 'Report submitted locally.', selectReason: 'Select a reason', reasonDisruption: 'Disruptive behavior', reasonHarassment: 'Harassment or bullying', reasonSpam: 'Spam or repeated disruption',
    localMockNotice: 'Offline mock lounge — no real voice connection is active.', roomDescriptionPhysics: 'Focused problem-solving and physics revision.', roomDescriptionCalculus: 'Advanced calculus practice and exam drills.', roomDescriptionJavaScript: 'Build and review JavaScript projects together.',
    roomDescriptionEnglish: 'Practice English conversation in a study-focused room.', roomDescriptionChemistry: 'Chemistry revision, formulas, and focused problem sets.', roomDescriptionExam: 'Quiet exam preparation and revision planning.', secureLocalLounge: 'Local safety layer',
    noRealVoiceConnection: 'No real-time voice connection', globalStudents: 'Global Students', regionalStudents: 'Regional Students',
    displayName: 'Display Name', chooseAvatar: 'Choose Your Avatar',
    interactiveStats: 'Interactive Stats', studyHoursGoal: 'Study Hours', studyHoursSubtitle: 'Hours focused this week', coinsEarned: 'Coins Earned', coinsEarnedSubtitle: 'Total currency collected', gemsCollected: 'Gems Collected', gemsCollectedSubtitle: 'Premium rewards earned', goalProgress: 'Goal progress',
    companionsTab: 'Companions', skinsTab: 'Character Skins', profileFramesTab: 'Profile Frames', equip: 'Equip', unequip: 'Unequip', rarityAll: 'All', rarityMythic: 'Mythic', inventorySection: 'Inventory', skinType: 'Skin', petType: 'Pet',
    dailyCorrectTitle: 'Perfect day', dailyCorrectBody: 'You completed every AI task today. +30 Coins earned.', dailyIncompleteBody: 'Finish every AI task today to make the day count as correct. A correct day gives +30 Coins.', goldenStarProgress: 'Golden Star: {count}/26 correct days',
    account: 'Account', signIn: 'Sign In', signUp: 'Sign Up', signOut: 'Sign Out', createAccount: 'Create Account', email: 'Email', password: 'Password',
    forgotPassword: 'Forgot password?', resetPasswordTitle: 'Reset your password', resetPasswordBody: 'Enter your email and we will send you a secure reset link.', sendResetLink: 'Send reset link', resetLinkSent: 'Check your email for a password reset link.', backToSignIn: 'Back to sign in', newPassword: 'New password', confirmPassword: 'Confirm password', updatePassword: 'Update password', passwordUpdated: 'Password updated successfully. You can sign in now.', passwordsDoNotMatch: 'Passwords do not match.', authErrorEmailNotConfirmed: 'Please confirm your email first. Check your inbox for the confirmation message.', authErrorResetExpired: 'This reset link is invalid or expired. Request a new one.',
    authSubmitting: 'Please wait...', authSignInSuccess: 'Signed in successfully.', authSignUpSuccess: 'Account created. Check your email to confirm. You received 100 Coins + 5 Gems as your welcome bonus.',
    authErrorGeneric: 'Something went wrong. Please try again.', authErrorInvalidCredentials: 'Invalid email or password.', authErrorEmailInUse: 'An account with this email already exists.',
    authErrorInvalidEmail: 'Please enter a valid email address.', authErrorPasswordTooShort: 'Password must be at least 6 characters.',
starterCompanionTitle: 'Your first companion is waiting', starterCompanionBody: 'Start with study, not power. Complete two study days to unlock Sparky, your gentle starter companion.', starterCompanionRequirement: '2 study days unlocks your first companion', coinGuideTitle: 'How to earn Coins', coinGuideBody: 'Complete verified study sessions and daily goals. Your effort earns Coins; spending never changes your rank.', firstDayMessage: 'Great first day! Keep your second study day going to unlock your first companion.', secondDayMessage: 'Two study days complete! Your starter companion is ready to claim.', paymentMethods: 'Payment methods', secureCheckout: 'Secure checkout', parentApproval: 'For younger students, purchases should be completed with a parent or guardian.',
    dailyBonus: 'Daily Coin cap', dailyBonusBody: 'Earn up to 60 Coins per day from verified study. Coins are awarded when a study session is fully verified, based on the verified minutes completed.', dailyBonusOnce: 'The 60-Coin daily cap is shared across all study sessions.', rewardGuideTitle: 'Exactly how Coins are earned', sessionRewardRule: 'Verified study earns Coins based on fully verified study minutes, up to 60 Coins per day.', withDailyBonus: 'daily cap', coinsShort: 'Coins', rewardGuideFootnote: 'Coins are earned by verified study only; there is no separate +100 daily bonus.', coinsPerDay: 'Up to 60 study Coins per day', planCards: 'Your study cards', aiGenerated: 'AI organized', startPlannedTask: 'Start this task', completedTask: 'Completed', minutes: 'min', nextTask: 'Next task', currentTask: 'Current task', petUnlockJourney: 'Your first companion unlocks after 2 study days', firstDayReward: 'Day 1: up to 60 Coins', secondDayReward: 'Day 2: your first companion', signedInAs: 'Signed in as', guest: 'Guest', close: 'Close',
  },
  de: {
    loadingStudyQuest: 'StudyQuest wird geladen...', studyDashboard: 'Lern-Dashboard', myProfile: 'Mein Profil',
    leaderboards: 'Bestenliste', futureSkins: 'Premium', premiumFeatures: 'Premium-Vorteile', dashboard: 'Dashboard', profile: 'Profil',
    ranks: 'Rangliste', skins: 'Skins', selectASubject: 'Fach auswählen', startFocus: 'Fokus starten', pause: 'Pause',
    reset: 'Zurücksetzen', inFocus: 'Im Fokus', ready: 'Bereit', ambient: 'Hintergrund', dailyStudyGoals: 'Tägliche Lernziele',
    lockInActive: 'Fokus aktiv', studyGoal: 'Lernziel', min: 'Min.', weeklyStreak: 'Wochenserie', companion: 'Begleiter',
    points: 'Punkte', gems: 'Edelsteine', syncing: 'Synchronisierung...', offline: 'Offline', help: 'Hilfe',
    privacy: 'Datenschutz', contact: 'Kontakt', madeWith: 'Erstellt mit', comingSoon: 'Demnächst',
    trackStats: 'Verfolge hier deine Statistiken, Erfolge und Belohnungen.', competeHeroes: 'Tritt gegen andere StudyQuest-Helden an!',
    customizePet: 'Passe dein Haustier an und schalte neue Designs frei!',
    keepGrinding: 'Weiter dranbleiben, Held! Dein Begleiter ist stolz auf dich!',
    everyMinute: 'Jede Minute zählt. Du baust deine Zukunft auf!',
    knowledgePower: 'Wissen ist Macht. Verdiene es, eine Sitzung nach der anderen!',
    stayLocked: 'Bleib fokussiert. Die Streak-Götter schauen zu!', petBelieves: 'Dein Begleiter glaubt an dich. Enttäusche ihn nicht!',
    noSound: 'Kein Ton', quranAudio: 'Koran-Audio', lofiMusic: 'Lo-Fi-Musik', rainAmbient: 'Regengeräusche',
    sunMode: 'In den hellen Modus wechseln', moonMode: 'In den dunklen Modus wechseln', iceMode: 'In den Eismodus wechseln', language: 'Sprache', active: 'AKTIV', days: 'Tage', levelCompanion: 'Begleiter', xp: 'EP', daysShort: 'Tage', selectSubjectHint: 'Fach auswählen',
    levelPrefix: 'Lv.', studentLevel: 'Schülerlevel', lifetimeGoldenStars: 'Goldene Sterne insgesamt', resourceWealth: 'Ressourcen', studyHours: 'Lernstunden', unlockedPets: 'Freigeschaltete Begleiter', equipmentApparel: 'Ausrüstung & Kleidung', equipped: 'AUSGERÜSTET', leaderboard: 'Bestenliste', globalRank: 'Globaler Rang', regionalRank: 'Regionaler Rang', internationalRanking: 'Internationale Rangliste', regionalRanking: 'Regionale Rangliste',
    topStudents: 'Top-Schüler', rank: 'Rang', level: 'Level', streak: 'Serie', goldenStars: 'Goldene Sterne', lifetimeStars: 'Sterne insgesamt', region: 'Region',
    safeStudyLounge: 'Sichere Lernlounge', studyRooms: 'Lernräume', physicsMastermindsRoom: 'Physik-Meisterraum', advancedCalculusHub: 'Fortgeschrittene Analysis',
    javascriptBuildersRoom: 'JavaScript-Bauerraum', englishConversationStudyRoom: 'Englisch-Konversationsraum', chemistryFocusRoom: 'Chemie-Fokusraum', examPreparationRoom: 'Prüfungsvorbereitungsraum',
    activeStudents: 'Aktive Schüler', secureRoom: 'Sicherer Raum', verifiedStudentsOnly: 'Nur verifizierte Schüler', wordFilterActive: 'Wortfilter aktiv', textModerationActive: 'Textmoderation aktiv',
    moderationLog: 'Moderationsprotokoll', reportDisruptiveBehavior: 'Störendes Verhalten melden', report: 'Melden', cancel: 'Abbrechen', submitReport: 'Meldung senden', joinRoom: 'Raum beitreten',
    joinedOfflineLobby: 'Du bist der Offline-Audio-Lounge beigetreten', microphone: 'Mikrofon', speaker: 'Lautsprecher', volume: 'Lautstärke', leaveRoom: 'Raum verlassen', offlineLobby: 'Offline-Lounge',
    mockLocalStatus: 'Demo / Lokalstatus', moderationActive: 'Moderation aktiv', automatedWordFiltering: 'Automatischer Wortfilter: AKTIV', reportReason: 'Meldegrund',
    reportSubmitted: 'Meldung lokal übermittelt.', selectReason: 'Grund auswählen', reasonDisruption: 'Störendes Verhalten', reasonHarassment: 'Belästigung oder Mobbing', reasonSpam: 'Spam oder wiederholte Störung',
    localMockNotice: 'Offline-Demo-Lounge — keine echte Sprachverbindung ist aktiv.', roomDescriptionPhysics: 'Konzentriertes Problemlösen und Physik-Wiederholung.', roomDescriptionCalculus: 'Fortgeschrittene Analysis und Prüfungsübungen.', roomDescriptionJavaScript: 'JavaScript-Projekte gemeinsam bauen und wiederholen.',
    roomDescriptionEnglish: 'Englische Konversation in einem lernorientierten Raum üben.', roomDescriptionChemistry: 'Chemie-Wiederholung, Formeln und konzentrierte Aufgaben.', roomDescriptionExam: 'Ruhige Prüfungsvorbereitung und Lernplanung.', secureLocalLounge: 'Lokale Sicherheitsebene',
    noRealVoiceConnection: 'Keine Echtzeit-Sprachverbindung', globalStudents: 'Globale Schüler', regionalStudents: 'Regionale Schüler',
    displayName: 'Anzeigename', chooseAvatar: 'Wähle deinen Avatar',
    interactiveStats: 'Interaktive Statistiken', studyHoursGoal: 'Lernstunden', studyHoursSubtitle: 'Fokusstunden diese Woche', coinsEarned: 'Verdiente Münzen', coinsEarnedSubtitle: 'Gesammelte Währung', gemsCollected: 'Gesammelte Edelsteine', gemsCollectedSubtitle: 'Premium-Belohnungen', goalProgress: 'Zielfortschritt',
    companionsTab: 'Begleiter', skinsTab: 'Charakter-Skins', profileFramesTab: 'Profilrahmen', equip: 'Ausrüsten', unequip: 'Ablegen', rarityAll: 'Alle', rarityMythic: 'Mythisch', inventorySection: 'Inventar', skinType: 'Skin', petType: 'Haustier',
    dailyCorrectTitle: 'Perfekter Tag', dailyCorrectBody: 'Du hast heute alle KI-Aufgaben abgeschlossen. +30 Coins verdient.', dailyIncompleteBody: 'Schließe alle KI-Aufgaben ab, damit der Tag als richtig zählt. Ein richtiger Tag gibt +30 Coins.', goldenStarProgress: 'Goldener Stern: {count}/26 richtige Tage',
    account: 'Konto', signIn: 'Anmelden', signUp: 'Registrieren', signOut: 'Abmelden', createAccount: 'Konto erstellen', email: 'E-Mail', password: 'Passwort',
    forgotPassword: 'Passwort vergessen?', resetPasswordTitle: 'Passwort zurücksetzen', resetPasswordBody: 'Gib deine E-Mail ein und wir senden dir einen sicheren Link zum Zurücksetzen.', sendResetLink: 'Link zum Zurücksetzen senden', resetLinkSent: 'Prüfe deine E-Mail auf den Link zum Zurücksetzen.', backToSignIn: 'Zur Anmeldung', newPassword: 'Neues Passwort', confirmPassword: 'Passwort bestätigen', updatePassword: 'Passwort aktualisieren', passwordUpdated: 'Passwort erfolgreich aktualisiert. Du kannst dich jetzt anmelden.', passwordsDoNotMatch: 'Die Passwörter stimmen nicht überein.', authErrorEmailNotConfirmed: 'Bitte bestätige zuerst deine E-Mail. Prüfe deinen Posteingang.', authErrorResetExpired: 'Dieser Zurücksetzungslink ist ungültig oder abgelaufen. Fordere einen neuen an.',
    authSubmitting: 'Bitte warten...', authSignInSuccess: 'Erfolgreich angemeldet.', authSignUpSuccess: 'Konto erstellt. Bestätige deine E-Mail. Du erhältst 100 Münzen + 5 Gems als Willkommensbonus.',
    authErrorGeneric: 'Etwas ist schiefgelaufen. Bitte erneut versuchen.', authErrorInvalidCredentials: 'Ungültige E-Mail oder Passwort.', authErrorEmailInUse: 'Ein Konto mit dieser E-Mail existiert bereits.',
    authErrorInvalidEmail: 'Bitte gib eine gültige E-Mail-Adresse ein.', authErrorPasswordTooShort: 'Das Passwort muss mindestens 6 Zeichen lang sein.',
starterCompanionTitle: 'Dein erster Begleiter wartet', starterCompanionBody: 'Starte mit Lernen, nicht mit Stärke. Schließe zwei Lerntage ab, um Sparky als sanften Startbegleiter freizuschalten.', starterCompanionRequirement: '2 Lerntage schalten deinen ersten Begleiter frei', coinGuideTitle: 'So verdienst du Münzen', coinGuideBody: 'Schließe verifizierte Lernsitzungen und Tagesziele ab. Leistung bringt Münzen; Ausgaben verändern deinen Rang nicht.', firstDayMessage: 'Starker erster Tag! Bleib am zweiten Lerntag dran, um deinen ersten Begleiter freizuschalten.', secondDayMessage: 'Zwei Lerntage geschafft! Dein Startbegleiter kann freigeschaltet werden.', paymentMethods: 'Zahlungsmethoden', secureCheckout: 'Sicherer Checkout', parentApproval: 'Für jüngere Schüler sollten Käufe mit einem Elternteil oder Erziehungsberechtigten abgeschlossen werden.',
    dailyBonus: 'Tägliches Münzlimit', dailyBonusBody: 'Bis zu 60 Münzen pro Tag durch verifiziertes Lernen. Münzen werden nach vollständig verifizierten Lernsitzungen entsprechend den verifizierten Minuten vergeben.', dailyBonusOnce: 'Das Tageslimit von 60 Münzen gilt für alle Lernsitzungen zusammen.', rewardGuideTitle: 'So werden Münzen genau verdient', sessionRewardRule: 'Verifiziertes Lernen bringt Münzen entsprechend den vollständig verifizierten Lernminuten, bis zu 60 Münzen pro Tag.', withDailyBonus: 'Tageslimit', coinsShort: 'Münzen', rewardGuideFootnote: 'Münzen gibt es nur für verifiziertes Lernen; keinen separaten +100-Tagesbonus.', coinsPerDay: 'Bis zu 60 Lernmünzen pro Tag', planCards: 'Deine Lernkarten', aiGenerated: 'KI-organisiert', startPlannedTask: 'Aufgabe starten', completedTask: 'Abgeschlossen', minutes: 'Min.', nextTask: 'Nächste Aufgabe', currentTask: 'Aktuelle Aufgabe', petUnlockJourney: 'Dein erster Begleiter wird nach 2 Lerntagen freigeschaltet', firstDayReward: 'Tag 1: bis zu 60 Münzen', secondDayReward: 'Tag 2: dein erster Begleiter', signedInAs: 'Angemeldet als', guest: 'Gast', close: 'Schließen',
  },
  ja: {
    loadingStudyQuest: 'StudyQuestを読み込んでいます...', studyDashboard: '学習ダッシュボード', myProfile: 'マイプロフィール',
    leaderboards: 'ランキング', futureSkins: 'Premium', premiumFeatures: 'Premium 特典', dashboard: 'ダッシュボード', profile: 'プロフィール',
    ranks: 'ランキング', skins: 'スキン', selectASubject: '科目を選択', startFocus: '集中を開始', pause: '一時停止',
    reset: 'リセット', inFocus: '集中中', ready: '準備完了', ambient: '環境音', dailyStudyGoals: '今日の学習目標',
    lockInActive: '集中モード中', studyGoal: '学習目標', min: '分', weeklyStreak: '週間ストリーク', companion: '仲間',
    points: 'ポイント', gems: 'ジェム', syncing: '同期中...', offline: 'オフライン', help: 'ヘルプ', privacy: 'プライバシー',
    contact: 'お問い合わせ', madeWith: '制作', comingSoon: '近日公開', trackStats: 'ここで統計、実績、報酬を確認できます。',
    competeHeroes: 'StudyQuestの仲間たちと競おう！', customizePet: 'ペットをカスタマイズして新しいテーマを解放しよう！',
    keepGrinding: 'その調子！あなたの仲間も誇りに思っています！', everyMinute: '一分一秒が大切。未来を築いています！',
    knowledgePower: '知識は力。一回のセッションずつ積み上げよう！', stayLocked: '集中を続けよう。ストリークの神々が見ています！',
    petBelieves: 'あなたの仲間は信じています。期待に応えよう！', noSound: '無音', quranAudio: 'クルアーン音声',
    lofiMusic: 'Lo-Fi音楽', rainAmbient: '雨の環境音', sunMode: 'ライトモードに切り替え', moonMode: 'ダークモードに切り替え', iceMode: 'アイスモードに切り替え', language: '言語', active: 'アクティブ', days: '日', levelCompanion: '仲間', xp: 'XP', daysShort: '日', selectSubjectHint: '科目を選択',
    levelPrefix: 'Lv.', studentLevel: '学生レベル', lifetimeGoldenStars: '累計ゴールデンスター', resourceWealth: 'リソース', studyHours: '学習時間', unlockedPets: '解放済みペット', equipmentApparel: '装備とアパレル', equipped: '装備中', leaderboard: 'ランキング', globalRank: '世界ランキング', regionalRank: '地域ランキング', internationalRanking: '国際ランキング', regionalRanking: '地域別ランキング',
    topStudents: '上位の学生', rank: '順位', level: 'レベル', streak: '連続記録', goldenStars: 'ゴールドスター', lifetimeStars: '累計スター', region: '地域',
    safeStudyLounge: '安全な学習ラウンジ', studyRooms: '学習ルーム', physicsMastermindsRoom: '物理マスターズルーム', advancedCalculusHub: '上級微積分ハブ',
    javascriptBuildersRoom: 'JavaScriptビルダーズルーム', englishConversationStudyRoom: '英会話学習ルーム', chemistryFocusRoom: '化学集中ルーム', examPreparationRoom: '試験対策ルーム',
    activeStudents: '参加中の学生', secureRoom: '安全なルーム', verifiedStudentsOnly: '認証済み学生のみ', wordFilterActive: 'ワードフィルター有効', textModerationActive: 'テキストモデレーション有効',
    moderationLog: 'モデレーションログ', reportDisruptiveBehavior: '迷惑行為を報告', report: '報告', cancel: 'キャンセル', submitReport: '報告を送信', joinRoom: 'ルームに参加',
    joinedOfflineLobby: 'オフライン音声ラウンジに参加しました', microphone: 'マイク', speaker: 'スピーカー', volume: '音量', leaveRoom: '退出', offlineLobby: 'オフラインラウンジ',
    mockLocalStatus: 'モック / ローカル状態', moderationActive: 'モデレーション有効', automatedWordFiltering: '自動ワードフィルター: 有効', reportReason: '報告理由',
    reportSubmitted: '報告をローカルで送信しました。', selectReason: '理由を選択', reasonDisruption: '迷惑行為', reasonHarassment: '嫌がらせ・いじめ', reasonSpam: 'スパム・繰り返しの迷惑行為',
    localMockNotice: 'オフラインのモックラウンジ — 実際の音声接続はありません。', roomDescriptionPhysics: '物理の問題演習と復習に集中します。', roomDescriptionCalculus: '上級微積分の練習と試験対策です。', roomDescriptionJavaScript: 'JavaScriptプロジェクトを一緒に作り、復習します。',
    roomDescriptionEnglish: '学習に集中した部屋で英会話を練習します。', roomDescriptionChemistry: '化学の復習、公式、集中問題演習です。', roomDescriptionExam: '静かな試験対策と復習計画のための部屋です。', secureLocalLounge: 'ローカル安全レイヤー',
    noRealVoiceConnection: 'リアルタイム音声接続なし', globalStudents: '世界の学生', regionalStudents: '地域の学生',
    displayName: '表示名', chooseAvatar: 'アバターを選択',
    interactiveStats: 'インタラクティブ統計', studyHoursGoal: '学習時間', studyHoursSubtitle: '今週の集中時間', coinsEarned: '獲得コイン', coinsEarnedSubtitle: '獲得した通貨', gemsCollected: '収集したジェム', gemsCollectedSubtitle: 'プレミアム報酬', goalProgress: '目標の進捗',
    companionsTab: '仲間', skinsTab: 'キャラクタースキン', profileFramesTab: 'プロフィールフレーム', equip: '装備', unequip: '装備解除', rarityAll: 'すべて', rarityMythic: '神話', inventorySection: '在庫', skinType: 'スキン', petType: 'ペット',
    dailyCorrectTitle: '完璧な一日', dailyCorrectBody: '今日のAIタスクをすべて完了しました。+30コイン獲得。', dailyIncompleteBody: '今日のAIタスクをすべて完了すると正しい一日になります。正しい日は+30コインです。', goldenStarProgress: 'ゴールドスター：正しい日 {count}/26',
    account: 'アカウント', signIn: 'ログイン', signUp: '新規登録', signOut: 'ログアウト', createAccount: 'アカウント作成', email: 'メール', password: 'パスワード',
    forgotPassword: 'パスワードを忘れましたか？', resetPasswordTitle: 'パスワードをリセット', resetPasswordBody: 'メールアドレスを入力すると、安全なリセットリンクを送信します。', sendResetLink: 'リセットリンクを送信', resetLinkSent: 'パスワードリセットのリンクをメールで確認してください。', backToSignIn: 'ログインに戻る', newPassword: '新しいパスワード', confirmPassword: 'パスワードを確認', updatePassword: 'パスワードを更新', passwordUpdated: 'パスワードを更新しました。これでログインできます。', passwordsDoNotMatch: 'パスワードが一致しません。', authErrorEmailNotConfirmed: '先にメールアドレスを確認してください。受信トレイを確認してください。', authErrorResetExpired: 'このリセットリンクは無効または期限切れです。新しいリンクをリクエストしてください。',
    authSubmitting: 'お待ちください...', authSignInSuccess: 'ログインしました。', authSignUpSuccess: 'アカウントを作成しました。メールを確認してください。ウェルカムボーナスとして100コイン＋5ジェムを受け取りました。',
    authErrorGeneric: '問題が発生しました。もう一度お試しください。', authErrorInvalidCredentials: 'メールアドレスまたはパスワードが無効です。', authErrorEmailInUse: 'このメールアドレスのアカウントは既に存在します。',
    authErrorInvalidEmail: '有効なメールアドレスを入力してください。', authErrorPasswordTooShort: 'パスワードは6文字以上必要です。',
starterCompanionTitle: '最初のコンパニオンが待っています', starterCompanionBody: '強さではなく学習から始めよう。2日間学習すると、最初の仲間Sparkyを解放できます。', starterCompanionRequirement: '2日間の学習で最初の仲間を解放', coinGuideTitle: 'コインの集め方', coinGuideBody: '認証された学習セッションと毎日の目標を完了してコインを獲得します。努力がコインを生み、支出で順位は変わりません。', firstDayMessage: '初日クリア！もう1日学習して最初の仲間を解放しよう。', secondDayMessage: '2日間の学習を達成！最初の仲間を解放できます。', paymentMethods: '支払い方法', secureCheckout: '安全な決済', parentApproval: '未成年の学生は、購入を保護者と一緒に行ってください。',
    dailyBonus: '毎日のコイン上限', dailyBonusBody: '認証済み学習で1日最大60コイン。コインは学習セッションを完全に認証した後、認証済みの学習時間に応じて獲得します。', dailyBonusOnce: '60コインの上限はその日のすべての学習セッションで共有されます。', rewardGuideTitle: 'コインの獲得方法', sessionRewardRule: '認証済み学習は完全に認証された学習時間に応じてコインを獲得し、1日最大60コインです。', withDailyBonus: '日次上限', coinsShort: 'コイン', rewardGuideFootnote: 'コインは認証済み学習だけで獲得でき、+100の別ボーナスはありません。', coinsPerDay: '1日最大60学習コイン', planCards: '学習プランカード', aiGenerated: 'AIが整理', startPlannedTask: 'このタスクを開始', completedTask: '完了', minutes: '分', nextTask: '次のタスク', currentTask: '現在のタスク', petUnlockJourney: '最初の仲間は2日間の学習で解放されます', firstDayReward: '1日目: 最大60コイン', secondDayReward: '2日目: 最初の仲間', signedInAs: 'ログイン中:', guest: 'ゲスト', close: '閉じる',
  },
  ar: {
    loadingStudyQuest: 'جارٍ تحميل StudyQuest...', studyDashboard: 'لوحة الدراسة', myProfile: 'ملفي الشخصي',
    leaderboards: 'لوحة المتصدرين', futureSkins: 'Premium', premiumFeatures: 'مميزات البرايم', dashboard: 'لوحة التحكم', profile: 'الملف الشخصي',
    ranks: 'الترتيب', skins: 'الأشكال', selectASubject: 'اختر مادة', startFocus: 'ابدأ التركيز', pause: 'إيقاف مؤقت',
    reset: 'إعادة ضبط', inFocus: 'في وضع التركيز', ready: 'جاهز', ambient: 'الصوت المحيط', dailyStudyGoals: 'أهداف الدراسة اليومية',
    lockInActive: 'وضع التركيز نشط', studyGoal: 'هدف الدراسة', min: 'دقيقة', weeklyStreak: 'سلسلة الأسبوع', companion: 'الرفيق',
    points: 'النقاط', gems: 'الجواهر', syncing: 'جارٍ المزامنة...', offline: 'غير متصل', help: 'المساعدة', privacy: 'الخصوصية',
    contact: 'تواصل معنا', madeWith: 'صُنع بـ', comingSoon: 'قريبًا', trackStats: 'تابع إحصاءاتك وإنجازاتك ومكافآتك هنا.',
    competeHeroes: 'نافس أبطال StudyQuest الآخرين!', customizePet: 'خصص رفيقك وافتح أشكالًا جديدة!',
    keepGrinding: 'استمر يا بطل! رفيقك فخور بك!', everyMinute: 'كل دقيقة مهمة. أنت تبني مستقبلك!',
    knowledgePower: 'المعرفة قوة. اجمعها جلسة بعد جلسة!', stayLocked: 'حافظ على تركيزك. آلهة السلسلة تراقبك!',
    petBelieves: 'رفيقك يؤمن بك. لا تخذله!', noSound: 'بدون صوت', quranAudio: 'صوت القرآن', lofiMusic: 'موسيقى Lo-Fi',
    rainAmbient: 'صوت المطر', sunMode: 'التبديل إلى الوضع الفاتح', moonMode: 'التبديل إلى الوضع الداكن', iceMode: 'التبديل إلى الوضع الثلجي', language: 'اللغة', active: 'نشط', days: 'أيام', levelCompanion: 'الرفيق', xp: 'نقاط خبرة', daysShort: 'أيام', selectSubjectHint: 'اختر مادة',
    levelPrefix: 'المستوى', studentLevel: 'مستوى الطالب', lifetimeGoldenStars: 'النجوم الذهبية الإجمالية', resourceWealth: 'الموارد', studyHours: 'ساعات الدراسة', unlockedPets: 'الحيوانات الأليفة المفتوحة', equipmentApparel: 'المعدات والملابس', equipped: 'مجهز', leaderboard: 'لوحة المتصدرين', globalRank: 'الترتيب العالمي', regionalRank: 'الترتيب الإقليمي', internationalRanking: 'التصنيف الدولي', regionalRanking: 'التصنيف الإقليمي',
    topStudents: 'أفضل الطلاب', rank: 'الترتيب', level: 'المستوى', streak: 'السلسلة', goldenStars: 'النجوم الذهبية', lifetimeStars: 'إجمالي النجوم', region: 'المنطقة',
    safeStudyLounge: 'صالة الدراسة الآمنة', studyRooms: 'غرف الدراسة', physicsMastermindsRoom: 'غرفة عباقرة الفيزياء', advancedCalculusHub: 'مركز التفاضل والتكامل المتقدم',
    javascriptBuildersRoom: 'غرفة مطوري JavaScript', englishConversationStudyRoom: 'غرفة دراسة المحادثة الإنجليزية', chemistryFocusRoom: 'غرفة التركيز على الكيمياء', examPreparationRoom: 'غرفة الاستعداد للامتحانات',
    activeStudents: 'الطلاب النشطون', secureRoom: 'غرفة آمنة', verifiedStudentsOnly: 'للطلاب الموثقين فقط', wordFilterActive: 'فلتر الكلمات نشط', textModerationActive: 'مراجعة النصوص نشطة',
    moderationLog: 'سجل الإشراف', reportDisruptiveBehavior: 'الإبلاغ عن السلوك المزعج', report: 'إبلاغ', cancel: 'إلغاء', submitReport: 'إرسال البلاغ', joinRoom: 'انضم للغرفة',
    joinedOfflineLobby: 'انضممت إلى صالة الصوت غير المتصلة', microphone: 'الميكروفون', speaker: 'مكبر الصوت', volume: 'مستوى الصوت', leaveRoom: 'مغادرة الغرفة', offlineLobby: 'الصالة غير المتصلة',
    mockLocalStatus: 'حالة تجريبية / محلية', moderationActive: 'الإشراف نشط', automatedWordFiltering: 'فلترة الكلمات تلقائيًا: نشطة', reportReason: 'سبب البلاغ',
    reportSubmitted: 'تم إرسال البلاغ محليًا.', selectReason: 'اختر سببًا', reasonDisruption: 'سلوك مزعج', reasonHarassment: 'مضايقة أو تنمر', reasonSpam: 'رسائل مزعجة أو إزعاج متكرر',
    localMockNotice: 'صالة تجريبية غير متصلة — لا يوجد اتصال صوتي حقيقي.', roomDescriptionPhysics: 'حل مسائل الفيزياء ومراجعتها بتركيز.', roomDescriptionCalculus: 'تدريب متقدم على التفاضل والتكامل واختبارات الامتحان.', roomDescriptionJavaScript: 'ابنِ وراجع مشاريع JavaScript معًا.',
    roomDescriptionEnglish: 'تدرّب على المحادثة الإنجليزية في غرفة مخصصة للدراسة.', roomDescriptionChemistry: 'مراجعة الكيمياء والقوانين وحل المسائل بتركيز.', roomDescriptionExam: 'استعداد هادئ للامتحانات وتخطيط المراجعة.', secureLocalLounge: 'طبقة أمان محلية',
    noRealVoiceConnection: 'لا يوجد اتصال صوتي مباشر', globalStudents: 'الطلاب عالميًا', regionalStudents: 'الطلاب إقليميًا',
    displayName: 'اسم العرض', chooseAvatar: 'اختر صورتك الرمزية',
    interactiveStats: 'إحصائات تفاعلية', studyHoursGoal: 'ساعات الدراسة', studyHoursSubtitle: 'ساعات التركيز هذا الأسبوع', coinsEarned: 'العملات المكتسبة', coinsEarnedSubtitle: 'إجمالي العملات المجموعة', gemsCollected: 'الجواهر المجموعة', gemsCollectedSubtitle: 'مكافآت مميزة مكتسبة', goalProgress: 'تقدم الهدف',
    companionsTab: 'الرفقاء', skinsTab: 'إطارات البروفايل', profileFramesTab: 'إطارات البروفايل', equip: 'تجهيز', unequip: 'إزالة', rarityAll: 'الكل', rarityMythic: 'أسطوري', inventorySection: 'المخزون', skinType: 'شكل', petType: 'حيوان',
    dailyCorrectTitle: 'يوم كامل', dailyCorrectBody: 'أنجزت كل مهام الذكاء الاصطناعي اليوم. حصلت على +30 كوين.', dailyIncompleteBody: 'أنجز كل مهام الذكاء الاصطناعي اليوم حتى يُحسب اليوم صحيحًا. اليوم الصحيح يمنح +30 كوين.', goldenStarProgress: 'النجمة الذهبية: {count}/26 يومًا صحيحًا',
    account: 'الحساب', signIn: 'تسجيل الدخول', signUp: 'إنشاء حساب', signOut: 'تسجيل الخروج', createAccount: 'إنشاء حساب', email: 'البريد الإلكتروني', password: 'كلمة المرور',
    forgotPassword: 'نسيت كلمة السر؟', resetPasswordTitle: 'إعادة تعيين كلمة السر', resetPasswordBody: 'اكتب بريدك الإلكتروني وسنرسل لك رابطًا آمنًا لإعادة التعيين.', sendResetLink: 'إرسال رابط التعيين', resetLinkSent: 'افحص بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة السر.', backToSignIn: 'العودة لتسجيل الدخول', newPassword: 'كلمة السر الجديدة', confirmPassword: 'تأكيد كلمة السر', updatePassword: 'تحديث كلمة السر', passwordUpdated: 'تم تحديث كلمة السر بنجاح. يمكنك تسجيل الدخول الآن.', passwordsDoNotMatch: 'كلمتا السر غير متطابقتين.', authErrorEmailNotConfirmed: 'أكد بريدك الإلكتروني أولًا. افحص صندوق الوارد لرسالة التأكيد.', authErrorResetExpired: 'رابط إعادة التعيين غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.',
    authSubmitting: 'يرجى الانتظار...', authSignInSuccess: 'تم تسجيل الدخول بنجاح.', authSignUpSuccess: 'تم إنشاء الحساب. تحقق من بريدك الإلكتروني للتأكيد. حصلت على 100 عملة + 5 جواهر كهدية ترحيبية.',
    authErrorGeneric: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.', authErrorInvalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', authErrorEmailInUse: 'يوجد حساب بهذا البريد الإلكتروني بالفعل.',
    authErrorInvalidEmail: 'يرجى إدخال بريد إلكتروني صالح.', authErrorPasswordTooShort: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.',
starterCompanionTitle: 'رفيقك الأول في انتظارك', starterCompanionBody: 'ابدأ بالمذاكرة وليس بالقوة. أكمل يومين من الدراسة لفتح Sparky، رفيق البداية الهادئ.', starterCompanionRequirement: 'يومان من الدراسة لفتح أول رفيق', coinGuideTitle: 'كيف تجمع العملات؟', coinGuideBody: 'أكمل جلسات مذاكرة موثقة وأهدافك اليومية. مجهودك هو الذي يكسبك العملات، والشراء لا يغيّر ترتيبك.', firstDayMessage: 'بداية ممتازة! أكمل يوم الدراسة الثاني لفتح رفيقك الأول.', secondDayMessage: 'أكملت يومين من الدراسة! رفيق البداية جاهز للفتح.', paymentMethods: 'طرق الدفع', secureCheckout: 'دفع آمن', parentApproval: 'للطلبة الأصغر سنًا، يُفضّل إتمام المشتريات مع ولي الأمر.',
    dailyBonus: 'حد الكوينز اليومي', dailyBonusBody: 'المذاكرة الموثقة تمنحك حتى 60 كوين في اليوم. الكوينز بتتحسب على الدقائق المكتملة والموثقة بعد إنهاء الجلسة.', dailyBonusOnce: 'حد الـ60 كوين مشترك بين كل جلسات المذاكرة في نفس اليوم.', rewardGuideTitle: 'بالضبط: كيف تكسب الكوينز؟', sessionRewardRule: 'المذاكرة الموثقة تمنح كوينز حسب إجمالي الدقائق المكتملة والموثقة، بحد أقصى 60 كوين في اليوم.', withDailyBonus: 'الحد اليومي', coinsShort: 'كوين', rewardGuideFootnote: 'الكوينز بتتجمع من المذاكرة الموثقة فقط، ومفيش مكافأة +100 منفصلة.', coinsPerDay: 'حتى 60 كوين مذاكرة في اليوم', planCards: 'بطاقات خطتك الدراسية', aiGenerated: 'منظم بالذكاء الاصطناعي', startPlannedTask: 'ابدأ هذه المهمة', completedTask: 'مكتملة', minutes: 'دقيقة', nextTask: 'المهمة التالية', currentTask: 'المهمة الحالية', petUnlockJourney: 'رفيقك الأول يُفتح بعد يومين من المذاكرة', firstDayReward: 'اليوم الأول: حتى 60 كوين', secondDayReward: 'اليوم الثاني: رفيقك الأول', signedInAs: 'مسجّل الدخول باسم', guest: 'زائر', close: 'إغلاق',
  },
  fr: {
    loadingStudyQuest: 'Chargement de StudyQuest...', studyDashboard: 'Tableau de bord', myProfile: 'Mon profil',
    leaderboards: 'Classement', futureSkins: 'Premium', premiumFeatures: 'Avantages Premium', dashboard: 'Tableau de bord', profile: 'Profil', ranks: 'Classement',
    skins: 'Skins', selectASubject: 'Choisir une matière', startFocus: 'Commencer la concentration', pause: 'Pause', reset: 'Réinitialiser',
    inFocus: 'En concentration', ready: 'Prêt', ambient: 'Ambiance', dailyStudyGoals: 'Objectifs d’étude du jour', lockInActive: 'Concentration active',
    studyGoal: 'Objectif d’étude', min: 'min', weeklyStreak: 'Série de la semaine', companion: 'Compagnon', points: 'Points', gems: 'Gemmes',
    syncing: 'Synchronisation...', offline: 'Hors ligne', help: 'Aide', privacy: 'Confidentialité', contact: 'Contact', madeWith: 'Créé avec',
    comingSoon: 'Bientôt disponible', trackStats: 'suivez ici vos statistiques, succès et récompenses.', competeHeroes: 'affrontez les autres héros de StudyQuest !',
    customizePet: 'personnalisez votre compagnon et débloquez de nouveaux thèmes !',
    keepGrinding: 'Continue, héros ! Ton compagnon est fier de toi !', everyMinute: 'Chaque minute compte. Tu construis ton avenir !',
    knowledgePower: 'Le savoir est une force. Gagne-le session après session !', stayLocked: 'Reste concentré. Les dieux de la série te regardent !',
    petBelieves: 'Ton compagnon croit en toi. Ne le déçois pas !', noSound: 'Aucun son', quranAudio: 'Audio du Coran', lofiMusic: 'Musique Lo-Fi',
    rainAmbient: 'Ambiance pluie', sunMode: 'Passer au mode clair', moonMode: 'Passer au mode sombre', iceMode: 'Passer au mode glacé', language: 'Langue', active: 'ACTIF', days: 'jours', levelCompanion: 'Compagnon', xp: 'XP', daysShort: 'jours', selectSubjectHint: 'Choisir une matière',
    levelPrefix: 'Niv.', studentLevel: 'Niveau de l’élève', lifetimeGoldenStars: 'Étoiles dorées cumulées', resourceWealth: 'Ressources', studyHours: 'Heures d’étude', unlockedPets: 'Animaux débloqués', equipmentApparel: 'Équipement et vêtements', equipped: 'ÉQUIPÉ', leaderboard: 'Classement', globalRank: 'Classement mondial', regionalRank: 'Classement régional', internationalRanking: 'Classement international', regionalRanking: 'Classement régional',
    topStudents: 'Meilleurs élèves', rank: 'Rang', level: 'Niveau', streak: 'Série', goldenStars: 'Étoiles dorées', lifetimeStars: 'Étoiles cumulées', region: 'Région',
    safeStudyLounge: 'Salon d’étude sécurisé', studyRooms: 'Salles d’étude', physicsMastermindsRoom: 'Salle des maîtres de physique', advancedCalculusHub: 'Hub de calcul avancé',
    javascriptBuildersRoom: 'Salle des builders JavaScript', englishConversationStudyRoom: 'Salle d’étude de conversation anglaise', chemistryFocusRoom: 'Salle de concentration en chimie', examPreparationRoom: 'Salle de préparation aux examens',
    activeStudents: 'Élèves actifs', secureRoom: 'Salle sécurisée', verifiedStudentsOnly: 'Élèves vérifiés uniquement', wordFilterActive: 'Filtre de mots actif', textModerationActive: 'Modération des textes active',
    moderationLog: 'Journal de modération', reportDisruptiveBehavior: 'Signaler un comportement perturbateur', report: 'Signaler', cancel: 'Annuler', submitReport: 'Envoyer le signalement', joinRoom: 'Rejoindre la salle',
    joinedOfflineLobby: 'Vous avez rejoint le salon audio hors ligne', microphone: 'Microphone', speaker: 'Haut-parleur', volume: 'Volume', leaveRoom: 'Quitter la salle', offlineLobby: 'Salon hors ligne',
    mockLocalStatus: 'État simulé / local', moderationActive: 'Modération active', automatedWordFiltering: 'Filtrage automatique des mots : ACTIF', reportReason: 'Motif du signalement',
    reportSubmitted: 'Signalement envoyé localement.', selectReason: 'Choisir un motif', reasonDisruption: 'Comportement perturbateur', reasonHarassment: 'Harcèlement ou intimidation', reasonSpam: 'Spam ou perturbations répétées',
    localMockNotice: 'Salon simulé hors ligne — aucune connexion vocale réelle.', roomDescriptionPhysics: 'Résolution de problèmes et révision de physique.', roomDescriptionCalculus: 'Pratique avancée du calcul et exercices d’examen.', roomDescriptionJavaScript: 'Construisez et révisez des projets JavaScript ensemble.',
    roomDescriptionEnglish: 'Pratiquez la conversation anglaise dans une salle axée sur les études.', roomDescriptionChemistry: 'Révision de chimie, formules et exercices ciblés.', roomDescriptionExam: 'Préparation calme aux examens et planification des révisions.', secureLocalLounge: 'Couche de sécurité locale',
    noRealVoiceConnection: 'Aucune connexion vocale en temps réel', globalStudents: 'Élèves du monde', regionalStudents: 'Élèves de la région',
    displayName: 'Nom affiché', chooseAvatar: 'Choisis ton avatar',
    interactiveStats: 'Statistiques interactives', studyHoursGoal: 'Heures d’étude', studyHoursSubtitle: 'Heures de concentration cette semaine', coinsEarned: 'Pièces gagnées', coinsEarnedSubtitle: 'Monnaie totale collectée', gemsCollected: 'Gemmes collectées', gemsCollectedSubtitle: 'Récompenses premium gagnées', goalProgress: 'Progression de l’objectif',
    companionsTab: 'Compagnons', skinsTab: 'Skins de personnage', profileFramesTab: 'Cadres de profil', equip: 'Équiper', unequip: 'Retirer', rarityAll: 'Tous', rarityMythic: 'Mythique', inventorySection: 'Inventaire', skinType: 'Skin', petType: 'Animal',
    dailyCorrectTitle: 'Journée parfaite', dailyCorrectBody: 'Toutes les tâches IA du jour sont terminées. +30 Coins gagnés.', dailyIncompleteBody: 'Terminez toutes les tâches IA du jour pour valider la journée. Une journée validée donne +30 Coins.', goldenStarProgress: 'Étoile dorée : {count}/26 jours validés',
    account: 'Compte', signIn: 'Se connecter', signUp: 'S’inscrire', signOut: 'Se déconnecter', createAccount: 'Créer un compte', email: 'E-mail', password: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié ?', resetPasswordTitle: 'Réinitialiser le mot de passe', resetPasswordBody: 'Saisis ton e-mail et nous t’enverrons un lien sécurisé de réinitialisation.', sendResetLink: 'Envoyer le lien', resetLinkSent: 'Vérifie ton e-mail pour le lien de réinitialisation.', backToSignIn: 'Retour à la connexion', newPassword: 'Nouveau mot de passe', confirmPassword: 'Confirmer le mot de passe', updatePassword: 'Mettre à jour le mot de passe', passwordUpdated: 'Mot de passe mis à jour. Tu peux maintenant te connecter.', passwordsDoNotMatch: 'Les mots de passe ne correspondent pas.', authErrorEmailNotConfirmed: 'Confirme d’abord ton e-mail. Vérifie ta boîte de réception.', authErrorResetExpired: 'Ce lien de réinitialisation est invalide ou expiré. Demande-en un nouveau.',
    authSubmitting: 'Veuillez patienter...', authSignInSuccess: 'Connexion réussie.', authSignUpSuccess: 'Compte créé. Vérifie ton e-mail pour confirmer. Tu reçois 100 pièces + 5 gemmes en bonus de bienvenue.',
    authErrorGeneric: 'Une erreur est survenue. Veuillez réessayer.', authErrorInvalidCredentials: 'E-mail ou mot de passe invalide.', authErrorEmailInUse: 'Un compte avec cet e-mail existe déjà.',
    authErrorInvalidEmail: 'Veuillez saisir une adresse e-mail valide.', authErrorPasswordTooShort: 'Le mot de passe doit contenir au moins 6 caractères.',
starterCompanionTitle: 'Ton premier compagnon t’attend', starterCompanionBody: 'Commence par apprendre, pas par la puissance. Termine deux jours d’étude pour débloquer Sparky, ton compagnon de départ.', starterCompanionRequirement: '2 jours d’étude pour débloquer ton premier compagnon', coinGuideTitle: 'Comment gagner des pièces', coinGuideBody: 'Termine des sessions d’étude vérifiées et tes objectifs quotidiens. Tes efforts rapportent des pièces; les achats ne changent pas ton classement.', firstDayMessage: 'Super premier jour ! Continue un deuxième jour pour débloquer ton premier compagnon.', secondDayMessage: 'Deux jours d’étude terminés ! Ton compagnon de départ est prêt à être débloqué.', paymentMethods: 'Modes de paiement', secureCheckout: 'Paiement sécurisé', parentApproval: 'Pour les jeunes élèves, les achats doivent être effectués avec un parent ou tuteur.',
    dailyBonus: 'Plafond quotidien de pièces', dailyBonusBody: 'Jusqu’à 60 pièces par jour grâce à l’étude vérifiée. Les pièces sont accordées après une session entièrement vérifiée, selon les minutes vérifiées complétées.', dailyBonusOnce: 'Le plafond de 60 pièces est partagé entre toutes les sessions du jour.', rewardGuideTitle: 'Comment les pièces sont gagnées', sessionRewardRule: 'L’étude vérifiée rapporte des pièces selon les minutes d’étude entièrement vérifiées, jusqu’à 60 pièces par jour.', withDailyBonus: 'plafond quotidien', coinsShort: 'pièces', rewardGuideFootnote: 'Les pièces viennent uniquement de l’étude vérifiée; aucun bonus séparé de +100.', coinsPerDay: 'Jusqu’à 60 pièces d’étude par jour', planCards: 'Tes cartes d’étude', aiGenerated: 'Organisé par l’IA', startPlannedTask: 'Commencer cette tâche', completedTask: 'Terminé', minutes: 'min', nextTask: 'Tâche suivante', currentTask: 'Tâche actuelle', petUnlockJourney: 'Ton premier compagnon se débloque après 2 jours d’étude', firstDayReward: 'Jour 1 : jusqu’à 60 pièces', secondDayReward: 'Jour 2 : ton premier compagnon', signedInAs: 'Connecté en tant que', guest: 'Invité', close: 'Fermer',
  },
};



export const SUBJECT_TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  Mathematics: { en: 'Mathematics', de: 'Mathematik', ja: '数学', ar: 'الرياضيات', fr: 'Mathématiques' },
  'Computer Science': { en: 'Computer Science', de: 'Informatik', ja: 'コンピューターサイエンス', ar: 'علوم الحاسوب', fr: 'Informatique' },
  Physics: { en: 'Physics', de: 'Physik', ja: '物理', ar: 'الفيزياء', fr: 'Physique' },
  Arabic: { en: 'Arabic', de: 'Arabisch', ja: 'アラビア語', ar: 'العربية', fr: 'Arabe' },
};

export const WEEKDAY_TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  Sun: { en: 'Sun', de: 'So', ja: '日', ar: 'الأحد', fr: 'Dim' },
  Mon: { en: 'Mon', de: 'Mo', ja: '月', ar: 'الإثنين', fr: 'Lun' },
  Tue: { en: 'Tue', de: 'Di', ja: '火', ar: 'الثلاثاء', fr: 'Mar' },
  Wed: { en: 'Wed', de: 'Mi', ja: '水', ar: 'الأربعاء', fr: 'Mer' },
  Thu: { en: 'Thu', de: 'Do', ja: '木', ar: 'الخميس', fr: 'Jeu' },
  Fri: { en: 'Fri', de: 'Fr', ja: '金', ar: 'الجمعة', fr: 'Ven' },
  Sat: { en: 'Sat', de: 'Sa', ja: '土', ar: 'السبت', fr: 'Sam' },
};

export const AMBIENT_TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  none: { en: 'No Sound', de: 'Kein Ton', ja: '無音', ar: 'بدون صوت', fr: 'Aucun son' },
  quran: { en: 'Quran Audio', de: 'Koran-Audio', ja: 'クルアーン音声', ar: 'تلاوة القرآن', fr: 'Audio du Coran' },
  lofi: { en: 'Lo-Fi Music', de: 'Lo-Fi-Musik', ja: 'Lo-Fi音楽', ar: 'موسيقى Lo-Fi', fr: 'Musique Lo-Fi' },
  rain: { en: 'Rain Ambient', de: 'Regengeräusche', ja: '雨の環境音', ar: 'أجواء المطر', fr: 'Ambiance pluie' },
};

export const PET_TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  Sparky: { en: 'Sparky', de: 'Sparky', ja: 'スパーキー', ar: 'سباركي', fr: 'Sparky' },
  'Volcanic Pup': { en: 'Volcanic Pup', de: 'Vulkanwelpe', ja: '火山の子犬', ar: 'جرو بركاني', fr: 'Chiot volcanique' },
  'Frost Kit': { en: 'Frost Kit', de: 'Frost-Kätzchen', ja: '氷の子ギツネ', ar: 'هر صغير جليدي', fr: 'Petit renard givré' },
  'Aqua Turtle': { en: 'Aqua Turtle', de: 'Wasserschildkröte', ja: 'アクアタートル', ar: 'سلحفاة مائية', fr: 'Tortue aquatique' },
  'Shadow Wyrm': { en: 'Shadow Wyrm', de: 'Schattenwyrm', ja: 'シャドウワーム', ar: 'تنين الظلال', fr: 'Wyrm de l’ombre' },
  'Celestial Phoenix': { en: 'Celestial Phoenix', de: 'Himmlischer Phönix', ja: '天上の不死鳥', ar: 'العنقاء السماوية', fr: 'Phénix céleste' },
  'Ember Raptor': { en: 'Ember Raptor', de: 'Glut-Raptor', ja: 'エンバーラプター', ar: 'رابتور الجمر', fr: 'Raptor de braise' },
  'Azure Drake': { en: 'Azure Drake', de: 'Azur-Drache', ja: 'アズールドレイク', ar: 'تنين أزرق سماوي', fr: 'Drake azur' },
  'Crimson Phoenix': { en: 'Crimson Phoenix', de: 'Purpurphönix', ja: 'クリムゾンフェニックス', ar: 'العنقاء القرمزية', fr: 'Phénix cramoisi' },
  'Storm Griffin': { en: 'Storm Griffin', de: 'Sturmgreif', ja: 'ストームグリフォン', ar: 'غريفين العاصفة', fr: 'Griffon de tempête' },
  'Frost Wolf': { en: 'Frost Wolf', de: 'Frostwolf', ja: 'フロストウルフ', ar: 'ذئب الصقيع', fr: 'Loup givré' },
  'Jade Triceratops': { en: 'Jade Triceratops', de: 'Jade-Triceratops', ja: 'ジェイドトリケラトプス', ar: 'ترايسيراتوبس اليشم', fr: 'Tricératops de jade' },
  'Lunar Wyvern': { en: 'Lunar Wyvern', de: 'Mondwyvern', ja: 'ルナワイバーン', ar: 'وايفرن قمري', fr: 'Wyverne lunaire' },
  'Sunfire Tiger': { en: 'Sunfire Tiger', de: 'Sonnenfeuer-Tiger', ja: 'サンファイアタイガー', ar: 'نمر اللهب الشمسي', fr: 'Tigre solaire ardent' },
};

export const SKIN_TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  'Cyber Hoodie': { en: 'Cyber Hoodie', de: 'Cyber-Hoodie', ja: 'サイバーパーカー', ar: 'هودي سايبر', fr: 'Sweat cyber' },
  'Neon Shades': { en: 'Neon Shades', de: 'Neon-Brille', ja: 'ネオンシェード', ar: 'نظارة نيون', fr: 'Lunettes néon' },
  'Golden Crown': { en: 'Golden Crown', de: 'Goldene Krone', ja: '黄金の王冠', ar: 'تاج ذهبي', fr: 'Couronne dorée' },
  Horse: { en: 'Horse', de: 'Pferd', ja: '馬', ar: 'حصان', fr: 'Cheval' },
  Lada: { en: 'Lada', de: 'Lada', ja: 'ラーダ', ar: 'لادا', fr: 'Lada' },
  'Winter Scarf': { en: 'Winter Scarf', de: 'Winterschal', ja: '冬のマフラー', ar: 'وشاح شتوي', fr: 'Écharpe d’hiver' },
  'Fancy Monocle': { en: 'Fancy Monocle', de: 'Edler Monokel', ja: 'おしゃれなモノクル', ar: 'عدسة أحادية أنيقة', fr: 'Monocle élégant' },
  'Wizard Hat': { en: 'Wizard Hat', de: 'Zauberhut', ja: '魔法使いの帽子', ar: 'قبعة ساحر', fr: 'Chapeau de sorcier' },
};

export const PROFILE_FRAME_TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  'Inferno Drake Frame': { en: 'Inferno Drake Frame', de: 'Inferno-Drachenrahmen', ja: 'インフェルノドレイクフレーム', ar: 'إطار تنين الجحيم', fr: 'Cadre drake infernal' },
  'Frost Wyvern Frame': { en: 'Frost Wyvern Frame', de: 'Frost-Wyvern-Rahmen', ja: 'フロストワイバーフレーム', ar: 'إطار ويفرن الجليد', fr: 'Cadre wyverne de givre' },
  'Solar Phoenix Frame': { en: 'Solar Phoenix Frame', de: 'Sonnenphönix-Rahmen', ja: 'ソーラーフェニックスフレーム', ar: 'إطار العنقاء الشمسية', fr: 'Cadre phénix solaire' },
  'Storm Eagle Frame': { en: 'Storm Eagle Frame', de: 'Sturmadler-Rahmen', ja: 'ストームイーグルフレーム', ar: 'إطار نسر العاصفة', fr: 'Cadre aigle de tempête' },
  'Glacial Wolf Frame': { en: 'Glacial Wolf Frame', de: 'Gletscherwolf-Rahmen', ja: 'グレイシャルウルフフレーム', ar: 'إطار الذئب الجليدي', fr: 'Cadre loup glaciaire' },
  'Emerald Guardian Frame': { en: 'Emerald Guardian Frame', de: 'Smaragd-Wächterrahmen', ja: 'エメラルドガーディアンフレーム', ar: 'إطار الحارس الزمردي', fr: 'Cadre gardien émeraude' },
  'Astral Wyrm Frame': { en: 'Astral Wyrm Frame', de: 'Astral-Wyrm-Rahmen', ja: 'アストラルワームフレーム', ar: 'إطار التنين النجمي', fr: 'Cadre wyrm astral' },
  'Golden Tiger Frame': { en: 'Golden Tiger Frame', de: 'Goldtiger-Rahmen', ja: 'ゴールデンタイガーフレーム', ar: 'إطار النمر الذهبي', fr: 'Cadre tigre doré' },
  'Royal Crown Frame': { en: 'Royal Crown Frame', de: 'Königlicher Kronenrahmen', ja: 'ロイヤルクラウンフレーム', ar: 'إطار التاج الملكي', fr: 'Cadre couronne royale' },
  'Sky Dragon Frame': { en: 'Sky Dragon Frame', de: 'Himmelsdrachenrahmen', ja: 'スカイドラゴンフレーム', ar: 'إطار التنين السماوي', fr: 'Cadre dragon céleste' },
  'Hope Frame': { en: 'Hope Frame', de: 'Hoffnungsrahmen', ja: '希望のフレーム', ar: 'إطار الأمل', fr: 'Cadre de l’espoir' },
  'Royal Dragon Frame': { en: 'Royal Dragon Frame', de: 'Königlicher Drachenrahmen', ja: 'ロイヤルドラゴンフレーム', ar: 'إطار التنين الملكي', fr: 'Cadre dragon royal' },
  'Divine Phoenix Frame': { en: 'Divine Phoenix Frame', de: 'Göttlicher Phönixrahmen', ja: 'ディヴァインフェニックスフレーム', ar: 'إطار العنقاء الإلهية', fr: 'Cadre phénix divin' },
  'Celestial Crown Frame': { en: 'Celestial Crown Frame', de: 'Himmlischer Kronenrahmen', ja: 'セレスティアルクラウンフレーム', ar: 'إطار التاج السماوي', fr: 'Cadre couronne céleste' },
  'Obsidian King Frame': { en: 'Obsidian King Frame', de: 'Obsidian-Königsrahmen', ja: 'オブシディアンキングフレーム', ar: 'إطار ملك السبج', fr: 'Cadre roi d’obsidienne' },
  'Astral Sovereign Frame': { en: 'Astral Sovereign Frame', de: 'Astraler Souverän-Rahmen', ja: 'アストラルソブリンフレーム', ar: 'إطار السيد النجمي', fr: 'Cadre souverain astral' },
  'Golden Reign Frame': { en: 'Golden Reign Frame', de: 'Goldene-Herrschaft-Rahmen', ja: 'ゴールデンレインフレーム', ar: 'إطار الهيبة الذهبية', fr: 'Cadre règne doré' },
  'Frost Emperor Frame': { en: 'Frost Emperor Frame', de: 'Frost-Kaiserrahmen', ja: 'フロストエンペラーフレーム', ar: 'إطار إمبراطور الصقيع', fr: 'Cadre empereur de givre' },
  'Infinity Royal Frame': { en: 'Infinity Royal Frame', de: 'Unendlichkeits-Königsrahmen', ja: 'インフィニティロイヤルフレーム', ar: 'إطار الملكية اللانهائية', fr: 'Cadre royal infini' },
};

export const RARITY_TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  Common: { en: 'Common', de: 'Gewöhnlich', ja: 'コモン', ar: 'عادي', fr: 'Commun' },
  Rare: { en: 'Rare', de: 'Selten', ja: 'レア', ar: 'نادر', fr: 'Rare' },
  Epic: { en: 'Epic', de: 'Episch', ja: 'エピック', ar: 'ملحمي', fr: 'Épique' },
  Legendary: { en: 'Legendary', de: 'Legendär', ja: 'レジェンド', ar: 'أسطوري', fr: 'Légendaire' },
  Mythic: { en: 'Mythic', de: 'Mythisch', ja: '神話', ar: 'خرافي', fr: 'Mythique' },
};

export const SKIN_CATEGORY_TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  clothes: { en: 'Clothes', de: 'Kleidung', ja: '服', ar: 'ملابس', fr: 'Vêtements' },
  glasses: { en: 'Glasses', de: 'Brille', ja: 'メガネ', ar: 'نظارات', fr: 'Lunettes' },
  crown: { en: 'Crown', de: 'Krone', ja: '王冠', ar: 'تاج', fr: 'Couronne' },
  vehicle: { en: 'Vehicle', de: 'Fahrzeug', ja: '乗り物', ar: 'مركبة', fr: 'Véhicule' },
  frame: { en: 'Profile Frame', de: 'Profilrahmen', ja: 'プロフィールフレーム', ar: 'إطار البروفايل', fr: 'Cadre de profil' },
};

const SUBJECT_CANONICAL_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(SUBJECT_TRANSLATIONS).flatMap(([canonical, translations]) =>
    Object.values(translations).map((name) => [name, canonical])
  )
);

const WEEKDAY_CANONICAL_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(WEEKDAY_TRANSLATIONS).flatMap(([canonical, translations]) =>
    Object.values(translations).map((name) => [name, canonical])
  )
);

const AMBIENT_CANONICAL_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(AMBIENT_TRANSLATIONS).flatMap(([canonical, translations]) =>
    Object.values(translations).map((name) => [name, canonical])
  )
);

const PET_CANONICAL_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(PET_TRANSLATIONS).flatMap(([canonical, translations]) =>
    Object.values(translations).map((name) => [name, canonical])
  )
);

const SKIN_CANONICAL_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(SKIN_TRANSLATIONS).flatMap(([canonical, translations]) =>
    Object.values(translations).map((name) => [name, canonical])
  )
);

export function translateSubjectName(name: string, target: LanguageCode): string {
  const canonical = SUBJECT_CANONICAL_NAMES[name] ?? name;
  return SUBJECT_TRANSLATIONS[canonical]?.[target] ?? name;
}

export function translateWeekday(day: string, target: LanguageCode): string {
  const canonical = WEEKDAY_CANONICAL_NAMES[day] ?? day;
  return WEEKDAY_TRANSLATIONS[canonical]?.[target] ?? day;
}

export function translateAmbientLabel(labelOrValue: string, target: LanguageCode): string {
  const canonical = AMBIENT_CANONICAL_NAMES[labelOrValue] ?? labelOrValue;
  return AMBIENT_TRANSLATIONS[canonical]?.[target] ?? labelOrValue;
}

export function translatePetName(name: string, target: LanguageCode): string {
  const canonical = PET_CANONICAL_NAMES[name] ?? name;
  return PET_TRANSLATIONS[canonical]?.[target] ?? name;
}

const PET_ID_CANONICAL_NAMES: Record<string, string> = {
  sparky: 'Sparky',
  'velvet-cat': 'Velvet Cat', 'moon-rabbit': 'Moon Rabbit', 'ember-pup': 'Ember Pup',
  'pearl-hamster': 'Pearl Hamster', 'suncrest-parrot': 'Suncrest Parrot', 'ice-penguin': 'Ice Penguin',
  'sage-turtle': 'Sage Turtle', 'cobalt-donkey': 'Cobalt Donkey', 'aurora-fox': 'Aurora Fox',
  'river-otter': 'River Otter', 'ruby-red-panda': 'Ruby Red Panda', 'mist-raccoon': 'Mist Raccoon',
  'willow-deer': 'Willow Deer', 'coral-seal': 'Coral Seal', 'crystal-owl': 'Crystal Owl',
  'golden-capybara': 'Golden Capybara', 'shadow-wolf': 'Shadow Wolf', 'snow-leopard': 'Snow Leopard',
  'storm-eagle': 'Storm Eagle', 'solar-tiger': 'Solar Tiger', 'jade-griffin': 'Jade Griffin',
  'crimson-kitsune': 'Crimson Kitsune', 'starlight-unicorn': 'Starlight Unicorn', 'frost-dragon': 'Frost Dragon',
  'crystal-dragon': 'Crystal Dragon', 'void-dragon': 'Void Dragon', 'chrono-dragon': 'Chrono Dragon',
  'frost-raptor': 'Frost Raptor', 'magma-trex': 'Magma T-Rex', 'ember-raptor': 'Ember Raptor',
  'azure-drake': 'Azure Drake', 'crimson-phoenix': 'Crimson Phoenix', 'storm-griffin': 'Storm Griffin',
  'frost-wolf': 'Frost Wolf', 'jade-triceratops': 'Jade Triceratops', 'lunar-wyvern': 'Lunar Wyvern',
  'sunfire-tiger': 'Sunfire Tiger',
};

const PET_ID_FALLBACK_NAMES: Record<string, Record<LanguageCode, string>> = {
  'velvet-cat': { en: 'Velvet Cat', de: 'Samtkatze', ja: 'ベルベットキャット', ar: 'قطة مخملية', fr: 'Chat velours' },
  'moon-rabbit': { en: 'Moon Rabbit', de: 'Mondhase', ja: 'ムーンラビット', ar: 'أرنب القمر', fr: 'Lapin lunaire' },
  'ember-pup': { en: 'Ember Pup', de: 'Glutwelpe', ja: 'エンバーパップ', ar: 'جرو الجمر', fr: 'Chiot braise' },
  'pearl-hamster': { en: 'Pearl Hamster', de: 'Perlhamster', ja: 'パールハムスター', ar: 'هامستر اللؤلؤ', fr: 'Hamster perle' },
  'suncrest-parrot': { en: 'Suncrest Parrot', de: 'Sonnenkamm-Papagei', ja: 'サンクレストパロット', ar: 'ببغاء قمة الشمس', fr: 'Perroquet crête solaire' },
  'ice-penguin': { en: 'Ice Penguin', de: 'Eispinguin', ja: 'アイスペンギン', ar: 'بطريق جليدي', fr: 'Pingouin de glace' },
  'sage-turtle': { en: 'Sage Turtle', de: 'Weise Schildkröte', ja: '賢者のカメ', ar: 'سلحفاة الحكيم', fr: 'Tortue sage' },
  'cobalt-donkey': { en: 'Cobalt Donkey', de: 'Kobaltesel', ja: 'コバルトロバ', ar: 'حمار كوبالت', fr: 'Âne cobalt' },
  'aurora-fox': { en: 'Aurora Fox', de: 'Polarlichtfuchs', ja: 'オーロラギツネ', ar: 'ثعلب الشفق', fr: 'Renard aurore' },
  'river-otter': { en: 'River Otter', de: 'Flussotter', ja: 'カワウソ', ar: 'قضاعة النهر', fr: 'Loutre de rivière' },
  'ruby-red-panda': { en: 'Ruby Red Panda', de: 'Rubinroter Panda', ja: 'ルビーレッサーパンダ', ar: 'باندا حمراء ياقوتية', fr: 'Panda roux rubis' },
  'mist-raccoon': { en: 'Mist Raccoon', de: 'Nebel-Waschbär', ja: 'ミストアライグマ', ar: 'راكون الضباب', fr: 'Raton laveur brumeux' },
  'willow-deer': { en: 'Willow Deer', de: 'Weidenhirsch', ja: 'ヤナギジカ', ar: 'غزال الصفصاف', fr: 'Cerf saule' },
  'coral-seal': { en: 'Coral Seal', de: 'Korallenrobbe', ja: 'コーラルアザラシ', ar: 'فقمة المرجان', fr: 'Phoque corail' },
  'crystal-owl': { en: 'Crystal Owl', de: 'Kristalleule', ja: 'クリスタルフクロウ', ar: 'بومة كريستالية', fr: 'Hibou de cristal' },
  'golden-capybara': { en: 'Golden Capybara', de: 'Goldenes Capybara', ja: 'ゴールデンカピバラ', ar: 'كابيبارا ذهبي', fr: 'Capybara doré' },
  'shadow-wolf': { en: 'Shadow Wolf', de: 'Schattenwolf', ja: 'シャドウウルフ', ar: 'ذئب الظلال', fr: 'Loup des ombres' },
  'snow-leopard': { en: 'Snow Leopard', de: 'Schneeleopard', ja: 'ユキヒョウ', ar: 'نمر ثلجي', fr: 'Léopard des neiges' },
  'storm-eagle': { en: 'Storm Eagle', de: 'Sturmadler', ja: 'ストームイーグル', ar: 'نسر العاصفة', fr: 'Aigle de tempête' },
  'solar-tiger': { en: 'Cosmic Tiger', de: 'Kosmischer Tiger', ja: 'コズミックタイガー', ar: 'النمر الكوني', fr: 'Tigre cosmique' },
  'jade-griffin': { en: 'Jade Griffin', de: 'Jadegreif', ja: 'ジェイドグリフォン', ar: 'غريفين اليشم', fr: 'Griffon de jade' },
  'crimson-kitsune': { en: 'Crimson Kitsune', de: 'Purpur-Kitsune', ja: 'クリムゾンキツネ', ar: 'كيتسوني قرمزي', fr: 'Kitsune cramoisi' },
  'starlight-unicorn': { en: 'Starlight Unicorn', de: 'Sternenlicht-Einhorn', ja: 'スターライトユニコーン', ar: 'وحيد القرن النجمي', fr: 'Licorne étoilée' },
  'frost-dragon': { en: 'Frost Dragon', de: 'Frostdrache', ja: 'フロストドラゴン', ar: 'تنين الصقيع', fr: 'Dragon de givre' },
  'crystal-dragon': { en: 'Crystal Dragon', de: 'Kristalldrache', ja: 'クリスタルドラゴン', ar: 'التنين الكريستالي', fr: 'Dragon de cristal' },
  'void-dragon': { en: 'Void Dragon', de: 'Leerendrache', ja: 'ヴォイドドラゴン', ar: 'تنين الفراغ', fr: 'Dragon du néant' },
  'chrono-dragon': { en: 'Chrono Dragon', de: 'Chronodrache', ja: 'クロノドラゴン', ar: 'تنين الزمن', fr: 'Dragon chrono' },
  'frost-raptor': { en: 'Frost Raptor', de: 'Frost-Raptor', ja: 'フロストラプター', ar: 'رابتور الصقيع', fr: 'Raptor de givre' },
  'magma-trex': { en: 'Magma T-Rex', de: 'Magma-T-Rex', ja: 'マグマTレックス', ar: 'ماجما تي ريكس', fr: 'T-Rex magma' },
  'ember-raptor': { en: 'Ember Raptor', de: 'Glut-Raptor', ja: 'エンバーラプター', ar: 'رابتور الجمر', fr: 'Raptor de braise' },
  'azure-drake': { en: 'Azure Drake', de: 'Azurdrache', ja: 'アズールドレイク', ar: 'تنين أزرق سماوي', fr: 'Drake azur' },
  'crimson-phoenix': { en: 'Crimson Phoenix', de: 'Purpurphönix', ja: 'クリムゾンフェニックス', ar: 'العنقاء القرمزية', fr: 'Phénix cramoisi' },
  'storm-griffin': { en: 'Storm Griffin', de: 'Sturmgreif', ja: 'ストームグリフォン', ar: 'غريفين العاصفة', fr: 'Griffon de tempête' },
  'frost-wolf': { en: 'Frost Wolf', de: 'Frostwolf', ja: 'フロストウルフ', ar: 'ذئب الصقيع', fr: 'Loup givré' },
  'jade-triceratops': { en: 'Jade Triceratops', de: 'Jade-Triceratops', ja: 'ジェイドトリケラトプス', ar: 'ترايسيراتوبس اليشم', fr: 'Tricératops de jade' },
  'lunar-wyvern': { en: 'Lunar Wyvern', de: 'Mondwyvern', ja: 'ルナワイバーン', ar: 'وايفرن قمري', fr: 'Wyverne lunaire' },
  'sunfire-tiger': { en: 'Sunfire Tiger', de: 'Sonnenfeuer-Tiger', ja: 'サンファイアタイガー', ar: 'نمر اللهب الشمسي', fr: 'Tigre solaire ardent' },
};

export function translatePetId(id: string, target: LanguageCode): string {
  const canonical = PET_ID_CANONICAL_NAMES[id];
  if (!canonical) return id;
  return PET_ID_FALLBACK_NAMES[id]?.[target] ?? PET_TRANSLATIONS[canonical]?.[target] ?? PET_TRANSLATIONS[canonical]?.en ?? canonical;
}

export function translateSkinName(name: string, target: LanguageCode): string {
  const frameIdTranslations: Record<string, string> = {
    'frame-inferno-drake': 'Inferno Drake Frame', 'frame-frost-wyvern': 'Frost Wyvern Frame',
    'frame-solar-phoenix': 'Solar Phoenix Frame', 'frame-storm-eagle': 'Storm Eagle Frame',
    'frame-glacial-wolf': 'Glacial Wolf Frame', 'frame-emerald-guardian': 'Emerald Guardian Frame',
    'frame-astral-wyrm': 'Astral Wyrm Frame', 'frame-golden-tiger': 'Golden Tiger Frame',
    'frame-premium-royal-dragon': 'Royal Dragon Frame', 'frame-premium-divine-phoenix': 'Divine Phoenix Frame',
    'frame-premium-celestial-crown': 'Celestial Crown Frame', 'frame-premium-obsidian-king': 'Obsidian King Frame',
    'frame-premium-astral-sovereign': 'Astral Sovereign Frame', 'frame-premium-golden-reign': 'Golden Reign Frame',
    'frame-premium-frost-emperor': 'Frost Emperor Frame', 'frame-premium-infinity-royal': 'Infinity Royal Frame',
    'frame-royal-crown': 'Royal Crown Frame', 'frame-sky-dragon': 'Sky Dragon Frame', 'frame-hope': 'Hope Frame',
  };
  const canonical = frameIdTranslations[name] ?? SKIN_CANONICAL_NAMES[name] ?? name;
  return SKIN_TRANSLATIONS[canonical]?.[target] ?? PROFILE_FRAME_TRANSLATIONS[canonical]?.[target] ?? name;
}

export function translateRarity(rarity: string, target: LanguageCode): string {
  return RARITY_TRANSLATIONS[rarity]?.[target] ?? rarity;
}

export function translateSkinCategory(category: string, target: LanguageCode): string {
  return SKIN_CATEGORY_TRANSLATIONS[category]?.[target] ?? category;
}

export type Translate = (key: TranslationKey) => string;
