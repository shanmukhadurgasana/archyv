"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import FileRow from "@/components/ui/FileRow";
import FileCard from "@/components/ui/FileCard";
import Pagination from "@/components/ui/Pagination";
import SortDropdown from "@/components/ui/SortDropdown";
import CustomDropdown from "@/components/ui/CustomDropdown";
import { Filter, Users, Folder, LayoutGrid, List } from "lucide-react";
import clsx from "clsx";
import { useDataView } from "@/hooks/useDataView";
import { useAppContext } from "@/store/AppContext";

export default function AdminDocuments() {
  const { documents, users } = useAppContext();
  const allFiles = documents.filter(f => !f.isDeleted);

  const uniqueDomains = [
    "Admissions", 
    "Examination", 
    "Placements", 
    "Events", 
    "Administrative"
  ];
  const totalDomains = 5;
  
  const facultyUsers = users.filter(u => u.role === "faculty");
  const totalFaculty = facultyUsers.length;

  const {
    sortBy, setSortBy,
    currentPage, totalPages, handlePageChange,
    viewMode, setViewMode,
    paginatedData, totalItems,
    filters, setFilters
  } = useDataView(allFiles, "Newest first", 10);

  const filterDomain = filters.domain || "All Domains";
  const setFilterDomain = (val: string) => setFilters(prev => ({ ...prev, domain: val === "All Domains" ? undefined : val }));
  const filterFaculty = filters.department || "All Faculty";
  const setFilterFaculty = (val: string) => setFilters(prev => ({ ...prev, department: val === "All Faculty" ? undefined : val }));

  return (
    <div>
      <PageHeader 
        title="Documents" 
        subtitle="View and manage all documents organized by domain and faculty."
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-white border border-[var(--border)] rounded-xl px-5 py-3 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--archyv-accent)]/10 flex items-center justify-center text-[var(--archyv-accent)]">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Total Domains</div>
              <div className="text-xl font-bold text-foreground">{totalDomains}</div>
            </div>
          </div>
          <div className="bg-white border border-[var(--border)] rounded-xl px-5 py-3 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Total Faculty</div>
              <div className="text-xl font-bold text-foreground">{totalFaculty}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SortDropdown value={sortBy} onChange={setSortBy} />
          <div className="flex bg-white border border-[var(--border)] rounded-lg overflow-hidden shadow-sm">
            <button 
              onClick={() => setViewMode("grid")}
              className={clsx("p-2 transition-colors", viewMode === "grid" ? "bg-gray-50 text-foreground" : "text-gray-400 hover:text-foreground hover:bg-gray-50")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={clsx("p-2 transition-colors", viewMode === "list" ? "bg-gray-50 text-foreground" : "text-gray-400 hover:text-foreground hover:bg-gray-50")}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 flex-wrap bg-gray-50/50 p-3 rounded-xl border border-[var(--border)] w-fit">
        <CustomDropdown 
          label="Domain:"
          value={filterDomain}
          onChange={setFilterDomain}
          options={["All Domains", ...uniqueDomains]}
        />
        
        <CustomDropdown 
          label="Faculty:"
          value={filterFaculty}
          onChange={setFilterFaculty}
          options={["All Faculty", ...facultyUsers.map(u => u.name)]}
          icon={filterFaculty !== "All Faculty" ? (
            <div className="w-5 h-5 rounded-full bg-[var(--archyv-accent)]/20 flex items-center justify-center text-[10px] font-bold text-foreground">
              {filterFaculty.substring(0, 2).toUpperCase()}
            </div>
          ) : undefined}
        />

        {(filterDomain !== "All Domains" || filterFaculty !== "All Faculty") && (
          <button 
            onClick={() => { setFilterDomain("All Domains"); setFilterFaculty("All Faculty"); }}
            className="text-sm font-semibold text-gray-500 hover:text-[var(--archyv-accent-hover)] transition-colors ml-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          {paginatedData.map((file, i) => (
            <FileCard key={`${file.id}-${i}`} file={file} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden mb-6">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50/50 border-b border-[var(--border)] text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-4 lg:col-span-3 ml-14">Name</div>
            <div className="col-span-3 lg:col-span-2">Uploaded By</div>
            <div className="hidden lg:block col-span-2">Date</div>
            <div className="col-span-2 lg:col-span-1">Size</div>
            <div className="col-span-3 lg:col-span-4 text-right mr-4">Actions</div>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {paginatedData.map((file, i) => (
              <FileRow key={`${file.id}-${i}`} file={file} />
            ))}
          </div>
        </div>
      )}
      
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalItems}
        itemsPerPage={10}
        label="documents"
      />
    </div>
  );
}
