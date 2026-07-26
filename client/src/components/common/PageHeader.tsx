import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">{title}</h1>
        <p className="text-sm text-zinc-400 mt-1 font-medium">{subtitle}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
