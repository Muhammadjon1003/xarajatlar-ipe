import React, { useState, useEffect } from 'react';
import { ModalWrapper } from '../common/ModalWrapper';
import { CurrencyInput } from '../common/CurrencyInput';
import { Button } from '../common/Button';
import { formatUZS, getMonthName } from '../../utils/format';
import { Award } from 'lucide-react';
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
  const [baseSalary, setBaseSalary] = useState<string>('');
  const [aktivCount, setAktivCount] = useState<string>('');
  const [aktivPrice, setAktivPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen && administratorId) {
      fetchData();
    }
  }, [isOpen, administratorId, month, year]);

  const fetchData = async () => {
    setFetching(true);
    try {
      const [aktivRes, settingsRes] = await Promise.all([
        api.get('/admin-aktiv', { params: { administratorId, month, year } }),
        api.get('/settings'),
      ]);

      const settings = settingsRes.data || {};
      const defaultBase = settings.adminBaseSalary ? settings.adminBaseSalary.toString() : '5000000';
      const defaultPrice = settings.adminAktivPrice ? settings.adminAktivPrice.toString() : '50000';

      if (aktivRes.data && aktivRes.data.length > 0) {
        const record = aktivRes.data[0];
        setBaseSalary(record.baseSalary ? record.baseSalary.toString() : (initialBaseSalary ? initialBaseSalary.toString() : defaultBase));
        setAktivCount(record.aktivCount ? record.aktivCount.toString() : '');
        setAktivPrice(record.aktivPrice ? record.aktivPrice.toString() : defaultPrice);
      } else {
        setBaseSalary(initialBaseSalary ? initialBaseSalary.toString() : defaultBase);
        setAktivCount('');
        setAktivPrice(defaultPrice);
      }
    } catch (err) {
      console.error(err);
      setBaseSalary(initialBaseSalary ? initialBaseSalary.toString() : '5000000');
      setAktivPrice('50000');
    } finally {
      setFetching(false);
    }
  };

  const baseNum = Number(baseSalary || 0);
  const countNum = Number(aktivCount || 0);
  const priceNum = Number(aktivPrice || 0);
  const aktivTotal = countNum * priceNum;
  const totalSalary = baseNum + aktivTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin-aktiv', {
        administratorId,
        salaryRecordId,
        month,
        year,
        baseSalary: baseNum,
        aktivCount: countNum,
        aktivPrice: priceNum,
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
      title={`Administrator Maoshi & Aktiv — ${administratorName}`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-[#0d0d0f] border border-zinc-800 rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <Award size={16} className="text-amber-400" />
            <span>Davr: {getMonthName(month)} {year}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Jami Oylik Maosh</span>
            <span className="text-base font-extrabold text-amber-400">{formatUZS(totalSalary)}</span>
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
                  Aktiv O‘quvchilar Soni *
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="10"
                  className="w-full bg-[#141417] border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  value={aktivCount}
                  onChange={(e) => setAktivCount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Bir Aktiv Narxi (UZS) *
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="50000"
                  className="w-full bg-[#141417] border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  value={aktivPrice}
                  onChange={(e) => setAktivPrice(e.target.value)}
                />
              </div>

              <div className="col-span-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-400">Aktivlardan Ustama Daromad:</span>
                <span className="text-emerald-400 font-extrabold">+{formatUZS(aktivTotal)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button type="button" variant="secondary" onClick={onClose} className="text-xs">
                Bekor Qilish
              </Button>
              <Button type="submit" variant="primary" disabled={loading} className="text-xs">
                {loading ? 'Saqlanmoqda...' : 'Maosh va Aktivni Saqlash'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </ModalWrapper>
  );
};
