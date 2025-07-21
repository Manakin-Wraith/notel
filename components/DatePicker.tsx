import React, { useState, useEffect, useRef, useMemo } from 'react';

interface DatePickerProps {
  initialDate: string | null;
  onSelect: (date: string) => void;
  onClose: () => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ initialDate, onSelect, onClose }) => {
  const [currentDate, setCurrentDate] = useState(initialDate ? new Date(initialDate) : new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const changeMonth = (amount: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grid: (Date | null)[] = [];
    // Fill leading empty cells
    for (let i = 0; i < firstDayOfMonth; i++) {
      grid.push(null);
    }
    // Fill days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push(new Date(year, month, i));
    }
    return grid;
  }, [currentDate]);

  const selectedDate = initialDate ? new Date(initialDate) : null;
  if(selectedDate) selectedDate.setHours(0,0,0,0); // Normalize for comparison

  return (
    <div
      ref={ref}
      className="absolute z-10 top-full mt-2 w-72 p-3 bg-black/50 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg"
      role="dialog"
      aria-label="Date selector"
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <button onClick={() => changeMonth(-1)} className="p-1 rounded-md hover:bg-white/10" aria-label="Previous month">
          &lt;
        </button>
        <span className="font-semibold text-sm text-gray-200">
          {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => changeMonth(1)} className="p-1 rounded-md hover:bg-white/10" aria-label="Next month">
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-gray-400">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day} className="py-1">{day}</div>)}
        {calendarGrid.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} />;
          
          const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
          const isToday = new Date().setHours(0,0,0,0) === date.getTime();

          let buttonClasses = "text-sm p-1.5 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-400";
          if (isSelected) {
            buttonClasses += " bg-purple-600 text-white font-semibold";
          } else if (isToday) {
            buttonClasses += " bg-white/20";
          } else {
            buttonClasses += " text-gray-300";
          }

          return (
            <div key={date.toISOString()} className="flex justify-center items-center">
              <button
                onClick={() => onSelect(date.toISOString())}
                className={buttonClasses}
                aria-label={`Select date ${date.toLocaleDateString()}`}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DatePicker;
