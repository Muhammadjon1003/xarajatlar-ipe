import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Expense, Branch, ExpenseCategory } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { ExpenseFilters } from '../components/expenses/ExpenseFilters';
import { ExpenseTable } from '../components/expenses/ExpenseTable';
import { ExpenseModalForm } from '../components/expenses/ExpenseModalForm';
import { Plus } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [search, selectedBranch, selectedCategory]);

  const fetchInitialData = async () => {
    try {
      const [bRes, cRes] = await Promise.all([api.get('/branches'), api.get('/categories')]);
      setBranches(bRes.data);
      setCategories(cRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExpenses = async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (selectedBranch) params.branchId = selectedBranch;
      if (selectedCategory) params.categoryId = selectedCategory;

      const res = await api.get('/expenses', { params });
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (payload: any) => {
    if (editingExpense) {
      await api.put(`/expenses/${editingExpense.id}`, payload);
    } else {
      await api.post('/expenses', payload);
    }
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Haqiqatan ham ushbu xarajatni o‘chirmoqchimisiz?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err: any) {
      alert(err.response?.data?.error || 'O‘chirishda xatolik');
    }
  };

  const openModal = (exp?: Expense) => {
    setEditingExpense(exp || null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xarajatlar Boshqaruvi"
        subtitle="Kompaniyaning barcha operatsion xarajatlari va cheklari ro‘yxati"
        action={
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => openModal()}>
            Yangi Xarajat Qo‘shish
          </Button>
        }
      />

      <ExpenseFilters
        search={search}
        setSearch={setSearch}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        branches={branches}
        categories={categories}
      />

      <ExpenseTable
        expenses={expenses}
        loading={loading}
        onEdit={openModal}
        onDelete={handleDelete}
      />

      <ExpenseModalForm
        isOpen={isModalOpen}
        editingExpense={editingExpense}
        branches={branches}
        categories={categories}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
      />
    </div>
  );
};
