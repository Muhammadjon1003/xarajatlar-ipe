import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Branch, ExpenseCategory } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { BranchTable } from '../components/branches/BranchTable';
import { BranchModalForm } from '../components/branches/BranchModalForm';
import { CategoryTable } from '../components/branches/CategoryTable';
import { CategoryModalForm } from '../components/branches/CategoryModalForm';
import { Plus, Building2, Tag } from 'lucide-react';

export const BranchesCategoriesPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [branchModal, setBranchModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bRes, cRes] = await Promise.all([api.get('/branches'), api.get('/categories')]);
      setBranches(bRes.data);
      setCategories(cRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (name: string) => {
    await api.post('/branches', { name });
    fetchData();
  };

  const handleDeleteBranch = async (id: string) => {
    if (!window.confirm('Filialni o‘chirmoqchimisiz?')) return;
    try {
      await api.delete(`/branches/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'O‘chirishda xatolik');
    }
  };

  const handleCreateCategory = async (name: string, description: string) => {
    await api.post('/categories', { name, description });
    fetchData();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Kategoriyani o‘chirmoqchimisiz?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'O‘chirishda xatolik');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Filiallar & Xarajat Kategoriyalari"
        subtitle="Tizim tuzilmasi, filiallar va xarajat turlarini boshqarish"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branches */}
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={20} className="text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Filiallar</h3>
            </div>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setBranchModal(true)}>
              Filial Qo‘shish
            </Button>
          </div>

          <BranchTable branches={branches} loading={loading} onDelete={handleDeleteBranch} />
        </div>

        {/* Categories */}
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag size={20} className="text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Xarajat Kategoriyalari</h3>
            </div>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCategoryModal(true)}>
              Kategoriya Qo‘shish
            </Button>
          </div>

          <CategoryTable categories={categories} loading={loading} onDelete={handleDeleteCategory} />
        </div>
      </div>

      <BranchModalForm
        isOpen={branchModal}
        onClose={() => setBranchModal(false)}
        onSubmit={handleCreateBranch}
      />

      <CategoryModalForm
        isOpen={categoryModal}
        onClose={() => setCategoryModal(false)}
        onSubmit={handleCreateCategory}
      />
    </div>
  );
};
