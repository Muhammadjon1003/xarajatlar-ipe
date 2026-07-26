import React from 'react';
import { Banknote } from 'lucide-react';
import { MonthlySalary } from '../../types';
import { TableWrapper } from '../common/TableWrapper';
import { SalaryTableRow } from './SalaryTableRow';
import { Button } from '../common/Button';

interface SalaryTableProps {
  salaries: MonthlySalary[];
  loading: boolean;
  onCalculate: () => void;
  onTogglePaid: (id: string, isPaid: boolean) => void;
}

export const SalaryTable: React.FC<SalaryTableProps> = ({
  salaries,
  loading,
  onCalculate,
  onTogglePaid,
}) => {
  if (loading) {
    return <p className="text-slate-400 p-4">Yuklanmoqda...</p>;
  }

  if (salaries.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Banknote size={40} className="mx-auto opacity-30 mb-2" />
        <p>Ushbu oy uchun hali oyliklar hisoblanmagan.</p>
        <Button variant="secondary" className="mt-4" onClick={onCalculate}>
          Hozir Hisoblash
        </Button>
      </div>
    );
  }

  return (
    <TableWrapper
      headers={[
        'Xodim',
        'Lavozim / Rol',
        'Asosiy Maosh',
        'Smena Qo‘shimcha',
        'Smena Ushlanma',
        'Avans Ushlanma',
        'Qo‘lga Tegadigan (Net)',
        'Holat',
        'Amal',
      ]}
    >
      {salaries.map((sal) => (
        <SalaryTableRow key={sal.id} salary={sal} onTogglePaid={onTogglePaid} />
      ))}
    </TableWrapper>
  );
};
