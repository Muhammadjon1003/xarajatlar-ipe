import React from 'react';
import { Building2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { formatUZS } from '../../utils/format';

interface BranchChartCardProps {
  data: { id: string; name: string; total: number }[];
}

export const BranchChartCard: React.FC<BranchChartCardProps> = ({ data }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Building2 size={20} className="text-yellow-400" />
        <h3 className="text-base font-bold text-white">Filiallar Bo‘yicha Xarajat</h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <XAxis dataKey="name" stroke="#a1a1aa" />
            <YAxis tickFormatter={(val) => `${Math.round(val / 1000)}k`} stroke="#71717a" />
            <Tooltip
              formatter={(val: any) => [formatUZS(val), 'Xarajat']}
              contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
            />
            <Bar dataKey="total" fill="#f97316" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
