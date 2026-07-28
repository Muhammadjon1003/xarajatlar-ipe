import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Employee, Role } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { EmployeeTable } from '../components/employees/EmployeeTable';
import { EmployeeModalForm } from '../components/employees/EmployeeModalForm';
import { Plus } from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchEmployeesAndRoles();
  }, []);

  const fetchEmployeesAndRoles = async () => {
    try {
      const [empRes, roleRes] = await Promise.all([api.get('/employees'), api.get('/auth/roles')]);
      setEmployees(empRes.data);
      setRoles(roleRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (payload: any) => {
    if (editingEmployee) {
      await api.put(`/employees/${editingEmployee.id}`, payload);
    } else {
      await api.post('/employees', payload);
    }
    fetchEmployeesAndRoles();
  };

  const openModal = (emp?: Employee) => {
    setEditingEmployee(emp || null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xodimlar va Rollar"
        subtitle="Tizimdagi barcha xodimlar, ularning lavozimlari va ruxsat darajalari"
        action={
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => openModal()}>
            Yangi Xodim Qo‘shish
          </Button>
        }
      />

      <EmployeeTable employees={employees} loading={loading} onEdit={openModal} />

      <EmployeeModalForm
        isOpen={isModalOpen}
        editingEmployee={editingEmployee}
        roles={roles}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
      />
    </div>
  );
};
