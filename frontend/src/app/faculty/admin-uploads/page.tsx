"use client";

import PageHeader from "@/components/ui/PageHeader";
import FileCard from "@/components/ui/FileCard";
import FileRow from "@/components/ui/FileRow";
import Pagination from "@/components/ui/Pagination";
import SortDropdown from "@/components/ui/SortDropdown";
import { LayoutGrid, List, File } from "lucide-react";
import { useDataView, SortOption } from "@/hooks/useDataView";
import clsx from "clsx";
import { useAppContext } from "@/store/AppContext";

export default function FacultyAdminUploads() {
  const { documents, currentUser } = useAppContext();
  
  // Filter for files uploaded by admin and not deleted
  const adminFiles = documents.filter(f => !f.isDeleted && f.uploadedById !== currentUser?.id);

  const {
    sortBy, setSortBy,
    currentPage, totalPages, handlePageChange,
    viewMode, setViewMode,
    paginatedData, totalItems
  } = useDataView(adminFiles, "Newest first", 10);

  return (
    <div>
      <PageHeader 
        title="Admin Uploads" 
        subtitle="Files uploaded by your admin and shared with you."
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
            label="admin uploads"
          />
        </>
      ) : (
        <div className="bg-white/50 border border-[var(--border)] rounded-2xl p-24 flex flex-col items-center justify-center text-center mt-12 border-dashed">
          <div className="w-20 h-20 rounded-full bg-[var(--archyv-accent)]/10 flex items-center justify-center mb-6">
            <File className="w-8 h-8 text-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">No files available</h3>
          <p className="text-base text-gray-500 max-w-sm">
            There are no files uploaded by your admin yet.<br/>
            Files shared with you will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
