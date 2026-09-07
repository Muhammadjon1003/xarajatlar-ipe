import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Expense, Branch, ExpenseCategory } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { ExpenseFilters } from '../components/expenses/ExpenseFilters';
import { TableWrapper } from '../components/common/TableWrapper';
import { Badge } from '../components/common/Badge';
import { ExpenseModalForm } from '../components/expenses/ExpenseModalForm';
import { ReceiptImageModal } from '../components/common/ReceiptImageModal';
import { formatUZS, formatDate } from '../utils/format';
import { Edit, Trash2, Eye, BookOpen, Calendar, Building2, User } from 'lucide-react';

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

  // Receipt Modal State
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

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

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        {loading ? (
          <p className="text-zinc-400 p-4">Yuklanmoqda...</p>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <BookOpen size={40} className="mx-auto opacity-30 mb-2" />
            <p>Daftarda hech qanday xarajat mavjud emas</p>
          </div>
        ) : (
          <>
            {/* Mobile Card List View (Phones < md) */}
            <div className="md:hidden space-y-3">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-[#141417] border border-zinc-800/90 rounded-2xl p-4 shadow-sm space-y-3"
                >
                  {/* Title & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-zinc-100 text-sm leading-snug break-words">
                        {exp.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-400">
                        <Calendar size={13} className="text-zinc-500 shrink-0" />
                        <span>{formatDate(exp.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openEditModal(exp)}
                        className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 active:scale-95 transition-all"
                        title="Tahrirlash"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all"
                        title="O‘chirish"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Amount & Badges */}
                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-zinc-800/60">
                    <span className="font-extrabold text-orange-400 text-base sm:text-lg">
                      {formatUZS(exp.value)}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <Badge status={exp.category?.name || 'Xarajat'} />
                      {exp.branch?.name && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-300 px-2 py-0.5 rounded-lg bg-zinc-800 border border-zinc-700/60">
                          <Building2 size={12} className="text-zinc-400 shrink-0" />
                          <span className="truncate max-w-[90px]">{exp.branch.name}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Clerk & Receipt */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/40 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-400 truncate">
                      <User size={13} className="text-amber-400 shrink-0" />
                      <span className="text-zinc-300 font-medium truncate">
                        {exp.createdBy ? `${exp.createdBy.firstName} ${exp.createdBy.lastName}` : 'Kiritilmagan'}
                      </span>
                    </div>

                    {exp.receiptUrl && (
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptUrl(exp.receiptUrl || null)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 text-xs font-semibold shrink-0"
                      >
                        <Eye size={13} /> Chek
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block">
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
                  <tr key={exp.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-zinc-100">{exp.name}</td>
                    <td className="px-5 py-3.5 font-extrabold text-orange-400 text-base">
                      {formatUZS(exp.value)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={exp.category?.name || 'Xarajat'} />
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300">{exp.branch?.name}</td>
                    <td className="px-5 py-3.5 text-amber-300 font-semibold text-xs">
                      {exp.createdBy ? (
                        <div>
                          <span>
                            {exp.createdBy.firstName} {exp.createdBy.lastName}
                          </span>
                          <span className="block text-[11px] text-zinc-400 font-normal">
                            {exp.createdBy.role?.displayName || 'Clerk'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 italic">Kiritilmagan</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400">{formatDate(exp.date)}</td>
                    <td className="px-5 py-3.5">
                      {exp.receiptUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptUrl(exp.receiptUrl || null)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 text-xs font-semibold transition-colors"
                        >
                          <Eye size={14} /> Chekni ko‘rish
                        </button>
                      ) : (
                        <span className="text-zinc-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
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
            </div>
          </>
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

      <ReceiptImageModal
        isOpen={!!selectedReceiptUrl}
        receiptUrl={selectedReceiptUrl}
        onClose={() => setSelectedReceiptUrl(null)}
      />
    </div>
  );
};
