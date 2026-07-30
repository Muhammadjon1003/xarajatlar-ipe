import React from 'react';
import { Check, X, Trash2, ShieldAlert } from 'lucide-react';
import { OneTimeShift } from '../../types';
import { formatUZS, formatDate } from '../../utils/format';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

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
  const { user } = useAuth();

  const isManagerOrAdmin = ['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT'].includes(user?.roleCode || '');
  const isAbsentEmployee = user?.id === shift.absentEmployeeId; // The employee who was replaced
  const isCoveringEmployee = user?.id === shift.coveringEmployeeId; // The employee who did the shift
  const canUpdateStatus = isManagerOrAdmin || isAbsentEmployee || isCoveringEmployee;
  const canDelete = isManagerOrAdmin || (isCoveringEmployee && shift.status === 'PENDING');

  return (
    <tr className="hover:bg-zinc-800/30 transition-colors border-b border-zinc-800/50">
      <td className="px-5 py-4 text-zinc-400 text-xs font-semibold">{formatDate(shift.date)}</td>

      {/* Absent Employee (Zamena Qildirgan) */}
      <td className="px-5 py-4 font-bold text-rose-400 text-sm">
        {shift.absentEmployee?.firstName} {shift.absentEmployee?.lastName}
        {isAbsentEmployee && (
          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-300 font-normal">
            (Siz)
          </span>
        )}
      </td>

      {/* Covering Employee (Zamena Qilgan) */}
      <td className="px-5 py-4 font-bold text-emerald-400 text-sm">
        {shift.coveringEmployee?.firstName} {shift.coveringEmployee?.lastName}
        {isCoveringEmployee && (
          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 font-normal">
            (Siz)
          </span>
        )}
      </td>

      <td className="px-5 py-4 font-extrabold text-white text-base">
        {formatUZS(shift.amount)}
      </td>

      <td className="px-5 py-4 text-zinc-300 italic text-sm">{shift.description || '—'}</td>

      <td className="px-5 py-4">
        <Badge status={shift.status} />
      </td>

      <td className="px-5 py-4 text-right">
        <div className="inline-flex gap-2 items-center">
          {shift.status === 'PENDING' && canUpdateStatus && (
            <>
              <button
                onClick={() => onUpdateStatus(shift.id, 'APPROVED')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all"
                title="Smenani To‘g‘ri Deb Tasdiqlash"
              >
                <Check size={15} />
                <span>Tasdiqlash</span>
              </button>

              <button
                onClick={() => onUpdateStatus(shift.id, 'REJECTED')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all"
                title="Noto‘g‘ri (Rad Etish / Bekor Qilish)"
              >
                <X size={15} />
                <span>Noto‘g‘ri (Bekor)</span>
              </button>
            </>
          )}

          {canDelete && (
            <button
              onClick={() => onDelete(shift.id)}
              className="p-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              title="O‘chirish"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
