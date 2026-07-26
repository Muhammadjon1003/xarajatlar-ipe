import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { DashboardSummary } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { KPICard } from '../components/dashboard/KPICard';
import { CategoryChartCard } from '../components/dashboard/CategoryChartCard';
import { BranchChartCard } from '../components/dashboard/BranchChartCard';
import { RecentExpensesCard } from '../components/dashboard/RecentExpensesCard';
import { TrendingDown, Banknote, Clock, Users } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400 p-4">Yuklanmoqda...</div>;
  }

  if (!data) {
    return <div className="text-rose-400 p-4">Statistikalarni yuklab bo‘lmadi</div>;
  }

  const { summary, categoryBreakdown, branchBreakdown, recentExpenses } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Boshqaruv Paneli"
        subtitle="Joriy oy bo‘yicha umumiy moliyaviy ko‘rsatkichlar va xarajatlar tahlili"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Oylik Xarajatlar"
          value={summary.totalExpensesThisMonth}
          subtext={`${summary.expenseCountThisMonth} ta xarajat`}
          icon={TrendingDown}
          iconColorClass="text-rose-400 bg-rose-500/10 border-rose-500/20"
        />
        <KPICard
          title="To‘langan Oyliklar"
          value={summary.totalSalariesPaidThisMonth}
          subtext={`${summary.salariesPaidCountThisMonth} ta xodimga to‘landi`}
          icon={Banknote}
          iconColorClass="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        />
        <KPICard
          title="Kutilayotgan Avanslar"
          value={summary.pendingAdvancesAmount}
          subtext={`${summary.pendingAdvancesCount} ta avans so‘rovi`}
          icon={Clock}
          iconColorClass="text-amber-400 bg-amber-500/10 border-amber-500/20"
        />
        <KPICard
          title="Faol Xodimlar"
          value={summary.activeEmployeesCount}
          isCurrency={false}
          subtext="Tizimdagi jami xodimlar"
          icon={Users}
          iconColorClass="text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChartCard data={categoryBreakdown} />
        <BranchChartCard data={branchBreakdown} />
      </div>

      <RecentExpensesCard expenses={recentExpenses} />
    </div>
  );
};
