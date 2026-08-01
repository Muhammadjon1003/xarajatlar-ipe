import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { ModalWrapper } from '../components/common/ModalWrapper';
import { formatUZS, getMonthName } from '../utils/format';
import {
  TrendingUp,
  Users,
  Award,
  BookOpen,
  DollarSign,
  Clock,
  RefreshCw,
  LineChart,
  UserCheck,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface MonthlyAnalysisData {
  targetMonth: number;
  targetYear: number;
  kpis: {
    totalAktivs: number;
    totalArchives: number;
    totalEmployees: number;
    teacherCount: number;
    adminCount: number;
    managerCount: number;
    otherStaffCount: number;
    totalSalaryExpense: number;
  };
  annualChartData: {
    month: number;
    monthName: string;
    basePaidSalaries: number;
    advancesGiven: number;
    advancesPending: number;
    totalMonthlyPayout: number;
  }[];
  topEarners: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    roleName: string;
    roleCode: string;
    baseSalary: number;
    totalAdditions: number;
    shiftDeductions: number;
    advanceDeductions: number;
    finalPayout: number;
    totalEarned: number;
    isPaid: boolean;
  }[];
  allTeachersStats: {
    teacherId: string;
    name: string;
    totalStudents: number;
    totalArchives: number;
    totalGroupSalary: number;
    groupCount: number;
  }[];
  allAdminsStats: {
    administratorId: string;
    name: string;
    aktivCount: number;
    aktivPrice: number;
    baseSalary: number;
    totalSalary: number;
  }[];
  advanceOverview: {
    approvedTotal: number;
    pendingTotal: number;
    approvedCount: number;
    pendingCount: number;
  };
}

export const MonthlyAnalysisPage: React.FC = () => {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [data, setData] = useState<MonthlyAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [activeModal, setActiveModal] = useState<'earners' | 'teachers' | 'admins' | null>(null);

  useEffect(() => {
    fetchAnalysisData();
  }, [month, year]);

  const fetchAnalysisData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/monthly-analysis', {
        params: { month, year },
      });
      setData(res.data);
    } catch (err) {
      console.error('Error fetching monthly analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const kpis = data?.kpis;
  const chartData = data?.annualChartData || [];
  const maxChartValue = Math.max(
    ...chartData.map((d) => Math.max(d.totalMonthlyPayout, d.basePaidSalaries, d.advancesGiven)),
    1000000
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Oylik Tahlil & Statistika"
        subtitle="Xodimlar maoshi, avanslar, o‘qituvchilar va administratorlar natijalari bo‘yicha chuqur tahlil"
      />

      {/* Month & Year Filter Header */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Oy</label>
            <select
              className="bg-[#0d0d0f] border border-zinc-800 rounded-xl px-3.5 py-2 text-sm font-bold text-zinc-100 focus:outline-none focus:border-orange-500"
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
              className="bg-[#0d0d0f] border border-zinc-800 rounded-xl px-3.5 py-2 text-sm font-bold text-zinc-100 focus:outline-none focus:border-orange-500"
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

          <button
            onClick={fetchAnalysisData}
            className="mt-5 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
            title="Yangilash"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            {getMonthName(month)} {year} — Jami Maosh Xarajatlari
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-orange-400">
            {formatUZS(kpis?.totalSalaryExpense || 0)}
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-500 font-semibold text-sm">
          Tahlil ma’lumotlari yuklanmoqda...
        </div>
      ) : (
        <>
          {/* STEP 1: Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Aktivs */}
            <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 space-y-2 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Jami Aktiv O‘quvchilar
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <UserCheck size={18} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-white">{kpis?.totalAktivs || 0}</p>
              <p className="text-[11px] text-zinc-400">
                {getMonthName(month)} {year} bo‘yicha jalb qilingan aktivlar
              </p>
            </div>

            {/* KPI 2: Archives */}
            <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 space-y-2 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Jami Arxiv O‘quvchilar
                </span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <BookOpen size={18} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-white">{kpis?.totalArchives || 0}</p>
              <p className="text-[11px] text-zinc-400">
                O‘qituvchilar guruhlaridagi umumiy arxiv
              </p>
            </div>

            {/* KPI 3: Employee Count */}
            <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 space-y-2 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                  Faol Xodimlar Shtati
                </span>
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Users size={18} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-white">{kpis?.totalEmployees || 0}</p>
              <p className="text-[11px] text-zinc-400">
                {kpis?.teacherCount || 0} o‘qituvchi, {kpis?.adminCount || 0} admin, {kpis?.managerCount || 0} menejer
              </p>
            </div>

            {/* KPI 4: Total Salary Expense */}
            <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 space-y-2 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  Jami Maosh Fondi
                </span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <DollarSign size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-white">
                {formatUZS(kpis?.totalSalaryExpense || 0)}
              </p>
              <p className="text-[11px] text-zinc-400">
                Oylik to‘lovlar + berilgan avanslar jamlanmasi
              </p>
            </div>
          </div>

          {/* STEP 2: Annual Expense Line Graph (Jan - Dec) */}
          <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <LineChart size={18} className="text-orange-400" />
                  Yillik Maosh Xarajatlari Dinamikasi ({year})
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  12 oylik maosh fondi (baza maoshlar + avanslar) tahlil grafigi
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-orange-400">
                  <span className="w-3 h-3 rounded-full bg-orange-500" /> Jami Maosh Fondi
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" /> To‘langan Maosh
                </div>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-3 h-3 rounded-full bg-amber-400" /> Avanslar
                </div>
              </div>
            </div>

            {/* Bar & Line Visual Chart */}
            <div className="pt-6 pb-2">
              <div className="h-64 flex items-end justify-between gap-2 border-b border-zinc-800 pb-3 px-2">
                {chartData.map((d) => {
                  const totalHeight = Math.max(10, Math.round((d.totalMonthlyPayout / maxChartValue) * 100));
                  const paidHeight = Math.max(5, Math.round((d.basePaidSalaries / maxChartValue) * 100));
                  const isCurrentMonth = d.month === month;

                  return (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-2 group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-[10px] font-bold text-white shadow-xl z-20 pointer-events-none whitespace-nowrap">
                        <p className="text-orange-400 font-extrabold">{d.monthName}: {formatUZS(d.totalMonthlyPayout)}</p>
                        <p className="text-emerald-400">To‘langan: {formatUZS(d.basePaidSalaries)}</p>
                        <p className="text-amber-400">Avans: {formatUZS(d.advancesGiven)}</p>
                      </div>

                      <div className="w-full flex items-end justify-center gap-1 h-48">
                        {/* Total Salary Bar */}
                        <div
                          className={`w-3.5 rounded-t-lg transition-all ${
                            isCurrentMonth ? 'bg-orange-500 shadow-lg shadow-orange-500/20' : 'bg-orange-500/40 group-hover:bg-orange-500'
                          }`}
                          style={{ height: `${totalHeight}%` }}
                        />
                        {/* Paid Salary Bar */}
                        <div
                          className="w-3.5 rounded-t-lg bg-emerald-500/40 group-hover:bg-emerald-500 transition-all"
                          style={{ height: `${paidHeight}%` }}
                        />
                      </div>

                      <span className={`text-[11px] font-bold ${isCurrentMonth ? 'text-orange-400 underline' : 'text-zinc-500'}`}>
                        {d.monthName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 3: Leaderboards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Card 1: Top Earner Employees */}
            <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award size={16} className="text-orange-400" />
                    Top Maosh Oluvchilar
                  </h4>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">
                    Avanslar Bilan
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(data?.topEarners || []).slice(0, 4).map((emp, idx) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between bg-[#0d0d0f] border border-zinc-800/80 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-orange-500/10 text-orange-400 font-extrabold text-xs flex items-center justify-center border border-orange-500/20">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-semibold">{emp.roleName}</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-orange-400">
                        {formatUZS(emp.totalEarned)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveModal('earners')}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-zinc-800/60 text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition"
              >
                <span>Barchasini Ko‘rish ({data?.topEarners?.length || 0})</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Card 2: Top Teachers (Least Archives) */}
            <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen size={16} className="text-amber-400" />
                    Top O‘qituvchilar (Kam Arxiv)
                  </h4>
                  <span className="text-[10px] font-bold text-amber-400 uppercase">
                    Eng Yaxshi
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(data?.allTeachersStats || []).slice(0, 4).map((t, idx) => (
                    <div
                      key={t.teacherId}
                      className="flex items-center justify-between bg-[#0d0d0f] border border-zinc-800/80 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-amber-400/10 text-amber-400 font-extrabold text-xs flex items-center justify-center border border-amber-400/20">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white">{t.name}</p>
                          <p className="text-[10px] text-zinc-400 font-semibold">
                            {t.groupCount} ta guruh | {t.totalStudents} o‘quvchi
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-amber-400 block">
                          {t.totalArchives} arxiv
                        </span>
                        <span className="text-[10px] text-zinc-500 font-semibold">
                          {formatUZS(t.totalGroupSalary)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveModal('teachers')}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-zinc-800/60 text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition"
              >
                <span>Barcha O‘qituvchilar ({data?.allTeachersStats?.length || 0})</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Card 3: Top Admins (Most Aktivs) */}
            <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserCheck size={16} className="text-emerald-400" />
                    Top Administratorlar (Aktiv)
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">
                    Eng Ko‘p
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(data?.allAdminsStats || []).slice(0, 4).map((adm, idx) => (
                    <div
                      key={adm.administratorId}
                      className="flex items-center justify-between bg-[#0d0d0f] border border-zinc-800/80 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 font-extrabold text-xs flex items-center justify-center border border-emerald-500/20">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white">{adm.name}</p>
                          <p className="text-[10px] text-zinc-400 font-semibold">
                            Baza: {formatUZS(adm.baseSalary)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-400 block">
                          {adm.aktivCount} ta aktiv
                        </span>
                        <span className="text-[10px] text-zinc-500 font-semibold">
                          Jami: {formatUZS(adm.totalSalary)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveModal('admins')}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-zinc-800/60 text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition"
              >
                <span>Barcha Administratorlar ({data?.allAdminsStats?.length || 0})</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* MODAL 1: Full Top Earners Staff List */}
      {activeModal === 'earners' && (
        <ModalWrapper
          title={`Barcha Xodimlarning Oylik Ro‘yxati (${getMonthName(month)} ${year})`}
          isOpen={true}
          onClose={() => setActiveModal(null)}
          maxWidthClass="max-w-4xl"
        >
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 mb-2">
              Barcha lavozimdagi xodimlarning jami maoshi (Avanslar qo‘shilgan holatda):
            </p>
            <div className="max-h-[450px] overflow-y-auto space-y-2 pr-1">
              {data?.topEarners.map((emp, idx) => (
                <div
                  key={emp.id}
                  className="flex flex-wrap items-center justify-between bg-[#0d0d0f] border border-zinc-800 rounded-xl p-3.5 gap-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-orange-500/10 text-orange-400 font-extrabold text-xs flex items-center justify-center border border-orange-500/20">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs text-zinc-400 font-semibold">{emp.roleName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-right">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Qo‘lga Tegadigan</span>
                      <span className="text-zinc-200 font-bold">{formatUZS(emp.finalPayout)}</span>
                    </div>
                    <div>
                      <span className="text-amber-500 block text-[10px]">+ Avans</span>
                      <span className="text-amber-400 font-bold">+{formatUZS(emp.advanceDeductions)}</span>
                    </div>
                    <div>
                      <span className="text-orange-400 block text-[10px] font-extrabold uppercase">Jami Daromad</span>
                      <span className="text-orange-400 font-extrabold text-sm">{formatUZS(emp.totalEarned)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* MODAL 2: Full Teachers Archive Stats */}
      {activeModal === 'teachers' && (
        <ModalWrapper
          title={`O‘qituvchilar Arxiv Statistikasi (${getMonthName(month)} ${year})`}
          isOpen={true}
          onClose={() => setActiveModal(null)}
          maxWidthClass="max-w-4xl"
        >
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 mb-2">
              O‘qituvchilar guruhlari, o‘quvchilar va arxiv ko‘rsatkichlari (eng kam arxivdan tartiblangan):
            </p>
            <div className="max-h-[450px] overflow-y-auto space-y-2 pr-1">
              {data?.allTeachersStats.map((t, idx) => (
                <div
                  key={t.teacherId}
                  className="flex flex-wrap items-center justify-between bg-[#0d0d0f] border border-zinc-800 rounded-xl p-3.5 gap-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-amber-400/10 text-amber-400 font-extrabold text-xs flex items-center justify-center border border-amber-400/20">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="text-xs text-zinc-400 font-semibold">{t.groupCount} ta guruh mavjud</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-right">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">O‘quvchilar</span>
                      <span className="text-zinc-200 font-bold">{t.totalStudents} ta</span>
                    </div>
                    <div>
                      <span className="text-amber-400 block text-[10px] font-bold">Arxiv</span>
                      <span className="text-amber-400 font-extrabold text-sm">{t.totalArchives} ta</span>
                    </div>
                    <div>
                      <span className="text-orange-400 block text-[10px]">Guruhlar Maoshi</span>
                      <span className="text-orange-400 font-extrabold">{formatUZS(t.totalGroupSalary)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* MODAL 3: Full Administrators Aktiv Stats */}
      {activeModal === 'admins' && (
        <ModalWrapper
          title={`Administratorlar Aktiv Statistikasi (${getMonthName(month)} ${year})`}
          isOpen={true}
          onClose={() => setActiveModal(null)}
          maxWidthClass="max-w-4xl"
        >
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 mb-2">
              Administratorlarning jalb qilgan aktiv o‘quvchilari va umumiy daromadi:
            </p>
            <div className="max-h-[450px] overflow-y-auto space-y-2 pr-1">
              {data?.allAdminsStats.map((adm, idx) => (
                <div
                  key={adm.administratorId}
                  className="flex flex-wrap items-center justify-between bg-[#0d0d0f] border border-zinc-800 rounded-xl p-3.5 gap-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 font-extrabold text-xs flex items-center justify-center border border-emerald-500/20">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{adm.name}</p>
                      <p className="text-xs text-zinc-400 font-semibold">Baza Maoshi: {formatUZS(adm.baseSalary)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-right">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">1 Aktiv Narxi</span>
                      <span className="text-zinc-200 font-bold">{formatUZS(adm.aktivPrice)}</span>
                    </div>
                    <div>
                      <span className="text-emerald-400 block text-[10px] font-bold">Aktivlar Soni</span>
                      <span className="text-emerald-400 font-extrabold text-sm">{adm.aktivCount} ta</span>
                    </div>
                    <div>
                      <span className="text-amber-400 block text-[10px] font-extrabold">Jami Maosh</span>
                      <span className="text-amber-400 font-extrabold text-sm">{formatUZS(adm.totalSalary)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
};
