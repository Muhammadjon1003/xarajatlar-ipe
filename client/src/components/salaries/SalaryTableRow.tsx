import React, { useState } from 'react';
import { CheckCircle, Save, BookOpen, Award } from 'lucide-react';
import { MonthlySalary } from '../../types';
import { formatUZS } from '../../utils/format';
import { Badge } from '../common/Badge';
import { TeacherSalaryModal } from './TeacherSalaryModal';
import { AdministratorSalaryModal } from './AdministratorSalaryModal';

interface SalaryTableRowProps {
  salary: MonthlySalary;
  onTogglePaid: (id: string, isPaid: boolean) => void;
  onUpdateBaseSalary: (id: string, newBaseSalary: number) => Promise<void>;
  onRefresh: () => void;
}

export const SalaryTableRow: React.FC<SalaryTableRowProps> = ({
  salary,
  onTogglePaid,
  onUpdateBaseSalary,
  onRefresh,
}) => {
  const [inputValue, setInputValue] = useState(
    Number(salary.baseSalary) > 0 ? salary.baseSalary.toString() : ''
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Modals state
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const roleCode = salary.employee?.role?.code;
  const isTeacher = roleCode === 'TEACHER';
  const isAdmin = roleCode === 'ADMINISTRATOR';

  const handleSave = async () => {
    const num = Number(inputValue.replace(/\s/g, '').replace(/[^\d]/g, ''));
    if (isNaN(num) || num <= 0) return;
    setSaving(true);
    try {
      await onUpdateBaseSalary(salary.id, num);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    setInputValue(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
  };

  const handleModalSuccess = () => {
    onRefresh();
  };

  return (
    <>
      <tr className="hover:bg-zinc-800/30 transition-colors border-b border-zinc-800/50">
        <td className="px-5 py-4 font-bold text-zinc-100">
          {salary.employee?.firstName} {salary.employee?.lastName}
        </td>
        <td className="px-5 py-4">
          <Badge status={salary.employee?.role?.displayName || 'Xodim'} />
        </td>

        {/* Additions & Deductions (read-only) */}
        <td className="px-5 py-4 font-semibold text-emerald-400 text-sm">
          {Number(salary.totalAdditions) > 0 ? `+${formatUZS(salary.totalAdditions)}` : '—'}
        </td>
        <td className="px-5 py-4 font-semibold text-rose-400 text-sm">
          {Number(salary.totalShiftDeductions) > 0 ? `-${formatUZS(salary.totalShiftDeductions)}` : '—'}
        </td>
        <td className="px-5 py-4 font-semibold text-amber-400 text-sm">
          {Number(salary.totalAdvanceDeductions) > 0 ? `-${formatUZS(salary.totalAdvanceDeductions)}` : '—'}
        </td>
        <td className="px-5 py-4 font-extrabold text-white text-base">
          {Number(salary.finalPayout) > 0 ? formatUZS(salary.finalPayout) : '—'}
        </td>

        {/* AMAL COLUMN: Role Specific Modals or Input */}
        <td className="px-4 py-3">
          {isTeacher ? (
            <button
              type="button"
              onClick={() => setIsTeacherModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-orange-500 text-zinc-950 border border-orange-500 hover:bg-orange-400 transition-all shadow-sm"
            >
              <BookOpen size={14} />
              <span>Guruhlar Kiritish</span>
              {Number(salary.baseSalary) > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-zinc-950/20 text-[10px]">
                  {formatUZS(salary.baseSalary)}
                </span>
              )}
            </button>
          ) : isAdmin ? (
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-400 text-zinc-950 border border-amber-400 hover:bg-amber-300 transition-all shadow-sm"
            >
              <Award size={14} />
              <span>Aktiv & Oylik</span>
              {Number(salary.baseSalary) > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-zinc-950/20 text-[10px]">
                  {formatUZS(salary.baseSalary)}
                </span>
              )}
            </button>
          ) : (
            /* Regular employee direct input */
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  className={`w-36 bg-[#0d0d0f] border rounded-xl px-3 py-2 text-sm font-bold focus:outline-none transition-all ${
                    saved
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-zinc-700 text-orange-400 focus:border-orange-500'
                  }`}
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Oylik kiriting"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !inputValue}
                title="Saqlash (Enter ham bosish mumkin)"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  saved
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-orange-500 text-zinc-950 border-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : saved ? (
                  <><CheckCircle size={14} /> Saqlandi</>
                ) : (
                  <><Save size={14} /> Kiritish</>
                )}
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* Teacher Salary Modal */}
      {isTeacherModalOpen && (
        <TeacherSalaryModal
          isOpen={isTeacherModalOpen}
          onClose={() => setIsTeacherModalOpen(false)}
          teacherId={salary.employeeId}
          teacherName={`${salary.employee?.firstName} ${salary.employee?.lastName}`}
          month={salary.month}
          year={salary.year}
          salaryRecordId={salary.id}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Administrator Salary Modal */}
      {isAdminModalOpen && (
        <AdministratorSalaryModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          administratorId={salary.employeeId}
          administratorName={`${salary.employee?.firstName} ${salary.employee?.lastName}`}
          month={salary.month}
          year={salary.year}
          salaryRecordId={salary.id}
          initialBaseSalary={Number(salary.baseSalary || 0)}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
};
