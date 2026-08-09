import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  ArrowRightLeft,
  UserCheck,
  Menu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  onOpenMobileMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMobileMenu }) => {
  const { user } = useAuth();
  const location = useLocation();
  const roleCode = user?.roleCode || '';

  const isSuperAdminOrDirectorOrManager = ['SUPER_ADMIN', 'DIRECTOR', 'MANAGER'].includes(roleCode);

  const navItems = isSuperAdminOrDirectorOrManager
    ? [
        { path: '/dashboard', label: 'Boshqaruv', icon: LayoutDashboard },
        { path: '/expenses-input', label: 'Xarajat', icon: PlusCircle },
        { path: '/shifts', label: 'Zamena', icon: ArrowRightLeft },
        { path: '/advances', label: 'Avanslar', icon: Clock },
      ]
    : [
        { path: '/my-salary', label: 'Oyligim', icon: UserCheck },
        { path: '/shifts', label: 'Zamena', icon: ArrowRightLeft },
        { path: '/advances', label: 'Avanslar', icon: Clock },
      ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121215]/95 backdrop-blur-md border-t border-zinc-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-bold transition-all ${
              isActive
                ? 'text-orange-400 font-extrabold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-orange-500/15 text-orange-400' : ''}`}>
              <Icon size={20} />
            </div>
            <span className="truncate max-w-[64px]">{item.label}</span>
          </Link>
        );
      })}

      {/* Menu Drawer Opener Button */}
      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-zinc-200"
      >
        <div className="p-1 rounded-xl">
          <Menu size={20} />
        </div>
        <span>Barchasi</span>
      </button>
    </nav>
  );
};
