"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import FileCard from "@/components/ui/FileCard";
import FileRow from "@/components/ui/FileRow";
import Pagination from "@/components/ui/Pagination";
import SortDropdown from "@/components/ui/SortDropdown";
import { LayoutGrid, List, ChevronDown, ChevronRight, Folder } from "lucide-react";
import { useDataView, SortOption } from "@/hooks/useDataView";
import clsx from "clsx";
import { useAppContext } from "@/store/AppContext";

export default function FacultyDocuments() {
  const domains = ["Admissions", "Administrative", "Examination", "Placements", "Events"];
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({
    Admissions: true,
  });

  const { documents, globalSearchQuery } = useAppContext();
  const allFiles = documents.filter(f => f.status === "Approved" && !f.isDeleted);

  const toggleDomain = (domain: string) => {
    setExpandedDomains(prev => ({ ...prev, [domain]: !prev[domain] }));
  };

  const {
    sortBy, setSortBy,
    currentPage, totalPages, handlePageChange,
    viewMode, setViewMode,
    paginatedData, filteredData, totalItems
  } = useDataView(allFiles, "Newest first", 10);

  return (
    <div>
      <PageHeader 
        title="Documents" 
        subtitle="All documents in your institution, organized by domain."
      >
        <SortDropdown value={sortBy} onChange={setSortBy} />
        
        <div className="flex bg-white border border-[var(--border)] rounded-lg overflow-hidden">
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
      </PageHeader>

      <div className="space-y-4">
        {domains.map((domain) => {
          // We use paginatedData to show only files that belong to this domain on the CURRENT page
          const domainFiles = paginatedData.filter(f => f.domain === domain);
          // And we also count the total files for this domain just for the header badge using filteredData
          const totalDomainFiles = filteredData.filter(f => f.domain === domain);
          const isExpanded = expandedDomains[domain];
          
          if (globalSearchQuery && totalDomainFiles.length === 0) return null;

          return (
            <div key={domain} className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
              <button 
                onClick={() => toggleDomain(domain)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-[var(--archyv-accent-hover)]">
                    <Folder className="w-6 h-6 fill-[var(--archyv-accent)]/20" strokeWidth={1.5} />
                  </div>
                  <span className="font-semibold text-foreground">{domain}</span>
                  <span className="text-sm text-gray-400">{totalDomainFiles.length} Files</span>
                </div>
                <div className="text-gray-400">
                  {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </button>
              
              {isExpanded && (
                <div className="p-5 pt-0 border-t border-gray-50">
                  {domainFiles.length > 0 ? (
                    <>
                      {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-5">
                          {domainFiles.map((file) => (
                            <FileCard key={file.id} file={file} />
                          ))}
                        </div>
                      ) : (
                        <div className="border border-[var(--border)] rounded-xl overflow-hidden mt-5">
                          <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50/50 border-b border-[var(--border)] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <div className="col-span-4 lg:col-span-3 ml-14">Name</div>
                            <div className="col-span-3 lg:col-span-2">Uploaded By</div>
                            <div className="hidden lg:block col-span-2">Date</div>
                            <div className="col-span-2 lg:col-span-1">Size</div>
                            <div className="col-span-3 lg:col-span-4 text-right mr-4">Actions</div>
                          </div>
                          <div className="divide-y divide-[var(--border)] bg-white">
                            {domainFiles.map((file) => (
                              <FileRow key={file.id} file={file} />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-sm text-gray-500">
                      No documents for this domain on the current page.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
