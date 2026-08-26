"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface CustomDropdownProps {
  label?: string;
  value: string | string[];
  options: string[];
  onChange: (value: any) => void;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  multiSelect?: boolean;
}

export default function CustomDropdown({ label, value, options, onChange, icon, fullWidth, multiSelect }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${fullWidth ? "w-full" : ""}`} ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-white border border-[var(--border)] rounded-lg px-3 py-1.5 shadow-sm hover:border-[var(--archyv-accent)]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 h-[38px] ${fullWidth ? "w-full justify-between" : ""}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {label && <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">{label}</span>}
          {icon && <span className="flex items-center justify-center shrink-0">{icon}</span>}
          <span className="text-sm font-medium text-foreground text-left truncate">
            {multiSelect && Array.isArray(value) 
              ? (value.length === 0 ? "Select..." : (value.length === options.length ? "All" : value.join(", "))) 
              : (value as string)}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 animate-in fade-in slide-in-from-top-2 duration-200 mt-2 bg-white border border-[var(--border)] rounded-xl shadow-lg overflow-hidden ${fullWidth ? "w-full left-0" : "left-0 sm:right-0 sm:left-auto min-w-[200px]"}`}>
          <div className="py-1 max-h-[300px] overflow-y-auto">
            {options.map((option) => {
              const isSelected = multiSelect && Array.isArray(value) ? value.includes(option) : value === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    if (multiSelect && Array.isArray(value)) {
                      const newValues = value.includes(option)
                        ? value.filter(v => v !== option)
                        : [...value, option];
                      onChange(newValues);
                    } else {
                      onChange(option);
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors ${
                    isSelected 
                      ? 'bg-orange-50/50 text-[var(--archyv-accent)] font-semibold' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-foreground'
                  }`}
                >
                  <span className="truncate pr-4">{option}</span>
                  {isSelected && <Check className="w-4 h-4 text-[var(--archyv-accent)] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
