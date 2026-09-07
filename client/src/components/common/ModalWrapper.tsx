import React from 'react';
import { X } from 'lucide-react';

interface ModalWrapperProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  title,
  isOpen,
  onClose,
  children,
  maxWidthClass = 'max-w-lg',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full ${maxWidthClass} bg-[#141417] border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl animate-slideUp max-h-[92vh] flex flex-col pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6`}
      >
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700/60 mx-auto mb-3 sm:hidden shrink-0" />

        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-zinc-800 shrink-0">
          <h3 className="text-base sm:text-lg font-extrabold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pr-0.5">{children}</div>
      </div>
    </div>
  );
};
