import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Expense, Branch } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { formatUZS, getMonthName } from '../utils/format';
import { PieChart as PieIcon, BarChart3, LineChart as LineIcon, Calendar, Building2, SlidersHorizontal } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

// Palette: Orange, Yellow/Gold, and close warm shades per requested palette
const WARM_PALETTE = [
  '#f97316', // Orange
  '#facc15', // Yellow
  '#ea580c', // Dark Orange
  '#eab308', // Gold
  '#fb923c', // Soft Orange
  '#d97706', // Amber
  '#fde047', // Light Yellow
  '#c2410c', // Terracotta
];

type FilterMode = 'quick' | 'custom';
type QuickRange = '7days' | '30days' | '365days';

export const ExpensesStatsPage: React.FC = () => {
  const [filterMode, setFilterMode] = useState<FilterMode>('quick');
  const [quickRange, setQuickRange] = useState<QuickRange>('30days'); // Default: last 30 days
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // '' = all year
  const [selectedBranchId, setSelectedBranchId] = useState<string>(''); // '' = Hammasi (Overall)

  const [branches, setBranches] = useState<Branch[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [filterMode, quickRange, selectedYear, selectedMonth, selectedBranchId]);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params: any = {};

      if (filterMode === 'quick') {
        const now = new Date();
        const startDate = new Date();
        if (quickRange === '7days') {
          startDate.setDate(now.getDate() - 7);
        } else if (quickRange === '30days') {
          startDate.setDate(now.getDate() - 30);
        } else if (quickRange === '365days') {
          startDate.setDate(now.getDate() - 365);
        }
        params.startDate = startDate.toISOString();
        params.endDate = now.toISOString();
      } else {
        // Custom Year / Month mode
        params.year = selectedYear;
        if (selectedMonth) {
          params.month = selectedMonth;
        }
      }

      if (selectedBranchId) {
        params.branchId = selectedBranchId;
      }

      const res = await api.get('/expenses', { params });
      setExpenses(res.data);
    } catch (err) {
      console.error('Error fetching expense stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Total Aggregation
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.value), 0);

  // Selected Branch Name
  const activeBranchName = selectedBranchId
    ? branches.find((b) => b.id === selectedBranchId)?.name || 'Filial'
    : 'Hammasi (Overall)';

  // 1. Chronologically Sorted Line Chart Data (Oldest -> Newest / 7 days ago -> Today)
  const buildChronologicalLineData = () => {
    if (filterMode === 'quick' && (quickRange === '7days' || quickRange === '30days')) {
      const daysCount = quickRange === '7days' ? 7 : 30;
      const result: { dateKey: string; dateDisplay: string; total: number; timestamp: number }[] = [];
      const now = new Date();

      // Generate all dates from (now - daysCount) up to today
      for (let i = daysCount; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);

        const yearStr = d.getFullYear();
        const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
        const dayStr = d.getDate().toString().padStart(2, '0');
        const dateKey = `${yearStr}-${monthStr}-${dayStr}`;
        const dateDisplay = `${dayStr}/${monthStr}`;

        result.push({
          dateKey,
          dateDisplay,
          total: 0,
          timestamp: d.getTime(),
        });
      }

      // Fill in expense values
      expenses.forEach((e) => {
        const eDate = new Date(e.date);
        const yStr = eDate.getFullYear();
        const mStr = (eDate.getMonth() + 1).toString().padStart(2, '0');
        const dStr = eDate.getDate().toString().padStart(2, '0');
        const key = `${yStr}-${mStr}-${dStr}`;

        const match = result.find((r) => r.dateKey === key);
        if (match) {
          match.total += Number(e.value);
        }
      });

      return result.map(({ dateDisplay, total }) => ({ date: dateDisplay, total }));
    }

    // For 365 days or custom Year/Month mode: group by month or day and sort ascending by date
    const dateMap: { [key: string]: { display: string; total: number; timestamp: number } } = {};

    expenses.forEach((e) => {
      const d = new Date(e.date);
      let key = '';
      let display = '';

      if (filterMode === 'quick' && quickRange === '365days') {
        key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        display = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      } else if (selectedMonth) {
        key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        display = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      } else {
        key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        display = `${getMonthName(d.getMonth() + 1).substring(0, 3)} ${d.getFullYear()}`;
      }

      if (!dateMap[key]) {
        dateMap[key] = { display, total: 0, timestamp: d.getTime() };
      }
      dateMap[key].total += Number(e.value);
    });

    // Sort ascending by timestamp
    return Object.values(dateMap)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ display, total }) => ({ date: display, total }));
  };

  const lineChartData = buildChronologicalLineData();

  // 2. Category Pie Chart Data with percentage calculation
  const categoryMap: { [name: string]: number } = {};
  expenses.forEach((e) => {
    const cName = e.category?.name || 'Boshqa';
    categoryMap[cName] = (categoryMap[cName] || 0) + Number(e.value);
  });

  const categoryData = Object.keys(categoryMap).map((name) => {
    const val = categoryMap[name];
    const pct = totalExpenseAmount > 0 ? ((val / totalExpenseAmount) * 100).toFixed(1) : '0';
    return {
      name,
      value: val,
      percentage: `${pct}%`,
    };
  });

  // 3. Branch Bar Chart Data (Only shown when selectedBranchId === '')
  const branchMap: { [name: string]: number } = {};
  expenses.forEach((e) => {
    const bName = e.branch?.name || 'Asosiy';
    branchMap[bName] = (branchMap[bName] || 0) + Number(e.value);
  });
  const branchData = Object.keys(branchMap).map((name) => ({
    name,
    total: branchMap[name],
  }));

  // Custom High-Contrast Tooltip for Pie Chart & Line Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#18181b] border border-zinc-700 rounded-xl p-3 shadow-2xl space-y-1">
          <p className="text-xs font-bold text-white uppercase tracking-wider">{data.name}</p>
          <p className="text-sm font-extrabold text-orange-400">{formatUZS(data.value)}</p>
          <p className="text-xs font-bold text-yellow-400">Ushush: {data.percentage}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Xarajatlar Tahlili & Analitika"
        subtitle="Vaqt va filiallar bo‘yicha to‘liq statistik diagramma va ko‘rsatkichlar"
      />

      {/* Top Filter Controls Container */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-5">
        {/* Row 1: Filter Mode Toggle (Quick Range vs Custom Year/Month) & Total Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={14} className="text-orange-400" /> Vaqt Rejimi:
            </span>
            <div className="inline-flex bg-[#0d0d0f] p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setFilterMode('quick')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'quick'
                    ? 'bg-orange-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Tezkor Oraliq (Quick)
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'custom'
                    ? 'bg-orange-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Yil & Oy (Custom)
              </button>
            </div>
          </div>

          {/* Stat Summary Box */}
          <div className="bg-[#0d0d0f] border border-zinc-800 rounded-xl px-5 py-2.5 text-right">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              {activeBranchName} — Jami Xarajat
            </span>
            <h2 className="text-2xl font-extrabold text-orange-400 mt-0.5">
              {formatUZS(totalExpenseAmount)}
            </h2>
          </div>
        </div>

        {/* Row 2: Time Option Controls (Quick Pills vs Year/Month Dropdowns) */}
        {filterMode === 'quick' ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Tezkor Oraliq:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setQuickRange('7days')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  quickRange === '7days'
                    ? 'bg-orange-500 text-zinc-950 border-orange-500 shadow-sm'
                    : 'bg-[#0d0d0f] text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                Oxirgi 7 Kun
              </button>
              <button
                type="button"
                onClick={() => setQuickRange('30days')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  quickRange === '30days'
                    ? 'bg-orange-500 text-zinc-950 border-orange-500 shadow-sm'
                    : 'bg-[#0d0d0f] text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                Oxirgi 30 Kun (Default)
              </button>
              <button
                type="button"
                onClick={() => setQuickRange('365days')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  quickRange === '365days'
                    ? 'bg-orange-500 text-zinc-950 border-orange-500 shadow-sm'
                    : 'bg-[#0d0d0f] text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                Oxirgi 365 Kun (1 Yil)
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-zinc-400">Yil:</label>
              <select
                className="bg-[#0d0d0f] border border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold text-zinc-100 focus:outline-none focus:border-orange-500"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}-Yil
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-zinc-400">Oy:</label>
              <select
                className="bg-[#0d0d0f] border border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold text-zinc-100 focus:outline-none focus:border-orange-500"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">Butun Yil (Barcha Oylar)</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {getMonthName(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Row 3: Branch Filter Tab Buttons */}
        <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 size={14} className="text-amber-400" /> Filiallar:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedBranchId('')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                selectedBranchId === ''
                  ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-sm'
                  : 'bg-[#0d0d0f] text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              Hammasi (Overall)
            </button>

            {branches.map((b) => {
              const isSelected = selectedBranchId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-sm'
                      : 'bg-[#0d0d0f] text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {b.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400">
          Analitika yuklanmoqda...
        </div>
      ) : (
        <>
          {/* Chronological Line Chart: Expenses Dynamic Trend (Oldest -> Today) */}
          <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LineIcon size={20} className="text-orange-400" />
                <h3 className="text-lg font-bold text-white">
                  Xarajatlar Dinamikasi — Vaqt Bo‘yicha ({activeBranchName})
                </h3>
              </div>
              <span className="text-xs font-semibold text-zinc-400 bg-[#0d0d0f] px-3 py-1 rounded-lg border border-zinc-800">
                {filterMode === 'quick'
                  ? quickRange === '7days'
                    ? 'Oxirgi 7 Kun (Eskidan Bugungacha)'
                    : quickRange === '30days'
                    ? 'Oxirgi 30 Kun'
                    : 'Oxirgi 365 Kun'
                  : `${selectedYear}-Yil ${selectedMonth ? getMonthName(Number(selectedMonth)) : ''}`}
              </span>
            </div>

            {lineChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
                Tanlangan davrda xarajatlar mavjud emas
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <XAxis dataKey="date" stroke="#a1a1aa" />
                    <YAxis tickFormatter={(val) => `${Math.round(val / 1000)}k`} stroke="#71717a" />
                    <Tooltip
                      formatter={(val: any) => [formatUZS(val), 'Xarajat']}
                      contentStyle={{ background: '#18181b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={{ fill: '#facc15', r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Charts Row: Category Pie Chart & Conditional Branch Bar Chart */}
          <div className={`grid grid-cols-1 ${selectedBranchId === '' ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
            {/* 1. Category Pie Chart with Custom High-Contrast Tooltip */}
            <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <PieIcon size={20} className="text-orange-400" />
                <h3 className="text-base font-bold text-white">
                  Kategoriyalar Taqsimoti ({activeBranchName})
                </h3>
              </div>

              {categoryData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
                  Kategoriyalar bo‘yicha ma’lumot yo‘q
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percentage }) => `${name}: ${percentage}`}
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={WARM_PALETTE[index % WARM_PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 2. Branch Comparison Bar Chart (ONLY shown when Overall/Hammasi is selected) */}
            {selectedBranchId === '' && (
              <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={20} className="text-amber-400" />
                  <h3 className="text-base font-bold text-white">
                    Filiallar Bo‘yicha Solishtirma Xarajat (Branch Comparison)
                  </h3>
                </div>

                {branchData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
                    Filiallar bo‘yicha ma’lumot yo‘q
                  </div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={branchData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                        <XAxis dataKey="name" stroke="#a1a1aa" />
                        <YAxis tickFormatter={(val) => `${Math.round(val / 1000)}k`} stroke="#71717a" />
                        <Tooltip
                          formatter={(val: any) => [formatUZS(val), 'Jami Xarajat']}
                          contentStyle={{ background: '#18181b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                        />
                        <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                          {branchData.map((_, index) => (
                            <Cell key={`bar-${index}`} fill={WARM_PALETTE[index % WARM_PALETTE.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
