import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Branch, ExpenseCategory, Expense } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { FileInput } from '../components/common/FileInput';
import { TableWrapper } from '../components/common/TableWrapper';
import { formatUZS, formatDate } from '../utils/format';
import { PlusCircle, CheckCircle, Receipt, ExternalLink } from 'lucide-react';

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
        createdById: user?.id || undefined, // Automatically attach currently logged in clerk
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

      {/* Input Form Card - Clean Non-Glowing UI */}
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
            <Input
              label="Summa (UZS) *"
              type="number"
              placeholder="1200000"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              helper={value ? formatUZS(value) : undefined}
              required
            />

            <Input
              label="Sana *"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wide">
                Filial *
              </label>
              <select
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
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
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2">
          <Receipt size={20} className="text-indigo-400" />
          <h3 className="text-base font-bold text-white">So‘nggi Kiritilgan Xarajatlar</h3>
        </div>

        {recentEntries.length === 0 ? (
          <p className="text-zinc-500 text-sm">Hali xarajatlar kiritilmagan</p>
        ) : (
          <TableWrapper headers={['Xarajat Nomi', 'Summa (UZS)', 'Filial', 'Kategoriya', 'Kiritgan Xodim', 'Chek', 'Sana']}>
            {recentEntries.map((exp) => (
              <tr key={exp.id} className="hover:bg-zinc-800/40">
                <td className="px-5 py-3 font-semibold text-zinc-100">{exp.name}</td>
                <td className="px-5 py-3 font-bold text-rose-400">{formatUZS(exp.value)}</td>
                <td className="px-5 py-3 text-zinc-300">{exp.branch?.name}</td>
                <td className="px-5 py-3 text-zinc-300">{exp.category?.name}</td>
                <td className="px-5 py-3 text-indigo-300 font-medium">
                  {exp.createdBy
                    ? `${exp.createdBy.firstName} ${exp.createdBy.lastName}`
                    : user?.firstName ? `${user.firstName} ${user.lastName}` : 'Tizim'}
                </td>
                <td className="px-5 py-3">
                  {exp.receiptUrl ? (
                    <a
                      href={exp.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-400 hover:underline text-xs"
                    >
                      <ExternalLink size={13} /> Chek
                    </a>
                  ) : (
                    <span className="text-zinc-600 text-xs">-</span>
                  )}
                </td>
                <td className="px-5 py-3 text-zinc-400">{formatDate(exp.date)}</td>
              </tr>
            ))}
          </TableWrapper>
        )}
      </div>
    </div>
  );
};
