
import { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/store/AppContext';

export type SortOption = "Newest first" | "Oldest first" | "Name A-Z" | "Name Z-A";

export interface FilterOptions {
  domain?: string;
  department?: string;
  branch?: string;
  section?: string;
  status?: string;
  subDomain?: string;
  academicYear?: string;
  yearOfStudy?: string;
  faculty?: string;
}

export function useDataView<T extends { date?: string; time?: string; name?: string; deletedDate?: string; domain?: string; department?: string; status?: string; uploadedBy?: string; year?: string }>(
  data: T[], // This is no longer used for local slicing if serverFetch is enabled
  initialSort: SortOption = "Newest first",
  initialItemsPerPage: number = 10,
  serverFetchParams?: { isDeleted?: boolean; status?: string; isStarred?: boolean; } // If provided, server-side fetching is enabled
) {
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPageState] = useState<number>(initialItemsPerPage);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});

  const { globalSearchQuery, fetchDocuments, fetchTrashDocuments, documents, trashDocuments, paginationData, trashPaginationData } = useAppContext();
  const searchQuery = localSearchQuery || globalSearchQuery;
  const setSearchQuery = setLocalSearchQuery;

  // Reset to first page whenever filters or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

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
          branch: filters.branch,
          section: filters.section,
          status: filters.status || serverFetchParams.status,
          isDeleted: serverFetchParams.isDeleted,
          isStarred: serverFetchParams.isStarred,
        });
      }, 300); // Debounce search
      return () => clearTimeout(timer);
    }
  }, [serverFetchParamsStr, currentPage, itemsPerPage, searchQuery, sortBy, filters.domain, filters.department, filters.branch, filters.section, filters.status]);

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

    const normalize = (val: any) => String(val || "").trim().toLowerCase();
    const normalizeYos = (val: any) => {
      const s = String(val || "").trim().toLowerCase();
      if (s.startsWith("1") || s.includes("1st") || s.includes("1 st") || s === "first" || s === "i") return "1st";
      if (s.startsWith("2") || s.includes("2nd") || s.includes("2 nd") || s === "second" || s === "ii") return "2nd";
      if (s.startsWith("3") || s.includes("3rd") || s.includes("3 rd") || s === "third" || s === "iii") return "3rd";
      if (s.startsWith("4") || s.includes("4th") || s.includes("4 th") || s === "fourth" || s === "iv") return "4th";
      return s;
    };

    return dataToFilter.filter(item => {
      const anyItem = item as any;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = (item.name || "").toLowerCase().includes(query);
        const matchesFilename = (anyItem.filename || "").toLowerCase().includes(query);
        const matchesDomain = (typeof item.domain === 'object' ? anyItem.domain?.name : (item.domain || "")).toLowerCase().includes(query);
        const matchesDept = (typeof item.department === 'object' ? anyItem.department?.name : (item.department || "")).toLowerCase().includes(query);
        const matchesUploadedBy = (item.uploadedBy || "").toLowerCase().includes(query);
        const matchesYear = (typeof anyItem.academicYear === 'object' ? anyItem.academicYear?.year : (item.year || anyItem.academicYear || "")).toLowerCase().includes(query);
        const matchesSubdomain = (typeof anyItem.subdomain === 'object' ? anyItem.subdomain?.name : (anyItem.subdomain || "")).toLowerCase().includes(query);
        const matchesYos = (anyItem.yearOfStudy || "").toLowerCase().includes(query);

        if (!matchesName && !matchesFilename && !matchesDomain && !matchesDept && !matchesUploadedBy && !matchesYear && !matchesSubdomain && !matchesYos) {
          return false;
        }
      }

      // Domain filter
      if (filters.domain) {
        const itemDomain = typeof item.domain === 'object' ? anyItem.domain?.name : item.domain;
        if (normalize(itemDomain) !== normalize(filters.domain)) return false;
      }

      // SubDomain filter
      if (filters.subDomain) {
        const itemSubdomain = typeof anyItem.subdomain === 'object' ? anyItem.subdomain?.name : anyItem.subdomain;
        if (normalize(itemSubdomain) !== normalize(filters.subDomain)) return false;
      }

      // Academic Year filter
      if (filters.academicYear) {
        const itemYear = typeof anyItem.academicYear === 'object' ? anyItem.academicYear?.year : (item.year || anyItem.academicYear);
        if (normalize(itemYear) !== normalize(filters.academicYear)) return false;
      }

      // Year of Study filter
      if (filters.yearOfStudy) {
        if (normalizeYos(anyItem.yearOfStudy) !== normalizeYos(filters.yearOfStudy)) return false;
      }

      // Branch filter
      const branchFilter = filters.branch || filters.department;
      if (branchFilter && branchFilter !== "All Branches" && branchFilter !== "All Branch & Sections") {
        const itemBranch = anyItem.branch || (typeof item.department === 'object' ? anyItem.department?.name : item.department);
        if (normalize(itemBranch) !== normalize(branchFilter)) return false;
      }

      // Section filter
      if (filters.section && filters.section !== "All Sections") {
        const itemSection = anyItem.section;
        if (filters.section === "Overall Section" || filters.section === "None") {
          if (itemSection && normalize(itemSection) !== "overall section" && normalize(itemSection) !== "n/a") return false;
        } else {
          if (normalize(itemSection) !== normalize(filters.section)) return false;
        }
      }

      // Faculty filter
      if (filters.faculty) {
        if (normalize(item.uploadedBy) !== normalize(filters.faculty)) return false;
      }

      // Status filter
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

  const handleItemsPerPageChange = (newCount: number) => {
    setItemsPerPageState(newCount);
    setCurrentPage(1);
  };

  return {
    sortBy, setSortBy, currentPage: validCurrentPage, totalPages, handlePageChange,
    itemsPerPage, setItemsPerPage: handleItemsPerPageChange,
    viewMode, setViewMode, searchQuery, setSearchQuery, filters, setFilters,
    paginatedData, filteredData,
    totalItems: serverFetchParams ? (activePaginationData?.total || 0) : sortedData.length
  };
}
