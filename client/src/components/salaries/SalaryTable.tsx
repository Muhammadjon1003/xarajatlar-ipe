import React from 'react';
import { Banknote } from 'lucide-react';
import { MonthlySalary } from '../../types';
import { TableWrapper } from '../common/TableWrapper';
import { SalaryTableRow } from './SalaryTableRow';

interface SalaryTableProps {
  salaries: MonthlySalary[];
  loading: boolean;
  onTogglePaid: (id: string, isPaid: boolean) => void;
  onUpdateBaseSalary: (id: string, newBaseSalary: number) => Promise<void>;
  onRefresh: () => void;
}

export const SalaryTable: React.FC<SalaryTableProps> = ({
  salaries,
  loading,
  onTogglePaid,
  onUpdateBaseSalary,
  onRefresh,
}) => {
  if (loading) {
    return <p className="text-zinc-400 p-4">Yuklanmoqda...</p>;
  }

  if (salaries.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 bg-[#141417] border border-zinc-800 rounded-2xl">
        <Banknote size={40} className="mx-auto opacity-30 mb-2 text-orange-400" />
        <p className="text-sm font-semibold text-zinc-400">
          Ushbu oy uchun mos keladigan xodimlar topilmadi
        </p>
      </div>
    );
  }

  return (
    <TableWrapper
      headers={[
        'Xodim',
        'Lavozim / Rol',
        'Zamena Qilgan',
        'Zamena Qildirgan',
        'Avans Ushlanma',
        "Qo'lga Tegadigan (Net)",
        'Oylik Kiritish (Amal)',
      ]}
    >
      {salaries.map((sal) => (
        <SalaryTableRow
          key={sal.id}
          salary={sal}
          onTogglePaid={onTogglePaid}
          onUpdateBaseSalary={onUpdateBaseSalary}
          onRefresh={onRefresh}
        />
      ))}
    </TableWrapper>
  );
};
