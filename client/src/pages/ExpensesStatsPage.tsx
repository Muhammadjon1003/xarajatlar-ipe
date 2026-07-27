import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Expense, Branch } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { formatUZS } from '../utils/format';
import { PieChart as PieIcon, BarChart3, LineChart as LineIcon, Calendar, Building2, Filter } from 'lucide-react';
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

type TimeRange = '7days' | '30days' | '365days';

export const ExpensesStatsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30days'); // Default: last 30 days
  const [selectedBranchId, setSelectedBranchId] = useState<string>(''); // '' = Hammasi (Overall)
  const [branches, setBranches] = useState<Branch[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [timeRange, selectedBranchId]);

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
      // Calculate date range filter
      const now = new Date();
      const startDate = new Date();

      if (timeRange === '7days') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === '30days') {
        startDate.setDate(now.getDate() - 30);
      } else if (timeRange === '365days') {
        startDate.setDate(now.getDate() - 365);
      }

      const params: any = {
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      };

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

  // Aggregations
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.value), 0);

  // Selected Branch Name
  const activeBranchName = selectedBranchId
    ? branches.find((b) => b.id === selectedBranchId)?.name || 'Filial'
    : 'Hammasi (Kompaniya)';

  // 1. Dynamic Line Chart Trend Data (Grouped by Day or Month depending on timeRange)
  const lineChartDataMap: { [label: string]: number } = {};

  expenses.forEach((e) => {
    const d = new Date(e.date);
    let label = '';
    if (timeRange === '365days') {
      // Format as Month Year (e.g. '07/2026')
      label = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } else {
      // Format as Day Month (e.g. '26/07')
      label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    lineChartDataMap[label] = (lineChartDataMap[label] || 0) + Number(e.value);
  });

  const lineChartData = Object.keys(lineChartDataMap).map((dateLabel) => ({
    date: dateLabel,
    total: lineChartDataMap[dateLabel],
  }));

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Xarajatlar Tahlili & Analitika"
        subtitle="Vaqt va filiallar bo‘yicha moliyaviy statistik diagrammalar"
      />

      {/* Top Filter Controls Container */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
        {/* Row 1: Time Range Selector Pills & Total Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={14} className="text-orange-400" /> Davrni Tanlang
            </span>
            <div className="inline-flex bg-[#0d0d0f] p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setTimeRange('7days')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeRange === '7days'
                    ? 'bg-orange-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Oxirgi 7 Kun
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('30days')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeRange === '30days'
                    ? 'bg-orange-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Oxirgi 30 Kun
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('365days')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeRange === '365days'
                    ? 'bg-orange-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Oxirgi 365 Kun (1 Yil)
              </button>
            </div>
          </div>

          {/* Stat Summary Box */}
          <div className="bg-[#0d0d0f] border border-zinc-800 rounded-xl px-5 py-3 text-right">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              {activeBranchName} — Jami Xarajat
            </span>
            <h2 className="text-2xl font-extrabold text-orange-400 mt-0.5">
              {formatUZS(totalExpenseAmount)}
            </h2>
          </div>
        </div>

        {/* Row 2: Branch Filter Tab Buttons */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 size={14} className="text-amber-400" /> Filialni Tanlang
          </span>
          <div className="flex flex-wrap gap-2">
            {/* Hammasi (Overall) Button */}
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

            {/* Individual Branch Buttons (Vodnik, Suvmash, etc.) */}
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
          {/* Line Chart: Expenses Dynamic Trend */}
          <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LineIcon size={20} className="text-orange-400" />
                <h3 className="text-lg font-bold text-white">
                  Xarajatlar Dinamikasi ({activeBranchName})
                </h3>
              </div>
              <span className="text-xs font-semibold text-zinc-400 bg-[#0d0d0f] px-3 py-1 rounded-lg border border-zinc-800">
                {timeRange === '7days' ? 'Oxirgi 7 Kun' : timeRange === '30days' ? 'Oxirgi 30 Kun' : 'Oxirgi 365 Kun'}
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
                      contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
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
            {/* 1. Category Pie Chart */}
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
                      <Tooltip
                        formatter={(val: any, name: any, item: any) => [
                          `${formatUZS(val)} (${item.payload?.percentage})`,
                          name,
                        ]}
                        contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                      />
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
                          contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
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
