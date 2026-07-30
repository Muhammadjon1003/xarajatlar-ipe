import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  BookOpen,
  Banknote,
  Users,
  Clock,
  ArrowRightLeft,
  TrendingDown,
  DollarSign,
  LineChart,
  Settings,
  LogOut,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const roleCode = user?.roleCode || '';

  const allNavItems = [
    { path: '/admin-panel', label: 'Admin Panel', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
    { path: '/my-salary', label: 'Mening Oyligim', icon: UserCheck, roles: ['TEACHER', 'ADMINISTRATOR', 'EMPLOYEE'] },
    { path: '/dashboard', label: 'Boshqaruv Paneli', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'MANAGER'] },
    { path: '/expenses-input', label: 'Xarajat Kiritish', icon: PlusCircle, roles: ['SUPER_ADMIN', 'MANAGER', 'EXPENSE_CLERK'] },
    { path: '/expenses-stats', label: 'Xarajat Tahlili & Stats', icon: BarChart3, roles: ['SUPER_ADMIN', 'MANAGER'] },
    { path: '/expenses-ledger', label: 'Xarajat Daftari (Ledger)', icon: BookOpen, roles: ['SUPER_ADMIN', 'MANAGER'] },
    { path: '/monthly-analysis', label: 'Oylik Tahlil', icon: LineChart, roles: ['SUPER_ADMIN', 'MANAGER'] },
    { path: '/salaries', label: 'Oyliklarni Hisoblash', icon: Banknote, roles: ['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT'] },
    { path: '/salary-payout', label: 'Oyliklarni Berish', icon: DollarSign, roles: ['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT'] },
    { path: '/employees', label: 'Xodimlar va Rollar', icon: Users, roles: ['SUPER_ADMIN', 'MANAGER'] },
    { path: '/advances', label: 'Oylik Avanslar', icon: Clock, roles: ['SUPER_ADMIN', 'MANAGER', 'EXPENSE_CLERK', 'PAYROLL_ACCOUNTANT', 'EMPLOYEE'] },
    { path: '/shifts', label: 'Zamena', icon: ArrowRightLeft, roles: ['SUPER_ADMIN', 'MANAGER', 'TEACHER', 'EMPLOYEE'] },
    { path: '/settings', label: 'Tizim Sozlamalari', icon: Settings, roles: ['SUPER_ADMIN', 'MANAGER'] },
  ];

  // Filter items based on user role
  const navItems = allNavItems.filter((item) => item.roles.includes(roleCode));

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
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-orange-500/15 text-orange-400 border-l-4 border-orange-500 font-bold'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border-l-4 border-transparent'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-orange-400' : 'text-zinc-400'} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Active User Info Banner & Logout */}
      <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between">
        <div className="overflow-hidden">
          <p className="text-xs font-bold text-white truncate">
            {user?.firstName} {user?.lastName}
          </p>
          <span className="text-[11px] text-amber-400 font-semibold block">
            {user?.roleDisplayName || 'Tizim Xodimi'}
          </span>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Tizimdan chiqish"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
