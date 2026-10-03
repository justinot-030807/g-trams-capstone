import React, { useMemo, useState, useRef, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  X, Check, Sparkles, Clock, CalendarDays 
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Parse YYYY-MM-DD
  const parsedDate = useMemo(() => {
    if (!value || typeof value !== 'string') return null;
    const parts = value.split('-');
    if (parts.length >= 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2].substring(0, 2), 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }
    return null;
  }, [value]);

  // Current view month & year in calendar popup
  const [viewYear, setViewYear] = useState(() => parsedDate ? parsedDate.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parsedDate ? parsedDate.getMonth() : today.getMonth());

  // Update view when value changes from outside
  useEffect(() => {
    if (parsedDate) {
      setViewYear(parsedDate.getFullYear());
      setViewMonth(parsedDate.getMonth());
    }
  }, [parsedDate]);

  // Close calendar on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Generate Year List based on mode
  const yearOptions = useMemo(() => {
    const thisYear = today.getFullYear();
    const years = [];
    if (mode === 'issuance') {
      for (let y = thisYear + 1; y >= thisYear - 8; y--) {
        years.push(y);
      }
    } else if (mode === 'expiry') {
      for (let y = thisYear; y <= thisYear + 12; y++) {
        years.push(y);
      }
    } else {
      for (let y = thisYear + 10; y >= thisYear - 10; y--) {
        years.push(y);
      }
    }
    return years;
  }, [mode, today]);

  // Days in current view month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: viewMonth - 1,
        year: viewMonth === 0 ? viewYear - 1 : viewYear,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      days.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true
      });
    }

    // Next month padding to fill grid to multiple of 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      days.push({
        day: n,
        month: viewMonth + 1,
        year: viewMonth === 11 ? viewYear + 1 : viewYear,
        isCurrentMonth: false
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const emitDate = (y, m, d) => {
    if (!onChange) return;
    const finalYear = String(y);
    const finalMonth = String(m + 1).padStart(2, '0');
    const finalDay = String(d).padStart(2, '0');
    const isoString = `${finalYear}-${finalMonth}-${finalDay}`;
    onChange({ target: { name, value: isoString } });
  };

  const handleSelectDay = (cell) => {
    emitDate(cell.year, cell.month, cell.day);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange({ target: { name, value: '' } });
    }
  };

  const setToday = (e) => {
    e?.stopPropagation?.();
    const now = new Date();
    emitDate(now.getFullYear(), now.getMonth(), now.getDate());
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setIsOpen(false);
  };

  const addYears = (numYears, e) => {
    e?.stopPropagation?.();
    const baseDate = parsedDate || new Date();
    const targetDate = new Date(baseDate);
    targetDate.setFullYear(targetDate.getFullYear() + numYears);
    emitDate(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    setViewYear(targetDate.getFullYear());
    setViewMonth(targetDate.getMonth());
    setIsOpen(false);
  };

  const prevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  // Formatted display in input
  const formattedDisplay = useMemo(() => {
    if (!parsedDate) return '';
    return parsedDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }, [parsedDate]);

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      {/* Label & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
        {label && (
          <label className="block text-sm sm:text-base font-semibold text-[#1F1D1B] dark:text-[#EAE7E1]">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}

        {/* Quick Shortcut Buttons in Label Row */}
        <div className="flex items-center gap-1.5 ml-auto">
          {mode === 'issuance' && (
            <button
              type="button"
              onClick={setToday}
              disabled={disabled}
              className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F6F5F3] dark:bg-[#1C1917] hover:bg-[#EAE7E1] dark:hover:bg-[#252220] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] transition-colors flex items-center gap-1 cursor-pointer min-h-[28px]"
              title="Set to today's date"
            >
              <Sparkles size={11} className="text-[#9E2A2B] dark:text-[#D4AF37]" />
              <span>Today</span>
            </button>
          )}

          {mode === 'expiry' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => addYears(1, e)}
                disabled={disabled}
                className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F6F5F3] dark:bg-[#1C1917] hover:bg-[#EAE7E1] dark:hover:bg-[#252220] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] cursor-pointer min-h-[28px]"
                title="+1 Year from date"
              >
                +1 Year
              </button>
              <button
                type="button"
                onClick={(e) => addYears(3, e)}
                disabled={disabled}
                className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F6F5F3] dark:bg-[#1C1917] hover:bg-[#EAE7E1] dark:hover:bg-[#252220] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] cursor-pointer min-h-[28px]"
                title="+3 Years from date"
              >
                +3 Years
              </button>
              <button
                type="button"
                onClick={(e) => addYears(5, e)}
                disabled={disabled}
                className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#9E2A2B]/10 dark:bg-[#D4AF37]/15 hover:bg-[#9E2A2B]/20 text-[#9E2A2B] dark:text-[#D4AF37] border border-[#9E2A2B]/30 dark:border-[#D4AF37]/30 cursor-pointer min-h-[28px]"
                title="+5 Years (Standard Driver's License)"
              >
                +5 Years
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary Input Trigger */}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full py-2.5 px-3.5 text-left font-medium text-sm sm:text-base rounded-lg border bg-white dark:bg-[#1C1917] transition-all shadow-xs flex items-center justify-between min-h-[46px] cursor-pointer ${
            error 
              ? 'border-red-500 ring-1 ring-red-500' 
              : isOpen 
              ? 'border-[#9E2A2B] dark:border-[#D4AF37] ring-1 ring-[#9E2A2B] dark:ring-[#D4AF37]' 
              : 'border-[#E4E1DC] dark:border-[#2E2A27] hover:border-[#9E2A2B]/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <CalendarIcon 
              size={17} 
              className={value ? 'text-[#9E2A2B] dark:text-[#D4AF37] shrink-0' : 'text-[#6B6761] dark:text-[#A8A29E] shrink-0'} 
            />
            {formattedDisplay ? (
              <span className="text-[#1F1D1B] dark:text-[#EAE7E1] font-semibold truncate">
                {formattedDisplay}
              </span>
            ) : (
              <span className="text-[#6B6761] dark:text-[#A8A29E] text-sm">
                Select date (YYYY-MM-DD)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClear(e); }}
                className="w-6 h-6 rounded-md hover:bg-[#F6F5F3] dark:hover:bg-[#252220] text-[#6B6761] dark:text-[#A8A29E] hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Clear date"
              >
                <X size={14} />
              </span>
            )}
            <span className="text-xs text-[#6B6761] dark:text-[#A8A29E] font-mono">
              {value ? value : '📅'}
            </span>
          </div>
        </button>

        {/* Hidden native input for form compatibility */}
        <input 
          type="hidden" 
          name={name} 
          value={value || ''} 
          required={required} 
        />
      </div>

      {/* Popover Calendar Container */}
      {isOpen && (
        <div 
          className="absolute z-50 mt-1.5 left-0 sm:left-auto right-0 sm:right-auto w-full sm:w-[320px] max-w-[95vw] bg-white dark:bg-[#1C1917] rounded-lg border border-[#E4E1DC] dark:border-[#2E2A27] shadow-xl p-3.5 animate-in fade-in zoom-in-95 duration-150"
          style={{ minWidth: '290px' }}
        >
          {/* Calendar Header: Month & Year Selector + Arrows */}
          <div className="flex items-center justify-between gap-1 pb-3 mb-2 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg hover:bg-[#F6F5F3] dark:hover:bg-[#252220] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] flex items-center justify-center active:scale-95 transition-colors cursor-pointer shrink-0"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1.5 flex-1 justify-center">
              {/* Month Dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="text-xs sm:text-sm font-bold bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-md px-2 py-1 outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="text-xs sm:text-sm font-bold bg-[#F6F5F3] dark:bg-[#14110F] text-[#1F1D1B] dark:text-[#EAE7E1] border border-[#E4E1DC] dark:border-[#2E2A27] rounded-md px-2 py-1 outline-none cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg hover:bg-[#F6F5F3] dark:hover:bg-[#252220] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#EAE7E1] flex items-center justify-center active:scale-95 transition-colors cursor-pointer shrink-0"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_OF_WEEK.map((d, i) => (
              <span 
                key={d} 
                className={`text-[11px] font-bold uppercase tracking-wider py-1 ${
                  i === 0 || i === 6 ? 'text-red-500/80 dark:text-red-400/80' : 'text-[#6B6761] dark:text-[#A8A29E]'
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              const cellDateStr = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
              const isSelected = value === cellDateStr;
              const isToday = todayStr === cellDateStr;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(cell)}
                  className={`h-9 w-full rounded-md text-xs sm:text-sm font-semibold flex items-center justify-center transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-[#9E2A2B] text-white dark:bg-[#D4AF37] dark:text-[#14110F] font-bold shadow-xs scale-102'
                      : !cell.isCurrentMonth
                      ? 'text-[#6B6761]/40 dark:text-[#A8A29E]/30 hover:bg-[#F6F5F3] dark:hover:bg-[#252220]'
                      : 'text-[#1F1D1B] dark:text-[#EAE7E1] hover:bg-[#F6F5F3] dark:hover:bg-[#252220]'
                  } ${isToday && !isSelected ? 'ring-1 ring-[#9E2A2B] dark:ring-[#D4AF37] font-bold' : ''}`}
                >
                  <span>{cell.day}</span>
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#9E2A2B] dark:bg-[#D4AF37]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar Footer Actions */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#E4E1DC] dark:border-[#2E2A27]">
            <button
              type="button"
              onClick={setToday}
              className="text-xs font-semibold text-[#9E2A2B] dark:text-[#D4AF37] hover:underline cursor-pointer flex items-center gap-1"
            >
              <Sparkles size={12} />
              <span>Today</span>
            </button>

            <div className="flex items-center gap-2">
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-semibold text-[#6B6761] dark:text-[#A8A29E] hover:text-red-600 cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-md bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs font-bold text-[#1F1D1B] dark:text-[#EAE7E1] hover:bg-[#EAE7E1] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Helper text or Error */}
      {helperText && !error && (
        <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5">{helperText}</p>
      )}

      {error && (
        <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-0.5">{error}</p>
      )}
    </div>
  );
};

export default SimpleDatePicker;
