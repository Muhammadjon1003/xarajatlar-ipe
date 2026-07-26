import React from 'react';
import { Trash2 } from 'lucide-react';
import { ExpenseCategory } from '../../types';
import { TableWrapper } from '../common/TableWrapper';

interface CategoryTableProps {
  categories: ExpenseCategory[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({ categories, loading, onDelete }) => {
  if (loading) return <p className="text-slate-400 p-4">Yuklanmoqda...</p>;

  return (
    <TableWrapper headers={['Kategoriya Nomi', 'Tavsif', 'Amal']}>
      {categories.map((c) => (
        <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
          <td className="px-5 py-3.5 font-bold text-slate-100">{c.name}</td>
          <td className="px-5 py-3.5 text-slate-400 text-xs">{c.description || '-'}</td>
          <td className="px-5 py-3.5 text-right">
            <button
              onClick={() => onDelete(c.id)}
              className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
            >
              <Trash2 size={16} />
            </button>
          </td>
        </tr>
      ))}
    </TableWrapper>
  );
};
