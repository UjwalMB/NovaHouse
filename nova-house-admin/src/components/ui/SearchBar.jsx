import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search by name, ID, or keywords...',
  className = '',
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        size={15}
        className="absolute left-3.5 text-[#77736C] pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          if (typeof onChange === 'function') {
            onChange(e.target.value);
          }
        }}
        placeholder={placeholder}
        className="form-input !pl-10 !pr-9 text-xs"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 text-[#9E9990] hover:text-[#111111]"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
