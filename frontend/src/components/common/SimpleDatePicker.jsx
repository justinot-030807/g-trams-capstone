import React, { useRef } from 'react';
import { Calendar, X, Sparkles } from 'lucide-react';

const SimpleDatePicker = ({
  name,
  value = '',
  onChange,
  label,
  required = false,
  mode = 'general', // 'issuance' | 'expiry' | 'general'
  helperText,
  disabled = false,
  error
}) => {
  const inputRef = useRef(null);

  // Normalize date to YYYY-MM-DD
  const cleanValue = (value && typeof value === 'string') ? value.substring(0, 10) : '';

  const handleNativeChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange({ target: { name, value: '' } });
    }
  };

  const setToday = (e) => {
    e.stopPropagation();
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (onChange) {
      onChange({ target: { name, value: iso } });
    }
  };

  const addYears = (numYears, e) => {
    e.stopPropagation();
    let base = new Date();
    if (cleanValue) {
      const parts = cleanValue.split('-');
      if (parts.length >= 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          base = new Date(y, m, d);
        }
      }
    }
    const target = new Date(base.getFullYear() + numYears, base.getMonth(), base.getDate());
    const iso = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
    if (onChange) {
      onChange({ target: { name, value: iso } });
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      {/* Label without red asterisk */}
      {label && (
        <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">
          {label}
        </label>
      )}

      {/* Input container */}
      <div 
        onClick={() => inputRef.current?.showPicker ? inputRef.current.showPicker() : inputRef.current?.focus()}
        className={`relative w-full rounded-lg border bg-white dark:bg-[#1C1917] flex items-center transition-all shadow-xs min-h-[48px] px-3.5 cursor-pointer ${
          error 
            ? 'border-red-500 ring-1 ring-red-500' 
            : 'border-[#E4E1DC] dark:border-[#2E2A27] hover:border-[#9E2A2B]/60 dark:hover:border-[#D4AF37]/60 focus-within:ring-2 focus-within:ring-[#9E2A2B] dark:focus-within:ring-[#D4AF37] focus-within:border-transparent'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-[#F6F5F3] dark:bg-[#14110F]' : ''}`}
      >
        <Calendar 
          size={18} 
          className={`shrink-0 mr-2.5 ${cleanValue ? 'text-[#9E2A2B] dark:text-[#D4AF37]' : 'text-[#6B6761] dark:text-[#A8A29E]'}`} 
        />

        <input
          ref={inputRef}
          type="date"
          name={name}
          value={cleanValue}
          onChange={handleNativeChange}
          disabled={disabled}
          required={required}
          className="w-full bg-transparent text-[#1F1D1B] dark:text-[#EAE7E1] font-medium text-sm sm:text-base outline-none cursor-pointer placeholder-transparent"
        />

        {cleanValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-md text-[#6B6761] dark:text-[#A8A29E] hover:text-red-600 hover:bg-[#F6F5F3] dark:hover:bg-[#252220] transition-colors shrink-0 ml-1.5 cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
            title="Clear date"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Quick Preset Buttons neatly placed below the input */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
        {mode === 'expiry' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] font-medium mr-0.5">Quick add:</span>
            <button
              type="button"
              onClick={(e) => addYears(1, e)}
              disabled={disabled}
              className="text-[11px] font-semibold px-2 py-1 rounded-md bg-[#F6F5F3] dark:bg-[#1C1917] hover:bg-[#EAE7E1] dark:hover:bg-[#252220] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] transition-all cursor-pointer min-h-[28px]"
            >
              +1 Year
            </button>
            <button
              type="button"
              onClick={(e) => addYears(3, e)}
              disabled={disabled}
              className="text-[11px] font-semibold px-2 py-1 rounded-md bg-[#F6F5F3] dark:bg-[#1C1917] hover:bg-[#EAE7E1] dark:hover:bg-[#252220] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] transition-all cursor-pointer min-h-[28px]"
            >
              +3 Years
            </button>
            <button
              type="button"
              onClick={(e) => addYears(5, e)}
              disabled={disabled}
              className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 hover:bg-[#9E2A2B]/20 text-[#9E2A2B] dark:text-[#D4AF37] border border-[#9E2A2B]/30 dark:border-[#D4AF37]/30 transition-all cursor-pointer min-h-[28px]"
            >
              +5 Years
            </button>
          </div>
        )}

        {mode === 'issuance' && (
          <button
            type="button"
            onClick={setToday}
            disabled={disabled}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[#F6F5F3] dark:bg-[#1C1917] hover:bg-[#EAE7E1] dark:hover:bg-[#252220] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] transition-all flex items-center gap-1 cursor-pointer min-h-[28px]"
          >
            <Sparkles size={11} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
            <span>Today</span>
          </button>
        )}

        {helperText && (
          <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E] ml-auto">
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
};

export default React.memo(SimpleDatePicker);
