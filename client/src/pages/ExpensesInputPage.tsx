import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Branch, ExpenseCategory, Expense } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { Input } from '../components/common/Input';
import { CurrencyInput } from '../components/common/CurrencyInput';
import { CustomDatePicker } from '../components/common/CustomDatePicker';
import { Button } from '../components/common/Button';
import { FileInput } from '../components/common/FileInput';
import { TableWrapper } from '../components/common/TableWrapper';
import { ReceiptImageModal } from '../components/common/ReceiptImageModal';
import { formatUZS, formatDate } from '../utils/format';
import { PlusCircle, CheckCircle, Receipt, Eye, Calendar, Building2 } from 'lucide-react';

export const ExpensesInputPage: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [branchId, setBranchId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');

  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [recentEntries, setRecentEntries] = useState<Expense[]>([]);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Receipt Modal State
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [bRes, cRes, expRes] = await Promise.all([
        api.get('/branches'),
        api.get('/categories'),
        api.get('/expenses'),
      ]);
      setBranches(bRes.data);
      setCategories(cRes.data);
      setRecentEntries(expRes.data.slice(0, 5));

      if (bRes.data.length > 0) setBranchId(bRes.data[0].id);
      if (cRes.data.length > 0) setCategoryId(cRes.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    try {
      await api.post('/expenses', {
        name,
        value: Number(value),
        date,
        branchId,
        categoryId,
        createdById: user?.id || undefined,
        receiptUrl: receiptUrl || null,
      });

      setSuccessMsg(`"${name}" (${formatUZS(value)}) muvaffaqiyatli saqlandi!`);
      setName('');
      setValue('');
      setReceiptUrl('');
      fetchMetadata();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xarajatni saqlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Yangi Xarajat Kiritish"
        subtitle="Xarajat va to‘lov ma’lumotlarini kiritish va chek rasmini Firebase Storage ga yuklash"
      />

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle size={20} />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Input Form Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Xarajat Nomi *"
            placeholder="Masalan: Ofis uchun kantselyariya vositalari"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Live 3-digit space formatted currency input */}
            <CurrencyInput
              label="Summa (UZS) *"
              value={value}
              onChange={(val) => setValue(val)}
              placeholder="1 500 000"
              required
            />

            {/* Interactive Calendar Date Picker Modal */}
            <CustomDatePicker
              label="Sana *"
              value={date}
              onChange={(d) => setDate(d)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wide">
                Filial *
              </label>
              <select
                className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                required
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wide">
                Kategoriya *
              </label>
              <select
                className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-orange-500"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Firebase Storage File Upload */}
          <FileInput
            label="Chek / Kvitansiya Faylini Yuklash (Firebase Storage)"
            onUploadComplete={(url) => setReceiptUrl(url)}
          />

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            icon={<PlusCircle size={18} />}
            className="w-full py-3 text-base mt-2"
          >
            {loading ? 'Saqlanmoqda...' : 'Xarajatni Kiritish'}
          </Button>
        </form>
      </div>

      {/* Recent Entries */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2">
          <Receipt size={20} className="text-orange-400" />
          <h3 className="text-base font-bold text-white">So‘nggi Kiritilgan Xarajatlar</h3>
        </div>

        {recentEntries.length === 0 ? (
          <p className="text-zinc-500 text-sm">Hali xarajatlar kiritilmagan</p>
        ) : (
          <>
            {/* Mobile Cards (< md) */}
            <div className="md:hidden space-y-3">
              {recentEntries.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-[#141417] border border-zinc-800/90 rounded-2xl p-4 shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-extrabold text-zinc-100 text-sm leading-snug break-words">
                      {exp.name}
                    </h4>
                    <span className="font-extrabold text-orange-400 text-sm shrink-0">
                      {formatUZS(exp.value)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-zinc-800/60">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Calendar size={12} className="text-zinc-500" />
                      <span>{formatDate(exp.date)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {exp.category?.name && (
                        <span className="text-[11px] font-semibold text-orange-400/90 px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20">
                          {exp.category.name}
                        </span>
                      )}
                      {exp.branch?.name && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-300 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/60">
                          <Building2 size={11} className="text-zinc-400" />
                          <span className="truncate max-w-[90px]">{exp.branch.name}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {exp.receiptUrl && (
                    <div className="pt-1.5 border-t border-zinc-800/40">
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptUrl(exp.receiptUrl || null)}
                        className="inline-flex items-center gap-1.5 text-xs text-orange-400 font-semibold hover:underline"
                      >
                        <Eye size={13} /> Chek rasmini ko‘rish
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block">
              <TableWrapper headers={['Xarajat Nomi', 'Summa (UZS)', 'Filial', 'Kategoriya', 'Kiritgan Xodim', 'Chek', 'Sana']}>
                {recentEntries.map((exp) => (
                  <tr key={exp.id} className="hover:bg-zinc-800/40">
                    <td className="px-5 py-3 font-semibold text-zinc-100">{exp.name}</td>
                    <td className="px-5 py-3 font-bold text-orange-400">{formatUZS(exp.value)}</td>
                    <td className="px-5 py-3 text-zinc-300">{exp.branch?.name}</td>
                    <td className="px-5 py-3 text-zinc-300">{exp.category?.name}</td>
                    <td className="px-5 py-3 text-amber-300 font-medium text-xs">
                      {exp.createdBy
                        ? `${exp.createdBy.firstName} ${exp.createdBy.lastName}`
                        : user?.firstName ? `${user.firstName} ${user.lastName}` : 'Tizim'}
                    </td>
                    <td className="px-5 py-3">
                      {exp.receiptUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptUrl(exp.receiptUrl || null)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 text-xs font-semibold transition-colors"
                        >
                          <Eye size={13} /> Chekni ko‘rish
                        </button>
                      ) : (
                        <span className="text-zinc-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">{formatDate(exp.date)}</td>
                  </tr>
                ))}
              </TableWrapper>
            </div>
          </>
        )}
      </div>

      {/* Receipt Image Modal Viewer */}
      <ReceiptImageModal
        isOpen={!!selectedReceiptUrl}
        receiptUrl={selectedReceiptUrl}
        onClose={() => setSelectedReceiptUrl(null)}
      />
    </div>
  );
};
