import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthName } from '../../utils/format';

interface CustomDatePickerProps {
  label?: string;
  value: string; // ISO date format YYYY-MM-DD
  onChange: (isoDateString: string) => void;
  required?: boolean;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label = 'Sana',
  value,
  onChange,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-11

  const containerRef = useRef<HTMLDivElement>(null);

  // Close calendar popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const m = (viewMonth + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    const selected = `${viewYear}-${m}-${d}`;
    onChange(selected);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const iso = today.toISOString().split('T')[0];
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onChange(iso);
    setIsOpen(false);
  };

  // Format display text (e.g. 26 Iyul 2026)
  const formatFormattedText = (iso: string) => {
    if (!iso) return 'Sana tanlang';
    const [y, m, d] = iso.split('-');
    return `${parseInt(d)} ${getMonthName(parseInt(m))} ${y}`;
  };

  const selectedDateObj = value ? new Date(value) : null;

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}

      {/* Button to open calendar popover */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#0d0d0f] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 font-semibold hover:border-orange-500/50 transition-all text-left"
      >
        <span className="flex items-center gap-2.5">
          <CalendarIcon size={18} className="text-orange-400" />
          <span>{formatFormattedText(value)}</span>
        </span>
        <span className="text-xs text-zinc-500">Tanlash ▾</span>
      </button>

      {/* Calendar Modal Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 w-72 bg-[#141417] border border-zinc-800 rounded-2xl p-4 shadow-2xl animate-fadeIn">
          {/* Header Month / Year controls */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {getMonthName(viewMonth + 1)} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-zinc-500 mb-2">
            <span>Yak</span>
            <span>Dush</span>
            <span>Sesh</span>
            <span>Chors</span>
            <span>Pay</span>
            <span>Jum</span>
            <span>Shan</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Empty slots for month start offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <span key={`empty-${i}`} />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected =
                selectedDateObj &&
                selectedDateObj.getFullYear() === viewYear &&
                selectedDateObj.getMonth() === viewMonth &&
                selectedDateObj.getDate() === dayNum;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`py-1.5 rounded-lg font-semibold transition-all ${
                    isSelected
                      ? 'bg-orange-500 text-zinc-950 font-extrabold shadow-sm'
                      : 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Action */}
          <div className="pt-3 mt-3 border-t border-zinc-800 flex justify-between items-center">
            <button
              type="button"
              onClick={handleToday}
              className="text-xs font-bold text-orange-400 hover:underline"
            >
              Bugun (Today)
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
