"use client";

import PageHeader from "@/components/ui/PageHeader";
import FileRow from "@/components/ui/FileRow";
import FileCard from "@/components/ui/FileCard";
import Pagination from "@/components/ui/Pagination";
import SortDropdown from "@/components/ui/SortDropdown";
import { Filter, MoreVertical, LayoutGrid, List } from "lucide-react";
import clsx from "clsx";
import { useAppContext } from "@/store/AppContext";
import { useDataView } from "@/hooks/useDataView";

export default function AdminApprovalQueue() {
  const { documents } = useAppContext();
  const pendingFiles = documents.filter(f => f.status === "Pending" && !f.isDeleted);
  
  const totalPending = documents.filter(f => f.status === "Pending" && !f.isDeleted).length;
  const totalApproved = documents.filter(f => f.status === "Approved" && !f.isDeleted).length;
  const totalRejected = documents.filter(f => f.status === "Rejected" && !f.isDeleted).length;
  const totalDeleted = documents.filter(f => f.isDeleted).length;
  
  const {
    sortBy, setSortBy,
    currentPage, totalPages, handlePageChange,
    viewMode, setViewMode,
    paginatedData, totalItems
  } = useDataView(pendingFiles, "Newest first", 10);

  return (
    <div>
      <PageHeader 
        title="Approval Queue" 
        subtitle="Review and take action on documents uploaded by faculty."
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Total Pending</div>
            <div className="text-lg font-bold text-foreground">{totalPending}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Total Approved</div>
            <div className="text-lg font-bold text-foreground">{totalApproved}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Total Rejected</div>
            <div className="text-lg font-bold text-foreground">{totalRejected}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Total Deleted</div>
            <div className="text-lg font-bold text-foreground">{totalDeleted}</div>
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

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          {paginatedData.map((file) => (
            <FileCard key={file.id} file={file} isAdminQueue={true} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden mb-6">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50/50 border-b border-[var(--border)] text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-4 lg:col-span-3 ml-14">Document</div>
            <div className="col-span-3 lg:col-span-2">Uploaded By</div>
            <div className="hidden lg:block col-span-2">Domain</div>
            <div className="hidden lg:block col-span-2">Date</div>
            <div className="col-span-2 lg:col-span-1">Size</div>
            <div className="hidden lg:block col-span-1">Status</div>
            <div className="col-span-3 sm:col-span-3 lg:col-span-1 text-right mr-4">Actions</div>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {paginatedData.map(file => (
              <FileRow key={file.id} file={file} isAdminQueue={true} />
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
        label="pending documents"
      />
    </div>
  );
}
