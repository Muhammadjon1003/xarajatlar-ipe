import React from 'react';
import { Clock } from 'lucide-react';
import { SalaryAdvance } from '../../types';
import { TableWrapper } from '../common/TableWrapper';
import { AdvanceTableRow } from './AdvanceTableRow';

interface AdvanceTableProps {
  advances: SalaryAdvance[];
  loading: boolean;
  onUpdateStatus: (id: string, status: 'APPROVED' | 'REJECTED') => void;
  onDelete: (id: string) => void;
}

export const AdvanceTable: React.FC<AdvanceTableProps> = ({
  advances,
  loading,
  onUpdateStatus,
  onDelete,
}) => {
  if (loading) {
    return <p className="text-zinc-400 p-4">Yuklanmoqda...</p>;
  }

  if (advances.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 bg-[#141417] border border-zinc-800 rounded-2xl">
        <Clock size={40} className="mx-auto opacity-30 mb-2 text-orange-400" />
        <p className="text-sm font-semibold text-zinc-400">Hali avans so‘rovlari mavjud emas</p>
      </div>
    );
  }

  return (
    <TableWrapper
      headers={['Xodim', 'Avans Summasi (UZS)', 'Sana', 'Sabab / Izoh', 'Holat', 'Tasdiqladi', 'Amallar']}
    >
      {advances.map((adv) => (
        <AdvanceTableRow
          key={adv.id}
          advance={adv}
          onUpdateStatus={onUpdateStatus}
          onDelete={onDelete}
        />
      ))}
    </TableWrapper>
  );
};
