'use client';

import React from 'react';

interface DurationOption {
  value: number;
  label: string;
  wordCount: number;
}

const durationOptions: DurationOption[] = [
  { value: 1, label: '1 Minute', wordCount: 180 },
  { value: 3, label: '3 Minutes', wordCount: 540 },
  { value: 5, label: '5 Minutes', wordCount: 900 },
  { value: 10, label: '10 Minutes', wordCount: 1800 }
];

interface DurationSelectorProps {
  duration: number;
  setDuration: (duration: number) => void;
  disabled?: boolean;
}

export const DurationSelector: React.FC<DurationSelectorProps> = ({ 
  duration, 
  setDuration,
  disabled = false
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-lg font-medium">
        Select script duration
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {durationOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setDuration(option.value)}
            disabled={disabled}
            className={`
              relative p-4 rounded-lg border transition-all
              ${duration === option.value 
                ? 'border-purple-500 bg-purple-900/30 text-white' 
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="text-center">
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-gray-400 mt-1">~{option.wordCount} words</div>
            </div>
            {duration === option.value && (
              <div className="absolute -top-2 -right-2 bg-purple-500 rounded-full w-4 h-4"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}; 