import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
}

export const Input: React.FC<InputProps> = ({ label, helper, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all ${className}`}
        {...props}
      />
      {helper && <span className="block text-xs text-emerald-400 mt-1 font-medium">{helper}</span>}
    </div>
  );
};
