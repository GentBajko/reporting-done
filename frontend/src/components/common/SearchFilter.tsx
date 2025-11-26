import React from 'react';
import { HiSearch } from 'react-icons/hi';

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <div className="relative rounded-md shadow-sm max-w-xs w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <HiSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>
      <input
        type="text"
        className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchFilter;

