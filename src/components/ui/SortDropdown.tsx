"use client";

import { SortOption } from "@/hooks/useDataView";
import CustomDropdown from "./CustomDropdown";

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const options: SortOption[] = [
    "Newest first", 
    "Oldest first", 
    "Name A-Z", 
    "Name Z-A"
  ];

  return (
    <CustomDropdown 
      label="Sort by:"
      value={value}
      options={options}
      onChange={(val) => onChange(val as SortOption)}
    />
  );
}
