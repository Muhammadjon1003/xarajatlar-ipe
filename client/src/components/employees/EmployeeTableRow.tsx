import React from 'react';
import { Edit, UserCheck, UserX } from 'lucide-react';
import { Employee } from '../../types';
import { formatUZS } from '../../utils/format';
import { Badge } from '../common/Badge';

interface EmployeeTableRowProps {
  employee: Employee;
  onEdit: (emp: Employee) => void;
}

export const EmployeeTableRow: React.FC<EmployeeTableRowProps> = ({ employee, onEdit }) => {
  const hasSalary = employee.defaultBaseSalary && Number(employee.defaultBaseSalary) > 0;

  return (
    <tr className="hover:bg-zinc-800/40 transition-colors">
      <td className="px-5 py-3.5 font-bold text-zinc-100">
        {employee.firstName} {employee.lastName}
      </td>
      <td className="px-5 py-3.5 text-zinc-400">{employee.phone || '-'}</td>
      <td className="px-5 py-3.5">
        <Badge status={employee.role?.displayName || 'Xodim'} />
      </td>
      <td className="px-5 py-3.5 font-bold text-orange-400">
        {hasSalary ? formatUZS(employee.defaultBaseSalary!) : '-'}
      </td>
      <td className="px-5 py-3.5">
        {employee.isActive ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck size={12} /> Faol
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <UserX size={12} /> Nofaol
          </span>
        )}
      </td>
      <td className="px-5 py-3.5 text-right">
        <button
          onClick={() => onEdit(employee)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-colors text-xs font-semibold"
        >
          <Edit size={14} /> Tahrirlash
        </button>
      </td>
    </tr>
  );
};
