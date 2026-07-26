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
  iconColorClass = 'text-orange-400 bg-orange-500/10 border-orange-500/20',
}) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
      <div>
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          {title}
        </span>
        <h3 className="text-xl font-extrabold text-white mt-1">
          {isCurrency ? formatUZS(value) : value}
        </h3>
        {subtext && <p className="text-xs text-zinc-500 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl border ${iconColorClass}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};
