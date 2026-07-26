import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Branch, ExpenseCategory, Expense } from '../../types';
import { ModalWrapper } from '../common/ModalWrapper';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { FileInput } from '../common/FileInput';
import { formatUZS } from '../../utils/format';

interface ExpenseModalFormProps {
  isOpen: boolean;
  editingExpense: Expense | null;
  branches: Branch[];
  categories: ExpenseCategory[];
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}

export const ExpenseModalForm: React.FC<ExpenseModalFormProps> = ({
  isOpen,
  editingExpense,
  branches,
  categories,
  onClose,
  onSubmit,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [branchId, setBranchId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setName(editingExpense.name);
      setValue(editingExpense.value.toString());
      setDate(new Date(editingExpense.date).toISOString().split('T')[0]);
      setBranchId(editingExpense.branchId);
      setCategoryId(editingExpense.categoryId);
      setReceiptUrl(editingExpense.receiptUrl || '');
    } else {
      setName('');
      setValue('');
      setDate(new Date().toISOString().split('T')[0]);
      setReceiptUrl('');
      if (branches.length > 0) setBranchId(branches[0].id);
      if (categories.length > 0) setCategoryId(categories[0].id);
    }
  }, [editingExpense, isOpen, branches, categories]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        name,
        value: Number(value),
        date,
        branchId,
        categoryId,
        createdById: user?.id || undefined,
        receiptUrl: receiptUrl || null,
      });
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper
      title={editingExpense ? 'Xarajatni Tahrirlash' : 'Yangi Xarajat Qo‘shish'}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmitForm} className="space-y-4">
        <Input
          label="Xarajat Nomi *"
          placeholder="Masalan: Elektr energiyasi to‘lovi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Summa (UZS) *"
            type="number"
            placeholder="1500000"
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

        <div className="grid grid-cols-2 gap-4">
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
          existingUrl={receiptUrl}
          onUploadComplete={(url) => setReceiptUrl(url)}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>
            Bekor Qilish
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
};
