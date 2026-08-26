"use client";

import PageHeader from "@/components/ui/PageHeader";
import FileCard from "@/components/ui/FileCard";
import FileRow from "@/components/ui/FileRow";
import Pagination from "@/components/ui/Pagination";
import SortDropdown from "@/components/ui/SortDropdown";
import { LayoutGrid, List } from "lucide-react";
import { useDataView, SortOption } from "@/hooks/useDataView";
import clsx from "clsx";
import { useAppContext } from "@/store/AppContext";

export default function FacultyFiles() {
  const { documents } = useAppContext();
  const allFiles = documents.filter(f => f.status === "Approved" && !f.isDeleted);

  const {
    sortBy, setSortBy,
    currentPage, totalPages, handlePageChange,
    viewMode, setViewMode,
    paginatedData, totalItems
  } = useDataView(allFiles, "Newest first", 10);

  return (
    <div>
      <PageHeader 
        title="Files" 
        subtitle="All documents in your institution, organized by domain, department and year."
      >
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
      </PageHeader>

      <div className="space-y-6">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedData.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden mb-6">
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50/50 border-b border-[var(--border)] text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-4 lg:col-span-3 ml-14">Name</div>
              <div className="col-span-3 lg:col-span-2">Uploaded By</div>
              <div className="hidden lg:block col-span-2">Domain</div>
              <div className="hidden lg:block col-span-2">Date</div>
              <div className="col-span-2 lg:col-span-1">Size</div>
              <div className="col-span-3 lg:col-span-2 text-right mr-4">Actions</div>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {paginatedData.map(file => (
                <FileRow key={file.id} file={file} />
              ))}
            </div>
          </div>
        )}

        {totalItems > 0 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            itemsPerPage={10}
            label="files"
          />
        )}
      </div>
    </div>
  );
}
