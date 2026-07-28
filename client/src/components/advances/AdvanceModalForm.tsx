import React, { useState, useEffect } from 'react';
import { Employee } from '../../types';
import { ModalWrapper } from '../common/ModalWrapper';
import { CurrencyInput } from '../common/CurrencyInput';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Clock, DollarSign } from 'lucide-react';

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
    const numericAmount = Number(amount.replace(/\D/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      alert('Avans summasi kiritilishi shart');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        employeeId,
        amount: numericAmount,
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
    <ModalWrapper title="Yangi Avans So‘rovi Yozish" isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-lg">
      <form onSubmit={handleSubmitForm} className="space-y-4">
        {/* Employee Select */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wide">
            Xodim *
          </label>
          <select
            className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-100 focus:outline-none focus:border-orange-500"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencyInput
            label="Avans Summasi (UZS) *"
            value={amount}
            onChange={(val) => setAmount(val)}
            placeholder="1 000 000"
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
          <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wide">
            Sabab / Izoh
          </label>
          <textarea
            className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
            rows={3}
            placeholder="Shaxsiy ehtiyojlar uchun avans so‘rovi..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Bekor Qilish
          </Button>
          <Button variant="primary" type="submit" disabled={loading} icon={<DollarSign size={16} />}>
            {loading ? 'Saqlanmoqda...' : 'Avans So‘rovini Saqlash'}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
};
