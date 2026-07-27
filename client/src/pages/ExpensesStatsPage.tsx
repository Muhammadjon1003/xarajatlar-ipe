import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Expense, Branch } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { ReceiptImageModal } from '../components/common/ReceiptImageModal';
import { formatUZS, getMonthName, formatDate } from '../utils/format';
import {
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Award,
  Flame,
  Eye,
  CalendarDays,
} from 'lucide-react';
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
  const [prevPeriodExpenses, setPrevPeriodExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Receipt Image Modal State
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

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
      const prevParams: any = {};

      if (filterMode === 'quick') {
        const now = new Date();
        const startDate = new Date();
        let days = 30;

        if (quickRange === '7days') days = 7;
        if (quickRange === '30days') days = 30;
        if (quickRange === '365days') days = 365;

        startDate.setDate(now.getDate() - days);
        params.startDate = startDate.toISOString();
        params.endDate = now.toISOString();

        // Calculate previous period for MoM variance comparison
        const prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - days);
        prevParams.startDate = prevStartDate.toISOString();
        prevParams.endDate = startDate.toISOString();
      } else {
        // Custom Year / Month mode
        params.year = selectedYear;
        if (selectedMonth) {
          params.month = selectedMonth;

          // MoM previous month calculation
          const m = Number(selectedMonth);
          if (m === 1) {
            prevParams.year = selectedYear - 1;
            prevParams.month = 12;
          } else {
            prevParams.year = selectedYear;
            prevParams.month = m - 1;
          }
        } else {
          prevParams.year = selectedYear - 1;
        }
      }

      if (selectedBranchId) {
        params.branchId = selectedBranchId;
        prevParams.branchId = selectedBranchId;
      }

      const [res, prevRes] = await Promise.all([
        api.get('/expenses', { params }),
        api.get('/expenses', { params: prevParams }),
      ]);

      setExpenses(res.data);
      setPrevPeriodExpenses(prevRes.data);
    } catch (err) {
      console.error('Error fetching expense stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- KPI CALCULATIONS ---
  // 1. Total Expenses
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.value), 0);
  const prevTotalExpenseAmount = prevPeriodExpenses.reduce((sum, e) => sum + Number(e.value), 0);

  // 2. Month-over-Month (MoM) Variance Percentage
  const momVariance =
    prevTotalExpenseAmount > 0
      ? ((totalExpenseAmount - prevTotalExpenseAmount) / prevTotalExpenseAmount) * 100
      : totalExpenseAmount > 0
      ? 100
      : 0;

  // 3. Average Daily Expense
  const calculateDaysInPeriod = () => {
    if (filterMode === 'quick') {
      if (quickRange === '7days') return 7;
      if (quickRange === '30days') return 30;
      if (quickRange === '365days') return 365;
    }
    if (selectedMonth) {
      const year = selectedYear;
      const month = Number(selectedMonth);
      return new Date(year, month, 0).getDate();
    }
    return 365;
  };

  const daysInPeriod = calculateDaysInPeriod();
  const avgDailyExpense = daysInPeriod > 0 ? totalExpenseAmount / daysInPeriod : 0;

  // 4. Largest Single Expense Item
  const largestExpense: Expense | null =
    expenses.length > 0
      ? expenses.reduce((max, e) => (Number(e.value) > Number(max.value) ? e : max), expenses[0])
      : null;

  // --- TOP 5 SPENDING CATEGORIES ---
  const categoryMap: { [name: string]: number } = {};
  expenses.forEach((e) => {
    const cName = e.category?.name || 'Boshqa';
    categoryMap[cName] = (categoryMap[cName] || 0) + Number(e.value);
  });

  const sortedCategories = Object.keys(categoryMap)
    .map((name) => {
      const amount = categoryMap[name];
      const percentage = totalExpenseAmount > 0 ? (amount / totalExpenseAmount) * 100 : 0;
      return { name, amount, percentage };
    })
    .sort((a, b) => b.amount - a.amount);

  const top5Categories = sortedCategories.slice(0, 5);

  // --- LINE CHART DATA ---
  const buildChronologicalLineData = () => {
    if (filterMode === 'quick' && (quickRange === '7days' || quickRange === '30days')) {
      const daysCount = quickRange === '7days' ? 7 : 30;
      const result: { dateKey: string; dateDisplay: string; total: number; timestamp: number }[] = [];
      const now = new Date();

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

    return Object.values(dateMap)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ display, total }) => ({ date: display, total }));
  };

  const lineChartData = buildChronologicalLineData();

  // --- PIE CHART DATA ---
  const categoryData = sortedCategories.map(({ name, amount, percentage }) => ({
    name,
    value: amount,
    percentage: `${percentage.toFixed(1)}%`,
  }));

  // --- BRANCH BAR CHART DATA ---
  const branchMap: { [name: string]: number } = {};
  expenses.forEach((e) => {
    const bName = e.branch?.name || 'Asosiy';
    branchMap[bName] = (branchMap[bName] || 0) + Number(e.value);
  });
  const branchData = Object.keys(branchMap).map((name) => ({
    name,
    total: branchMap[name],
  }));

  const activeBranchName = selectedBranchId
    ? branches.find((b) => b.id === selectedBranchId)?.name || 'Filial'
    : 'Hammasi (Overall)';

  // High-Contrast Tooltip for Pie Chart
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
        subtitle="KPI metrikalar, eng katta xarajatlar, kategoriyalar va filiallar bo‘yicha to‘liq statistik ko‘rsatkichlar"
      />

      {/* Top Filter Controls Container */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
        {/* Row 1: Filter Mode Toggle */}
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

          <div className="text-xs font-semibold text-zinc-400">
            Tanlangan Filial: <span className="text-orange-400 font-bold">{activeBranchName}</span>
          </div>
        </div>

        {/* Row 2: Time Controls */}
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

        {/* Row 3: Branch Tabs */}
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
          {/* FEATURE 1: KEY PERFORMANCE INDICATOR (KPI) SUMMARY CARDS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Expenses */}
            <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Jami Xarajat
                </span>
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <DollarSign size={20} />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-white">{formatUZS(totalExpenseAmount)}</h3>
              <p className="text-[11px] text-zinc-500 font-medium">
                {expenses.length} ta operatsiya kiritilgan
              </p>
            </div>

            {/* Card 2: Month-over-Month (MoM) Variance */}
            <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  MoM O‘zgarish (Variance)
                </span>
                <div
                  className={`p-2.5 rounded-xl border ${
                    momVariance > 0
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  {momVariance > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3
                  className={`text-2xl font-extrabold ${
                    momVariance > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {momVariance > 0 ? `+${momVariance.toFixed(1)}%` : `${momVariance.toFixed(1)}%`}
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium">
                O‘tgan davrga ({formatUZS(prevTotalExpenseAmount)}) nisbatan
              </p>
            </div>

            {/* Card 3: Average Daily Expense */}
            <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  O‘rtacha Kunlik Xarajat
                </span>
                <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  <CalendarDays size={20} />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-amber-400">{formatUZS(avgDailyExpense)}</h3>
              <p className="text-[11px] text-zinc-500 font-medium">
                {daysInPeriod} kun uchun o‘rtacha kunlik
              </p>
            </div>

            {/* Card 4: Largest Single Expense */}
            <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Eng Katta Xarajat
                </span>
                <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  <Flame size={20} />
                </div>
              </div>
              {largestExpense ? (
                <div>
                  <h3 className="text-xl font-extrabold text-yellow-400 truncate">
                    {formatUZS(largestExpense.value)}
                  </h3>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-300">
                    <span className="font-semibold truncate max-w-[130px]" title={largestExpense.name}>
                      {largestExpense.name}
                    </span>
                    {largestExpense.receiptUrl && (
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptUrl(largestExpense.receiptUrl || null)}
                        className="inline-flex items-center gap-1 text-orange-400 hover:underline"
                      >
                        <Eye size={12} /> Chek
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 font-medium">Mavjud emas</p>
              )}
            </div>
          </div>

          {/* FEATURE 2: TOP SPENDING CATEGORIES & LINE GRAPH ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top 5 Spending Categories Section */}
            <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-md space-y-4 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award size={20} className="text-yellow-400" />
                  <h3 className="text-base font-bold text-white">Top 5 Xarajat Kategoriyalari</h3>
                </div>
              </div>

              {top5Categories.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-10">Kategoriyalar mavjud emas</p>
              ) : (
                <div className="space-y-4">
                  {top5Categories.map((cat, index) => (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-zinc-200 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-zinc-800 text-orange-400 text-[10px] font-extrabold flex items-center justify-center">
                            #{index + 1}
                          </span>
                          {cat.name}
                        </span>
                        <div className="text-right">
                          <span className="text-white font-bold">{formatUZS(cat.amount)}</span>
                          <span className="text-zinc-400 text-[11px] ml-1 font-medium">
                            ({cat.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      {/* Visual Progress Bar */}
                      <div className="w-full h-2 bg-[#0d0d0f] rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chronological Line Chart: Expenses Dynamic Trend */}
            <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-md lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <LineIcon size={20} className="text-orange-400" />
                  <h3 className="text-base font-bold text-white">
                    Xarajatlar Dinamikasi ({activeBranchName})
                  </h3>
                </div>
                <span className="text-xs font-semibold text-zinc-400 bg-[#0d0d0f] px-3 py-1 rounded-lg border border-zinc-800">
                  {filterMode === 'quick'
                    ? quickRange === '7days'
                      ? 'Oxirgi 7 Kun'
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
          </div>

          {/* FEATURE 3: CATEGORY PIE CHART & CONDITIONAL BRANCH BAR CHART ROW */}
          <div className={`grid grid-cols-1 ${selectedBranchId === '' ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
            {/* Category Pie Chart */}
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

            {/* Branch Comparison Bar Chart (ONLY shown when Overall/Hammasi is selected) */}
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

      {/* Receipt Image Viewer Modal */}
      <ReceiptImageModal
        isOpen={!!selectedReceiptUrl}
        receiptUrl={selectedReceiptUrl}
        onClose={() => setSelectedReceiptUrl(null)}
      />
    </div>
  );
};
