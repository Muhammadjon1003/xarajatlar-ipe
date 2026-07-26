import React from 'react';

interface CurrencyInputProps {
  label?: string;
  value: string | number;
  onChange: (rawNumericValue: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label = 'Summa (UZS)',
  value,
  onChange,
  placeholder = '1 500 000',
  required = false,
  className = '',
}) => {
  // Format raw number string with 3-digit space separation
  const formatDisplay = (val: string | number): string => {
    if (val === undefined || val === null || val === '') return '';
    const cleanDigits = val.toString().replace(/\D/g, '');
    if (!cleanDigits) return '';
    return cleanDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanDigits = rawVal.replace(/\D/g, '');
    onChange(cleanDigits);
  };

  const displayValue = formatDisplay(value);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="numeric"
          className={`w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl pl-4 pr-16 py-2.5 text-sm font-extrabold text-orange-400 placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-all ${className}`}
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
        />
        <span className="absolute right-3.5 text-xs font-bold text-zinc-500 pointer-events-none">
          UZS
        </span>
      </div>
    </div>
  );
};
