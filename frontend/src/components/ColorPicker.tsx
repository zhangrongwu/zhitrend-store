import { useState, useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useClickAway } from 'react-use';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popover = useRef<HTMLDivElement>(null);

  useClickAway(popover, () => setIsOpen(false));

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full h-10 rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <div className="flex items-center">
            <div
              className="w-6 h-6 rounded-md border border-gray-200"
              style={{ backgroundColor: color }}
            />
            <span className="ml-2 text-sm text-gray-700">{color}</span>
          </div>
        </button>

        {isOpen && (
          <div
            ref={popover}
            className="absolute z-10 mt-2 bg-white rounded-lg shadow-lg p-3"
          >
            <HexColorPicker color={color} onChange={onChange} />
            <div className="mt-2">
              <input
                type="text"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 