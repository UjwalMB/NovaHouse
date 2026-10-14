import React from 'react';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterBarProps {
  options?: FilterOption[];
  activeValue?: string;
  activeFilter?: string;
  onChange?: (val: string) => void;
  onSelectFilter?: (val: string) => void;
  className?: string;
}

export default function FilterBar({
  options = [],
  activeValue,
  activeFilter,
  onChange,
  onSelectFilter,
  className = '',
}: FilterBarProps) {
  const currentActive = activeValue !== undefined ? activeValue : activeFilter;
  const handleChange = onChange || onSelectFilter || (() => {});

  return (
    <div className={`flex flex-wrap items-center gap-1.5 p-1 bg-[#ECE8E0] rounded-xs border border-[#E2DDD5] ${className}`}>
      {options.map((opt) => {
        const isActive = currentActive === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => handleChange(opt.value)}
            className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider rounded-xs transition-all ${
              isActive
                ? 'bg-[#111111] text-[#F4F1EB] font-medium shadow-xs'
                : 'bg-transparent text-[#55514B] hover:text-[#111111] hover:bg-[#FAF8F5]'
            }`}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={`ml-1.5 px-1 py-0.2 text-[9px] rounded-xs ${
                isActive ? 'bg-[#333333] text-[#F4F1EB]' : 'bg-[#D8D0C3] text-[#111111]'
              }`}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
