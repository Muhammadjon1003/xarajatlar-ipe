import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { MonthlySalary } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { SalaryFilters } from '../components/salaries/SalaryFilters';
import { SalaryTable } from '../components/salaries/SalaryTable';

export const SalariesPage: React.FC = () => {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [salaries, setSalaries] = useState<MonthlySalary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalaries();
  }, [month, year]);

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      // 1. Fetch salaries for month/year
      let res = await api.get('/salaries', { params: { month, year } });

      // 2. If no salary records exist for this month/year, automatically initialize them
      if (!res.data || res.data.length === 0) {
        await api.post('/salaries/calculate', { month, year });
        res = await api.get('/salaries', { params: { month, year } });
      }

      setSalaries(res.data || []);
    } catch (err) {
      console.error('Error fetching salaries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBaseSalary = async (salaryId: string, newBaseSalary: number) => {
    await api.put(`/salaries/${salaryId}`, { baseSalary: newBaseSalary });
    fetchSalaries();
  };

  const togglePaidStatus = async (salaryId: string, currentStatus: boolean) => {
    try {
      await api.put(`/salaries/${salaryId}/pay`, { isPaid: !currentStatus });
      fetchSalaries();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xatolik');
    }
  };

  const totalPayroll = salaries.reduce((sum, s) => sum + Number(s.finalPayout), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Oyliklarni Hisoblash"
        subtitle="Xodimlar uchun oylik maosh kiritish, avans va zamena ushlanmalarini hisoblash"
      />

      <SalaryFilters
        month={month}
        setMonth={setMonth}
        year={year}
        setYear={setYear}
        totalPayroll={totalPayroll}
      />

      <SalaryTable
        salaries={salaries}
        loading={loading}
        onTogglePaid={togglePaidStatus}
        onUpdateBaseSalary={handleUpdateBaseSalary}
        onRefresh={fetchSalaries}
      />
    </div>
  );
};
