import React from 'react';
import { PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { formatUZS } from '../../utils/format';

interface CategoryChartCardProps {
  data: { id: string; name: string; total: number }[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e'];

export const CategoryChartCard: React.FC<CategoryChartCardProps> = ({ data }) => {
  return (
    <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <PieIcon size={20} className="text-indigo-400" />
        <h3 className="text-base font-bold text-white">Xarajat Kategoriyalari</h3>
      </div>
      {data.length === 0 ? (
        <div className="text-slate-500 text-center py-12 text-sm">
          Ushbu oyda hali xarajatlar mavjud emas
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
              <XAxis type="number" tickFormatter={(val) => `${Math.round(val / 1000)}k`} stroke="#64748b" />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" width={110} />
              <Tooltip
                formatter={(val: any) => [formatUZS(val), 'Summa']}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
              />
              <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
