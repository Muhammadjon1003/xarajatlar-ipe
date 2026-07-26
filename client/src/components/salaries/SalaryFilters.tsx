import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';
import { getMonthName, formatUZS } from '../../utils/format';

interface SalaryFiltersProps {
  month: number;
  setMonth: (m: number) => void;
  year: number;
  setYear: (y: number) => void;
  totalPayroll: number;
  calculating: boolean;
  onCalculate: () => void;
}

export const SalaryFilters: React.FC<SalaryFiltersProps> = ({
  month,
  setMonth,
  year,
  setYear,
  totalPayroll,
  calculating,
  onCalculate,
}) => {
  return (
    <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex gap-4 items-center">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Oy</label>
          <select
            className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {getMonthName(m)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Yil</label>
          <select
            className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="primary"
          onClick={onCalculate}
          disabled={calculating}
          icon={<RefreshCw size={16} className={calculating ? 'animate-spin' : ''} />}
          className="mt-4"
        >
          {calculating ? 'Hisoblanmoqda...' : 'Oyliklarni Hisoblash'}
        </Button>
      </div>

      <div className="text-right">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {getMonthName(month)} {year} Jami Oylik Fondi
        </span>
        <h2 className="text-xl font-extrabold text-emerald-400">{formatUZS(totalPayroll)}</h2>
      </div>
    </div>
  );
};
