import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status?.toUpperCase()) {
    case 'APPROVED':
    case 'PAID':
    case 'TRUE':
      return <span className="badge badge-emerald">Tasdiqlangan / To‘langan</span>;
    case 'PENDING':
    case 'FALSE':
      return <span className="badge badge-amber">Kutilmoqda / Kiritilmagan</span>;
    case 'REJECTED':
      return <span className="badge badge-rose">Rad etilgan</span>;
    default:
      return <span className="badge badge-indigo">{status}</span>;
  }
};
