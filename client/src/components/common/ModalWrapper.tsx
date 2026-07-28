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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full ${maxWidthClass} bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-2xl animate-slideUp max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800 shrink-0">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pr-1">{children}</div>
      </div>
    </div>
  );
};
