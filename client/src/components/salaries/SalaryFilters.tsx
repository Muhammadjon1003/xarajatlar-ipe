import React from 'react';
import { getMonthName, formatUZS } from '../../utils/format';

interface SalaryFiltersProps {
  month: number;
  setMonth: (m: number) => void;
  year: number;
  setYear: (y: number) => void;
  totalPayroll: number;
}

export const SalaryFilters: React.FC<SalaryFiltersProps> = ({
  month,
  setMonth,
  year,
  setYear,
  totalPayroll,
}) => {
  return (
    <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex gap-4 items-center">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1">Oy</label>
          <select
            className="bg-[#0d0d0f] border border-zinc-800 rounded-xl px-3 py-1.5 text-sm font-bold text-zinc-100 focus:outline-none focus:border-orange-500"
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
          <label className="block text-xs font-semibold text-zinc-400 mb-1">Yil</label>
          <select
            className="bg-[#0d0d0f] border border-zinc-800 rounded-xl px-3 py-1.5 text-sm font-bold text-zinc-100 focus:outline-none focus:border-orange-500"
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
      </div>

      <div className="text-right">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
          {getMonthName(month)} {year} Jami Oylik Fondi
        </span>
        <h2 className="text-xl font-extrabold text-orange-400">{formatUZS(totalPayroll)}</h2>
      </div>
    </div>
  );
};
