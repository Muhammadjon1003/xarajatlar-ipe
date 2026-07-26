import React from 'react';
import { Check, X, Trash2 } from 'lucide-react';
import { OneTimeShift } from '../../types';
import { formatUZS, formatDate } from '../../utils/format';
import { Badge } from '../common/Badge';

interface ShiftTableRowProps {
  shift: OneTimeShift;
  onUpdateStatus: (id: string, status: 'APPROVED' | 'REJECTED') => void;
  onDelete: (id: string) => void;
}

export const ShiftTableRow: React.FC<ShiftTableRowProps> = ({
  shift,
  onUpdateStatus,
  onDelete,
}) => {
  return (
    <tr className="hover:bg-slate-800/40 transition-colors">
      <td className="px-5 py-3.5 text-slate-400">{formatDate(shift.date)}</td>
      <td className="px-5 py-3.5 font-bold text-rose-400">
        {shift.absentEmployee?.firstName} {shift.absentEmployee?.lastName}
      </td>
      <td className="px-5 py-3.5 font-bold text-emerald-400">
        {shift.coveringEmployee?.firstName} {shift.coveringEmployee?.lastName}
      </td>
      <td className="px-5 py-3.5 font-extrabold text-white text-base">
        {formatUZS(shift.amount)}
      </td>
      <td className="px-5 py-3.5 text-slate-300 italic">{shift.description || '-'}</td>
      <td className="px-5 py-3.5">
        <Badge status={shift.status} />
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="inline-flex gap-2">
          {shift.status === 'PENDING' && (
            <>
              <button
                onClick={() => onUpdateStatus(shift.id, 'APPROVED')}
                className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                title="Tasdiqlash"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => onUpdateStatus(shift.id, 'REJECTED')}
                className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                title="Rad etish"
              >
                <X size={16} />
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(shift.id)}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};
