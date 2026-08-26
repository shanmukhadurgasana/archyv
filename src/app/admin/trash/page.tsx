"use client";

import PageHeader from "@/components/ui/PageHeader";
import FileRow from "@/components/ui/FileRow";
import FileCard from "@/components/ui/FileCard";
import Pagination from "@/components/ui/Pagination";
import SortDropdown from "@/components/ui/SortDropdown";
import { Calendar, LayoutGrid, List } from "lucide-react";
import clsx from "clsx";
import { useDataView } from "@/hooks/useDataView";
import { useAppContext } from "@/store/AppContext";

export default function AdminTrash() {
  const { documents } = useAppContext();
  const trashFiles = documents.filter(f => f.isDeleted);

  const {
    sortBy, setSortBy,
    currentPage, totalPages, handlePageChange,
    viewMode, setViewMode,
    paginatedData, totalItems
  } = useDataView(trashFiles, "Newest first", 10);

  return (
    <div>
      <PageHeader 
        title="Trash" 
        subtitle="Files moved to trash will be permanently deleted after 90 days."
      >
        <div className="flex items-center gap-6 mr-4">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Total Files</div>
            <div className="text-base font-bold text-foreground">{totalItems}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Files will be permanently deleted after</div>
            <div className="text-base font-bold text-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              90 days
            </div>
          </div>
        </div>
      </PageHeader>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SortDropdown value={sortBy} onChange={setSortBy} />
          <div className="flex bg-white border border-[var(--border)] rounded-lg overflow-hidden shadow-sm ml-2">
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
            <FileCard key={file.id} file={file} isTrash={true} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden mb-6">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50/50 border-b border-[var(--border)] text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-4 lg:col-span-3 ml-14">Name</div>
            <div className="col-span-3 lg:col-span-2">Deleted By</div>
            <div className="hidden lg:block col-span-2">Original Location</div>
            <div className="hidden lg:block col-span-2">Deleted On</div>
            <div className="col-span-2 lg:col-span-1">Days Left</div>
            <div className="col-span-3 lg:col-span-2 text-right mr-4">Actions</div>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {paginatedData.map(file => (
              <FileRow key={file.id} file={file} isTrash={true} />
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
        label="trash files"
      />
    </div>
  );
}
