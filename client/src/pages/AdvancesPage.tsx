import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { SalaryAdvance, Employee } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { AdvanceTable } from '../components/advances/AdvanceTable';
import { AdvanceModalForm } from '../components/advances/AdvanceModalForm';
import { Plus } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Oylik Avanslar So‘rovi"
        subtitle="Xodimlar tomonidan olingan avanslar va ularning tasdiqlash holati"
        action={
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
            Avans Berish / So‘rov Qo‘shish
          </Button>
        }
      />

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
