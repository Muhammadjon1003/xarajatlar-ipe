import React from 'react';

interface BadgeProps {
  status: string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const norm = status?.toUpperCase();

  if (['APPROVED', 'PAID', 'TRUE'].includes(norm)) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
        Tasdiqlangan / To‘langan
      </span>
    );
  }

  if (['PENDING', 'FALSE'].includes(norm)) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-400/10 text-yellow-400 border border-yellow-400/20">
        Kutilmoqda / Kiritilmagan
      </span>
    );
  }

  if (['REJECTED'].includes(norm)) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
        Rad etilgan
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-zinc-800 text-amber-300 border border-zinc-700">
      {status}
    </span>
  );
};
