import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { TrendingDown, AlertCircle } from 'lucide-react';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { login: loginInput, password });
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Tizimga kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#09090b] p-4">
      <div className="w-full max-w-md bg-[#141417] border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-orange-500 inline-flex items-center justify-center shadow-lg shadow-orange-500/20 mb-3">
            <TrendingDown size={30} className="text-zinc-950" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Xarajatlar & Oyliklar</h1>
          <p className="text-zinc-400 text-xs mt-1">
            Tizimga kirish uchun login va parolingizni kiriting
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-300 text-xs flex items-center gap-2 mb-6 font-semibold">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Login / Foydalanuvchi Nomi *"
            placeholder="Login"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            required
          />

          <Input
            label="Parol *"
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
            className="w-full py-3 text-sm font-bold mt-2"
          >
            {loading ? 'Kirilmoqda...' : 'Tizimga Kirish'}
          </Button>
        </form>
      </div>
    </div>
  );
};
