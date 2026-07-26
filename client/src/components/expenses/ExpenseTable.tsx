import React from 'react';
import { Receipt } from 'lucide-react';
import { Expense } from '../../types';
import { TableWrapper } from '../common/TableWrapper';
import { ExpenseTableRow } from './ExpenseTableRow';

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
    <TableWrapper headers={['Xarajat Nomi', 'Summa (UZS)', 'Kategoriya', 'Filial', 'Sana', 'Amallar']}>
      {expenses.map((exp) => (
        <ExpenseTableRow key={exp.id} expense={exp} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </TableWrapper>
  );
};
