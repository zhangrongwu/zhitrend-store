import { useState } from 'react';
import { format, isAfter, isBefore, isEqual } from 'date-fns';
import { CalendarIcon } from '@heroicons/react/24/outline';
import DatePicker from './DatePicker';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (dates: { startDate: Date; endDate: Date }) => void;
  minDate?: Date;
  maxDate?: Date;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  const handleStartDateChange = (date: Date) => {
    if (isAfter(date, endDate)) {
      onChange({ startDate: date, endDate: date });
    } else {
      onChange({ startDate: date, endDate });
    }
    setIsStartOpen(false);
  };

  const handleEndDateChange = (date: Date) => {
    if (isBefore(date, startDate)) {
      onChange({ startDate: date, endDate: date });
    } else {
      onChange({ startDate, endDate: date });
    }
    setIsEndOpen(false);
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <button
          onClick={() => setIsStartOpen(!isStartOpen)}
          className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm"
        >
          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span>{format(startDate, 'yyyy年MM月dd日')}</span>
        </button>
        {isStartOpen && (
          <div className="absolute z-10 mt-1">
            <DatePicker
              value={startDate}
              onChange={handleStartDateChange}
              minDate={minDate}
              maxDate={endDate}
            />
          </div>
        )}
      </div>

      <span className="text-gray-500">至</span>

      <div className="relative">
        <button
          onClick={() => setIsEndOpen(!isEndOpen)}
          className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm"
        >
          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span>{format(endDate, 'yyyy年MM月dd日')}</span>
        </button>
        {isEndOpen && (
          <div className="absolute z-10 mt-1">
            <DatePicker
              value={endDate}
              onChange={handleEndDateChange}
              minDate={startDate}
              maxDate={maxDate}
            />
          </div>
        )}
      </div>
    </div>
  );
} 