import React from 'react';
import { PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { formatUZS } from '../../utils/format';

interface CategoryChartCardProps {
  data: { id: string; name: string; total: number }[];
}

// 2nd and 3rd Color Palette: Orange, Yellow/Gold, and close warm shades
const WARM_COLORS = [
  '#f97316', // Orange
  '#facc15', // Yellow
  '#ea580c', // Dark Orange
  '#eab308', // Gold
  '#fb923c', // Light Orange
  '#d97706', // Amber
  '#fde047', // Light Yellow
];

export const CategoryChartCard: React.FC<CategoryChartCardProps> = ({ data }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <PieIcon size={20} className="text-orange-400" />
        <h3 className="text-base font-bold text-white">Xarajat Kategoriyalari</h3>
      </div>
      {data.length === 0 ? (
        <div className="text-zinc-500 text-center py-12 text-sm">
          Ushbu oyda hali xarajatlar mavjud emas
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
              <XAxis type="number" tickFormatter={(val) => `${Math.round(val / 1000)}k`} stroke="#71717a" />
              <YAxis type="category" dataKey="name" stroke="#a1a1aa" width={110} />
              <Tooltip
                formatter={(val: any) => [formatUZS(val), 'Summa']}
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
              />
              <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={WARM_COLORS[index % WARM_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
