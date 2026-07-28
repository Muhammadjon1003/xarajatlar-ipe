import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { CurrencyInput } from '../components/common/CurrencyInput';
import { Button } from '../components/common/Button';
import { Save, Tag, ShieldAlert } from 'lucide-react';

export const PriceSettingsPage: React.FC = () => {
  const [zamenaPrice, setZamenaPrice] = useState<string>('250000');
  const [adminBaseSalary, setAdminBaseSalary] = useState<string>('5000000');
  const [adminAktivPrice, setAdminAktivPrice] = useState<string>('50000');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', {
        zamenaPrice: Number(zamenaPrice.replace(/\D/g, '') || 0),
        adminBaseSalary: Number(adminBaseSalary.replace(/\D/g, '') || 0),
        adminAktivPrice: Number(adminAktivPrice.replace(/\D/g, '') || 0),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Sozlamalarni saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Narx Sozlamalari"
        subtitle="Zamena narxi, Administrator baza maoshi va har bir aktiv o‘quvchi uchun to‘lov miqdorlarini boshqarish"
      />

      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-md space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Tag size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Standart Tariflar va Qiymatlar</h3>
            <p className="text-xs text-zinc-400">
              Bu qiymatlar zamena qo‘shishda va administrator oyligini hisoblashda avtomatik to‘ldiriladi
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-zinc-500 text-xs font-semibold">
            Sozlamalar yuklanmoqda...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Zamena Narxi */}
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
                  Bir martalik zamena yozilganda birlamchi qiymat sifatida taklif etiladi
                </p>
              </div>

              {/* Card 2: Administrator Baza Maoshi */}
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
                  Administrator maoshini hisoblash modalida baza oyligi o‘rnida avto-to‘ldiriladi
                </p>
              </div>

              {/* Card 3: Bir Aktiv Narxi */}
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
                  Har bir kelgan/ro‘yxatdan o‘tgan aktiv o‘quvchi uchun administratorga to‘lanadigan ustama
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              {saved ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                  ✓ Sozlamalar muvaffaqiyatli saqlandi!
                </div>
              ) : (
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <ShieldAlert size={14} className="text-amber-400" />
                  O‘zgarishlar darhol butun tizimga tatbiq etiladi
                </span>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                icon={<Save size={16} />}
              >
                {saving ? 'Saqlanmoqda...' : 'Sozlamalarni Saqlash'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
