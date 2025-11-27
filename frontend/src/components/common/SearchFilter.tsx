import React from 'react';
import { HiSearch } from 'react-icons/hi';

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <div className="relative max-w-xs w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <HiSearch className="h-4 w-4 text-gray-400" aria-hidden="true" />
      </div>
      <input
        type="text"
        className="block w-full rounded border-gray-300 py-1.5 pl-9 text-gray-900 focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchFilter;

