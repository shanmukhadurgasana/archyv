
import { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/store/AppContext';

export type SortOption = "Newest first" | "Oldest first" | "Name A-Z" | "Name Z-A";

export interface FilterOptions {
  domain?: string;
  department?: string;
  status?: string;
}

export function useDataView<T extends { date?: string; time?: string; name?: string; deletedDate?: string; domain?: string; department?: string; status?: string; uploadedBy?: string; year?: string }>(
  data: T[], // This is no longer used for local slicing if serverFetch is enabled
  initialSort: SortOption = "Newest first",
  itemsPerPage: number = 10,
  serverFetchParams?: { isDeleted?: boolean; status?: string; isStarred?: boolean; } // If provided, server-side fetching is enabled
) {
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  
  const { globalSearchQuery, fetchDocuments, fetchTrashDocuments, documents, trashDocuments, paginationData, trashPaginationData } = useAppContext();
  const searchQuery = localSearchQuery || globalSearchQuery;
  const setSearchQuery = setLocalSearchQuery;

  // If serverFetchParams is provided, fetch data from backend when dependencies change
  const serverFetchParamsStr = serverFetchParams ? JSON.stringify(serverFetchParams) : null;
  useEffect(() => {
    if (serverFetchParams) {
      const timer = setTimeout(() => {
        const fetchMethod = serverFetchParams.isDeleted ? fetchTrashDocuments : fetchDocuments;
        fetchMethod({
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery,
          sortBy,
          domain: filters.domain,
          department: filters.department,
          status: filters.status || serverFetchParams.status,
          isDeleted: serverFetchParams.isDeleted,
          isStarred: serverFetchParams.isStarred,
        });
      }, 300); // Debounce search
      return () => clearTimeout(timer);
    }
  }, [serverFetchParamsStr, currentPage, itemsPerPage, searchQuery, sortBy, filters.domain, filters.department, filters.status]);

  // If serverFetchParams is present, use global documents. Otherwise, fallback to local filtering.
  const activeData = serverFetchParams ? (serverFetchParams.isDeleted ? (trashDocuments as unknown as T[]) : (documents as unknown as T[])) : data;
  const activePaginationData = serverFetchParams?.isDeleted ? trashPaginationData : paginationData;

  const filteredData = useMemo(() => {
    let dataToFilter = activeData;
    
    // activeData is a shared global state (documents). When navigating to the Starred page,
    // we must locally filter out unstarred documents immediately to prevent showing all documents
    // while the backend is fetching.
    if (serverFetchParams?.isStarred) {
      dataToFilter = dataToFilter.filter(item => (item as any).isStarred);
    }

    if (serverFetchParams) return dataToFilter; // Backend handles filtering
    return dataToFilter.filter(item => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!item.name?.toLowerCase().includes(query) && !(item as any).filename?.toLowerCase().includes(query) && !item.domain?.toLowerCase().includes(query) && !item.department?.toLowerCase().includes(query) && !item.uploadedBy?.toLowerCase().includes(query) && !item.year?.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (filters.domain && item.domain !== filters.domain) return false;
      if (filters.department && item.uploadedBy !== filters.department) return false;
      if (filters.status && item.status !== filters.status) return false;
      return true;
    });
  }, [activeData, searchQuery, filters, serverFetchParamsStr]);

  const sortedData = useMemo(() => {
    if (serverFetchParams) return filteredData; // Backend handles sorting
    return [...filteredData].sort((a, b) => {
      // (Sort logic truncated for brevity, but left intact below)
      if (sortBy.includes("Newest") || sortBy.includes("Oldest")) {
        const dateA = new Date(a.deletedDate || (a.date ? `${a.date} ${a.time || "12:00 AM"}` : "")).getTime() || 0;
        const dateB = new Date(b.deletedDate || (b.date ? `${b.date} ${b.time || "12:00 AM"}` : "")).getTime() || 0;
        return sortBy.includes("Newest") ? dateB - dateA : dateA - dateB;
      } else {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return (sortBy.includes("A-Z") || sortBy.includes("A–Z")) ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
    });
  }, [filteredData, sortBy, serverFetchParamsStr]);

  const totalPages = serverFetchParams ? (activePaginationData?.totalPages || 1) : Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedData = serverFetchParams 
    ? sortedData 
    : sortedData.slice((validCurrentPage - 1) * itemsPerPage, validCurrentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return {
    sortBy, setSortBy, currentPage: validCurrentPage, totalPages, handlePageChange,
    viewMode, setViewMode, searchQuery, setSearchQuery, filters, setFilters,
    paginatedData, filteredData,
    totalItems: serverFetchParams ? (activePaginationData?.total || 0) : sortedData.length
  };
}
