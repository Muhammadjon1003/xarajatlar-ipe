import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { MonthlySalary } from '../../types';
import { formatUZS } from '../../utils/format';
import { Badge } from '../common/Badge';

interface SalaryTableRowProps {
  salary: MonthlySalary;
  onTogglePaid: (id: string, isPaid: boolean) => void;
}

export const SalaryTableRow: React.FC<SalaryTableRowProps> = ({ salary, onTogglePaid }) => {
  return (
    <tr className="hover:bg-slate-800/40 transition-colors">
      <td className="px-5 py-3.5 font-bold text-slate-100">
        {salary.employee?.firstName} {salary.employee?.lastName}
      </td>
      <td className="px-5 py-3.5">
        <Badge status={salary.employee?.role?.displayName || 'Xodim'} />
      </td>
      <td className="px-5 py-3.5 font-semibold text-slate-300">{formatUZS(salary.baseSalary)}</td>
      <td className="px-5 py-3.5 font-semibold text-emerald-400">
        +{formatUZS(salary.totalAdditions)}
      </td>
      <td className="px-5 py-3.5 font-semibold text-rose-400">
        -{formatUZS(salary.totalShiftDeductions)}
      </td>
      <td className="px-5 py-3.5 font-semibold text-amber-400">
        -{formatUZS(salary.totalAdvanceDeductions)}
      </td>
      <td className="px-5 py-3.5 font-extrabold text-white text-base">
        {formatUZS(salary.finalPayout)}
      </td>
      <td className="px-5 py-3.5">
        <Badge status={salary.isPaid ? 'PAID' : 'PENDING'} />
      </td>
      <td className="px-5 py-3.5 text-right">
        <button
          onClick={() => onTogglePaid(salary.id, salary.isPaid)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            salary.isPaid
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
          }`}
        >
          {salary.isPaid ? (
            <>
              <Clock size={14} /> Qaytarish
            </>
          ) : (
            <>
              <CheckCircle size={14} /> To‘lash
            </>
          )}
        </button>
      </td>
    </tr>
  );
};
