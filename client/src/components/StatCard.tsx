import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatUZS } from '../utils/format';

interface StatCardProps {
  title: string;
  value: number;
  isCurrency?: boolean;
  subtext?: string;
  icon: LucideIcon;
  gradient?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  isCurrency = true,
  subtext,
  icon: Icon,
  color = '#6366f1',
}) => {
  return (
    <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '0.3rem', color: '#ffffff' }}>
          {isCurrency ? formatUZS(value) : value}
        </h3>
        {subtext && (
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
            {subtext}
          </p>
        )}
      </div>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '14px',
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={24} color={color} />
      </div>
    </div>
  );
};
