import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { OneTimeShift, Employee } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { ShiftTable } from '../components/shifts/ShiftTable';
import { ShiftModalForm } from '../components/shifts/ShiftModalForm';
import { Plus } from 'lucide-react';

export const ShiftsPage: React.FC = () => {
  const [shifts, setShifts] = useState<OneTimeShift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchShiftsAndEmployees();
  }, []);

  const fetchShiftsAndEmployees = async () => {
    try {
      const [shRes, empRes] = await Promise.all([api.get('/shifts'), api.get('/employees')]);
      setShifts(shRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShift = async (payload: any) => {
    await api.post('/shifts', payload);
    fetchShiftsAndEmployees();
  };

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.put(`/shifts/${id}/status`, { status });
      fetchShiftsAndEmployees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xatolik');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Smenani o‘chirmoqchimisiz?')) return;
    try {
      await api.delete(`/shifts/${id}`);
      fetchShiftsAndEmployees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'O‘chirishda xatolik');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bir Martalik Smena Almashtirish"
        subtitle="Kelmagan xodim maoshidan ushlab, uning o‘rniga chiqqan xodimga oylik sifatida o‘tkazish"
        action={
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
            Smena Almashtirish Qo‘shish
          </Button>
        }
      />

      <ShiftTable
        shifts={shifts}
        loading={loading}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDelete}
      />

      <ShiftModalForm
        isOpen={isModalOpen}
        employees={employees}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateShift}
      />
    </div>
  );
};
