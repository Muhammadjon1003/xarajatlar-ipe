import React from 'react';
import { ModalWrapper } from './ModalWrapper';
import { ExternalLink, Download, FileText } from 'lucide-react';

interface ReceiptImageModalProps {
  isOpen: boolean;
  receiptUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ReceiptImageModal: React.FC<ReceiptImageModalProps> = ({
  isOpen,
  receiptUrl,
  title = 'Chek / Kvitansiya Rasmi',
  onClose,
}) => {
  if (!isOpen || !receiptUrl) return null;

  const isImage =
    receiptUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) ||
    receiptUrl.includes('firebasestorage') ||
    receiptUrl.startsWith('data:image/');

  return (
    <ModalWrapper title={title} isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-2 flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-hidden">
          {isImage ? (
            <img
              src={receiptUrl}
              alt="Receipt Full Preview"
              className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-lg"
            />
          ) : (
            <div className="text-center py-10 space-y-3">
              <FileText size={48} className="mx-auto text-amber-400 opacity-60" />
              <p className="text-sm font-semibold text-zinc-300">
                Ushbu fayl rasm formati emas (PDF yoki boshqa hujjat)
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <a
            href={receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 text-xs font-semibold transition-colors"
          >
            <ExternalLink size={14} /> Asl Manzilini Ochish
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-xs font-semibold transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};
