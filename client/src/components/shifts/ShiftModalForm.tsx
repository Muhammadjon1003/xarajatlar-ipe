import React, { useState, useEffect } from 'react';
import { Employee } from '../../types';
import { ModalWrapper } from '../common/ModalWrapper';
import { CurrencyInput } from '../common/CurrencyInput';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { ArrowRightLeft } from 'lucide-react';

interface ShiftModalFormProps {
  isOpen: boolean;
  employees: Employee[];
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}

export const ShiftModalForm: React.FC<ShiftModalFormProps> = ({
  isOpen,
  employees,
  onClose,
  onSubmit,
}) => {
  const { user } = useAuth();
  const isManagerOrAdmin = ['SUPER_ADMIN', 'MANAGER', 'PAYROLL_ACCOUNTANT'].includes(user?.roleCode || '');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [absentEmployeeId, setAbsentEmployeeId] = useState('');
  const [coveringEmployeeId, setCoveringEmployeeId] = useState(user?.id || '');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Available absent employees (excluding covering employee)
  const availableAbsentEmployees = employees.filter((emp) => emp.id !== (coveringEmployeeId || user?.id));

  useEffect(() => {
    if (isOpen) {
      fetchDefaultZamenaPrice();
      setCoveringEmployeeId(user?.id || (employees[0]?.id || ''));
      if (availableAbsentEmployees.length > 0) {
        setAbsentEmployeeId(availableAbsentEmployees[0].id);
      }
    }
  }, [isOpen, employees, user?.id]);

  const fetchDefaultZamenaPrice = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data && res.data.zamenaPrice) {
        setAmount(res.data.zamenaPrice.toString());
      } else {
        setAmount('250000');
      }
    } catch (err) {
      setAmount('250000');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCoveringId = isManagerOrAdmin ? coveringEmployeeId : (user?.id || coveringEmployeeId);

    if (!absentEmployeeId) {
      alert('Kelmagan (almashtirilgan) xodimlardan birini tanlang');
      return;
    }

    if (absentEmployeeId === finalCoveringId) {
      alert('Kelmagan va o‘rniga chiqqan xodim bir xil bo‘lishi mumkin emas');
      return;
    }

    const numericAmount = Number(amount.replace(/\D/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      alert('Zamena summasi kiritilishi shart');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        date,
        amount: numericAmount,
        absentEmployeeId,
        coveringEmployeeId: finalCoveringId,
        description,
      });
      setDescription('');
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title="Yangi Zamena (Smena Almashtirish) Yozish" isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-lg">
      <form onSubmit={handleSubmitForm} className="space-y-4">
        {/* If Manager/Admin, show covering employee select as well. Otherwise automatically user is covering */}
        {isManagerOrAdmin ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-emerald-400 mb-1.5 uppercase tracking-wide">
                O‘rniga Chiqqan Xodim (Qo‘shimcha) *
              </label>
              <select
                className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-100 focus:outline-none focus:border-orange-500"
                value={coveringEmployeeId}
                onChange={(e) => setCoveringEmployeeId(e.target.value)}
                required
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-400 mb-1.5 uppercase tracking-wide">
                Kelmagan Xodim (Ushlanma) *
              </label>
              <select
                className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-100 focus:outline-none focus:border-orange-500"
                value={absentEmployeeId}
                onChange={(e) => setAbsentEmployeeId(e.target.value)}
                required
              >
                {employees
                  .filter((e) => e.id !== coveringEmployeeId)
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-rose-400 mb-1.5 uppercase tracking-wide">
              Kim uchun zamena qildingiz? (Kelmagan Xodim) *
            </label>
            <select
              className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-100 focus:outline-none focus:border-orange-500"
              value={absentEmployeeId}
              onChange={(e) => setAbsentEmployeeId(e.target.value)}
              required
            >
              {availableAbsentEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencyInput
            label="Zamena Narxi (UZS) *"
            value={amount}
            onChange={(val) => setAmount(val)}
            placeholder="250 000"
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
            Izoh / Sabab
          </label>
          <textarea
            className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
            rows={2}
            placeholder="Shoshilinch holat yoki kasallik tufayli zamena qilindi..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Bekor Qilish
          </Button>
          <Button variant="primary" type="submit" disabled={loading} icon={<ArrowRightLeft size={16} />}>
            {loading ? 'Saqlanmoqda...' : 'Zamanani Saqlash'}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
};
