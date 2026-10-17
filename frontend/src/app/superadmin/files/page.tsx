"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import FileRow from "@/components/ui/FileRow";
import FileCard from "@/components/ui/FileCard";
import { 
  Folder, 
  FileText, 
  GraduationCap, 
  ShieldCheck, 
  Search, 
  LayoutGrid, 
  List, 
  Filter, 
  HardDrive 
} from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import clsx from "clsx";

export default function SuperAdminFiles() {
  const { documents, domains, departments, academicYears, dashboardStats } = useAppContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "FACULTY" | "ADMIN">("ALL");
  const [selectedDomain, setSelectedDomain] = useState("All Domains");
  const [selectedSubdomain, setSelectedSubdomain] = useState("All Sub Domains");
  const [selectedYear, setSelectedYear] = useState("All Academic Years");
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Approved and active files
  const allActiveFiles = documents.filter((f) => !f.isDeleted);

  // Uploader Role counts
  const facultyFiles = allActiveFiles.filter(
    (f) => f.uploaderRole?.toLowerCase() === "faculty"
  );
  const adminFiles = allActiveFiles.filter(
    (f) => f.uploaderRole?.toLowerCase() === "admin" || f.uploaderRole?.toLowerCase() === "super_admin"
  );

  const totalFilesCount = allActiveFiles.length;
  const facultyFilesCount = facultyFiles.length;
  const adminFilesCount = adminFiles.length;

  // Filtered files
  const filteredFiles = allActiveFiles.filter((f) => {
    // Role filter
    if (roleFilter === "FACULTY" && f.uploaderRole?.toLowerCase() !== "faculty") return false;
    if (roleFilter === "ADMIN" && f.uploaderRole?.toLowerCase() !== "admin" && f.uploaderRole?.toLowerCase() !== "super_admin") return false;

    // Domain filter
    const docDomain = typeof f.domain === "object" ? (f.domain as any)?.name : f.domain;
    if (selectedDomain !== "All Domains" && docDomain !== selectedDomain) return false;

    // Subdomain filter
    const docSubdomain = typeof f.subdomain === "object" ? (f.subdomain as any)?.name : f.subdomain;
    if (selectedSubdomain !== "All Sub Domains" && docSubdomain !== selectedSubdomain) return false;

    // Academic Year filter
    const docYear = typeof f.academicYear === "object" ? (f.academicYear as any)?.year : (f.year || f.academicYear);
    if (selectedYear !== "All Academic Years" && docYear !== selectedYear) return false;

    // Branch filter
    const docBranch = f.branch || (typeof f.department === "object" ? (f.department as any)?.name : f.department);
    if (selectedBranch !== "All Branches" && docBranch !== selectedBranch) return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = f.name?.toLowerCase().includes(q);
      const matchUploader = f.uploadedBy?.toLowerCase().includes(q);
      const matchDomain = docDomain?.toLowerCase().includes(q);
      if (!matchName && !matchUploader && !matchDomain) return false;
    }

    return true;
  });

  const activeDomainObj = domains.find((d) => d.name === selectedDomain);
  const subdomainOptions = activeDomainObj?.subdomains?.map((s) => s.name) || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Institutional Files"
        subtitle="Comprehensive file governance, access controls, and uploader role metrics."
      />

      {/* Upload Origin Metric Badges as requested */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Files */}
        <div 
          onClick={() => setRoleFilter("ALL")}
          className={clsx(
            "bg-white border rounded-2xl p-5 shadow-xs cursor-pointer transition-all",
            roleFilter === "ALL" ? "border-[var(--archyv-accent)] ring-2 ring-[var(--archyv-accent)]/20" : "border-[var(--border)] hover:border-gray-300"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Files</span>
            <div className="w-8 h-8 rounded-lg bg-[var(--archyv-accent)]/15 text-[var(--archyv-accent-hover)] flex items-center justify-center">
              <Folder className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{totalFilesCount}</div>
          <div className="text-xs text-gray-400 mt-1">Across all domains & sessions</div>
        </div>

        {/* Uploaded by Faculty */}
        <div 
          onClick={() => setRoleFilter("FACULTY")}
          className={clsx(
            "bg-white border rounded-2xl p-5 shadow-xs cursor-pointer transition-all",
            roleFilter === "FACULTY" ? "border-[var(--archyv-accent)] ring-2 ring-[var(--archyv-accent)]/20" : "border-[var(--border)] hover:border-gray-300"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">Faculty Uploads</span>
            <div className="w-8 h-8 rounded-lg bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{facultyFilesCount}</div>
          <div className="text-xs text-gray-400 mt-1">
            {totalFilesCount > 0 ? ((facultyFilesCount / totalFilesCount) * 100).toFixed(0) : 0}% of total files
          </div>
        </div>

        {/* Uploaded by Admins */}
        <div 
          onClick={() => setRoleFilter("ADMIN")}
          className={clsx(
            "bg-white border rounded-2xl p-5 shadow-xs cursor-pointer transition-all",
            roleFilter === "ADMIN" ? "border-foreground ring-2 ring-gray-900/10" : "border-[var(--border)] hover:border-gray-300"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">Admin Uploads</span>
            <div className="w-8 h-8 rounded-lg bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{adminFilesCount}</div>
          <div className="text-xs text-gray-400 mt-1">
            {totalFilesCount > 0 ? ((adminFilesCount / totalFilesCount) * 100).toFixed(0) : 0}% of total files
          </div>
        </div>

        {/* Storage Capacity */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">Storage Used</span>
            <div className="w-8 h-8 rounded-lg bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {(dashboardStats?.totalBytes ? (dashboardStats.totalBytes / (1024 * 1024)).toFixed(1) : "0.0")} MB
          </div>
          <div className="text-xs text-gray-400 mt-1">Synced with Google Drive</div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white border border-[var(--border)] rounded-2xl p-4 shadow-xs space-y-3">
        {/* Top Controls: Role Filter Tabs + Search + View Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Role Pill Selector */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setRoleFilter("ALL")}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                roleFilter === "ALL" ? "bg-white text-foreground shadow-xs" : "text-gray-500 hover:text-foreground"
              )}
            >
              All Files ({totalFilesCount})
            </button>
            <button
              onClick={() => setRoleFilter("FACULTY")}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                roleFilter === "FACULTY" ? "bg-white text-foreground shadow-xs font-bold" : "text-gray-500 hover:text-foreground"
              )}
            >
              Faculty Uploads ({facultyFilesCount})
            </button>
            <button
              onClick={() => setRoleFilter("ADMIN")}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                roleFilter === "ADMIN" ? "bg-white text-foreground shadow-xs font-bold" : "text-gray-500 hover:text-foreground"
              )}
            >
              Admin Uploads ({adminFilesCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search files or uploader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50"
              />
            </div>

            {/* View Mode */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("list")}
                className={clsx("p-1.5 rounded-lg transition-colors", viewMode === "list" ? "bg-white shadow-xs text-foreground" : "text-gray-400 hover:text-foreground")}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={clsx("p-1.5 rounded-lg transition-colors", viewMode === "grid" ? "bg-white shadow-xs text-foreground" : "text-gray-400 hover:text-foreground")}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
          <div className="text-gray-400 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter by:
          </div>

          {/* Domain */}
          <select
            value={selectedDomain}
            onChange={(e) => {
              setSelectedDomain(e.target.value);
              setSelectedSubdomain("All Sub Domains");
            }}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[var(--archyv-accent)]"
          >
            <option value="All Domains">All Domains</option>
            {domains.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>

          {/* Subdomain */}
          {selectedDomain !== "All Domains" && subdomainOptions.length > 0 && (
            <select
              value={selectedSubdomain}
              onChange={(e) => setSelectedSubdomain(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[var(--archyv-accent)]"
            >
              <option value="All Sub Domains">All Sub Domains</option>
              {subdomainOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          {/* Academic Year */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[var(--archyv-accent)]"
          >
            <option value="All Academic Years">All Academic Years</option>
            {academicYears.map((y) => (
              <option key={y.id} value={y.year}>{y.year}</option>
            ))}
          </select>

          {/* Branch / Department */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[var(--archyv-accent)]"
          >
            <option value="All Branches">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>

          {(selectedDomain !== "All Domains" || selectedYear !== "All Academic Years" || selectedBranch !== "All Branches" || searchQuery || roleFilter !== "ALL") && (
            <button
              onClick={() => {
                setSelectedDomain("All Domains");
                setSelectedSubdomain("All Sub Domains");
                setSelectedYear("All Academic Years");
                setSelectedBranch("All Branches");
                setSearchQuery("");
                setRoleFilter("ALL");
              }}
              className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Files Display */}
      {viewMode === "list" ? (
        <div className="bg-white border border-[var(--border)] rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-3 bg-gray-50/75 border-b border-gray-100 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
            <span>Files ({filteredFiles.length})</span>
            <span>Uploader & Actions</span>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
                <div key={file.id} className="relative group">
                  {/* Uploader Role Indicator Tag */}
                  <div className="absolute top-2 right-16 z-5 hidden md:flex items-center gap-1.5">
                    {file.uploaderRole?.toLowerCase() === "faculty" ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--archyv-accent)]/20 text-foreground border border-[var(--border)]">
                        Faculty Upload
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800 border border-gray-200">
                        Admin Upload
                      </span>
                    )}
                  </div>
                  <FileRow file={file} showActions={true} />
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-gray-400 text-sm">
                No institutional files matching current filter criteria.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file) => (
              <div key={file.id} className="relative">
                <FileCard file={file} />
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-gray-400 text-sm bg-white border border-[var(--border)] rounded-2xl">
              No files found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
