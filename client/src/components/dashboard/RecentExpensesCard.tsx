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
      )}
    </div>
  );
};
