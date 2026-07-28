import React from 'react';
import { Check, X, Trash2 } from 'lucide-react';
import { SalaryAdvance } from '../../types';
import { formatUZS, formatDate } from '../../utils/format';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

interface AdvanceTableRowProps {
  advance: SalaryAdvance;
  onUpdateStatus: (id: string, status: 'APPROVED' | 'REJECTED') => void;
  onDelete: (id: string) => void;
}

export const AdvanceTableRow: React.FC<AdvanceTableRowProps> = ({
  advance,
  onUpdateStatus,
  onDelete,
}) => {
  const { user } = useAuth();
  const roleCode = user?.roleCode || '';

  // Role permissions
  const canApproveOrReject = ['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT'].includes(roleCode);
  const canDelete = ['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT'].includes(roleCode) || advance.status === 'PENDING';

  return (
    <tr className="hover:bg-zinc-800/30 transition-colors border-b border-zinc-800/50">
      <td className="px-5 py-4 font-bold text-zinc-100">
        {advance.employee?.firstName} {advance.employee?.lastName}
      </td>
      <td className="px-5 py-4 font-extrabold text-amber-400 text-base">
        {formatUZS(advance.amount)}
      </td>
      <td className="px-5 py-4 text-zinc-400 text-sm font-semibold">{formatDate(advance.date)}</td>
      <td className="px-5 py-4 text-zinc-300 italic text-sm">{advance.reason || '—'}</td>
      <td className="px-5 py-4">
        <Badge status={advance.status} />
      </td>
      <td className="px-5 py-4 text-zinc-300 text-sm font-semibold">
        {advance.approvedBy
          ? `${advance.approvedBy.firstName} ${advance.approvedBy.lastName}`
          : '—'}
      </td>
      <td className="px-5 py-4 text-right">
        <div className="inline-flex gap-2">
          {/* Approve / Reject buttons for Managers/Admins */}
          {advance.status === 'PENDING' && canApproveOrReject && (
            <>
              <button
                onClick={() => onUpdateStatus(advance.id, 'APPROVED')}
                className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                title="Avansni Tasdiqlash"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => onUpdateStatus(advance.id, 'REJECTED')}
                className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all"
                title="Avansni Rad Etish"
              >
                <X size={16} />
              </button>
            </>
          )}

          {/* Delete button */}
          {canDelete && (
            <button
              onClick={() => onDelete(advance.id)}
              className="p-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
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
