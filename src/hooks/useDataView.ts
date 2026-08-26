import { useState, useMemo } from 'react';
import { useAppContext } from '@/store/AppContext';

export type SortOption = "Newest first" | "Oldest first" | "Name A-Z" | "Name Z-A";

export interface FilterOptions {
  domain?: string;
  department?: string;
  status?: string;
}

export function useDataView<T extends { date?: string; time?: string; name?: string; deletedDate?: string; domain?: string; department?: string; status?: string; uploadedBy?: string; year?: string }>(
  data: T[],
  initialSort: SortOption = "Newest first",
  itemsPerPage: number = 20
) {
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  
  const { globalSearchQuery } = useAppContext();
  const searchQuery = localSearchQuery || globalSearchQuery;
  const setSearchQuery = setLocalSearchQuery;

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name?.toLowerCase().includes(query);
        const matchesFilename = (item as any).filename?.toLowerCase().includes(query);
        const matchesDomain = item.domain?.toLowerCase().includes(query);
        const matchesDepartment = item.department?.toLowerCase().includes(query);
        const matchesUploader = item.uploadedBy?.toLowerCase().includes(query);
        const matchesYear = item.year?.toLowerCase().includes(query);
        
        if (!matchesName && !matchesFilename && !matchesDomain && !matchesDepartment && !matchesUploader && !matchesYear) {
          return false;
        }
      }
      
      // Filters
      if (filters.domain && item.domain !== filters.domain) return false;
      if (filters.department && item.department !== filters.department) return false;
      if (filters.status && item.status !== filters.status) return false;
      
      return true;
    });
  }, [data, searchQuery, filters]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (sortBy.includes("Newest") || sortBy.includes("Oldest")) {
        const dateAStr = a.deletedDate ? a.deletedDate : (a.date ? `${a.date} ${a.time || "12:00 AM"}` : "");
        const dateBStr = b.deletedDate ? b.deletedDate : (b.date ? `${b.date} ${b.time || "12:00 AM"}` : "");
        
        const dateA = new Date(dateAStr).getTime() || 0;
        const dateB = new Date(dateBStr).getTime() || 0;

        if (sortBy.includes("Newest")) {
          return dateB - dateA;
        } else {
          return dateA - dateB;
        }
      } else {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        
        if (sortBy.includes("A-Z") || sortBy.includes("A–Z")) {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      }
    });
  }, [filteredData, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  
  // Make sure current page is valid when data changes
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedData = sortedData.slice((validCurrentPage - 1) * itemsPerPage, validCurrentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return {
    sortBy,
    setSortBy,
    currentPage: validCurrentPage,
    totalPages,
    handlePageChange,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    paginatedData,
    filteredData,
    totalItems: sortedData.length
  };
}
