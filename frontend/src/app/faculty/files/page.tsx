"use client";

import PageHeader from "@/components/ui/PageHeader";
import FileCard from "@/components/ui/FileCard";
import FileRow from "@/components/ui/FileRow";
import Pagination from "@/components/ui/Pagination";
import SortDropdown from "@/components/ui/SortDropdown";
import CustomDropdown from "@/components/ui/CustomDropdown";
import { LayoutGrid, List, Filter } from "lucide-react";
import { useDataView } from "@/hooks/useDataView";
import clsx from "clsx";
import { useAppContext } from "@/store/AppContext";

export default function FacultyFiles() {
  const { documents, isDataLoading, domains, departments, academicYears } = useAppContext();
  const allFiles = documents.filter(f => !f.isDeleted);

  const {
    sortBy, setSortBy,
    currentPage, totalPages, handlePageChange,
    itemsPerPage, setItemsPerPage,
    viewMode, setViewMode,
    paginatedData, totalItems,
    filters, setFilters
  } = useDataView(allFiles, "Newest first", 10);

  const filterDomain = filters.domain || "All Domains";
  const filterSubDomain = filters.subDomain || "All Sub Domains";
  const filterAcademicYear = filters.academicYear || "All Academic Years";
  const filterYearOfStudy = filters.yearOfStudy || "All Years of Study";
  const filterBranch = filters.branch || filters.department || "All Branches";
  const filterSection = filters.section || "All Sections";

  const setFilter = (key: string, value: string, defaultVal: string) => {
    setFilters(prev => ({ ...prev, [key]: value === defaultVal ? undefined : value }));
  };

  const hasActiveFilter = Boolean(
    (filters.domain && filters.domain !== "All Domains") ||
    (filters.subDomain && filters.subDomain !== "All Sub Domains") ||
    (filters.academicYear && filters.academicYear !== "All Academic Years") ||
    (filters.yearOfStudy && filters.yearOfStudy !== "All Years of Study") ||
    (filters.branch && filters.branch !== "All Branches") ||
    (filters.department && filters.department !== "All Branches") ||
    (filters.section && filters.section !== "All Sections") ||
    filters.status
  );

  const uniqueDomains = [...domains].map(d => d.name).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  const selectedDomainObj = domains.find(d => d.name === filterDomain);
  const subDomainOptions = (selectedDomainObj?.subdomains?.map(s => s.name) || []).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  const uniqueAcademicYears = [...academicYears].map(y => y.year).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  const uniqueBranches = [...departments].map(d => d.name).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  const yearOfStudyOptions = ["1st yr", "2nd yr", "3rd yr", "4th yr"];

  const selectedBranchObj = departments.find(d => d.name === filterBranch);
  const sectionOptions = selectedBranchObj 
    ? (selectedBranchObj.sections?.map(s => s.name) || []).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    : Array.from(new Set(departments.flatMap(d => (d.sections || []).map(s => s.name)))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  return (
    <div>
      <PageHeader 
        title="Files" 
        subtitle="All documents in your institution, organized by domain, department and year."
      >
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block mr-2">
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">
              {hasActiveFilter ? "Filtered Files" : "Total Files"}
            </div>
            <div className="text-base font-bold text-foreground">
              {totalItems} {hasActiveFilter && <span className="text-xs text-gray-400 font-normal">/ {allFiles.length}</span>}
            </div>
          </div>
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
      </PageHeader>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 mb-6 bg-white p-5 rounded-2xl border border-[var(--border)]">
        <div className="flex flex-row flex-wrap xl:flex-nowrap items-end gap-3 xl:gap-4 w-full">
          <div className="flex-1 min-w-[130px] space-y-1.5 flex flex-col justify-end">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Domain</label>
            <CustomDropdown
              value={filterDomain}
              onChange={(v) => { setFilter('domain', v, 'All Domains'); setFilter('subDomain', 'All Sub Domains', 'All Sub Domains'); }}
              options={["All Domains", ...uniqueDomains]}
              fullWidth
            />
          </div>

          <div className="flex-1 min-w-[130px] space-y-1.5 flex flex-col justify-end">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Subdomain</label>
            <CustomDropdown
              value={filterSubDomain}
              onChange={(v) => setFilter('subDomain', v, 'All Sub Domains')}
              options={["All Sub Domains", ...subDomainOptions]}
              fullWidth
            />
          </div>

          <div className="flex-1 min-w-[130px] space-y-1.5 flex flex-col justify-end">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Academic Year</label>
            <CustomDropdown
              value={filterAcademicYear}
              onChange={(v) => setFilter('academicYear', v, 'All Academic Years')}
              options={["All Academic Years", ...uniqueAcademicYears]}
              fullWidth
            />
          </div>

          <div className="flex-1 min-w-[130px] space-y-1.5 flex flex-col justify-end">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Year of Study</label>
            <CustomDropdown
              value={filterYearOfStudy}
              onChange={(v) => setFilter('yearOfStudy', v, 'All Years of Study')}
              options={["All Years of Study", ...yearOfStudyOptions]}
              fullWidth
            />
          </div>

          <div className="flex-1 min-w-[130px] space-y-1.5 flex flex-col justify-end">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Branch</label>
            <CustomDropdown
              value={filterBranch}
              onChange={(v) => {
                setFilter('branch', v, 'All Branches');
                setFilter('department', v, 'All Branches');
                setFilter('section', 'All Sections', 'All Sections');
              }}
              options={["All Branches", ...uniqueBranches]}
              fullWidth
            />
          </div>

          <div className="flex-1 min-w-[130px] space-y-1.5 flex flex-col justify-end">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Section</label>
            <CustomDropdown
              value={filterSection}
              onChange={(v) => setFilter('section', v, 'All Sections')}
              options={["All Sections", "Overall Section", ...sectionOptions]}
              fullWidth
            />
          </div>

          {hasActiveFilter && (
            <div className="shrink-0 space-y-1.5 flex flex-col justify-end">
              <label className="text-[10px] font-bold text-transparent uppercase tracking-wider hidden md:block">Reset</label>
              <button
                onClick={() => setFilters({})}
                className="w-[80px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-1 px-2 rounded-lg text-[11px] h-[38px] transition-colors flex flex-col items-center justify-center border border-transparent leading-none"
              >
                <span>Reset</span>
                <span className="mt-0.5">Filters</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-4 px-1">
        <span>
          {hasActiveFilter ? (
            <>Showing <strong className="text-foreground">{totalItems}</strong> matching {totalItems === 1 ? 'file' : 'files'} (filtered from <strong className="text-foreground">{allFiles.length}</strong> total)</>
          ) : (
            <>Showing all <strong className="text-foreground">{allFiles.length}</strong> files</>
          )}
        </span>
      </div>

      <div className="space-y-6">
        {isDataLoading && documents.length === 0 ? (
          <div className="bg-white border border-[var(--border)] rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[var(--archyv-accent)] rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-bold text-foreground mb-2">Loading files...</h3>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="bg-white border border-[var(--border)] rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[300px] mb-6">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">No documents found</h3>
            <p className="text-sm text-gray-500 max-w-sm mb-4">No documents match the currently selected filters.</p>
            {hasActiveFilter && (
              <button
                onClick={() => setFilters({})}
                className="px-4 py-2 bg-[var(--archyv-accent)] text-foreground text-xs font-semibold rounded-lg hover:brightness-105 transition-all shadow-sm"
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <>
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
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                label="files"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
