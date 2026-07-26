import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Expense } from '../../types';
import { formatUZS, formatDate } from '../../utils/format';
import { Badge } from '../common/Badge';

interface ExpenseTableRowProps {
  expense: Expense;
  onEdit: (exp: Expense) => void;
  onDelete: (id: string) => void;
}

export const ExpenseTableRow: React.FC<ExpenseTableRowProps> = ({
  expense,
  onEdit,
  onDelete,
}) => {
  return (
    <tr className="hover:bg-slate-800/40 transition-colors">
      <td className="px-5 py-3.5 font-semibold text-slate-100">{expense.name}</td>
      <td className="px-5 py-3.5 font-extrabold text-rose-400 text-base">
        {formatUZS(expense.value)}
      </td>
      <td className="px-5 py-3.5">
        <Badge status={expense.category?.name || 'Xarajat'} />
      </td>
      <td className="px-5 py-3.5 text-slate-300">{expense.branch?.name}</td>
      <td className="px-5 py-3.5 text-slate-400">{formatDate(expense.date)}</td>
      <td className="px-5 py-3.5 text-right">
        <div className="inline-flex gap-2">
          <button
            onClick={() => onEdit(expense)}
            className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(expense.id)}
            className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};
