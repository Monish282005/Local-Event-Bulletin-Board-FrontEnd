import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

export default function CustomDateTimePicker({
  value,
  onChange,
  minDate = new Date(),
  placeholder = 'Select Date & Time *',
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial value or default to current date/time
  const parseInitialValue = () => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    const defaultDate = new Date(Date.now() + 3600000); // 1 hour in future
    return defaultDate;
  };

  const initialParsed = parseInitialValue();

  const [currentViewMonth, setCurrentViewMonth] = useState(initialParsed.getMonth());
  const [currentViewYear, setCurrentViewYear] = useState(initialParsed.getFullYear());

  const [selectedDay, setSelectedDay] = useState(initialParsed.getDate());
  const [selectedMonth, setSelectedMonth] = useState(initialParsed.getMonth());
  const [selectedYear, setSelectedYear] = useState(initialParsed.getFullYear());

  let rawHours = initialParsed.getHours();
  const initialAmPm = rawHours >= 12 ? 'PM' : 'AM';
  let initial12Hour = rawHours % 12;
  if (initial12Hour === 0) initial12Hour = 12;

  const [selectedHour, setSelectedHour] = useState(initial12Hour);
  const [selectedMinute, setSelectedMinute] = useState(
    String(Math.floor(initialParsed.getMinutes() / 5) * 5).padStart(2, '0')
  );
  const [selectedAmPm, setSelectedAmPm] = useState(initialAmPm);

  const [dateChosen, setDateChosen] = useState(!!value);
  const [timeChosen, setTimeChosen] = useState(!!value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync internal state when value prop changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedYear(d.getFullYear());
        setSelectedMonth(d.getMonth());
        setSelectedDay(d.getDate());
        setCurrentViewYear(d.getFullYear());
        setCurrentViewMonth(d.getMonth());

        let h = d.getHours();
        const ampm = h >= 12 ? 'PM' : 'AM';
        let h12 = h % 12;
        if (h12 === 0) h12 = 12;
        setSelectedHour(h12);
        setSelectedMinute(String(d.getMinutes()).padStart(2, '0'));
        setSelectedAmPm(ampm);
        setDateChosen(true);
        setTimeChosen(true);
      }
    }
  }, [value]);

  const commitSelection = (year, month, day, hour12, minuteStr, ampmStr) => {
    let h24 = parseInt(hour12, 10);
    if (ampmStr === 'PM' && h24 < 12) h24 += 12;
    if (ampmStr === 'AM' && h24 === 12) h24 = 0;

    const pad = (n) => String(n).padStart(2, '0');
    // Format YYYY-MM-DDTHH:mm for datetime-local state
    const formattedIso = `${year}-${pad(month + 1)}-${pad(day)}T${pad(h24)}:${pad(minuteStr)}`;
    onChange(formattedIso);
  };

  const handleDateClick = (dayNum) => {
    setSelectedDay(dayNum);
    setSelectedMonth(currentViewMonth);
    setSelectedYear(currentViewYear);
    setDateChosen(true);

    // Commit immediately
    commitSelection(currentViewYear, currentViewMonth, dayNum, selectedHour, selectedMinute, selectedAmPm);

    // If time was already chosen or user just selected date, close automatically if both are selected
    if (timeChosen) {
      setTimeout(() => setIsOpen(false), 150);
    }
  };

  const handleTimeSelect = (hour, minute, ampm) => {
    const newHour = hour !== undefined ? hour : selectedHour;
    const newMin = minute !== undefined ? minute : selectedMinute;
    const newAmPm = ampm !== undefined ? ampm : selectedAmPm;

    setSelectedHour(newHour);
    setSelectedMinute(newMin);
    setSelectedAmPm(newAmPm);
    setTimeChosen(true);

    commitSelection(selectedYear, selectedMonth, selectedDay, newHour, newMin, newAmPm);

    // Auto-close if date was already chosen
    if (dateChosen) {
      setTimeout(() => setIsOpen(false), 150);
    }
  };

  // Calendar generation helpers
  const daysInMonth = new Date(currentViewYear, currentViewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentViewYear, currentViewMonth, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentViewMonth === 0) {
      setCurrentViewMonth(11);
      setCurrentViewYear((prev) => prev - 1);
    } else {
      setCurrentViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentViewMonth === 11) {
      setCurrentViewMonth(0);
      setCurrentViewYear((prev) => prev + 1);
    } else {
      setCurrentViewMonth((prev) => prev + 1);
    }
  };

  // Format display text in trigger button
  const getDisplayText = () => {
    if (!value) return placeholder;
    const d = new Date(value);
    if (isNaN(d.getTime())) return placeholder;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
  const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  const minDateTime = minDate instanceof Date ? minDate : new Date(minDate);

  return (
    <div className="relative font-sans" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#0F172A] rounded-xl px-2.5 py-2 text-[11px] sm:text-xs text-[#0F172A] font-bold flex items-center justify-between transition shadow-2xs cursor-pointer focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <CalendarIcon className="w-3.5 h-3.5 text-[#0F172A] flex-shrink-0" />
          <span className={`truncate ${value ? 'text-[#0F172A] font-extrabold' : 'text-[#64748B]'}`}>
            {getDisplayText()}
          </span>
        </div>
        <Clock className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0 ml-1" />
      </button>

      {/* Popover Dropdown Picker */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-[9999] bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl p-4 sm:p-5 w-[320px] sm:w-[350px] animate-in fade-in zoom-in-95 duration-150 text-[#0F172A]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
              <span>📅</span>
              <span>Select Date & Time</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] flex items-center justify-center text-xs font-bold transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Calendar View Controls */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#0F172A] transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-[#0F172A]">
              {monthNames[currentViewMonth]} {currentViewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#0F172A] transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Grid Header (Sun - Sat) */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <span key={day} className="text-[10px] font-extrabold text-[#64748B] uppercase">
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Month Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-4">
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <span key={`empty-${i}`} className="w-8 h-8" />
            ))}

            {/* Month Day buttons */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const thisDate = new Date(currentViewYear, currentViewMonth, dayNum, 23, 59, 59);
              const isDisabled = thisDate < minDateTime;

              const isSelected =
                selectedDay === dayNum &&
                selectedMonth === currentViewMonth &&
                selectedYear === currentViewYear;

              return (
                <button
                  key={dayNum}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDateClick(dayNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center mx-auto cursor-pointer ${
                    isSelected
                      ? 'bg-[#0F172A] text-white shadow-md font-black scale-105'
                      : isDisabled
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'hover:bg-[#F1F5F9] text-[#0F172A]'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Time Picker Section */}
          <div className="pt-3 border-t border-[#E2E8F0] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#0F172A]" />
                <span>Select Time</span>
              </span>
              <div className="flex items-center gap-1 bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => handleTimeSelect(undefined, undefined, 'AM')}
                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md transition cursor-pointer ${
                    selectedAmPm === 'AM'
                      ? 'bg-[#0F172A] text-white shadow-2xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeSelect(undefined, undefined, 'PM')}
                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md transition cursor-pointer ${
                    selectedAmPm === 'PM'
                      ? 'bg-[#0F172A] text-white shadow-2xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Hour & Minute Selection Pill Rows */}
            <div className="grid grid-cols-2 gap-2">
              {/* Hours Dropdown / Selector */}
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] mb-1">Hour</label>
                <select
                  value={selectedHour}
                  onChange={(e) => handleTimeSelect(parseInt(e.target.value, 10), undefined, undefined)}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl px-2.5 py-1.5 text-xs text-[#0F172A] font-bold focus:outline-none focus:border-[#0F172A]"
                >
                  {hoursList.map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minutes Dropdown / Selector */}
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] mb-1">Minute</label>
                <select
                  value={selectedMinute}
                  onChange={(e) => handleTimeSelect(undefined, e.target.value, undefined)}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl px-2.5 py-1.5 text-xs text-[#0F172A] font-bold focus:outline-none focus:border-[#0F172A]"
                >
                  {minutesList.map((m) => (
                    <option key={m} value={m}>
                      :{m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Confirm & Close Button */}
          <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done Selecting</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
