import React from 'react';
import { Check, X, Trash2 } from 'lucide-react';
import { SalaryAdvance } from '../../types';
import { formatUZS, formatDate } from '../../utils/format';
import { Badge } from '../common/Badge';

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
  return (
    <tr className="hover:bg-slate-800/40 transition-colors">
      <td className="px-5 py-3.5 font-bold text-slate-100">
        {advance.employee?.firstName} {advance.employee?.lastName}
      </td>
      <td className="px-5 py-3.5 font-extrabold text-amber-400 text-base">
        {formatUZS(advance.amount)}
      </td>
      <td className="px-5 py-3.5 text-slate-400">{formatDate(advance.date)}</td>
      <td className="px-5 py-3.5 text-slate-300 italic">{advance.reason || '-'}</td>
      <td className="px-5 py-3.5">
        <Badge status={advance.status} />
      </td>
      <td className="px-5 py-3.5 text-slate-300">
        {advance.approvedBy
          ? `${advance.approvedBy.firstName} ${advance.approvedBy.lastName}`
          : '-'}
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="inline-flex gap-2">
          {advance.status === 'PENDING' && (
            <>
              <button
                onClick={() => onUpdateStatus(advance.id, 'APPROVED')}
                className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                title="Tasdiqlash"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => onUpdateStatus(advance.id, 'REJECTED')}
                className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                title="Rad etish"
              >
                <X size={16} />
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(advance.id)}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};
