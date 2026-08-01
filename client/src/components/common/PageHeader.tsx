import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{title}</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">{subtitle}</p>
      </div>
      {action && <div className="w-full sm:w-auto flex justify-start sm:justify-end">{action}</div>}
    </div>
  );
};
