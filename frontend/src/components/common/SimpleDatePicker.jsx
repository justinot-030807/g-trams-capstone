import React, { useMemo, useState } from 'react';
import { Calendar, Check, Sparkles, ChevronDown } from 'lucide-react';

const MONTHS = [
  { value: '01', name: 'Enero (01)', label: 'January' },
  { value: '02', name: 'Pebrero (02)', label: 'February' },
  { value: '03', name: 'Marso (03)', label: 'March' },
  { value: '04', name: 'Abril (04)', label: 'April' },
  { value: '05', name: 'Mayo (05)', label: 'May' },
  { value: '06', name: 'Hunyo (06)', label: 'June' },
  { value: '07', name: 'Hulyo (07)', label: 'July' },
  { value: '08', name: 'Agosto (08)', label: 'August' },
  { value: '09', name: 'Setyembre (09)', label: 'September' },
  { value: '10', name: 'Oktubre (10)', label: 'October' },
  { value: '11', name: 'Nobyembre (11)', label: 'November' },
  { value: '12', name: 'Disyembre (12)', label: 'December' }
];

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
  const [useNative, setUseNative] = useState(false);

  // Parse YYYY-MM-DD
  const { currentYear, currentMonth, currentDay } = useMemo(() => {
    if (!value || typeof value !== 'string') {
      return { currentYear: '', currentMonth: '', currentDay: '' };
    }
    const parts = value.split('-');
    if (parts.length >= 3) {
      return {
        currentYear: parts[0] || '',
        currentMonth: parts[1] || '',
        currentDay: parts[2].substring(0, 2) || ''
      };
    }
    return { currentYear: '', currentMonth: '', currentDay: '' };
  }, [value]);

  const thisYear = new Date().getFullYear();

  // Generate Year List based on mode
  const yearOptions = useMemo(() => {
    const years = [];
    if (mode === 'issuance') {
      // Past 6 years up to next year
      for (let y = thisYear + 1; y >= thisYear - 6; y--) {
        years.push(y);
      }
    } else if (mode === 'expiry') {
      // Current year up to next 12 years
      for (let y = thisYear; y <= thisYear + 12; y++) {
        years.push(y);
      }
    } else {
      // General: past 10 years to future 10 years
      for (let y = thisYear + 10; y >= thisYear - 10; y--) {
        years.push(y);
      }
    }
    return years;
  }, [mode, thisYear]);

  // Compute number of days in selected month and year
  const daysInMonth = useMemo(() => {
    const y = parseInt(currentYear, 10) || thisYear;
    const m = parseInt(currentMonth, 10) || 1;
    return new Date(y, m, 0).getDate();
  }, [currentYear, currentMonth, thisYear]);

  const dayOptions = useMemo(() => {
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(String(d).padStart(2, '0'));
    }
    return days;
  }, [daysInMonth]);

  const emitDate = (y, m, d) => {
    if (!onChange) return;
    if (!y && !m && !d) {
      onChange({ target: { name, value: '' } });
      return;
    }
    // Auto-fill fallback for comfortable UX
    const finalYear = y || String(thisYear);
    const finalMonth = m || '01';
    let finalDay = d || '01';

    // Clamp day to valid range
    const maxD = new Date(parseInt(finalYear, 10), parseInt(finalMonth, 10), 0).getDate();
    if (parseInt(finalDay, 10) > maxD) {
      finalDay = String(maxD).padStart(2, '0');
    }

    const isoString = `${finalYear}-${finalMonth}-${finalDay}`;
    onChange({ target: { name, value: isoString } });
  };

  const handleMonthChange = (e) => {
    emitDate(currentYear || String(thisYear), e.target.value, currentDay || '01');
  };

  const handleDayChange = (e) => {
    emitDate(currentYear || String(thisYear), currentMonth || '01', e.target.value);
  };

  const handleYearChange = (e) => {
    emitDate(e.target.value, currentMonth || '01', currentDay || '01');
  };

  // Quick preset shortcuts
  const setToday = () => {
    const now = new Date();
    const y = String(now.getFullYear());
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    emitDate(y, m, d);
  };

  const addYears = (numYears) => {
    const baseDate = value ? new Date(value) : new Date();
    baseDate.setFullYear(baseDate.getFullYear() + numYears);
    const y = String(baseDate.getFullYear());
    const m = String(baseDate.getMonth() + 1).padStart(2, '0');
    const d = String(baseDate.getDate()).padStart(2, '0');
    emitDate(y, m, d);
  };

  // Human-readable formatted string
  const formattedDisplay = useMemo(() => {
    if (!value) return null;
    const parts = value.split('-');
    if (parts.length < 3) return null;
    const y = parts[0];
    const mIdx = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const monthObj = MONTHS[mIdx];
    if (!monthObj) return null;
    return `${monthObj.label} ${d}, ${y}`;
  }, [value]);

  const selectClasses = "w-full py-2 px-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#9E2A2B] dark:focus:ring-[#D4AF37] focus:border-transparent transition-all shadow-2xs disabled:opacity-50 cursor-pointer";

  return (
    <div className="space-y-1.5">
      {/* Label and Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        {label && (
          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          {mode === 'issuance' && (
            <button
              type="button"
              onClick={setToday}
              disabled={disabled}
              className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles size={11} />
              <span>Ngayong Araw</span>
            </button>
          )}

          {mode === 'expiry' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => addYears(1)}
                disabled={disabled}
                className="text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100 border border-amber-200 dark:border-amber-800/80 cursor-pointer"
                title="Dagdag 1 taon mula ngayon"
              >
                +1 Taon
              </button>
              <button
                type="button"
                onClick={() => addYears(3)}
                disabled={disabled}
                className="text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100 border border-amber-200 dark:border-amber-800/80 cursor-pointer"
                title="Dagdag 3 taon"
              >
                +3 Taon
              </button>
              <button
                type="button"
                onClick={() => addYears(5)}
                disabled={disabled}
                className="text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100 border border-amber-200 dark:border-amber-800/80 cursor-pointer"
                title="Dagdag 5 taon (Standard Driver's License)"
              >
                +5 Taon
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setUseNative(!useNative)}
            className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline ml-1 cursor-pointer"
            title="Lumipat sa calendar picker"
          >
            {useNative ? 'Dropdown' : 'Calendar'}
          </button>
        </div>
      </div>

      {useNative ? (
        <div className="relative">
          <input
            type="date"
            name={name}
            value={value || ''}
            onChange={onChange}
            disabled={disabled}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#9E2A2B] dark:focus:ring-[#D4AF37]"
          />
        </div>
      ) : (
        /* 3-Part Intuitive Dropdowns: Buwan (Month), Araw (Day), Taon (Year) */
        <div className="grid grid-cols-12 gap-1.5 sm:gap-2">
          {/* Month Selector */}
          <div className="col-span-5 sm:col-span-5 relative">
            <select
              value={currentMonth}
              onChange={handleMonthChange}
              disabled={disabled}
              className={selectClasses}
              aria-label="Pumili ng Buwan"
            >
              <option value="">Buwan (Month)</option>
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Day Selector */}
          <div className="col-span-3 sm:col-span-3 relative">
            <select
              value={currentDay}
              onChange={handleDayChange}
              disabled={disabled}
              className={selectClasses}
              aria-label="Pumili ng Araw"
            >
              <option value="">Araw</option>
              {dayOptions.map(d => (
                <option key={d} value={d}>
                  {parseInt(d, 10)}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="col-span-4 sm:col-span-4 relative">
            <select
              value={currentYear}
              onChange={handleYearChange}
              disabled={disabled}
              className={selectClasses}
              aria-label="Pumili ng Taon"
            >
              <option value="">Taon</option>
              {yearOptions.map(y => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Selected Date Confirmation Badge */}
      {formattedDisplay && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60 w-fit">
          <Calendar size={12} />
          <span>Piniling Petsa: {formattedDisplay}</span>
        </div>
      )}

      {helperText && !error && (
        <p className="text-[10px] text-slate-500 dark:text-slate-400">{helperText}</p>
      )}

      {error && (
        <p className="text-[10px] font-bold text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default SimpleDatePicker;
