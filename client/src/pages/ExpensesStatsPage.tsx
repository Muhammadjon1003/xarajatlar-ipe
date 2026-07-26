import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Expense } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { KPICard } from '../components/dashboard/KPICard';
import { formatUZS, getMonthName } from '../utils/format';
import { TrendingDown, PieChart as PieIcon, BarChart3, LineChart as LineIcon } from 'lucide-react';
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

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e'];

export const ExpensesStatsPage: React.FC = () => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // empty string = all year
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, [year, selectedMonth]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params: any = { year };
      if (selectedMonth) params.month = selectedMonth;

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

  // 1. Monthly Line Chart Data (Jan - Dec)
  const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const monthExpenses = expenses.filter((e) => new Date(e.date).getMonth() + 1 === m);
    const total = monthExpenses.reduce((sum, e) => sum + Number(e.value), 0);
    return {
      month: getMonthName(m).substring(0, 3),
      total,
      count: monthExpenses.length,
    };
  });

  // 2. Category Pie Chart Data
  const categoryMap: { [name: string]: number } = {};
  expenses.forEach((e) => {
    const cName = e.category?.name || 'Boshqa';
    categoryMap[cName] = (categoryMap[cName] || 0) + Number(e.value);
  });
  const categoryData = Object.keys(categoryMap).map((name) => ({
    name,
    value: categoryMap[name],
  }));

  // 3. Branch Bar Chart Data
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
    <div className="space-y-6">
      <PageHeader
        title="Xarajatlar Tahlili & Analitika"
        subtitle="Kompaniyaning umumiy va filiallar bo‘yicha moliyaviy grafik va diagrammalari"
      />

      {/* Year & Month Selection Controls */}
      <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Yil</label>
            <select
              className="bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}-Yil
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Oy (Filtr)</label>
            <select
              className="bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
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

        <div className="text-right">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tanlangan Davr Jami Xarajat
          </span>
          <h2 className="text-xl font-extrabold text-rose-400">{formatUZS(totalExpenseAmount)}</h2>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400 p-4">Analitika yuklanmoqda...</p>
      ) : (
        <>
          {/* Top Line Chart: Yearly Monthly Expenses Trend */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <LineIcon size={20} className="text-indigo-400" />
              <h3 className="text-lg font-bold text-white">
                Oylik Xarajatlar Dinamikasi ({year}-Yil)
              </h3>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis tickFormatter={(val) => `${Math.round(val / 1000)}k`} stroke="#64748b" />
                  <Tooltip
                    formatter={(val: any) => [formatUZS(val), 'Xarajat']}
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row: Bar Chart & Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Branch Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={20} className="text-emerald-400" />
                <h3 className="text-base font-bold text-white">Filiallar Bo‘yicha Xarajatlar</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis tickFormatter={(val) => `${Math.round(val / 1000)}k`} stroke="#64748b" />
                    <Tooltip
                      formatter={(val: any) => [formatUZS(val), 'Xarajat']}
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Pie Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <PieIcon size={20} className="text-amber-400" />
                <h3 className="text-base font-bold text-white">Kategoriyalar Taqsimoti (Pie)</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatUZS(val), 'Summa']}
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
