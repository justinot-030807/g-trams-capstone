import React, { useRef } from 'react';
import { Calendar, X } from 'lucide-react';

const SimpleDatePicker = ({
  name,
  value = '',
  onChange,
  label,
  required = false,
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
            ? 'border-2 border-red-500 bg-red-50/10 dark:bg-red-950/20' 
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
          className="w-full bg-transparent text-[#1F1D1B] dark:text-[#EAE7E1] font-medium text-sm sm:text-base border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 shadow-none ring-0 cursor-pointer placeholder-transparent !outline-none !ring-0 !border-0"
          style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
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

      {helperText && !error && (
        <p className="text-[11px] text-[#6B6761] dark:text-[#A8A29E]">
          {helperText}
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 font-semibold leading-relaxed">
          {error}
        </p>
      )}
    </div>
  );
};

export default React.memo(SimpleDatePicker);
