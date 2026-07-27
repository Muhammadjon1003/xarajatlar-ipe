import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  BookOpen,
  Banknote,
  Users,
  Clock,
  ArrowRightLeft,
  Building2,
  TrendingDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Boshqaruv Paneli', icon: LayoutDashboard },
    { id: 'expenses-input', label: 'Xarajat Kiritish', icon: PlusCircle },
    { id: 'expenses-stats', label: 'Xarajat Tahlili & Stats', icon: BarChart3 },
    { id: 'expenses-ledger', label: 'Xarajat Daftari (Ledger)', icon: BookOpen },
    { id: 'salaries', label: 'Oyliklarni Hisoblash', icon: Banknote },
    { id: 'employees', label: 'Xodimlar Shtati', icon: Users },
    { id: 'advances', label: 'Oylik Avanslar', icon: Clock },
    { id: 'shifts', label: 'Zamena', icon: ArrowRightLeft },
    { id: 'branches-categories', label: 'Filial & Kategoriyalar', icon: Building2 },
  ];

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-[#121215] border-r border-zinc-800/60 flex flex-col p-5 z-40">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 pb-5 mb-5 border-b border-zinc-800/60">
        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-zinc-950 font-bold shadow-sm">
          <TrendingDown size={22} className="text-zinc-950" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-white tracking-tight">
            Xarajatlar & Oylik
          </h2>
          <span className="text-xs text-orange-400 font-semibold">Moliya Boshqaruvi</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-orange-500/15 text-orange-400 border-l-4 border-orange-500 font-bold'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border-l-4 border-transparent'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-orange-400' : 'text-zinc-400'} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Active User Info Banner */}
      <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between">
        <div className="overflow-hidden">
          <p className="text-xs font-bold text-white truncate">
            {user?.firstName} {user?.lastName}
          </p>
          <span className="text-[11px] text-amber-400 font-semibold block">
            {user?.roleDisplayName || 'Test Mode Active'}
          </span>
        </div>
      </div>
    </aside>
  );
};
