import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Expense, Branch, ExpenseCategory } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { ExpenseFilters } from '../components/expenses/ExpenseFilters';
import { TableWrapper } from '../components/common/TableWrapper';
import { Badge } from '../components/common/Badge';
import { ExpenseModalForm } from '../components/expenses/ExpenseModalForm';
import { formatUZS, formatDate } from '../utils/format';
import { Edit, Trash2, ExternalLink, BookOpen } from 'lucide-react';

export const ExpensesLedgerPage: React.FC = () => {
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
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [search, selectedBranch, selectedCategory]);

  const fetchMetadata = async () => {
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
    if (!window.confirm('Xarajatni o‘chirmoqchimisiz?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err: any) {
      alert(err.response?.data?.error || 'O‘chirishda xatolik');
    }
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xarajatlar Daftari (Ledger Table)"
        subtitle="Barcha operatsion va ma’muriy xarajatlarning to‘liq buxgalteriya daftari va mas’ul xodimlar qaydi"
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

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <p className="text-slate-400 p-4">Yuklanmoqda...</p>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <BookOpen size={40} className="mx-auto opacity-30 mb-2" />
            <p>Daftarda hech qanday xarajat mavjud emas</p>
          </div>
        ) : (
          <TableWrapper
            headers={[
              'Xarajat Nomi',
              'Summa (UZS)',
              'Kategoriya',
              'Filial',
              'Mas’ul Xodim (Clerk)',
              'Sana',
              'Chek',
              'Amallar',
            ]}
          >
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-5 py-3.5 font-bold text-slate-100">{exp.name}</td>
                <td className="px-5 py-3.5 font-extrabold text-rose-400 text-base">
                  {formatUZS(exp.value)}
                </td>
                <td className="px-5 py-3.5">
                  <Badge status={exp.category?.name || 'Xarajat'} />
                </td>
                <td className="px-5 py-3.5 text-slate-300">{exp.branch?.name}</td>
                <td className="px-5 py-3.5 text-indigo-300 font-semibold text-xs">
                  {exp.createdBy ? (
                    <div>
                      <span>
                        {exp.createdBy.firstName} {exp.createdBy.lastName}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-normal">
                        {exp.createdBy.role?.displayName || 'Clerk'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">Kiritilmagan</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-400">{formatDate(exp.date)}</td>
                <td className="px-5 py-3.5">
                  {exp.receiptUrl ? (
                    <a
                      href={exp.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-400 hover:underline text-xs"
                    >
                      <ExternalLink size={14} /> Chekni ko‘rish
                    </a>
                  ) : (
                    <span className="text-slate-600 text-xs">-</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      onClick={() => openEditModal(exp)}
                      className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </TableWrapper>
        )}
      </div>

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
