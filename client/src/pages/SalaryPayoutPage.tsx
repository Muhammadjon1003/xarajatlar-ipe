import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { MonthlySalary } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { formatUZS, getMonthName } from '../utils/format';
import { RefreshCw, CheckCircle, Clock, Banknote, Users, DollarSign } from 'lucide-react';

export const SalaryPayoutPage: React.FC = () => {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [salaries, setSalaries] = useState<MonthlySalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSalaries();
  }, [month, year]);

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/salaries', { params: { month, year } });
      setSalaries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (salaryId: string, isPaid: boolean) => {
    setPayingId(salaryId);
    try {
      await api.put(`/salaries/${salaryId}/pay`, { isPaid: !isPaid });
      await fetchSalaries();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setPayingId(null);
    }
  };

  const unpaidSalaries = salaries.filter((s) => !s.isPaid);
  const paidSalaries = salaries.filter((s) => s.isPaid);
  const totalPaid = paidSalaries.reduce((sum, s) => sum + Number(s.finalPayout), 0);
  const totalRemaining = unpaidSalaries.reduce((sum, s) => sum + Number(s.finalPayout), 0);
  const totalFund = salaries.reduce((sum, s) => sum + Number(s.finalPayout), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Oyliklarni Berish"
        subtitle="Hisoblangan oyliklarni ko'rib chiqing va har bir xodimga to'lash amalni bajaring"
      />

      {/* Month / Year Filter Bar */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Oy</label>
            <select
              className="bg-[#0d0d0f] border border-zinc-800 rounded-xl px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{getMonthName(m)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Yil</label>
            <select
              className="bg-[#0d0d0f] border border-zinc-800 rounded-xl px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchSalaries}
            className="mt-4 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
            title="Yangilash"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Jami Fond</p>
            <p className="text-lg font-extrabold text-white">{formatUZS(totalFund)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Berildi</p>
            <p className="text-lg font-extrabold text-emerald-400">{formatUZS(totalPaid)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Qoldi</p>
            <p className="text-lg font-extrabold text-amber-400">{formatUZS(totalRemaining)}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-10 text-center text-zinc-400">
          Yuklanmoqda...
        </div>
      ) : salaries.length === 0 ? (
        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-14 text-center">
          <Banknote size={48} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-zinc-400 font-semibold text-base">
            {getMonthName(month)} {year} uchun oyliklar hisoblangmagan.
          </p>
          <p className="text-zinc-600 text-sm mt-1">
            Avval «Oyliklarni Hisoblash» bo'limidan oyliklarni kiriting.
          </p>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Users size={13} className="text-orange-400" />
                {paidSalaries.length} / {salaries.length} xodimga berildi
              </span>
              <span className="text-zinc-400">
                {salaries.length > 0
                  ? `${Math.round((paidSalaries.length / salaries.length) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                style={{
                  width: salaries.length > 0
                    ? `${(paidSalaries.length / salaries.length) * 100}%`
                    : '0%',
                }}
              />
            </div>
          </div>

          {/* Unpaid Salaries Section */}
          {unpaidSalaries.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Clock size={15} className="text-amber-400" />
                To'lanmagan ({unpaidSalaries.length} ta)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {unpaidSalaries.map((sal) => (
                  <SalaryPayoutCard
                    key={sal.id}
                    salary={sal}
                    onPay={handlePay}
                    isPaying={payingId === sal.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Paid Salaries Section */}
          {paidSalaries.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle size={15} className="text-emerald-400" />
                Berilgan ({paidSalaries.length} ta)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paidSalaries.map((sal) => (
                  <SalaryPayoutCard
                    key={sal.id}
                    salary={sal}
                    onPay={handlePay}
                    isPaying={payingId === sal.id}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Salary Payout Card
// ─────────────────────────────────────────────────────────────────────────────

interface SalaryPayoutCardProps {
  salary: MonthlySalary;
  onPay: (id: string, isPaid: boolean) => void;
  isPaying: boolean;
}

const SalaryPayoutCard: React.FC<SalaryPayoutCardProps> = ({ salary, onPay, isPaying }) => {
  const isPaid = salary.isPaid;

  return (
    <div
      className={`bg-[#141417] border rounded-2xl p-5 space-y-4 transition-all ${
        isPaid ? 'border-emerald-800/40 opacity-70' : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-extrabold text-white">
            {salary.employee?.firstName} {salary.employee?.lastName}
          </p>
          <p className="text-xs font-semibold text-zinc-500 mt-0.5">
            {salary.employee?.role?.displayName || 'Xodim'}
          </p>
        </div>
        <div
          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
            isPaid
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}
        >
          {isPaid ? 'Berildi' : 'Kutilmoqda'}
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-1.5 text-xs font-semibold">
        <div className="flex justify-between text-zinc-400">
          <span>Asosiy Maosh</span>
          <span className="text-zinc-200">{formatUZS(salary.baseSalary)}</span>
        </div>
        {Number(salary.totalAdditions) > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>+ Zamena Qilgan</span>
            <span>+{formatUZS(salary.totalAdditions)}</span>
          </div>
        )}
        {Number(salary.totalShiftDeductions) > 0 && (
          <div className="flex justify-between text-rose-400">
            <span>− Zamena Qildirgan</span>
            <span>-{formatUZS(salary.totalShiftDeductions)}</span>
          </div>
        )}
        {Number(salary.totalAdvanceDeductions) > 0 && (
          <div className="flex justify-between text-amber-400">
            <span>− Avans Ushlanma</span>
            <span>-{formatUZS(salary.totalAdvanceDeductions)}</span>
          </div>
        )}
        <div className="pt-2 border-t border-zinc-800 flex justify-between">
          <span className="text-zinc-300 font-bold">Qo'lga Tegadigan</span>
          <span className="text-orange-400 font-extrabold text-sm">{formatUZS(salary.finalPayout)}</span>
        </div>
      </div>

      {/* Pay / Unpay Button */}
      <button
        onClick={() => onPay(salary.id, isPaid)}
        disabled={isPaying}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all border ${
          isPaid
            ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30'
            : 'bg-orange-500 text-zinc-950 border-orange-500 hover:bg-orange-400'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isPaying ? (
          <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
        ) : isPaid ? (
          <>
            <Clock size={15} /> Qaytarish
          </>
        ) : (
          <>
            <DollarSign size={15} /> To'lash
          </>
        )}
      </button>

      {/* Paid timestamp */}
      {isPaid && salary.paidAt && (
        <p className="text-center text-[10px] text-zinc-600 font-medium">
          {new Date(salary.paidAt).toLocaleDateString('uz-UZ', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })} da berildi
        </p>
      )}
    </div>
  );
};
