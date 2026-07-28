import React, { useState, useEffect } from 'react';
import { ModalWrapper } from '../common/ModalWrapper';
import { Input } from '../common/Input';
import { CurrencyInput } from '../common/CurrencyInput';
import { Button } from '../common/Button';
import { formatUZS, getMonthName } from '../../utils/format';
import { Calculator, Award } from 'lucide-react';
import api from '../../api/client';

interface AdministratorSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  administratorId: string;
  administratorName: string;
  month: number;
  year: number;
  salaryRecordId: string;
  initialBaseSalary: number;
  onSuccess: () => void;
}

export const AdministratorSalaryModal: React.FC<AdministratorSalaryModalProps> = ({
  isOpen,
  onClose,
  administratorId,
  administratorName,
  month,
  year,
  salaryRecordId,
  initialBaseSalary,
  onSuccess,
}) => {
  const [baseSalary, setBaseSalary] = useState<string>(initialBaseSalary ? initialBaseSalary.toString() : '');
  const [probniyCount, setProbniyCount] = useState<string>('');
  const [probniyPrice, setProbniyPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen && administratorId) {
      fetchExistingProbniy();
    }
  }, [isOpen, administratorId, month, year]);

  const fetchExistingProbniy = async () => {
    setFetching(true);
    try {
      const res = await api.get('/admin-probniy', {
        params: { administratorId, month, year },
      });
      if (res.data && res.data.length > 0) {
        const record = res.data[0];
        setBaseSalary(record.baseSalary ? record.baseSalary.toString() : initialBaseSalary.toString());
        setProbniyCount(record.probniyCount ? record.probniyCount.toString() : '');
        setProbniyPrice(record.probniyPrice ? record.probniyPrice.toString() : '');
      } else {
        setBaseSalary(initialBaseSalary ? initialBaseSalary.toString() : '');
        setProbniyCount('');
        setProbniyPrice('');
      }
    } catch (err) {
      console.error(err);
      setBaseSalary(initialBaseSalary ? initialBaseSalary.toString() : '');
    } finally {
      setFetching(false);
    }
  };

  const baseNum = Number(baseSalary || 0);
  const countNum = Number(probniyCount || 0);
  const priceNum = Number(probniyPrice || 0);
  const probniyTotal = countNum * priceNum;
  const totalSalary = baseNum + probniyTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin-probniy', {
        administratorId,
        salaryRecordId,
        month,
        year,
        baseSalary: baseNum,
        probniyCount: countNum,
        probniyPrice: priceNum,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Saqlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper
      title={`Administrator Maoshi & Probniy — ${administratorName}`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-[#0d0d0f] border border-zinc-800 rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <Award size={16} className="text-orange-400" />
            <span>Davr: {getMonthName(month)} {year}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Jami Oylik Maosh</span>
            <span className="text-base font-extrabold text-orange-400">{formatUZS(totalSalary)}</span>
          </div>
        </div>

        {fetching ? (
          <div className="py-8 text-center text-xs font-semibold text-zinc-500">
            Ma’lumotlar yuklanmoqda...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <CurrencyInput
              label="Baza Maoshi (UZS) *"
              value={baseSalary}
              onChange={(val) => setBaseSalary(val)}
              placeholder="5 000 000"
            />

            <div className="grid grid-cols-2 gap-3 bg-[#0d0d0f] border border-zinc-800 rounded-xl p-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Probniy Darslar Soni *
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="10"
                  className="w-full bg-[#141417] border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                  value={probniyCount}
                  onChange={(e) => setProbniyCount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Bir Probniy Narxi (UZS) *
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="50000"
                  className="w-full bg-[#141417] border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                  value={probniyPrice}
                  onChange={(e) => setProbniyPrice(e.target.value)}
                />
              </div>

              <div className="col-span-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-400">Probniylardan Daromad:</span>
                <span className="text-emerald-400 font-extrabold">+{formatUZS(probniyTotal)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button type="button" variant="secondary" onClick={onClose} className="text-xs">
                Bekor Qilish
              </Button>
              <Button type="submit" variant="primary" disabled={loading} className="text-xs">
                {loading ? 'Saqlanmoqda...' : 'Maosh va Probniyni Saqlash'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </ModalWrapper>
  );
};
