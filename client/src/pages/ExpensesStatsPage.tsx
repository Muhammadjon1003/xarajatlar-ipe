import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Expense } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { formatUZS, getMonthName } from '../utils/format';
import { PieChart as PieIcon, BarChart3, LineChart as LineIcon } from 'lucide-react';
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
  '#f97316', // Orange (2nd color)
  '#facc15', // Yellow (3rd color)
  '#ea580c', // Dark Orange
  '#eab308', // Gold
  '#fb923c', // Soft Orange
  '#d97706', // Amber
  '#fde047', // Light Yellow
];

export const ExpensesStatsPage: React.FC = () => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('');
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

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.value), 0);

  // 1. Monthly Line Chart (Jan - Dec)
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

  // 2. Category Pie Chart
  const categoryMap: { [name: string]: number } = {};
  expenses.forEach((e) => {
    const cName = e.category?.name || 'Boshqa';
    categoryMap[cName] = (categoryMap[cName] || 0) + Number(e.value);
  });
  const categoryData = Object.keys(categoryMap).map((name) => ({
    name,
    value: categoryMap[name],
  }));

  // 3. Branch Bar Chart
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
        subtitle="Kompaniyaning narx va xarajat grafiklari (Apelsin va Sariq ranglar palitrasi)"
      />

      {/* Year & Month Selection Controls */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Yil</label>
            <select
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
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
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Oy (Filtr)</label>
            <select
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
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
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Tanlangan Davr Jami Xarajat
          </span>
          <h2 className="text-xl font-extrabold text-orange-400">{formatUZS(totalExpenseAmount)}</h2>
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-400 p-4">Analitika yuklanmoqda...</p>
      ) : (
        <>
          {/* Top Line Chart: Yearly Monthly Expenses Trend in Orange & Yellow */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <LineIcon size={20} className="text-orange-400" />
              <h3 className="text-lg font-bold text-white">
                Oylik Xarajatlar Dinamikasi ({year}-Yil Line Graph)
              </h3>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <XAxis dataKey="month" stroke="#a1a1aa" />
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
                    dot={{ fill: '#facc15', r: 6 }}
                    activeDot={{ r: 9 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row: Bar Chart & Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Branch Bar Chart in Warm Orange */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={20} className="text-yellow-400" />
                <h3 className="text-base font-bold text-white">Filiallar Bo‘yicha Xarajatlar (Bar Graph)</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <XAxis dataKey="name" stroke="#a1a1aa" />
                    <YAxis tickFormatter={(val) => `${Math.round(val / 1000)}k`} stroke="#71717a" />
                    <Tooltip
                      formatter={(val: any) => [formatUZS(val), 'Xarajat']}
                      contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="total" fill="#ea580c" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Pie Chart in Orange/Yellow Shades */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <PieIcon size={20} className="text-orange-400" />
                <h3 className="text-base font-bold text-white">Kategoriyalar Taqsimoti (Pie Chart)</h3>
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
                        <Cell key={`cell-${index}`} fill={WARM_PALETTE[index % WARM_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatUZS(val), 'Summa']}
                      contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
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
