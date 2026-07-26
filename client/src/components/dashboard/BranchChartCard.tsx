import React from 'react';
import { Building2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { formatUZS } from '../../utils/format';

interface BranchChartCardProps {
  data: { id: string; name: string; total: number }[];
}

export const BranchChartCard: React.FC<BranchChartCardProps> = ({ data }) => {
  return (
    <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Building2 size={20} className="text-emerald-400" />
        <h3 className="text-base font-bold text-white">Filiallar Bo‘yicha Xarajat</h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
            <YAxis tickFormatter={(val) => `${Math.round(val / 1000)}k`} stroke="#64748b" />
            <Tooltip
              formatter={(val: any) => [formatUZS(val), 'Xarajat']}
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
            />
            <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
