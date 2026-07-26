import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
}

export const Input: React.FC<InputProps> = ({ label, helper, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-all ${className}`}
        {...props}
      />
      {helper && <span className="block text-xs text-amber-400 mt-1 font-medium">{helper}</span>}
    </div>
  );
};
