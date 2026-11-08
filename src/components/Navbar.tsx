import React from 'react';
import {
  LayoutDashboard, User, Trophy, Globe2, Sun, Moon, Menu, X, Snowflake, Crown, Coins, Gem, Settings, Sparkles,
} from 'lucide-react';
import type { LanguageCode, ThemeMode, TranslationKey } from '@/lib/i18n';
import AccountMenu from '@/components/AccountMenu';

type Props = {
  coins: number; gems: number; activeTab: string; onTabChange: (tab: string) => void;
  language: LanguageCode; languages: Array<{ code: LanguageCode; label: string; locale: string }>;
  onLanguageChange: (language: LanguageCode) => void;
  theme: ThemeMode; onThemeChange: React.Dispatch<React.SetStateAction<ThemeMode>>;
  t: (key: TranslationKey) => string;
  isAdmin?: boolean;
  isPremium?: boolean;
};

const TABS = [
  { id: 'dashboard', key: 'studyDashboard' as TranslationKey, icon: LayoutDashboard },
  { id: 'profile', key: 'myProfile' as TranslationKey, icon: User },
  { id: 'leaderboards', key: 'leaderboards' as TranslationKey, icon: Trophy },
  { id: 'skins', key: 'futureSkins' as TranslationKey, icon: Crown },
  { id: 'premium-benefits', key: 'premiumFeatures' as TranslationKey, icon: Sparkles },
];

const THEME_LABELS: Record<ThemeMode, string> = { dark: 'Dark', light: 'Light', ice: 'Ice' };

export default function Navbar({ coins, gems, activeTab, onTabChange, language, languages, onLanguageChange, theme, onThemeChange, t, isAdmin = false, isPremium = false }: Props) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const cycleTheme = () => onThemeChange((current) => current === 'ice' ? 'dark' : current === 'dark' ? 'light' : 'ice');
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Snowflake;
  const themeLabel = theme === 'dark' ? t('sunMode') : theme === 'light' ? t('iceMode') : t('moonMode');

  const go = (id: string) => { onTabChange(id); setMenuOpen(false); };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 lg:right-auto lg:w-64 lg:h-screen lg:border-r lg:border-b-0 lg:glass app-sidebar lg:flex lg:flex-col">
      <div className="flex items-center justify-between gap-3 px-4 md:px-6 lg:px-5 h-14 md:h-16 lg:h-auto lg:py-6 lg:block">
        <button type="button" onClick={() => go('dashboard')} className="flex items-center gap-3 font-display text-lg md:text-xl font-extrabold tracking-tight">
          <span className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-300/20 to-violet-500/20 border border-cyan-300/30 shadow-[0_0_24px_rgba(0,205,255,.15)]">
            <Snowflake className="w-6 h-6 text-neon-cyan" />
          </span>
          <span className="bg-gradient-to-r from-neon-cyan via-sky-200 to-neon-violet bg-clip-text text-transparent">StudyQuest</span>
        </button>

        <div className="hidden lg:flex items-center gap-2 mt-4 px-3 py-2 rounded-2xl border border-white/10 bg-white/[.03]">
          <div className="w-8 h-8 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-sm font-bold text-neon-cyan">S</div>
          <div className="min-w-0 flex-1"><p className="text-xs font-bold text-gray-200 truncate">StudyQuest</p><p className="text-[10px] text-gray-500">Learn • Grow • Achieve</p></div>
        </div>

        <button type="button" className="lg:hidden p-2 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <nav className="hidden lg:flex flex-col gap-1 px-3 flex-1 mt-2">
        {isAdmin && <button onClick={() => go('admin')} title="Admin" className={`group relative flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-semibold text-left ${activeTab === 'admin' ? 'text-white bg-neon-amber/10 border border-neon-amber/30' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}><Settings className="w-5 h-5" />Admin</button>}
        {TABS.filter((tab) => tab.id !== 'premium-benefits' || isPremium).map((tab) => {
          const Icon = tab.icon; const isActive = activeTab === tab.id;
          return <button key={tab.id} onClick={() => go(tab.id)} title={t(tab.key)} className={`group relative flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-semibold text-left ${isActive ? 'text-white bg-neon-cyan/10 border border-neon-cyan/30 shadow-[0_0_24px_rgba(0,205,255,.12)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-neon-cyan shadow-[0_0_12px_rgba(0,240,255,.8)]" />}
            <Icon className={`w-5 h-5 ${isActive ? 'text-neon-cyan' : ''}`} />{t(tab.key)}
          </button>;
        })}
      </nav>

      <div className="hidden lg:flex flex-col gap-2 px-3 pb-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-amber-300/15 bg-amber-300/5 px-2.5 py-2"><div className="text-[10px] text-gray-500">Coins</div><div className="text-sm font-mono font-bold text-neon-amber flex items-center gap-1"><Coins className="w-4 h-4" />{coins.toLocaleString()}</div></div>
          <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/5 px-2.5 py-2"><div className="text-[10px] text-gray-500">Gems</div><div className="text-sm font-mono font-bold text-neon-cyan flex items-center gap-1"><Gem className="w-4 h-4" />{gems}</div></div>
        </div>
        <div className="flex gap-2">
          <label className="studyquest-language-control flex-1 h-10 rounded-xl border items-center px-2.5 hidden lg:flex">
            <Globe2 className="w-4 h-4 mr-1.5 shrink-0" /><select value={language} onChange={(e) => onLanguageChange(e.target.value as LanguageCode)} aria-label={t('language')} className="studyquest-language-select min-w-0 flex-1 bg-transparent border-0 outline-none text-[11px] font-semibold cursor-pointer"><option value="en">EN</option>{languages.filter(x => x.code !== 'en').map(item => <option key={item.code} value={item.code}>{item.label}</option>)}</select>
          </label>
          <button type="button" onClick={cycleTheme} title={themeLabel} aria-label={themeLabel} className="studyquest-control w-10 h-10 rounded-xl border flex items-center justify-center"><ThemeIcon className={`w-4 h-4 ${theme === 'ice' ? 'text-neon-cyan' : theme === 'light' ? 'text-neon-amber' : 'text-violet-300'}`} /></button>
        </div>
        <AccountMenu t={t} />
      </div>

      {menuOpen && <div className="lg:hidden border-t border-white/10 bg-ink-800/95 backdrop-blur-xl px-4 py-4 space-y-3">
        <nav className="grid grid-cols-2 gap-2">{isAdmin && <button onClick={() => go('admin')} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${activeTab === 'admin' ? 'text-neon-amber bg-amber-300/5 border border-amber-300/20' : 'text-gray-400 bg-white/5 border border-white/5'}`}><Settings className="w-4 h-4" />Admin</button>}{TABS.filter((tab) => tab.id !== 'premium-benefits' || isPremium).map(tab => { const Icon=tab.icon; const isActive=activeTab===tab.id; return <button key={tab.id} onClick={()=>go(tab.id)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive ? 'text-neon-cyan bg-neon-cyan/5 border border-neon-cyan/20' : 'text-gray-400 bg-white/5 border border-white/5'}`}><Icon className="w-4 h-4" />{t(tab.key)}</button>; })}</nav>
        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-white/5">
          <label className="studyquest-language-control min-h-11 rounded-xl border flex items-center px-3"><Globe2 className="w-4 h-4 mr-2 text-neon-cyan"/><span className="text-xs text-gray-500 mr-2">{t('language')}</span><select value={language} onChange={(e)=>onLanguageChange(e.target.value as LanguageCode)} className="studyquest-language-select flex-1 bg-transparent border-0 outline-none text-sm font-semibold"><option value="en">English</option>{languages.filter(x=>x.code!=='en').map(item=><option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
          <button type="button" onClick={cycleTheme} className="studyquest-control min-h-11 rounded-xl border flex items-center justify-between px-3 text-sm"><span className="flex items-center gap-2"><ThemeIcon className="w-4 h-4 text-neon-cyan" />Theme</span><span className="text-xs text-gray-500">{THEME_LABELS[theme]}</span></button>
          <div className="flex items-center justify-center gap-5 py-2.5 rounded-xl bg-white/5 border border-white/10"><span className="font-mono text-sm font-bold text-neon-amber flex items-center gap-1"><Coins className="w-4 h-4" />{coins.toLocaleString()}</span><span className="font-mono text-sm font-bold text-neon-cyan flex items-center gap-1"><Gem className="w-4 h-4" />{gems}</span></div>
          <div className="flex items-center justify-center"><AccountMenu t={t} /></div>
        </div>
      </div>}
    </header>
  );
}
