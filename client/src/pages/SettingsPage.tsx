import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Branch, ExpenseCategory } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { CurrencyInput } from '../components/common/CurrencyInput';
import { Button } from '../components/common/Button';
import { BranchTable } from '../components/branches/BranchTable';
import { BranchModalForm } from '../components/branches/BranchModalForm';
import { CategoryTable } from '../components/branches/CategoryTable';
import { CategoryModalForm } from '../components/branches/CategoryModalForm';
import { Tag, Building2, FolderKanban, Save, ShieldAlert, Plus, Settings } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'prices' | 'branches' | 'categories'>('prices');

  // Price Settings State
  const [zamenaPrice, setZamenaPrice] = useState<string>('250000');
  const [adminBaseSalary, setAdminBaseSalary] = useState<string>('5000000');
  const [adminAktivPrice, setAdminAktivPrice] = useState<string>('50000');
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceSaved, setPriceSaved] = useState(false);

  // Branches & Categories State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [bcLoading, setBcLoading] = useState(true);

  const [branchModal, setBranchModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchBranchesAndCategories();
  }, []);

  const fetchSettings = async () => {
    setPriceLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.data) {
        setZamenaPrice(res.data.zamenaPrice ? res.data.zamenaPrice.toString() : '250000');
        setAdminBaseSalary(res.data.adminBaseSalary ? res.data.adminBaseSalary.toString() : '5000000');
        setAdminAktivPrice(res.data.adminAktivPrice ? res.data.adminAktivPrice.toString() : '50000');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setPriceLoading(false);
    }
  };

  const fetchBranchesAndCategories = async () => {
    setBcLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([api.get('/branches'), api.get('/categories')]);
      setBranches(bRes.data);
      setCategories(cRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setBcLoading(false);
    }
  };

  const handleSavePrices = async (e: React.FormEvent) => {
    e.preventDefault();
    setPriceSaving(true);
    try {
      await api.put('/settings', {
        zamenaPrice: Number(zamenaPrice.replace(/\D/g, '') || 0),
        adminBaseSalary: Number(adminBaseSalary.replace(/\D/g, '') || 0),
        adminAktivPrice: Number(adminAktivPrice.replace(/\D/g, '') || 0),
      });
      setPriceSaved(true);
      setTimeout(() => setPriceSaved(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Sozlamalarni saqlashda xatolik');
    } finally {
      setPriceSaving(false);
    }
  };

  const handleCreateBranch = async (name: string) => {
    await api.post('/branches', { name });
    fetchBranchesAndCategories();
  };

  const handleDeleteBranch = async (id: string) => {
    if (!window.confirm('Filialni o‘chirmoqchimisiz?')) return;
    try {
      await api.delete(`/branches/${id}`);
      fetchBranchesAndCategories();
    } catch (err: any) {
      alert(err.response?.data?.error || 'O‘chirishda xatolik');
    }
  };

  const handleCreateCategory = async (name: string, description: string) => {
    await api.post('/categories', { name, description });
    fetchBranchesAndCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Kategoriyani o‘chirmoqchimisiz?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchBranchesAndCategories();
    } catch (err: any) {
      alert(err.response?.data?.error || 'O‘chirishda xatolik');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Tizim Sozlamalari"
        subtitle="Tarif narxlari, filiallar va xarajat kategoriyalarini yagona bo‘limda boshqarish"
      />

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 bg-[#141417] p-1.5 rounded-2xl border border-zinc-800">
        <button
          onClick={() => setActiveSubTab('prices')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'prices'
              ? 'bg-orange-500 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Tag size={16} />
          <span>Narx Tariflari Sozlamasi</span>
        </button>

        <button
          onClick={() => setActiveSubTab('branches')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'branches'
              ? 'bg-orange-500 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Building2 size={16} />
          <span>Filiallar ({branches.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'categories'
              ? 'bg-orange-500 text-zinc-950 shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <FolderKanban size={16} />
          <span>Xarajat Kategoriyalari ({categories.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: Price Settings */}
      {activeSubTab === 'prices' && (
        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-md space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Tag size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Standart Tariflar va Qiymatlar</h3>
              <p className="text-xs text-zinc-400">
                Bu qiymatlar zamena yozishda va administrator oyligini hisoblashda avtomatik to‘ldiriladi
              </p>
            </div>
          </div>

          {priceLoading ? (
            <div className="py-8 text-center text-zinc-500 text-xs font-semibold">
              Sozlamalar yuklanmoqda...
            </div>
          ) : (
            <form onSubmit={handleSavePrices} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-[#0d0d0f] border border-zinc-800/80 rounded-xl p-4 space-y-3">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">
                    Zamena Narxi (Standart)
                  </span>
                  <CurrencyInput
                    label="1 Zamena Qiymati (UZS)"
                    value={zamenaPrice}
                    onChange={(val) => setZamenaPrice(val)}
                    placeholder="250 000"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Bir martalik zamena yozilganda birlamchi qiymat sifatida ishlatiladi
                  </p>
                </div>

                <div className="bg-[#0d0d0f] border border-zinc-800/80 rounded-xl p-4 space-y-3">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    Admin Baza Maoshi
                  </span>
                  <CurrencyInput
                    label="Standart Baza Maoshi (UZS)"
                    value={adminBaseSalary}
                    onChange={(val) => setAdminBaseSalary(val)}
                    placeholder="5 000 000"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Administrator maoshini hisoblash modalida baza oyligi sifatida to‘ldiriladi
                  </p>
                </div>

                <div className="bg-[#0d0d0f] border border-zinc-800/80 rounded-xl p-4 space-y-3">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                    Bir Aktiv Narxi
                  </span>
                  <CurrencyInput
                    label="1 Aktiv O‘quvchi Narxi (UZS)"
                    value={adminAktivPrice}
                    onChange={(val) => setAdminAktivPrice(val)}
                    placeholder="50 000"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Administrator jalb qilgan har bir aktiv o‘quvchi uchun beriladigan ustama
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                {priceSaved ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                    ✓ Tariflar muvaffaqiyatli saqlandi!
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <ShieldAlert size={14} className="text-amber-400" />
                    O‘zgarishlar butun tizimga tatbiq etiladi
                  </span>
                )}

                <Button type="submit" variant="primary" disabled={priceSaving} icon={<Save size={16} />}>
                  {priceSaving ? 'Saqlanmoqda...' : 'Tariflarni Saqlash'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* SUB-TAB 2: Branches */}
      {activeSubTab === 'branches' && (
        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Filiallar Ro‘yxati</h3>
                <p className="text-xs text-zinc-400">Tizimdagi barcha mavjud filiallarni boshqarish</p>
              </div>
            </div>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setBranchModal(true)}>
              Yangi Filial Qo‘shish
            </Button>
          </div>

          <BranchTable branches={branches} loading={bcLoading} onDelete={handleDeleteBranch} />
        </div>
      )}

      {/* SUB-TAB 3: Categories */}
      {activeSubTab === 'categories' && (
        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <FolderKanban size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xarajat Kategoriyalari</h3>
                <p className="text-xs text-zinc-400">Chiqimlar va xarajat turlarini guruhlash sozlamalari</p>
              </div>
            </div>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCategoryModal(true)}>
              Yangi Kategoriya Qo‘shish
            </Button>
          </div>

          <CategoryTable categories={categories} loading={bcLoading} onDelete={handleDeleteCategory} />
        </div>
      )}

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
