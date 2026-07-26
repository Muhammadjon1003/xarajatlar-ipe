import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatUZS } from '../../utils/format';

interface KPICardProps {
  title: string;
  value: number;
  isCurrency?: boolean;
  subtext?: string;
  icon: LucideIcon;
  iconColorClass?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  isCurrency = true,
  subtext,
  icon: Icon,
  iconColorClass = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
}) => {
  return (
    <div className="bg-slate-800/80 border border-slate-700/50 hover:border-indigo-500/40 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-slate-950/40 flex items-center justify-between">
      <div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <h3 className="text-xl font-extrabold text-white mt-1">
          {isCurrency ? formatUZS(value) : value}
        </h3>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl border ${iconColorClass}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};
