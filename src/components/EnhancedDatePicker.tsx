import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface EnhancedDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  maxDate?: string;
  minDate?: string;
  label?: string;
  className?: string;
  placeholder?: string;
}

export function EnhancedDatePicker({
  value,
  onChange,
  maxDate,
  minDate,
  label,
  className = '',
  placeholder = 'Select date'
}: EnhancedDatePickerProps) {
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  // Parse min and max years
  const minYear = minDate ? new Date(minDate).getFullYear() : 1900;
  const maxYear = maxDate ? new Date(maxDate).getFullYear() : new Date().getFullYear();
  
  // Generate array of years for selector
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  
  // Initialize selected year from value
  useEffect(() => {
    if (value) {
      setSelectedYear(new Date(value).getFullYear());
    }
  }, [value]);

  // Handle direct date input change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue) {
      setSelectedYear(new Date(newValue).getFullYear());
    }
  };

  // Handle year selection
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    
    // Update the date maintaining the same month and day
    if (value) {
      const currentDate = new Date(value);
      const newDate = new Date(currentDate);
      newDate.setFullYear(year);
      
      // Format the date as YYYY-MM-DD for the input
      const formattedDate = newDate.toISOString().split('T')[0];
      onChange(formattedDate);
    } else {
      // If no date is selected, set to January 1st of selected year
      const formattedDate = `${year}-01-01`;
      onChange(formattedDate);
    }
    
    setShowYearSelector(false);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm text-white/60 mb-2">{label}</label>
      )}
      
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={handleDateChange}
          min={minDate}
          max={maxDate}
          className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 [color-scheme:dark] ${className}`}
          placeholder={placeholder}
        />
        
        <button
          type="button"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          onClick={() => setShowYearSelector(!showYearSelector)}
          title="Select Year"
        >
          <Calendar className="w-5 h-5 text-white/70" />
        </button>
      </div>
      
      {showYearSelector && (
        <div className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto bg-black/90 border border-white/20 rounded-lg shadow-xl">
          <div className="p-2 sticky top-0 bg-black/90 border-b border-white/10">
            <input
              type="text"
              placeholder="Search year..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
              onChange={(e) => {
                const searchValue = e.target.value;
                // If input is numeric, auto-scroll to that year
                if (/^\d+$/.test(searchValue) && years.includes(Number(searchValue))) {
                  const yearElement = document.getElementById(`year-${searchValue}`);
                  if (yearElement) {
                    yearElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }
              }}
            />
          </div>
          <div className="p-2">
            {years.map(year => (
              <button
                key={year}
                id={`year-${year}`}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedYear === year 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => handleYearChange(year)}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}