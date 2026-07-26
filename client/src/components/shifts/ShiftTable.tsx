import React from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { OneTimeShift } from '../../types';
import { TableWrapper } from '../common/TableWrapper';
import { ShiftTableRow } from './ShiftTableRow';

interface ShiftTableProps {
  shifts: OneTimeShift[];
  loading: boolean;
  onUpdateStatus: (id: string, status: 'APPROVED' | 'REJECTED') => void;
  onDelete: (id: string) => void;
}

export const ShiftTable: React.FC<ShiftTableProps> = ({
  shifts,
  loading,
  onUpdateStatus,
  onDelete,
}) => {
  if (loading) {
    return <p className="text-slate-400 p-4">Yuklanmoqda...</p>;
  }

  if (shifts.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <ArrowRightLeft size={40} className="mx-auto opacity-30 mb-2" />
        <p>Hali smena almashtirishlar mavjud emas</p>
      </div>
    );
  }

  return (
    <TableWrapper
      headers={[
        'Sana',
        'Kelmagan Xodim (Ushlanadi)',
        'O‘rniga Chiqqan (Qo‘shiladi)',
        'Smena Haqi (UZS)',
        'Izoh',
        'Holat',
        'Amallar',
      ]}
    >
      {shifts.map((sh) => (
        <ShiftTableRow
          key={sh.id}
          shift={sh}
          onUpdateStatus={onUpdateStatus}
          onDelete={onDelete}
        />
      ))}
    </TableWrapper>
  );
};
