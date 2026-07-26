import React, { useState, useEffect } from 'react';
import { Employee } from '../../types';
import { ModalWrapper } from '../common/ModalWrapper';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { formatUZS } from '../../utils/format';

interface AdvanceModalFormProps {
  isOpen: boolean;
  employees: Employee[];
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}

export const AdvanceModalForm: React.FC<AdvanceModalFormProps> = ({
  isOpen,
  employees,
  onClose,
  onSubmit,
}) => {
  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employees.length > 0 && !employeeId) {
      setEmployeeId(employees[0].id);
    }
  }, [employees]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        employeeId,
        amount: Number(amount),
        date,
        reason,
      });
      setAmount('');
      setReason('');
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title="Yangi Avans So‘rovi" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmitForm} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
            Xodim *
          </label>
          <select
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.phone || 'Tel yo‘q'})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Summa (UZS) *"
            type="number"
            placeholder="1000000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            helper={amount ? formatUZS(amount) : undefined}
            required
          />

          <Input
            label="Sana *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
            Sabab / Izoh
          </label>
          <textarea
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            rows={3}
            placeholder="Shaxsiy ehtiyojlar uchun..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>
            Bekor Qilish
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saqlanmoqda...' : 'Avans Qo‘shish'}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
};
