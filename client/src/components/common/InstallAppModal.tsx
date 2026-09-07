import React from 'react';
import { X, Smartphone, Share2, PlusSquare, CheckCircle, ArrowDown } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose, isIOS }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#18181b] border border-zinc-700/80 rounded-2xl shadow-2xl p-6 text-zinc-100 overflow-hidden">
        {/* Top Decorative Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Yopish"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0 shadow-inner">
            <Smartphone size={26} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white tracking-tight">
              Telefon uchun ilovani o‘rnatish
            </h3>
            <p className="text-xs text-zinc-400">
              {isIOS ? 'iPhone (iOS) uchun qo‘llanma' : 'Android va Brauzer uchun qo‘llanma'}
            </p>
          </div>
        </div>

        {/* Instructions Body */}
        {isIOS ? (
          <div className="space-y-3.5 my-4 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div className="flex-1">
                <p className="font-semibold text-zinc-200">
                  Safari brauzeri pastki menyusidagi <span className="text-orange-400 font-bold">"Ulashish" (Share)</span> belgisini bosing:
                </p>
                <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 font-mono text-[11px]">
                  <Share2 size={13} className="text-blue-400" /> Ulashish (Share / Поделиться)
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <div className="flex-1">
                <p className="font-semibold text-zinc-200">
                  Ochilgan ro‘yxatdan <span className="text-orange-400 font-bold">"Bosh ekranga qo‘shish"</span> bandini tanlang:
                </p>
                <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 font-mono text-[11px]">
                  <PlusSquare size={13} className="text-zinc-200" /> Bosh ekranga qo‘shish (Add to Home Screen)
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                3
              </div>
              <div className="flex-1">
                <p className="font-semibold text-zinc-200">
                  Yuqori o‘ng burchakdagi <span className="text-emerald-400 font-bold">"Qo‘shish" (Add)</span> tugmasini bosing.
                </p>
                <p className="text-zinc-400 text-[11px] mt-1">
                  Ilova telefoningiz ekranida xuddi App Store ilovalaridek alohida paydo bo‘ladi! 📲
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 my-4 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div className="flex-1">
                <p className="font-semibold text-zinc-200">
                  Brauzerning yuqori o‘ng burchagidagi <span className="text-orange-400 font-bold">uchta nuqta (⋮)</span> yoki manzil qatoridagi o‘rnatish belgisini bosing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <div className="flex-1">
                <p className="font-semibold text-zinc-200">
                  <span className="text-orange-400 font-bold">"Ilovani o‘rnatish" (Установить приложение / Install App)</span> yoki <span className="text-orange-400 font-bold">"Bosh ekranga qo‘shish"</span> tugmasini tanlang.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <CheckCircle size={18} className="shrink-0 mt-0.5 text-emerald-400" />
              <p className="text-[11px] leading-relaxed">
                O‘rnatilgandan so‘ng ilova brauzersiz, to‘liq ekran (Full Screen) rejimida tez va qulay ishlaydi!
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-5 pt-3 border-t border-zinc-800/80">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-zinc-950 font-extrabold text-sm transition-all shadow-md shadow-orange-500/20"
          >
            Tushunarli
          </button>
        </div>
      </div>
    </div>
  );
};
