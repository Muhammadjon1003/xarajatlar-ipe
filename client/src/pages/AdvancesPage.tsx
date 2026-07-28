import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { SalaryAdvance, Employee } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { AdvanceTable } from '../components/advances/AdvanceTable';
import { AdvanceModalForm } from '../components/advances/AdvanceModalForm';
import { Plus, Clock, CheckCircle2, DollarSign } from 'lucide-react';
import { formatUZS } from '../utils/format';

export const AdvancesPage: React.FC = () => {
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAdvancesAndEmployees();
  }, []);

  const fetchAdvancesAndEmployees = async () => {
    try {
      const [advRes, empRes] = await Promise.all([api.get('/advances'), api.get('/employees')]);
      setAdvances(advRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdvance = async (payload: any) => {
    await api.post('/advances', payload);
    fetchAdvancesAndEmployees();
  };

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.put(`/advances/${id}/status`, { status });
      fetchAdvancesAndEmployees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xatolik');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Avans so‘rovini o‘chirmoqchimisiz?')) return;
    try {
      await api.delete(`/advances/${id}`);
      fetchAdvancesAndEmployees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'O‘chirishda xatolik');
    }
  };

  // KPI Calculations
  const totalAmount = advances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const pendingAdvances = advances.filter((a) => a.status === 'PENDING');
  const approvedAdvances = advances.filter((a) => a.status === 'APPROVED');
  const pendingTotal = pendingAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const approvedTotal = approvedAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Oylik Avanslar So‘rovi"
        subtitle="Xodimlarga berilgan avanslar va ularning tasdiqlash holati"
        action={
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
            Yangi Avans So‘rovi
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Jami Avanslar</p>
            <h3 className="text-xl font-extrabold text-white mt-1">{formatUZS(totalAmount)}</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">{advances.length} ta umumiy so‘rov</p>
          </div>
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Kutilayotgan Avanslar</p>
            <h3 className="text-xl font-extrabold text-amber-400 mt-1">{formatUZS(pendingTotal)}</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">{pendingAdvances.length} ta tasdiq kutilmoqda</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Tasdiqlangan Avanslar</p>
            <h3 className="text-xl font-extrabold text-emerald-400 mt-1">{formatUZS(approvedTotal)}</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">{approvedAdvances.length} ta tasdiqlangan</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      <AdvanceTable
        advances={advances}
        loading={loading}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDelete}
      />

      <AdvanceModalForm
        isOpen={isModalOpen}
        employees={employees}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateAdvance}
      />
    </div>
  );
};
