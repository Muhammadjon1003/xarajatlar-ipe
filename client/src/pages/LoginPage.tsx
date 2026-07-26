import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { TrendingDown, Lock, Phone, AlertCircle } from 'lucide-react';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [phone, setPhone] = useState('+998901234567');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { phone, password });
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Tizimga kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/60 via-slate-950 to-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-indigo-950/40">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 inline-flex items-center justify-center shadow-lg shadow-indigo-500/40 mb-3">
            <TrendingDown size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Xarajatlar & Oyliklar</h1>
          <p className="text-slate-400 text-xs mt-1">
            Tizimga kirish uchun ma’lumotlaringizni kiriting
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-300 text-sm flex items-center gap-2 mb-6">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Telefon Raqam"
            placeholder="+998901234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <Input
            label="Parol"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full py-3 text-base mt-2"
          >
            {loading ? 'Kirilmoqda...' : 'Tizimga Kirish'}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
          Super Admin: <span className="text-indigo-400 font-semibold">+998901234567</span> /{' '}
          <span className="text-indigo-400 font-semibold">admin123</span>
        </div>
      </div>
    </div>
  );
};
