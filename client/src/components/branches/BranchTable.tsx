import React from 'react';
import { Trash2 } from 'lucide-react';
import { Branch } from '../../types';
import { TableWrapper } from '../common/TableWrapper';
import { Badge } from '../common/Badge';

interface BranchTableProps {
  branches: Branch[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export const BranchTable: React.FC<BranchTableProps> = ({ branches, loading, onDelete }) => {
  if (loading) return <p className="text-slate-400 p-4">Yuklanmoqda...</p>;

  return (
    <TableWrapper headers={['Filial Nomi', 'Xarajatlar Soni', 'Amal']}>
      {branches.map((b) => (
        <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
          <td className="px-5 py-3.5 font-bold text-slate-100">{b.name}</td>
          <td className="px-5 py-3.5">
            <Badge status={`${b._count?.expenses || 0} ta`} />
          </td>
          <td className="px-5 py-3.5 text-right">
            <button
              onClick={() => onDelete(b.id)}
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
