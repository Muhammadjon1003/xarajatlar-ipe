import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ShieldCheck, Lock, UserCheck, KeyRound, CheckCircle2, Server } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminPanelPage: React.FC = () => {
  const { user } = useAuth();
  const [newUsername, setNewUsername] = useState('admin');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // System stats state
  const [stats, setStats] = useState<{ totalUsers: number; rolesCount: number } | null>(null);

  useEffect(() => {
    fetchSystemStats();
    if (user?.username) {
      setNewUsername(user.username);
    }
  }, [user]);

  const fetchSystemStats = async () => {
    try {
      const [empRes, roleRes] = await Promise.all([api.get('/employees'), api.get('/auth/roles')]);
      setStats({
        totalUsers: empRes.data.length,
        rolesCount: roleRes.data.length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('Parollar bir-biriga mos kelmadi');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/employees/${user?.id}`, {
        username: newUsername.trim(),
        phone: newUsername.trim(),
        password: newPassword || undefined,
      });
      setSuccessMsg('Direktor profil ma’lumotlari muvaffaqiyatli yangilandi');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Yangilashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Direktor Paneli (Admin Panel)"
        subtitle="Maxsus eksklyuziv boshqaruv, direktor xavfsizligi va tizim sozlamalari"
      />

      {/* System Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Tizim Darajasi</span>
            <h3 className="text-lg font-extrabold text-white mt-1">Super Admin</h3>
            <p className="text-[11px] text-zinc-400">To‘liq eksklyuziv huquq</p>
          </div>
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Ro‘yxatdan O‘tganlar</span>
            <h3 className="text-xl font-extrabold text-white mt-1">{stats?.totalUsers || 0} ta xodim</h3>
            <p className="text-[11px] text-zinc-400">Tizim foydalanuvchilari</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck size={22} />
          </div>
        </div>

        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Tizim Holati</span>
            <h3 className="text-lg font-extrabold text-amber-400 mt-1">Faol & Himoyalangan</h3>
            <p className="text-[11px] text-zinc-400">Database server faol</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Server size={22} />
          </div>
        </div>
      </div>

      {/* Super Admin Credential Management */}
      <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 shadow-md space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <KeyRound size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Direktor Login va Parolini Yangilash</h3>
            <p className="text-xs text-zinc-400">Tizimga kirish uchun yangi login yoki maxfiy parol o‘rnating</p>
          </div>
        </div>

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-300 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleUpdateCredentials} className="space-y-4">
          <Input
            label="Direktor Logini (Username) *"
            placeholder="admin"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Yangi Parol (O‘zgarmasa bo‘sh qoldiring)"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Yangi Parolni Tasdiqlang"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" disabled={loading} icon={<Lock size={16} />}>
              {loading ? 'Saqlanmoqda...' : 'Ma’lumotlarni Saqlash'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
