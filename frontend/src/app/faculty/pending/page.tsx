"use client";

import { useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import FileRow from "@/components/ui/FileRow";
import FileCard from "@/components/ui/FileCard";
import Pagination from "@/components/ui/Pagination";
import SortDropdown from "@/components/ui/SortDropdown";
import { LayoutGrid, List, Clock, Upload, FileText } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { useDataView } from "@/hooks/useDataView";
import { useAppContext } from "@/store/AppContext";

export default function FacultyPending() {
  const { pendingDocuments, currentUser, isDataLoading, fetchPendingDocuments } = useAppContext();

  useEffect(() => {
    fetchPendingDocuments();
  }, []);

  // Show documents uploaded by this faculty that are currently in PENDING status (awaiting admin approval)
  const isOwner = (f: any) => {
    if (currentUser?.id && f.uploadedById === currentUser.id) return true;
    if (currentUser?.name && f.uploadedBy === currentUser.name) return true;
    if (!currentUser) {
      try {
        const stored = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("archyv_user") || "null") : null;
        if (stored?.id && f.uploadedById === stored.id) return true;
        if (stored?.name && f.uploadedBy === stored.name) return true;
      } catch (e) {}
    }
    return false;
  };

  const allFiles = pendingDocuments.filter(f => 
    !f.isDeleted && 
    (f.status === 'PENDING' || f.status === 'REJECTED') &&
    isOwner(f)
  );

  const {
    sortBy, setSortBy,
    currentPage, totalPages, handlePageChange,
    itemsPerPage, setItemsPerPage,
    viewMode, setViewMode,
    paginatedData, totalItems
  } = useDataView(allFiles, "Newest first", 10);

  return (
    <div>
      <PageHeader 
        title="Pending Documents" 
        subtitle="Track your uploaded documents awaiting administrator review and approval."
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-8">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Total Pending</div>
            <div className="text-lg font-bold text-foreground">{totalItems}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SortDropdown value={sortBy} onChange={setSortBy} />
          <div className="flex bg-white border border-[var(--border)] rounded-lg overflow-hidden shadow-sm">
            <button 
              onClick={() => setViewMode("grid")}
              className={clsx("p-2 transition-colors", viewMode === "grid" ? "bg-gray-50 text-foreground" : "text-gray-400 hover:text-foreground hover:bg-gray-50")}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={clsx("p-2 transition-colors", viewMode === "list" ? "bg-gray-50 text-foreground" : "text-gray-400 hover:text-foreground hover:bg-gray-50")}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {isDataLoading && pendingDocuments.length === 0 ? (
          <div className="bg-white border border-[var(--border)] rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[350px]">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[var(--archyv-accent)] rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-bold text-foreground mb-2">Loading pending files...</h3>
          </div>
        ) : allFiles.length === 0 ? (
          <div className="bg-white border border-[var(--border)] rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[350px]">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">No Pending Documents</h3>
            <p className="text-xs text-gray-500 max-w-sm mb-6">
              When you upload files, they are submitted for administrator approval and will appear here until approved.
            </p>
            <Link
              href="/faculty/upload"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-foreground bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] rounded-xl transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload a Document
            </Link>
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
                {paginatedData.map((file, i) => (
                  <FileCard key={`${file.id}-${i}`} file={file} />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden mb-6 shadow-sm">
                <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50/50 border-b border-[var(--border)] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-4 lg:col-span-3 ml-14">File Name</div>
                  <div className="col-span-3 lg:col-span-2">Uploaded By</div>
                  <div className="hidden lg:block col-span-2">Domain</div>
                  <div className="hidden lg:block col-span-2">Date</div>
                  <div className="col-span-2 lg:col-span-1">Size</div>
                  <div className="col-span-3 lg:col-span-2 text-right mr-4">Status</div>
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
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              label="pending files"
            />
          </>
        )}
      </div>
    </div>
  );
}
