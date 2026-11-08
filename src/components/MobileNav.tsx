import { LayoutDashboard, User, Trophy, Crown, Settings, Sparkles } from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n';

type Props = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  t: (key: TranslationKey) => string;
  isAdmin?: boolean;
  isPremium?: boolean;
};

const TABS = [
  { id: 'dashboard', key: 'dashboard' as TranslationKey, icon: LayoutDashboard },
  { id: 'profile', key: 'profile' as TranslationKey, icon: User },
  { id: 'leaderboards', key: 'ranks' as TranslationKey, icon: Trophy },
  { id: 'skins', key: 'futureSkins' as TranslationKey, icon: Crown },
  { id: 'premium-benefits', key: 'premiumFeatures' as TranslationKey, icon: Sparkles },
];

export default function MobileNav({ activeTab, onTabChange, t, isAdmin = false, isPremium = false }: Props) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-2 py-2">
        {isAdmin && <button onClick={() => onTabChange('admin')} className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-300 ${activeTab === 'admin' ? 'text-neon-amber' : 'text-gray-500'}`}><div className={`p-1.5 rounded-lg ${activeTab === 'admin' ? 'bg-amber-300/10' : ''}`}><Settings className="w-5 h-5" /></div><span className="text-[10px] font-medium">Admin</span></button>}
        {TABS.filter((tab) => tab.id !== 'premium-benefits' || isPremium).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                isActive ? 'text-neon-cyan' : 'text-gray-500'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all duration-300 ${isActive ? 'bg-neon-cyan/10 neon-border-cyan' : 'bg-transparent'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">{t(tab.key)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
