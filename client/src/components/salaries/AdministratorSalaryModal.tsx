import React, { useState, useEffect } from 'react';
import { ModalWrapper } from '../common/ModalWrapper';
import { Button } from '../common/Button';
import { formatUZS, getMonthName } from '../../utils/format';
import { Award, Users, DollarSign, Calculator } from 'lucide-react';
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
  const [baseSalary, setBaseSalary] = useState<number>(initialBaseSalary || 5000000);
  const [aktivPrice, setAktivPrice] = useState<number>(50000);
  const [aktivCount, setAktivCount] = useState<string>('');
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
      const defaultBase = settings.adminBaseSalary ? Number(settings.adminBaseSalary) : 5000000;
      const defaultPrice = settings.adminAktivPrice ? Number(settings.adminAktivPrice) : 50000;

      setAktivPrice(defaultPrice);

      if (aktivRes.data && aktivRes.data.length > 0) {
        const record = aktivRes.data[0];
        setBaseSalary(record.baseSalary ? Number(record.baseSalary) : (initialBaseSalary || defaultBase));
        setAktivCount(record.aktivCount !== undefined && record.aktivCount !== null ? record.aktivCount.toString() : '');
      } else {
        setBaseSalary(initialBaseSalary || defaultBase);
        setAktivCount('');
      }
    } catch (err) {
      console.error(err);
      setBaseSalary(initialBaseSalary || 5000000);
      setAktivPrice(50000);
    } finally {
      setFetching(false);
    }
  };

  const countNum = Number(aktivCount || 0);
  const aktivTotal = countNum * aktivPrice;
  const totalSalary = baseSalary + aktivTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin-aktiv', {
        administratorId,
        salaryRecordId,
        month,
        year,
        baseSalary,
        aktivCount: countNum,
        aktivPrice,
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
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-5">
        {/* Overall Total Card */}
        <div className="flex items-center justify-between bg-[#0d0d0f] border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <Award size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Oylik Davri: {getMonthName(month)} {year}</p>
              <p className="text-[11px] text-zinc-400">Baza maoshi va aktiv o‘quvchilar ustamasi hisoblanadi</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">Jami Oylik Maosh</span>
            <span className="text-xl font-extrabold text-amber-400">{formatUZS(totalSalary)}</span>
          </div>
        </div>

        {fetching ? (
          <div className="py-8 text-center text-xs font-semibold text-zinc-500">
            Ma’lumotlar yuklanmoqda...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Read-Only Settings Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0d0d0f] border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400 block uppercase tracking-wider">
                  Baza Maoshi (Sozlamadan)
                </span>
                <span className="text-sm font-extrabold text-white block">
                  {formatUZS(baseSalary)}
                </span>
              </div>

              <div className="bg-[#0d0d0f] border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400 block uppercase tracking-wider">
                  1 Aktiv O‘quvchi Narxi
                </span>
                <span className="text-sm font-extrabold text-emerald-400 block">
                  {formatUZS(aktivPrice)}
                </span>
              </div>
            </div>

            {/* ONLY Input: Aktiv O'quvchilar Soni */}
            <div className="bg-[#0d0d0f] border border-amber-500/20 rounded-2xl p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <Users size={15} />
                  Aktiv O‘quvchilar Soni *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  autoFocus
                  placeholder="Masalan: 12"
                  className="w-full bg-[#141417] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white focus:outline-none focus:border-amber-500"
                  value={aktivCount}
                  onChange={(e) => setAktivCount(e.target.value)}
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-400">Aktivlardan Daromad Ustamasi:</span>
                <span className="text-emerald-400 font-extrabold text-sm">
                  +{formatUZS(aktivTotal)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
              <Button type="button" variant="secondary" onClick={onClose}>
                Bekor Qilish
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saqlanmoqda...' : 'Maosh va Aktivni Saqlash'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </ModalWrapper>
  );
};
