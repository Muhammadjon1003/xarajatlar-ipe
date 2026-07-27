import React from 'react';
import { Users } from 'lucide-react';
import { Employee } from '../../types';
import { TableWrapper } from '../common/TableWrapper';
import { EmployeeTableRow } from './EmployeeTableRow';

interface EmployeeTableProps {
  employees: Employee[];
  loading: boolean;
  onEdit: (emp: Employee) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({ employees, loading, onEdit }) => {
  if (loading) {
    return <p className="text-zinc-400 p-4">Yuklanmoqda...</p>;
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <Users size={40} className="mx-auto opacity-30 mb-2" />
        <p>Hali xodimlar ro‘yxatdan o‘tkazilmagan</p>
      </div>
    );
  }

  return (
    <TableWrapper headers={['Ism Familiya', 'Telefon', 'Rol / Huquq', 'Oxirgi Maoshi', 'Holat', 'Amallar']}>
      {employees.map((emp) => (
        <EmployeeTableRow key={emp.id} employee={emp} onEdit={onEdit} />
      ))}
    </TableWrapper>
  );
};
