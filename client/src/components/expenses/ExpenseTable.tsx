import React from 'react';
import { Receipt, Edit, Trash2, Calendar, Eye, Building2 } from 'lucide-react';
import { Expense } from '../../types';
import { TableWrapper } from '../common/TableWrapper';
import { ExpenseTableRow } from './ExpenseTableRow';
import { formatUZS, formatDate } from '../../utils/format';
import { Badge } from '../common/Badge';

interface ExpenseTableProps {
  expenses: Expense[];
  loading: boolean;
  onEdit: (exp: Expense) => void;
  onDelete: (id: string) => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  loading,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return <p className="text-slate-400 p-4">Yuklanmoqda...</p>;
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Receipt size={40} className="mx-auto opacity-30 mb-2" />
        <p>Hech qanday xarajat topilmadi</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card List View (Phones < md) */}
      <div className="md:hidden space-y-3">
        {expenses.map((exp) => (
          <div
            key={exp.id}
            className="bg-[#141417] border border-zinc-800/90 rounded-2xl p-4 shadow-sm space-y-3 transition-all hover:border-zinc-700"
          >
            {/* Header: Name + Actions */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-zinc-100 text-sm leading-snug break-words">
                  {exp.name}
                </h4>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-400">
                  <Calendar size={13} className="text-zinc-500 shrink-0" />
                  <span>{formatDate(exp.date)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onEdit(exp)}
                  className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 active:scale-95 transition-all"
                  title="Tahrirlash"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => onDelete(exp.id)}
                  className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all"
                  title="O‘chirish"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Middle: Amount & Badges */}
            <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-zinc-800/60">
              <span className="font-extrabold text-orange-400 text-base sm:text-lg">
                {formatUZS(exp.value)}
              </span>

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <Badge status={exp.category?.name || 'Xarajat'} />
                {exp.branch?.name && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-300 px-2.5 py-0.5 rounded-lg bg-zinc-800 border border-zinc-700/60">
                    <Building2 size={12} className="text-zinc-400 shrink-0" />
                    <span className="truncate max-w-[100px]">{exp.branch.name}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Receipt Link if Available */}
            {exp.receiptUrl && (
              <div className="pt-2 border-t border-zinc-800/40">
                <a
                  href={exp.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-orange-400 font-semibold hover:underline"
                >
                  <Eye size={14} /> Chek rasmini ko‘rish
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block">
        <TableWrapper headers={['Xarajat Nomi', 'Summa (UZS)', 'Kategoriya', 'Filial', 'Sana', 'Amallar']}>
          {expenses.map((exp) => (
            <ExpenseTableRow key={exp.id} expense={exp} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </TableWrapper>
      </div>
    </>
  );
};
