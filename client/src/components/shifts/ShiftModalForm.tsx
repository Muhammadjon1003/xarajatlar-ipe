import React, { useState, useEffect } from 'react';
import { Employee } from '../../types';
import { ModalWrapper } from '../common/ModalWrapper';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { formatUZS } from '../../utils/format';
import api from '../../api/client';

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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [absentEmployeeId, setAbsentEmployeeId] = useState('');
  const [coveringEmployeeId, setCoveringEmployeeId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDefaultZamenaPrice();
      if (employees.length > 1) {
        setAbsentEmployeeId(employees[0].id);
        setCoveringEmployeeId(employees[1].id);
      }
    }
  }, [isOpen, employees]);

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
    if (absentEmployeeId === coveringEmployeeId) {
      alert('Kelmagan va o‘rniga chiqqan xodim bir xil bo‘lishi mumkin emas');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        date,
        amount: Number(amount),
        absentEmployeeId,
        coveringEmployeeId,
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
    <ModalWrapper title="Zamena Yozish" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmitForm} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-rose-400 mb-1.5 uppercase tracking-wide">
              Kelmagan Xodim (Ushlanma) *
            </label>
            <select
              className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
              value={absentEmployeeId}
              onChange={(e) => setAbsentEmployeeId(e.target.value)}
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
            <label className="block text-xs font-semibold text-emerald-400 mb-1.5 uppercase tracking-wide">
              O‘rniga Chiqqan Xodim (Qo‘shimcha) *
            </label>
            <select
              className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Zamena Haq Qiymati (UZS) *"
            type="number"
            placeholder="250000"
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
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wide">
            Izoh / Sabab
          </label>
          <textarea
            className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
            rows={2}
            placeholder="Kasallik tufayli zamena qilindi..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Bekor Qilish
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saqlanmoqda...' : 'Zamanani Saqlash'}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
};
