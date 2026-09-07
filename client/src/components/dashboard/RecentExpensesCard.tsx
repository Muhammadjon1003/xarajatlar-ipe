import React from 'react';
import { Receipt } from 'lucide-react';
import { Expense } from '../../types';
import { formatUZS, formatDate } from '../../utils/format';
import { TableWrapper } from '../common/TableWrapper';

interface RecentExpensesCardProps {
  expenses: Expense[];
}

export const RecentExpensesCard: React.FC<RecentExpensesCardProps> = ({ expenses }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Receipt size={20} className="text-orange-400" />
        <h3 className="text-base font-bold text-white">So‘nggi Xarajatlar</h3>
      </div>

      {expenses.length === 0 ? (
        <p className="text-zinc-500 text-sm">Hali xarajatlar ro‘yxatga olinmagan</p>
      ) : (
        <>
          {/* Mobile List View (< md) */}
          <div className="md:hidden space-y-2.5">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-3 rounded-xl bg-[#141417] border border-zinc-800/80 flex items-center justify-between gap-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-zinc-100 text-xs truncate">{exp.name}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                    <span>{exp.category?.name || 'Xarajat'}</span>
                    <span>•</span>
                    <span>{formatDate(exp.date)}</span>
                  </div>
                </div>
                <span className="font-extrabold text-orange-400 text-xs shrink-0">
                  {formatUZS(exp.value)}
                </span>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block">
            <TableWrapper headers={['Nomi', 'Kategoriya', 'Filial', 'Sana', 'Summa (UZS)']}>
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-5 py-3 font-semibold text-zinc-100">{exp.name}</td>
                  <td className="px-5 py-3 text-zinc-300">{exp.category?.name}</td>
                  <td className="px-5 py-3 text-zinc-300">{exp.branch?.name}</td>
                  <td className="px-5 py-3 text-zinc-400">{formatDate(exp.date)}</td>
                  <td className="px-5 py-3 font-bold text-orange-400">{formatUZS(exp.value)}</td>
                </tr>
              ))}
            </TableWrapper>
          </div>
        </>
      )}
    </div>
  );
};
