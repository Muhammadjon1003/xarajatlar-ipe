import React from 'react';
import { Download, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { InstallAppModal } from './InstallAppModal';

interface InstallAppButtonProps {
  variant?: 'sidebar' | 'header' | 'bottom-nav' | 'badge';
  className?: string;
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  variant = 'sidebar',
  className = '',
}) => {
  const { isInstalled, isIOS, isModalOpen, setIsModalOpen, triggerInstall } = usePWAInstall();

  if (isInstalled && variant !== 'badge') {
    return null;
  }

  return (
    <>
      {variant === 'sidebar' && (
        <button
          onClick={triggerInstall}
          type="button"
          className={`w-full group relative flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/5 border border-orange-500/30 hover:border-orange-500/60 text-orange-400 hover:text-orange-300 font-bold text-xs transition-all shadow-sm active:scale-[0.98] ${className}`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 group-hover:bg-orange-500 group-hover:text-zinc-950 transition-colors shrink-0">
              <Smartphone size={16} />
            </div>
            <div className="text-left truncate">
              <span className="block text-white text-[11px] font-extrabold leading-tight">
                Telefon uchun ilova
              </span>
              <span className="text-[10px] text-orange-400 font-medium leading-none">
                Yuklab olish
              </span>
            </div>
          </div>
          <div className="p-1 rounded-lg bg-orange-500/10 text-orange-400 group-hover:translate-y-0.5 transition-transform shrink-0">
            <Download size={14} />
          </div>
        </button>
      )}

      {variant === 'header' && (
        <button
          onClick={triggerInstall}
          type="button"
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-orange-500/15 border border-orange-500/40 text-orange-400 hover:text-white hover:bg-orange-500 font-bold text-xs transition-all active:scale-95 shadow-sm shrink-0 ${className}`}
          title="Ilovani telefoningizga o‘rnating"
        >
          <Download size={14} className="animate-bounce shrink-0" />
          <span className="text-[11px] font-extrabold hidden min-[390px]:inline">Yuklab olish</span>
        </button>
      )}

      {variant === 'bottom-nav' && !isInstalled && (
        <button
          onClick={triggerInstall}
          type="button"
          className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-[10px] font-bold text-orange-400 hover:text-orange-300 transition-all active:scale-95"
          title="Telefoningizga o‘rnating"
        >
          <div className="relative p-1 rounded-xl bg-orange-500/20 text-orange-400 shadow-sm border border-orange-500/30">
            <Download size={18} className="animate-bounce" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-500" />
          </div>
          <span className="text-orange-400 font-extrabold">O‘rnatish</span>
        </button>
      )}

      {variant === 'badge' && isInstalled && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Check size={14} />
          <span>Ilova o‘rnatilgan</span>
        </div>
      )}

      {/* Guide Modal */}
      <InstallAppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isIOS={isIOS}
      />
    </>
  );
};
