import React from 'react';

interface FilterOption {
  id: string;
  label: string;
}

interface FilterProps {
  label?: string;
  placeholder?: string;
  options: FilterOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  className?: string;
}

export const Filter: React.FC<FilterProps> = ({
  label,
  placeholder = 'All',
  options,
  selectedValue,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label className="mb-1 text-sm font-medium text-divider">{label}</label>}
      <select
        value={selectedValue}
        onChange={(e) => onChange(e.target.value)}
        className="input p-2 bg-white border border-border rounded-md shadow-sm text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-button-blue focus:border-button-blue"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Filter;
