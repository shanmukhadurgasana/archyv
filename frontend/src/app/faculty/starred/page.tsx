"use client";

import PageHeader from "@/components/ui/PageHeader";
import FileCard from "@/components/ui/FileCard";
import FileRow from "@/components/ui/FileRow";
import Pagination from "@/components/ui/Pagination";
import SortDropdown from "@/components/ui/SortDropdown";
import { LayoutGrid, List } from "lucide-react";
import Image from "next/image";
import { useDataView, SortOption } from "@/hooks/useDataView";
import clsx from "clsx";
import { useAppContext } from "@/store/AppContext";

export default function FacultyStarred() {
  const { documents, starredDocs, currentUser } = useAppContext();
  
  // Local filtering for starred docs to prevent overriding the global documents cache
  const userStarredIds = currentUser ? starredDocs[currentUser.id] || [] : [];
  const starredFiles = documents.filter(f => !f.isDeleted && (f.isStarred || userStarredIds.includes(f.id)));

  const {
    sortBy, setSortBy,
    currentPage, totalPages, handlePageChange,
    viewMode, setViewMode,
    paginatedData, totalItems
  } = useDataView(starredFiles, "Newest first", 10);

  return (
    <div>
      <PageHeader 
        title="Starred" 
        subtitle="Files you have starred for quick access."
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

      {totalItems > 0 ? (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {paginatedData.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50/50 border-b border-[var(--border)] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="col-span-4 lg:col-span-3 ml-14">Name</div>
                <div className="col-span-3 lg:col-span-2">Uploaded By</div>
                <div className="hidden lg:block col-span-2">Date</div>
                <div className="col-span-2 lg:col-span-1">Size</div>
                <div className="col-span-3 lg:col-span-4 text-right mr-4">Actions</div>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {paginatedData.map((file) => (
                  <FileRow key={file.id} file={file} />
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
            label="starred files"
          />
        </>
      ) : (
        <div className="bg-white border border-[var(--border)] rounded-2xl p-12 flex flex-col items-center justify-center text-center mt-12">
          <div className="w-24 h-24 relative mb-4 opacity-70">
            <Image src="/logo.png" alt="No starred files" fill className="object-contain" />
            <div className="absolute -bottom-2 -right-2 bg-[var(--archyv-accent)] rounded-full p-1.5 text-white shadow-md">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">No starred files yet</h3>
          <p className="text-sm text-gray-500 max-w-sm">Star important documents to access them quickly from here.</p>
        </div>
      )}
    </div>
  );
}
