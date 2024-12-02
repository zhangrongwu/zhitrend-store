import { useState, useRef, useEffect } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export default function DatePicker({ value, onChange, minDate, maxDate }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDateSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className="relative w-full cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          type="text"
          readOnly
          value={format(value, 'yyyy年MM月dd日', { locale: zhCN })}
          className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          <CalendarIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
          <div className="p-2">
            <div className="grid grid-cols-7 gap-1">
              {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500"
                >
                  {day}
                </div>
              ))}
              {/* Calendar grid */}
              {Array.from({ length: 42 }, (_, i) => {
                const date = new Date(
                  value.getFullYear(),
                  value.getMonth(),
                  1 - new Date(value.getFullYear(), value.getMonth(), 1).getDay() + i
                );
                const isCurrentMonth = date.getMonth() === value.getMonth();
                const isSelected = date.toDateString() === value.toDateString();
                const disabled = isDateDisabled(date);

                return (
                  <button
                    key={i}
                    onClick={() => !disabled && handleDateSelect(date)}
                    disabled={disabled}
                    className={`
                      p-2 text-sm rounded-md
                      ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                      ${isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'}
                      ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 