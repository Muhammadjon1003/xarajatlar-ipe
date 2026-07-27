import React, { useState } from 'react';
import { CheckCircle, Clock, Edit, Save, X } from 'lucide-react';
import { MonthlySalary } from '../../types';
import { formatUZS } from '../../utils/format';
import { Badge } from '../common/Badge';

interface SalaryTableRowProps {
  salary: MonthlySalary;
  onTogglePaid: (id: string, isPaid: boolean) => void;
  onUpdateBaseSalary: (id: string, newBaseSalary: number) => Promise<void>;
}

export const SalaryTableRow: React.FC<SalaryTableRowProps> = ({
  salary,
  onTogglePaid,
  onUpdateBaseSalary,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(salary.baseSalary.toString());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const num = Number(editValue.replace(/\D/g, ''));
    if (isNaN(num)) return;
    setSaving(true);
    try {
      await onUpdateBaseSalary(salary.id, num);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="hover:bg-zinc-800/40 transition-colors">
      <td className="px-5 py-3.5 font-bold text-zinc-100">
        {salary.employee?.firstName} {salary.employee?.lastName}
      </td>
      <td className="px-5 py-3.5">
        <Badge status={salary.employee?.role?.displayName || 'Xodim'} />
      </td>

      {/* Editable Base Salary Field */}
      <td className="px-5 py-3.5 font-semibold text-zinc-300">
        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              inputMode="numeric"
              className="w-32 bg-[#0d0d0f] border border-orange-500 rounded-lg px-2.5 py-1 text-xs font-bold text-orange-400 focus:outline-none"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Oylik kiriting"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-1 rounded bg-orange-500 text-zinc-950 hover:bg-orange-400"
              title="Saqlash va keyingi oylar uchun avto-yangilash"
            >
              <Save size={14} />
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <span>
              {Number(salary.baseSalary) > 0
                ? formatUZS(salary.baseSalary)
                : 'Kiritilmagan (0)'}
            </span>
            <button
              onClick={() => {
                setEditValue(salary.baseSalary ? salary.baseSalary.toString() : '');
                setIsEditing(true);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-orange-400 hover:bg-orange-500/10 rounded transition-all"
              title="Oylik kiritish / yangilash"
            >
              <Edit size={13} />
            </button>
          </div>
        )}
      </td>

      <td className="px-5 py-3.5 font-semibold text-emerald-400">
        +{formatUZS(salary.totalAdditions)}
      </td>
      <td className="px-5 py-3.5 font-semibold text-rose-400">
        -{formatUZS(salary.totalShiftDeductions)}
      </td>
      <td className="px-5 py-3.5 font-semibold text-amber-400">
        -{formatUZS(salary.totalAdvanceDeductions)}
      </td>
      <td className="px-5 py-3.5 font-extrabold text-white text-base">
        {formatUZS(salary.finalPayout)}
      </td>
      <td className="px-5 py-3.5">
        <Badge status={salary.isPaid ? 'PAID' : 'PENDING'} />
      </td>
      <td className="px-5 py-3.5 text-right">
        <button
          onClick={() => onTogglePaid(salary.id, salary.isPaid)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            salary.isPaid
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
          }`}
        >
          {salary.isPaid ? (
            <>
              <Clock size={14} /> Qaytarish
            </>
          ) : (
            <>
              <CheckCircle size={14} /> To‘lash
            </>
          )}
        </button>
      </td>
    </tr>
  );
};
