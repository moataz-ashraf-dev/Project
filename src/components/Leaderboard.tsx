import { useEffect, useMemo, useState } from 'react';
import { Flag, ShieldCheck, Filter, FileCheck2, FlagTriangleRight, Users, Trophy, Globe2, MapPin, X, Loader2, LogIn, LogOut, Send, MessageCircle, Medal, Star } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/useAuth';
import { getActiveUserId, getUserStorageKey } from '@/lib/storageIdentity';
import ProfileAvatar, { type AvatarPetPosition, type AvatarTheme } from '@/components/ProfileAvatar';
import PublicStudentProfileModal from '@/components/PublicStudentProfileModal';

type TranslationFn = (key: string) => string;
type LanguageCode = 'en' | 'de' | 'ja' | 'ar' | 'fr';
const EXTRA_COPY: Record<LanguageCode, Record<string,string>> = {
  en: { signIn:'Sign in to use the verified leaderboard.', empty:'No verified students are available in this scope yet.', lounge:'Text study rooms are the safe community foundation. Voice is intentionally not enabled in this release.' },
  ar: { signIn:'سجّل الدخول لاستخدام لوحة الترتيب الموثقة.', empty:'لا يوجد طلاب موثّقون متاحون في هذا النطاق حتى الآن.', lounge:'غرف الدراسة النصية هي أساس المجتمع الآمن. الصوت غير مفعّل في هذا الإصدار.' },
  de: { signIn:'Melde dich an, um die verifizierte Bestenliste zu nutzen.', empty:'In diesem Bereich sind noch keine verifizierten Schüler verfügbar.', lounge:'Text-Lernräume sind die sichere Community-Grundlage. Sprache ist in dieser Version deaktiviert.' },
  ja: { signIn:'認証済みランキングを利用するにはログインしてください。', empty:'この範囲にはまだ認証済みの学生がいません。', lounge:'テキスト学習ルームを安全なコミュニティの基盤としています。音声はこのリリースでは無効です。' },
  fr: { signIn:'Connectez-vous pour utiliser le classement vérifié.', empty:'Aucun élève vérifié n’est encore disponible dans ce périmètre.', lounge:'Les salles d’étude textuelles sont la base de la communauté sécurisée. La voix est désactivée dans cette version.' },
};
type Scope = 'global' | 'international' | 'city';
type Student = {
  user_id: string;
  display_name: string;
  country_code: string | null;
  city: string | null;
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  avatar_url?: string | null;
  avatar_theme?: string | null;
  avatar_pet_position?: string | null;
  equipped_pet_id?: string | null;
  equipped_frame_id?: string | null;
  owned_pet_count?: number | null;
  golden_star_count?: number | null;
  rank_position?: number | null;
};
type Room = { id: string; nameKey: string; descriptionKey: string; subjectKey: string };
type RoomMessage = { id: string; room_id: string; user_id: string; body: string; created_at: string; display_name?: string };
type RankMessage = { id: string; scope: Scope; user_id: string; body: string; created_at: string };

type RankedStudent = Student & { rank: number };

function RankHero({ scope, onScopeChange, language, t, count, myRank }: {
  scope: Scope; onScopeChange: (scope: Scope) => void; language: LanguageCode;
  t: TranslationFn; count: number; myRank: number;
}) {
  const scopeName = scope === 'global' ? t('globalRank') : scope === 'international' ? t('internationalRanking') : t('regionalRanking');
  const scoring = language === 'ar'
    ? 'النجمة الذهبية أولًا، ثم عدد الحيوانات، ثم XP، ثم العملات والجواهر. عند التعادل يشترك الطلاب في المركز.'
    : 'Golden star first, then pets owned, XP, Coins, and Gems. Equal scores share a place.';
  const options: Array<{ id: Scope; icon: typeof Globe2; label: string }> = [
    { id: 'global', icon: Globe2, label: t('globalRank') },
    { id: 'international', icon: Globe2, label: t('internationalRanking') },
    { id: 'city', icon: MapPin, label: t('regionalRank') },
  ];
  return (
    <header className="rank-page-header">
      <div className="rank-header-copy">
        <div className="rank-eyebrow"><span className="rank-eyebrow-icon"><Trophy aria-hidden="true" /></span><span>{t('leaderboard')}</span></div>
        <h1 className="rank-page-title">{t('topStudents')}</h1>
        <p className="rank-scope-caption">{scopeName}</p>
        <p className="rank-scoring-note">{scoring}</p>
      </div>
      <div className="rank-header-side">
        <div className="rank-scope-switch" role="group" aria-label={language === 'ar' ? 'نطاق الترتيب' : 'Ranking scope'}>
          {options.map(({ id, icon: Icon, label }) => <button key={id} type="button" aria-pressed={scope === id} onClick={() => onScopeChange(id)}><Icon aria-hidden="true" /><span>{label}</span></button>)}
        </div>
        <div className="rank-header-meta"><span><Users aria-hidden="true" />{count} {language === 'ar' ? 'طالب' : 'students'}</span>{myRank > 0 && <span className="rank-your-place"><Medal aria-hidden="true" />{language === 'ar' ? `مركزك ${myRank}` : `Your place #${myRank}`}</span>}</div>
      </div>
    </header>
  );
}

function RankResults({ podium, rest, currentUserId, language, t, onSelect }: {
  podium: RankedStudent[]; rest: RankedStudent[]; currentUserId?: string;
  language: LanguageCode; t: TranslationFn; onSelect: (student: Student) => void;
}) {
  const placeName = (rank: number) => language === 'ar'
    ? rank === 1 ? 'المركز الأول' : rank === 2 ? 'المركز الثاني' : 'المركز الثالث'
    : rank === 1 ? '1st place' : rank === 2 ? '2nd place' : '3rd place';
  const numberLabel = (value: number) => value.toLocaleString(language === 'ar' ? 'ar-EG' : undefined);
  const studentAvatar = (student: Student, size: 'sm' | 'md' = 'md') => <ProfileAvatar avatarUrl={student.avatar_url} fallbackPetId={student.equipped_pet_id || 'sparky'} petPosition={(student.avatar_pet_position as AvatarPetPosition) || 'bottom-right'} theme={(student.avatar_theme as AvatarTheme) || 'ice'} frameId={student.equipped_frame_id} size={size} />;
  return (
    <section className="rank-board-section" aria-label={language === 'ar' ? 'ترتيب الطلاب' : 'Student rankings'}>
      <div className="rank-section-heading"><div><p className="rank-section-kicker">{language === 'ar' ? 'منافسة هذا النطاق' : 'CURRENT STANDINGS'}</p><h2>{language === 'ar' ? 'المتصدرون' : 'The leaders'}</h2></div><div className="rank-section-total"><Users aria-hidden="true" /><b>{podium.length + rest.length}</b><span>{language === 'ar' ? 'طالب' : 'students'}</span></div></div>
      <div className="rank-podium" data-count={podium.length}>
        {podium.map((student, index) => {
          const isMine = student.user_id === currentUserId;
          const card = <><span className="rank-podium-place"><Medal aria-hidden="true" />{placeName(student.rank)}</span><span className="rank-podium-avatar">{studentAvatar(student)}</span><span className="rank-podium-name">{student.display_name}</span><span className="rank-podium-level">{t('level')} {student.level}</span><span className="rank-podium-stats"><span className="rank-podium-star"><Star aria-hidden="true" /><b>{student.golden_star_count ?? 0}</b>{language === 'ar' ? ' نجمة ذهبية' : ' golden stars'}</span><span><b>{student.owned_pet_count ?? 0}</b>{language === 'ar' ? ' حيوان' : ' pets'}</span></span><span className="rank-podium-score"><strong>{numberLabel(student.total_xp)}</strong><small>XP</small></span>{(student.country_code || student.city) && <span className="rank-podium-location">{student.country_code || ''}{student.city ? ` · ${student.city}` : ''}</span>}</>;
          return <article key={student.user_id} data-spot={index + 1} data-rank={student.rank} className={`rank-podium-card ${isMine ? 'is-current-user' : ''}`}>{isMine ? <div className="rank-podium-action">{card}</div> : <button type="button" className="rank-podium-action" onClick={() => onSelect(student)} aria-label={`${student.display_name}, ${placeName(student.rank)}`}>{card}</button>}</article>;
        })}
      </div>
      {rest.length > 0 && <div className="rank-roster"><div className="rank-roster-head"><span>{t('rank')}</span><span>{language === 'ar' ? 'الطالب' : 'Student'}</span><span>{language === 'ar' ? 'النجمة الذهبية' : 'Golden star'}</span><span>{language === 'ar' ? 'الحيوانات' : 'Pets'}</span><span>XP</span></div>
        {rest.map((student) => { const isMine = student.user_id === currentUserId; return <button key={student.user_id} type="button" data-rank={student.rank} disabled={isMine} onClick={() => onSelect(student)} className={`rank-roster-row ${isMine ? 'is-current-user' : ''}`}><span className="rank-roster-position">{student.rank}</span><span className="rank-roster-student">{studentAvatar(student, 'sm')}<span className="rank-roster-identity"><strong>{student.display_name}</strong><small>{student.country_code || ''}{student.city ? ` · ${student.city}` : ''}{student.city || student.country_code ? ' · ' : ''}{student.owned_pet_count ?? 0} {language === 'ar' ? 'حيوان' : 'pets'}</small></span></span><span className="rank-roster-stars"><small>{language === 'ar' ? 'ذهبية' : 'Gold'}</small><b><Star aria-hidden="true" /> {student.golden_star_count ?? 0}</b></span><span className="rank-roster-pets"><small>{language === 'ar' ? 'حيوانات' : 'Pets'}</small><b>{student.owned_pet_count ?? 0}</b></span><span className="rank-roster-xp">{numberLabel(student.total_xp)} <small>XP</small></span></button>; })}
      </div>}
    </section>
  );
}

const RANK_CHAT_STORAGE = 'studyquest_rank_chat_v1';
function localRankChat(): Record<string, RankMessage[]> {
  try { const raw = localStorage.getItem(getUserStorageKey(RANK_CHAT_STORAGE)); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
function saveLocalRankChat(data: Record<string, RankMessage[]>) { try { localStorage.setItem(getUserStorageKey(RANK_CHAT_STORAGE), JSON.stringify(data)); } catch { /* best effort */ } }

const ROOMS: Room[] = [
  { id: 'physics', nameKey: 'physicsMastermindsRoom', descriptionKey: 'roomDescriptionPhysics', subjectKey: 'physicsMastermindsRoom' },
  { id: 'calculus', nameKey: 'advancedCalculusHub', descriptionKey: 'roomDescriptionCalculus', subjectKey: 'advancedCalculusHub' },
  { id: 'javascript', nameKey: 'javascriptBuildersRoom', descriptionKey: 'roomDescriptionJavaScript', subjectKey: 'javascriptBuildersRoom' },
  { id: 'english', nameKey: 'englishConversationStudyRoom', descriptionKey: 'roomDescriptionEnglish', subjectKey: 'englishConversationStudyRoom' },
  { id: 'chemistry', nameKey: 'chemistryFocusRoom', descriptionKey: 'roomDescriptionChemistry', subjectKey: 'chemistryFocusRoom' },
  { id: 'exam', nameKey: 'examPreparationRoom', descriptionKey: 'roomDescriptionExam', subjectKey: 'examPreparationRoom' },
];

const ROOM_STORAGE = 'studyquest_room_lounge_v1';
function localRoomData(): { joined: string[]; messages: Record<string, RoomMessage[]> } {
  try {
    const raw = localStorage.getItem(getUserStorageKey(ROOM_STORAGE));
    const parsed = raw ? JSON.parse(raw) : {};
    return { joined: Array.isArray(parsed.joined) ? parsed.joined : [], messages: parsed.messages ?? {} };
  } catch { return { joined: [], messages: {} }; }
}
function saveLocalRoomData(data: { joined: string[]; messages: Record<string, RoomMessage[]> }) {
  try { localStorage.setItem(getUserStorageKey(ROOM_STORAGE), JSON.stringify(data)); } catch { /* best effort */ }
}

export default function Leaderboard({ t, language = 'en' }: { t: TranslationFn; language?: LanguageCode }) {
  const copy = EXTRA_COPY[language];
  const { user } = useAuth();
  const [scope, setScope] = useState<Scope>('global');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportRoomId, setReportRoomId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reported, setReported] = useState(false);
  const [joinedRooms, setJoinedRooms] = useState<string[]>(() => localRoomData().joined);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [roomBusy, setRoomBusy] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [rankMessages, setRankMessages] = useState<RankMessage[]>([]);
  const [rankMessageText, setRankMessageText] = useState('');
  const [rankChatBusy, setRankChatBusy] = useState(false);
  const [rankChatError, setRankChatError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);


  useEffect(() => {
    let cancelled = false;
    if (!user || !isSupabaseConfigured || !navigator.onLine) { setStudents([]); return; }
    const refreshLeaderboard = async () => {
      setLoading(true); setError('');
      const { data, error: rpcError } = await supabase.rpc('get_leaderboard', { p_scope: scope, p_limit: 50 });
      if (cancelled) return;
      if (rpcError) setError(rpcError.message);
      else setStudents((data ?? []) as Student[]);
      setLoading(false);
    };
    void refreshLeaderboard();
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible' && navigator.onLine) void refreshLeaderboard(); };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('online', refreshWhenVisible);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('online', refreshWhenVisible);
    };
  }, [scope, user?.id]);

  useEffect(() => {
    if (!user || !isSupabaseConfigured || !navigator.onLine) return;
    supabase.from('study_room_members').select('room_id').eq('user_id', user.id).then(({ data }) => {
      if (data) setJoinedRooms(data.map((row) => row.room_id));
    }, () => undefined);
  }, [user?.id]);

  const loadRankMessages = async (chatScope: Scope) => {
    if (chatScope === 'global') { setRankMessages([]); return; }
    setRankChatError('');
    if (!isSupabaseConfigured || !user || !navigator.onLine) {
      setRankMessages((localRankChat()[chatScope] ?? []).slice(-3));
      return;
    }
    const { data, error: chatError } = await supabase
      .from('leaderboard_scope_messages')
      .select('id,scope,user_id,body,created_at')
      .eq('scope', chatScope)
      .order('created_at', { ascending: false })
      .limit(3);
    if (chatError) setRankChatError(chatError.message.replace(/_/g, ' '));
    else setRankMessages(((data ?? []) as RankMessage[]).reverse());
  };

  useEffect(() => {
    loadRankMessages(scope).catch(() => undefined);
    if (scope === 'global') return;
    const timer = window.setInterval(() => loadRankMessages(scope).catch(() => undefined), 7000);
    return () => window.clearInterval(timer);
  }, [scope, user?.id]);

  const sendRankMessage = async () => {
    const body = rankMessageText.trim().slice(0, 240);
    if (scope === 'global' || !body || rankChatBusy) return;
    setRankChatBusy(true); setRankChatError('');
    try {
      const createdAt = new Date().toISOString();
      if (isSupabaseConfigured && user && navigator.onLine) {
        const { data, error: sendError } = await supabase.from('leaderboard_scope_messages').insert({ scope, user_id: user.id, body }).select('id,scope,user_id,body,created_at').single();
        if (sendError) throw sendError;
        if (data) setRankMessages((prev) => [...prev, data as RankMessage].slice(-3));
      } else {
        const local = localRankChat();
        const item: RankMessage = { id:`rank-${Date.now()}-${Math.random().toString(36).slice(2)}`, scope, user_id:user?.id ?? 'local', body, created_at:createdAt };
        local[scope] = [...(local[scope] ?? []), item].slice(-3);
        saveLocalRankChat(local); setRankMessages(local[scope]);
      }
      setRankMessageText('');
    } catch (e) { setRankChatError(e instanceof Error ? e.message.replace(/_/g, ' ') : 'Message failed'); }
    finally { setRankChatBusy(false); }
  };

  const activeRoom = useMemo(() => ROOMS.find((room) => room.id === activeRoomId) ?? null, [activeRoomId]);

  const loadMessages = async (roomId: string) => {
    if (!roomId) return;
    setRoomError('');
    if (!isSupabaseConfigured || !user || !navigator.onLine) {
      const data = localRoomData();
      setMessages(data.messages[roomId] ?? []);
      return;
    }
    const { data, error: loadError } = await supabase
      .from('study_room_messages')
      .select('id,room_id,user_id,body,created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (loadError) setRoomError(loadError.message);
    else setMessages((data ?? []) as RoomMessage[]);
  };

  useEffect(() => {
    if (!activeRoomId) return;
    loadMessages(activeRoomId);
    if (!isSupabaseConfigured || !user || !navigator.onLine) return;
    const timer = window.setInterval(() => loadMessages(activeRoomId), 5000);
    return () => window.clearInterval(timer);
  }, [activeRoomId, user?.id]);

  const joinRoom = async (roomId: string) => {
    setRoomBusy(true); setRoomError('');
    try {
      if (isSupabaseConfigured && user && navigator.onLine) {
        const { error: joinError } = await supabase.from('study_room_members').upsert({ room_id: roomId, user_id: user.id, last_seen_at: new Date().toISOString() }, { onConflict: 'room_id,user_id' });
        if (joinError) throw joinError;
      } else {
        const data = localRoomData();
        if (!data.joined.includes(roomId)) data.joined.push(roomId);
        if (!data.messages[roomId]) data.messages[roomId] = [{ id: `welcome-${roomId}`, room_id: roomId, user_id: 'system', body: language === 'ar' ? 'أهلًا بك في غرفة الدراسة. حافظ على المحادثة مرتبطة بالمذاكرة.' : 'Welcome to the study room. Keep the conversation study-focused.', created_at: new Date().toISOString(), display_name: 'StudyQuest' }];
        saveLocalRoomData(data);
      }
      setJoinedRooms((prev) => Array.from(new Set([...prev, roomId])));
      setActiveRoomId(roomId);
    } catch (e) { setRoomError(e instanceof Error ? e.message.replace(/_/g, ' ') : 'Could not join room'); }
    finally { setRoomBusy(false); }
  };

  const leaveRoom = async (roomId: string) => {
    setRoomBusy(true); setRoomError('');
    try {
      if (isSupabaseConfigured && user && navigator.onLine) {
        const { error: leaveError } = await supabase.from('study_room_members').delete().eq('room_id', roomId).eq('user_id', user.id);
        if (leaveError) throw leaveError;
      } else {
        const data = localRoomData(); data.joined = data.joined.filter((id) => id !== roomId); saveLocalRoomData(data);
      }
      setJoinedRooms((prev) => prev.filter((id) => id !== roomId));
      if (activeRoomId === roomId) { setActiveRoomId(null); setMessages([]); }
    } catch (e) { setRoomError(e instanceof Error ? e.message.replace(/_/g, ' ') : 'Could not leave room'); }
    finally { setRoomBusy(false); }
  };

  const sendMessage = async () => {
    const body = messageText.trim().slice(0, 500);
    if (!activeRoomId || !body) return;
    setRoomBusy(true); setRoomError('');
    try {
      const createdAt = new Date().toISOString();
      if (isSupabaseConfigured && user && navigator.onLine) {
        const { data, error: sendError } = await supabase.from('study_room_messages').insert({ room_id: activeRoomId, user_id: user.id, body }).select('id,room_id,user_id,body,created_at').single();
        if (sendError) throw sendError;
        if (data) setMessages((prev) => [...prev, data as RoomMessage]);
      } else {
        const local = localRoomData();
        const item: RoomMessage = { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`, room_id: activeRoomId, user_id: getActiveUserId(), body, created_at: createdAt, display_name: language === 'ar' ? 'أنت' : 'You' };
        local.messages[activeRoomId] = [...(local.messages[activeRoomId] ?? []), item].slice(-100);
        saveLocalRoomData(local); setMessages(local.messages[activeRoomId]);
      }
      setMessageText('');
    } catch (e) { setRoomError(e instanceof Error ? e.message.replace(/_/g, ' ') : 'Message failed'); }
    finally { setRoomBusy(false); }
  };

  const ranked = useMemo(() => {
    const value = (amount: number | null | undefined) => Number(amount) || 0;
    const hasServerRank = students.length > 0 && students.every((student) => Number.isFinite(Number(student.rank_position)) && Number(student.rank_position) > 0);
    const ordered = [...students].sort((a, b) =>
      (hasServerRank ? value(a.rank_position) - value(b.rank_position) : 0) ||
      value(b.golden_star_count) - value(a.golden_star_count) ||
      value(b.owned_pet_count) - value(a.owned_pet_count) ||
      value(b.total_xp) - value(a.total_xp) ||
      a.display_name.localeCompare(b.display_name),
    );
    if (hasServerRank) return ordered.map((student) => ({ ...student, rank: value(student.rank_position) }));
    const rankKey = (student: Student) => [student.golden_star_count, student.owned_pet_count, student.total_xp].map(value).join(':');
    const firstRank = new Map<string, number>();
    return ordered.map((student, index) => {
      const key = rankKey(student);
      if (!firstRank.has(key)) firstRank.set(key, index + 1);
      return { ...student, rank: firstRank.get(key)! };
    });
  }, [students]);
  const podium = ranked.slice(0, 3);
  const myRank = ranked.find((student) => student.user_id === user?.id)?.rank ?? 0;
  const rest = ranked.slice(3);

  const submitReport = async () => {
    if (!reportRoomId || !reportReason) return;
    if (!user || !isSupabaseConfigured || !navigator.onLine) { setReported(true); return; }
    const { error: reportError } = await supabase.from('room_reports').insert({ room_id: reportRoomId, reporter_id: user.id, reason: reportReason });
    if (!reportError) setReported(true); else setRoomError(reportError.message);
  };

  return (
    <div className="leaderboard-page flex flex-col gap-8 animate-fade-in pb-8">
      <section className="flex flex-col gap-4">
        <RankHero scope={scope} onScopeChange={setScope} language={language} t={t} count={ranked.length} myRank={myRank} />
        {!user && <p className="rank-alert">{copy.signIn}</p>}
        {error && <p className="rank-alert is-error" role="alert">{error.replace(/_/g, ' ')}</p>}
        {loading ? <div className="rank-loading"><Loader2 className="w-7 h-7 animate-spin text-neon-cyan" /></div> : ranked.length === 0 ? <div className="rank-empty"><Trophy aria-hidden="true" /><p>{copy.empty}</p></div> : <RankResults podium={podium} rest={rest} currentUserId={user?.id} language={language} t={t} onSelect={setSelectedStudent} />}
        {scope !== 'global' && <section className="rank-scope-chat rounded-2xl glass border border-neon-cyan/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0"><MessageCircle className="w-4 h-4 text-neon-cyan" /><div className="min-w-0"><h3 className="text-sm font-black text-gray-200">{language === 'ar' ? 'دردشة الترتيب' : language === 'ja' ? 'ランキングチャット' : language === 'de' ? 'Ranglisten-Chat' : language === 'fr' ? 'Chat du classement' : 'Ranking chat'}</h3><p className="text-[9px] text-gray-500 truncate">{language === 'ar' ? (scope === 'city' ? 'دردشة الترتيب المحلي' : 'دردشة الترتيب الدولي') : (scope === 'city' ? 'Local ranking chat' : 'International ranking chat')}</p></div></div>
            <span className="text-[9px] font-bold text-neon-cyan border border-neon-cyan/20 rounded-full px-2 py-1">{language === 'ar' ? 'آخر 3 رسائل' : 'Last 3 messages'}</span>
          </div>
          <div className="p-3 space-y-2 min-h-[90px]">
            {rankMessages.length === 0 ? <p className="text-center text-[10px] text-gray-500 py-5">{language === 'ar' ? 'لسه مفيش رسائل. خليك مركز في المذاكرة.' : 'No messages yet. Keep the chat study-focused.'}</p> : rankMessages.map((m) => <div key={m.id} className="rounded-xl border border-white/5 bg-white/[.025] px-3 py-2"><div className="flex items-center justify-between gap-2 mb-0.5"><span className="text-[9px] font-bold text-neon-cyan">{m.user_id === user?.id ? (language === 'ar' ? 'أنت' : 'You') : (language === 'ar' ? 'طالب' : 'Student')}</span><span className="text-[8px] text-gray-600">{new Date(m.created_at).toLocaleTimeString(language === 'ar' ? 'ar-EG' : undefined, {hour:'2-digit', minute:'2-digit'})}</span></div><p className="text-[11px] text-gray-300 break-words">{m.body}</p></div>)}
          </div>
          <div className="p-3 pt-0 flex gap-2"><input value={rankMessageText} onChange={(e)=>setRankMessageText(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter') sendRankMessage();}} maxLength={240} placeholder={language === 'ar' ? 'اكتب رسالة...' : 'Write a message...'} className="flex-1 min-w-0 rounded-xl bg-ink-700 border border-white/10 px-3 py-2.5 text-xs text-gray-200 outline-none focus:border-neon-cyan/40" /><button type="button" onClick={sendRankMessage} disabled={rankChatBusy || !rankMessageText.trim()} className="rounded-xl px-3 border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan disabled:opacity-30"><Send className="w-4 h-4" /></button></div>
          {rankChatError && <p className="px-3 pb-3 text-[9px] text-neon-rose">{rankChatError}</p>}
        </section>}
      </section>

      {selectedStudent && <PublicStudentProfileModal student={selectedStudent} language={language} onClose={() => setSelectedStudent(null)} t={t} />}

      <section className="study-room-section flex flex-col gap-5">
        <div><div className="study-room-heading__eyebrow"><Users className="w-5 h-5" /><span className="text-xs font-bold uppercase tracking-[0.2em]">{t('safeStudyLounge')}</span></div><h2 className="study-room-heading__title">{t('studyRooms')}</h2><p className="study-room-heading__copy">{copy.lounge}</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ROOMS.map((room) => {
            const joined = joinedRooms.includes(room.id);
            return <article key={room.id} className="study-room-card flex flex-col gap-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-display font-bold text-sm">{t(room.nameKey)}</h3><p className="text-[11px] text-neon-cyan mt-1">{t(room.subjectKey)}</p></div><span className="shrink-0 flex items-center gap-1 text-[10px] text-neon-emerald"><ShieldCheck className="w-3.5 h-3.5" /> {t('secureRoom')}</span></div><p className="text-xs text-gray-500 leading-relaxed">{t(room.descriptionKey)}</p><div className="grid grid-cols-2 gap-2 text-[9px] text-gray-500"><span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-neon-emerald" />{t('verifiedStudentsOnly')}</span><span className="flex items-center gap-1"><Filter className="w-3 h-3 text-neon-cyan" />{t('wordFilterActive')}</span><span className="flex items-center gap-1"><FileCheck2 className="w-3 h-3 text-neon-cyan" />{t('textModerationActive')}</span><span className="flex items-center gap-1"><FlagTriangleRight className="w-3 h-3 text-neon-amber" />{t('moderationLog')}</span></div><div className="grid grid-cols-2 gap-2"><button disabled={roomBusy} onClick={() => joined ? setActiveRoomId(room.id) : joinRoom(room.id)} className="w-full px-3 py-2.5 rounded-xl bg-neon-emerald/10 border border-neon-emerald/30 text-neon-emerald text-xs font-bold disabled:opacity-50">{joined ? <><MessageCircle className="w-4 h-4 inline mr-1" />{language === 'ar' ? 'فتح الغرفة' : 'Open room'}</> : <><LogIn className="w-4 h-4 inline mr-1" />{t('joinRoom')}</>}</button><button disabled={roomBusy || !joined} onClick={() => leaveRoom(room.id)} className="px-3 py-2.5 rounded-xl border border-white/10 text-gray-500 text-xs font-bold disabled:opacity-30"><LogOut className="w-4 h-4 inline mr-1" />{t('leaveRoom')}</button></div><button onClick={() => { setReportRoomId(room.id); setReported(false); setReportReason(''); }} className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-neon-rose hover:border-neon-rose/30"><Flag className="w-4 h-4 inline mr-2" />{t('reportDisruptiveBehavior')}</button></article>;
          })}
        </div>
        {roomError && <p className="text-xs text-neon-rose" role="alert">{roomError}</p>}
      </section>

      {activeRoom && <div className="fixed inset-0 z-[100] flex items-center justify-center px-4"><div className="absolute inset-0 bg-black/70" onClick={() => setActiveRoomId(null)} /><div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl glass border border-white/10 p-5 flex flex-col"><div className="flex items-center justify-between gap-3 mb-4"><div><div className="text-[10px] uppercase tracking-widest text-neon-emerald">{t('safeStudyLounge')}</div><h3 className="font-display font-bold text-gray-200">{t(activeRoom.nameKey)}</h3></div><button onClick={() => setActiveRoomId(null)} aria-label={t('close')}><X className="w-5 h-5" /></button></div><div className="flex-1 min-h-[260px] max-h-[50vh] overflow-y-auto rounded-xl bg-black/20 border border-white/5 p-3 space-y-2">{messages.length === 0 ? <p className="text-center text-xs text-gray-500 py-10">{language === 'ar' ? 'لسه مفيش رسائل. ابدأ المحادثة.' : 'No messages yet. Start the conversation.'}</p> : messages.map((m) => <div key={m.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-3"><div className="flex items-center justify-between gap-3 mb-1"><span className="text-[10px] font-bold text-neon-cyan">{m.display_name ?? (m.user_id === user?.id ? (language === 'ar' ? 'أنت' : 'You') : 'Student')}</span><span className="text-[9px] text-gray-600">{new Date(m.created_at).toLocaleTimeString(language === 'ar' ? 'ar-EG' : undefined, { hour: '2-digit', minute: '2-digit' })}</span></div><p className="text-xs text-gray-300 break-words">{m.body}</p></div>)}</div><div className="flex gap-2 mt-3"><input value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }} maxLength={500} placeholder={language === 'ar' ? 'اكتب رسالة مرتبطة بالمذاكرة...' : 'Write a study-focused message...'} className="flex-1 rounded-xl bg-ink-700 border border-white/10 px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-neon-cyan/40" /><button disabled={roomBusy || !messageText.trim()} onClick={sendMessage} className="rounded-xl px-4 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan disabled:opacity-30"><Send className="w-4 h-4" /></button></div><p className="text-[9px] text-gray-600 mt-2">{language === 'ar' ? 'المحادثة نصية فقط. لا يوجد اتصال صوتي مباشر.' : 'Text only. No live voice connection.'}</p></div></div>}

      {reportRoomId && <div className="fixed inset-0 z-[110] flex items-center justify-center px-4"><div className="absolute inset-0 bg-black/60" onClick={() => setReportRoomId(null)} /><div className="relative w-full max-w-sm rounded-2xl glass border border-white/10 p-5"><div className="flex justify-between items-center mb-4"><h3 className="font-display font-bold text-gray-200">{t('report')}</h3><button onClick={() => setReportRoomId(null)} aria-label={t('close')}><X className="w-4 h-4" /></button></div><select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full rounded-xl bg-ink-700 border border-white/10 p-3 text-sm text-gray-200"><option value="">{t('selectReason')}</option><option value="disruption">{t('reasonDisruption')}</option><option value="harassment">{t('reasonHarassment')}</option><option value="spam">{t('reasonSpam')}</option></select>{reported ? <p className="text-xs text-neon-emerald mt-3">{t('reportSubmitted')}</p> : <button onClick={submitReport} disabled={!reportReason} className="w-full mt-4 px-4 py-2.5 rounded-xl bg-neon-rose/10 border border-neon-rose/30 text-neon-rose text-sm font-bold disabled:opacity-40">{t('submitReport')}</button>}</div></div>}
    </div>
  );
}
