"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import DomainCard from "@/components/ui/DomainCard";
import FileCard from "@/components/ui/FileCard";
import { useAppContext } from "@/store/AppContext";
import { ChevronRight, ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function FacultyOverview() {
  const { currentUser, documents, domains, academicYears, departments, globalSearchQuery, isDataLoading } = useAppContext();
  
  // Faculty can browse all active, approved files
  const allFiles = documents.filter((f: any) => !f.isDeleted && f.status === "APPROVED");

  type CrumbType = "domain" | "subdomain" | "academicYear" | "yearOfStudy" | "branch" | "section" | "semester" | "student";
  interface PathCrumb {
    type: CrumbType;
    value: string;
    label: string;
  }

  const [path, setPath] = useState<PathCrumb[]>([]);

  // Normalization and robust getters for document fields
  const normalize = (val: any) => String(val || "").trim().toLowerCase();
  const normalizeYos = (val: any) => {
    const s = String(val || "").trim().toLowerCase();
    if (s.startsWith("1") || s.includes("1st") || s.includes("1 st") || s === "first" || s === "i") return "1st";
    if (s.startsWith("2") || s.includes("2nd") || s.includes("2 nd") || s === "second" || s === "ii") return "2nd";
    if (s.startsWith("3") || s.includes("3rd") || s.includes("3 rd") || s === "third" || s === "iii") return "3rd";
    if (s.startsWith("4") || s.includes("4th") || s.includes("4 th") || s === "fourth" || s === "iv") return "4th";
    return s;
  };
  const normalizeSem = (val: any) => {
    const s = String(val || "").trim().toLowerCase();
    if (s === "1" || s === "sem 1" || s === "semester 1" || s === "sem-1" || s === "semester-1" || s === "odd" || s === "odd semester") return "1";
    if (s === "2" || s === "sem 2" || s === "semester 2" || s === "sem-2" || s === "semester-2" || s === "even" || s === "even semester") return "2";
    return "";
  };
  const normalizeSec = (val: any) => {
    const s = String(val || "").trim().toLowerCase();
    if (!s || s === "overall section" || s === "overall" || s === "none" || s === "n/a") return "";
    return s;
  };
  const cleanSectionName = (name: any) => {
    const s = String(name || "").trim();
    if (!s || !normalizeSec(s)) return "";
    return s.replace(/^(section|sec)\s+/i, "").trim();
  };
  const getDocDomain = (f: any) => (typeof f.domain === "object" ? f.domain?.name : f.domain) || "";
  const getDocYear = (f: any) => (typeof f.academicYear === "object" ? f.academicYear?.year : (f.year || f.academicYear)) || "";
  const getDocYearOfStudy = (f: any) => f.yearOfStudy || "";
  const getDocBranch = (f: any) => f.branch || (typeof f.department === "object" ? f.department?.name : f.department) || "";
  const getDocDept = getDocBranch;
  const getDocSection = (f: any) => f.section || (typeof f.sectionRel === "object" ? f.sectionRel?.name : "") || "";
  const getDocSem = (f: any) => f.semester || "";
  const getDocSubdomain = (f: any) => (typeof f.subdomain === "object" ? f.subdomain?.name : f.subdomain) || "";
  const getDocStudentRegisterNumber = (f: any) => (f.studentRegisterNumber || "").trim().toUpperCase();

  // Dynamic domain stats for quick access
  const domainStats = domains.map((domain: any) => {
    const count = allFiles.filter((f: any) => normalize(getDocDomain(f)) === normalize(domain.name)).length;
    return { id: domain.id, name: domain.name, count, isFaculty: domain.isFaculty };
  });

  // Filter My Documents: uploaded by this faculty AND approved by admin
  const facultyDocs = documents.filter((d: any) => {
    if (d.isDeleted) return false;
    
    // Check if uploaded by this faculty member
    const isOwner = (currentUser?.id && d.uploadedById === currentUser.id) ||
                    (currentUser?.name && d.uploadedBy === currentUser.name);
    if (!isOwner) return false;

    // Must be approved by admin
    if (d.status !== "APPROVED") return false;

    if (globalSearchQuery) {
      const q = globalSearchQuery.toLowerCase();
      const matchesName = d.name?.toLowerCase().includes(q);
      const matchesDomain = getDocDomain(d).toLowerCase().includes(q);
      const matchesDepartment = (d.department || d.branch || "").toLowerCase().includes(q);
      const matchesYear = (d.year || "").toLowerCase().includes(q);
      return matchesName || matchesDomain || matchesDepartment || matchesYear;
    }

    return true;
  });

  return (
    <div>
      <PageHeader 
        title={`Good morning, ${currentUser?.name || "Faculty"} 👋`} 
        subtitle="Here's what's happening with your documents today." 
      />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {path.length > 0 && (
            <button 
              onClick={() => setPath(path.slice(0, -1))} 
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" 
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-1.5 flex-wrap text-sm">
            {path.length === 0 ? (
              <h2 className="font-semibold text-foreground">Quick access (Domains)</h2>
            ) : (
              <>
                <button
                  onClick={() => setPath([])}
                  className="font-medium text-gray-500 hover:text-foreground hover:underline transition-colors"
                >
                  Domains
                </button>
                {path.map((crumb, idx) => {
                  const isLast = idx === path.length - 1;
                  return (
                    <div key={idx} className="flex items-center gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {isLast ? (
                        <span className="font-semibold text-foreground">{crumb.label}</span>
                      ) : (
                        <button
                          onClick={() => setPath(path.slice(0, idx + 1))}
                          className="font-medium text-gray-500 hover:text-foreground hover:underline transition-colors"
                        >
                          {crumb.label}
                        </button>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl p-6">
          {isDataLoading && documents.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-[var(--archyv-accent)] rounded-full animate-spin mb-3"></div>
              <p className="text-sm text-gray-500">Loading files...</p>
            </div>
          ) : (() => {
            // Level 0: Domains view
            if (path.length === 0) {
              const sortedDomains = [...domains].sort((a: any, b: any) => a.name.localeCompare(b.name));
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {sortedDomains.map((dom: any) => {
                    const count = allFiles.filter((f: any) => normalize(getDocDomain(f)) === normalize(dom.name)).length;
                    return (
                      <div key={dom.id} onClick={() => setPath([{ type: "domain", value: dom.name, label: dom.name }])} className="h-full">
                        <DomainCard name={dom.name} count={count} isFaculty={dom.isFaculty} />
                      </div>
                    );
                  })}
                  {sortedDomains.length === 0 && <p className="text-gray-400 col-span-full text-center py-8">No domains available.</p>}
                </div>
              );
            }

            const selectedDomain = path.find(c => c.type === "domain")?.value;
            const selectedDomainObj = domains.find((d: any) => normalize(d.name) === normalize(selectedDomain));

            // Filter active files based on all currently applied crumbs in path
            let currentFiles = allFiles.filter((f: any) => normalize(getDocDomain(f)) === normalize(selectedDomain));

            const selectedSubdomainCrumb = path.find(c => c.type === "subdomain");
            if (selectedSubdomainCrumb) {
              if (selectedSubdomainCrumb.value === "__DIRECT__") {
                currentFiles = currentFiles.filter((f: any) => !getDocSubdomain(f));
              } else {
                currentFiles = currentFiles.filter((f: any) => normalize(getDocSubdomain(f)) === normalize(selectedSubdomainCrumb.value));
              }
            }

            const selectedYearCrumb = path.find(c => c.type === "academicYear");
            if (selectedYearCrumb) {
              if (selectedYearCrumb.value === "__DIRECT__") {
                currentFiles = currentFiles.filter((f: any) => !getDocYear(f));
              } else {
                currentFiles = currentFiles.filter((f: any) => normalize(getDocYear(f)) === normalize(selectedYearCrumb.value));
              }
            }

            const selectedYosCrumb = path.find(c => c.type === "yearOfStudy");
            if (selectedYosCrumb) {
              currentFiles = currentFiles.filter((f: any) => normalizeYos(getDocYearOfStudy(f)) === normalizeYos(selectedYosCrumb.value));
            }

            const selectedBranchCrumb = path.find(c => c.type === "branch");
            if (selectedBranchCrumb) {
              if (selectedBranchCrumb.value === "__DIRECT__") {
                currentFiles = currentFiles.filter((f: any) => !getDocBranch(f));
              } else {
                currentFiles = currentFiles.filter((f: any) => normalize(getDocBranch(f)) === normalize(selectedBranchCrumb.value));
              }
            }

            const selectedSectionCrumb = path.find(c => c.type === "section");
            if (selectedSectionCrumb) {
              if (selectedSectionCrumb.value === "__OVERALL__") {
                currentFiles = currentFiles.filter((f: any) => !cleanSectionName(getDocSection(f)));
              } else {
                currentFiles = currentFiles.filter((f: any) => cleanSectionName(getDocSection(f)).toLowerCase() === selectedSectionCrumb.value.toLowerCase());
              }
            }

            const selectedSemesterCrumb = path.find(c => c.type === "semester");
            if (selectedSemesterCrumb) {
              if (selectedSemesterCrumb.value === "__NONE__") {
                currentFiles = currentFiles.filter((f: any) => !normalizeSem(getDocSem(f)));
              } else {
                currentFiles = currentFiles.filter((f: any) => normalizeSem(getDocSem(f)) === selectedSemesterCrumb.value);
              }
            }

            const selectedStudentCrumb = path.find(c => c.type === "student");
            if (selectedStudentCrumb) {
              if (selectedStudentCrumb.value === "__DIRECT__") {
                currentFiles = currentFiles.filter((f: any) => !getDocStudentRegisterNumber(f));
              } else {
                currentFiles = currentFiles.filter((f: any) => getDocStudentRegisterNumber(f) === selectedStudentCrumb.value.toUpperCase());
              }
            }

            // Special hierarchy for Admissions: Admissions -> Academic Year -> Branch -> Files in that path
            const isAdmissions = normalize(selectedDomain) === "admissions";
            const isPlacements = normalize(selectedDomain) === "placements";
            if (isAdmissions) {
              // 1. ACADEMIC YEAR
              if (!selectedYearCrumb) {
                const dbYears = (academicYears || []).map((y: any) => y.year).filter(Boolean);
                const fileYears = (Array.from(new Set(currentFiles.map((f: any) => getDocYear(f)).filter(Boolean))) as string[]);
                const allYears = (Array.from(new Set([...dbYears, ...fileYears])) as string[]).sort();
                const directYearCount = currentFiles.filter((f: any) => !getDocYear(f)).length;

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {directYearCount > 0 && (
                      <div
                        onClick={() => setPath([...path, { type: "academicYear", value: "__DIRECT__", label: "Direct Files" }])}
                        className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                      >
                        <div className="w-12 h-12 relative mb-2 shrink-0"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                        <span className="font-semibold text-sm">Direct Files</span>
                        <span className="text-xs text-gray-400 mt-1">{directYearCount} {directYearCount === 1 ? 'file' : 'files'}</span>
                      </div>
                    )}
                    {allYears.map((year: string) => {
                      const count = currentFiles.filter((f: any) => normalize(getDocYear(f)) === normalize(year)).length;
                      return (
                        <div
                          key={year}
                          onClick={() => setPath([...path, { type: "academicYear", value: year, label: year }])}
                          className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                        >
                          <div className="w-12 h-12 relative mb-2 shrink-0"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                          <span className="font-semibold text-sm">{year}</span>
                          <span className="text-xs text-gray-400 mt-1">{count} {count === 1 ? 'file' : 'files'}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              }

              // 2. BRANCH
              if (!selectedBranchCrumb) {
                const dbBranches = (departments || []).map((d: any) => d.name).filter(Boolean);
                const fileBranches = (Array.from(new Set(currentFiles.map((f: any) => getDocBranch(f)).filter(Boolean))) as string[]);
                const allBranches = (Array.from(new Set([...dbBranches, ...fileBranches])) as string[]).sort((a: string, b: string) => a.localeCompare(b));
                const directBranchCount = currentFiles.filter((f: any) => !getDocBranch(f)).length;

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {directBranchCount > 0 && (
                      <div
                        onClick={() => setPath([...path, { type: "branch", value: "__DIRECT__", label: "Direct Files" }])}
                        className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                      >
                        <div className="w-12 h-12 relative mb-2 shrink-0"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                        <span className="font-semibold text-sm">Direct Files</span>
                        <span className="text-xs text-gray-400 mt-1">{directBranchCount} {directBranchCount === 1 ? 'file' : 'files'}</span>
                      </div>
                    )}
                    {allBranches.map((branch: string) => {
                      const count = currentFiles.filter((f: any) => normalize(getDocBranch(f)) === normalize(branch)).length;
                      return (
                        <div
                          key={branch}
                          onClick={() => setPath([...path, { type: "branch", value: branch, label: branch }])}
                          className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                        >
                          <div className="w-12 h-12 relative mb-2 shrink-0"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                          <span className="font-semibold text-sm">{branch}</span>
                          <span className="text-xs text-gray-400 mt-1">{count} {count === 1 ? 'file' : 'files'}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              }

              // 3. FILES IN THAT PATH
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {currentFiles.map((file: any) => (
                    <FileCard key={file.id} file={file} />
                  ))}
                  {currentFiles.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-300">
                        <div className="w-8 h-8 relative"><Image src="/logo.png" alt="Folder" fill sizes="32px" className="object-contain opacity-40" /></div>
                      </div>
                      <p className="text-sm font-semibold text-gray-600">No files found.</p>
                      <p className="text-xs text-gray-400 mt-1">There are no approved documents in this folder.</p>
                    </div>
                  )}
                </div>
              );
            }

            // Path hierarchy order:
            // 1. Subdomain -> 2. Academic Year -> 3. Year of Studying -> 4. Branch -> 5. Section -> 6. Semester -> 7. Files
            // If any of this is not specified, ignore it automatically.

            // 1. SUBDOMAIN (if there)
            if (!selectedSubdomainCrumb) {
              const configuredSubs = (selectedDomainObj?.subdomains || []).map((s: any) => s.name).filter(Boolean);
              const fileSubs = (Array.from(new Set(currentFiles.map((f: any) => getDocSubdomain(f)).filter(Boolean))) as string[]);
              const allSubs = (Array.from(new Set([...configuredSubs, ...fileSubs])) as string[]).sort((a: string, b: string) => a.localeCompare(b));

              if (allSubs.length > 0) {
                const directCount = currentFiles.filter((f: any) => !getDocSubdomain(f)).length;
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {directCount > 0 && (
                      <div
                        onClick={() => setPath([...path, { type: "subdomain", value: "__DIRECT__", label: "Direct Files" }])}
                        className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                      >
                        <div className="w-12 h-12 relative mb-2 shrink-0"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                        <span className="font-semibold text-sm">Direct Files</span>
                        <span className="text-xs text-gray-400 mt-1">{directCount} {directCount === 1 ? 'file' : 'files'}</span>
                      </div>
                    )}
                    {allSubs.map((sub: string) => {
                      const count = currentFiles.filter((f: any) => normalize(getDocSubdomain(f)) === normalize(sub)).length;
                      return (
                        <div
                          key={sub}
                          onClick={() => setPath([...path, { type: "subdomain", value: sub, label: sub }])}
                          className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                        >
                          <div className="w-12 h-12 relative mb-2 shrink-0"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                          <span className="font-semibold text-sm">{sub}</span>
                          <span className="text-xs text-gray-400 mt-1">{count} {count === 1 ? 'file' : 'files'}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              }
            }

            // 2. ACADEMIC YEAR (all academic years from database even no files in that year)
            if (!selectedYearCrumb) {
              const dbYears = (academicYears || []).map((y: any) => y.year).filter(Boolean);
              const fileYears = (Array.from(new Set(currentFiles.map((f: any) => getDocYear(f)).filter(Boolean))) as string[]);
              const allYears = (Array.from(new Set([...dbYears, ...fileYears])) as string[]).sort();

              if (allYears.length > 0) {
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {allYears.map((year: string) => {
                      const count = currentFiles.filter((f: any) => normalize(getDocYear(f)) === normalize(year)).length;
                      return (
                        <div
                          key={year}
                          onClick={() => setPath([...path, { type: "academicYear", value: year, label: year }])}
                          className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                        >
                          <div className="w-12 h-12 relative mb-2 shrink-0"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                          <span className="font-semibold text-sm">{year}</span>
                          <span className="text-xs text-gray-400 mt-1">{count} {count === 1 ? 'file' : 'files'}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              }
            }

            // 3. YEAR OF STUDYING (1st year, 2nd year, 3rd year, 4th year even no files are there in that path)
            if (!selectedYosCrumb) {
              const standardYos = [
                { key: "1st", label: "1st yr" },
                { key: "2nd", label: "2nd yr" },
                { key: "3rd", label: "3rd yr" },
                { key: "4th", label: "4th yr" }
              ];

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {standardYos.map((yosItem) => {
                    const count = currentFiles.filter((f: any) => normalizeYos(getDocYearOfStudy(f)) === yosItem.key).length;
                    return (
                      <div
                        key={yosItem.key}
                        onClick={() => setPath([...path, { type: "yearOfStudy", value: yosItem.key, label: yosItem.label }])}
                        className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                      >
                        <div className="w-12 h-12 relative mb-2 shrink-0"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                        <span className="font-semibold text-sm">{yosItem.label}</span>
                        <span className="text-xs text-gray-400 mt-1">{count} {count === 1 ? 'file' : 'files'}</span>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // 4. BRANCH (from database even no files are there)
            if (!selectedBranchCrumb) {
              const dbBranches = (departments || []).map((d: any) => d.name).filter(Boolean);
              const fileBranches = (Array.from(new Set(currentFiles.map((f: any) => getDocBranch(f)).filter(Boolean))) as string[]);
              const allBranches = (Array.from(new Set([...dbBranches, ...fileBranches])) as string[]).sort((a: string, b: string) => a.localeCompare(b));

              if (allBranches.length > 0) {
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {allBranches.map((branch: string) => {
                      const count = currentFiles.filter((f: any) => normalize(getDocBranch(f)) === normalize(branch)).length;
                      return (
                        <div
                          key={branch}
                          onClick={() => setPath([...path, { type: "branch", value: branch, label: branch }])}
                          className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                        >
                          <div className="w-12 h-12 relative mb-2 shrink-0"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                          <span className="font-semibold text-sm">{branch}</span>
                          <span className="text-xs text-gray-400 mt-1">{count} {count === 1 ? 'file' : 'files'}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              }
            }

            // 5. SECTION
            if (!selectedSectionCrumb) {
              const branchObj = departments.find((d: any) => normalize(d.name) === normalize(selectedBranchCrumb?.value));
              const configuredSections = (branchObj?.sections || []).map((s: any) => cleanSectionName(s.name)).filter(Boolean);
              const fileSections = (Array.from(new Set(currentFiles.map((f: any) => cleanSectionName(getDocSection(f))).filter(Boolean))) as string[]);
              const allSections = (Array.from(new Set([...configuredSections, ...fileSections])) as string[]).sort((a: string, b: string) => a.localeCompare(b));

              if (allSections.length > 0) {
                const overallCount = currentFiles.filter((f: any) => !cleanSectionName(getDocSection(f))).length;
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div
                      onClick={() => setPath([...path, { type: "section", value: "__OVERALL__", label: "Overall Section" }])}
                      className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                    >
                      <div className="w-12 h-12 relative mb-2 shrink-0"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                      <span className="font-semibold text-sm">Overall Section</span>
                      <span className="text-xs text-gray-400 mt-1">{overallCount} {overallCount === 1 ? 'file' : 'files'}</span>
                    </div>
                    {allSections.map((sec: string) => {
                      const count = currentFiles.filter((f: any) => cleanSectionName(getDocSection(f)).toLowerCase() === sec.toLowerCase()).length;
                      return (
                        <div
                          key={sec}
                          onClick={() => setPath([...path, { type: "section", value: sec, label: `Section ${sec}` }])}
                          className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                        >
                          <div className="w-12 h-12 relative mb-2 shrink-0"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                          <span className="font-semibold text-sm">Section {sec}</span>
                          <span className="text-xs text-gray-400 mt-1">{count} {count === 1 ? 'file' : 'files'}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              }
            }

            // Special hierarchy for Placements: Placements -> Subdomain -> Academic Year -> Year of Study -> Branch -> Section -> Student Register Number -> Files
            if (isPlacements) {
              // 6. STUDENT REGISTER NUMBER
              if (!selectedStudentCrumb) {
                const studentRegs = (Array.from(new Set(
                  currentFiles
                    .map((f: any) => getDocStudentRegisterNumber(f))
                    .filter(Boolean)
                )) as string[]).sort((a: string, b: string) => a.localeCompare(b));

                const directStudentCount = currentFiles.filter((f: any) => !getDocStudentRegisterNumber(f)).length;

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {directStudentCount > 0 && (
                      <div
                        onClick={() => setPath([...path, { type: "student", value: "__DIRECT__", label: "Other Documents" }])}
                        className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                      >
                        <div className="w-12 h-12 relative mb-2 shrink-0"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                        <span className="font-semibold text-sm">Other Documents</span>
                        <span className="text-xs text-gray-400 mt-1">{directStudentCount} {directStudentCount === 1 ? 'file' : 'files'}</span>
                      </div>
                    )}
                    {studentRegs.map((reg: string) => {
                      const count = currentFiles.filter((f: any) => getDocStudentRegisterNumber(f) === reg).length;
                      return (
                        <div
                          key={reg}
                          onClick={() => setPath([...path, { type: "student", value: reg, label: reg }])}
                          className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors group"
                        >
                          <div className="w-12 h-12 relative mb-2 shrink-0"><Image src="/logo.png" alt="Student" fill sizes="48px" className="object-contain" /></div>
                          <span className="font-semibold text-sm font-mono tracking-wider">{reg}</span>
                          <span className="text-xs text-gray-400 mt-1">{count} {count === 1 ? 'file' : 'files'}</span>
                        </div>
                      );
                    })}
                    {studentRegs.length === 0 && directStudentCount === 0 && (
                      <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-300">
                          <div className="w-8 h-8 relative"><Image src="/logo.png" alt="Student" fill sizes="32px" className="object-contain opacity-40" /></div>
                        </div>
                        <p className="text-sm font-semibold text-gray-600">No student documents found.</p>
                        <p className="text-xs text-gray-400 mt-1">There are no student documents uploaded in this path yet.</p>
                      </div>
                    )}
                  </div>
                );
              }

              // 7. FILES FOR THIS STUDENT
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {currentFiles.map((file: any) => (
                    <FileCard key={file.id} file={file} />
                  ))}
                  {currentFiles.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-300">
                        <div className="w-8 h-8 relative"><Image src="/logo.png" alt="Folder" fill sizes="32px" className="object-contain opacity-40" /></div>
                      </div>
                      <p className="text-sm font-semibold text-gray-600">No files found.</p>
                      <p className="text-xs text-gray-400 mt-1">There are no approved documents for this student.</p>
                    </div>
                  )}
                </div>
              );
            }

            // 6. SEMESTER (EVEN OR ODD)
            if (!selectedSemesterCrumb) {
              const sem1Count = currentFiles.filter((f: any) => normalizeSem(getDocSem(f)) === "1").length;
              const sem2Count = currentFiles.filter((f: any) => normalizeSem(getDocSem(f)) === "2").length;
              const noSemCount = currentFiles.filter((f: any) => !normalizeSem(getDocSem(f))).length;

              if (sem1Count > 0 || sem2Count > 0) {
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {sem1Count > 0 && (
                      <div
                        onClick={() => setPath([...path, { type: "semester", value: "1", label: "Semester 1 (Odd)" }])}
                        className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                      >
                        <div className="w-12 h-12 relative mb-2 shrink-0"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                        <span className="font-semibold text-sm">Semester 1 (Odd)</span>
                        <span className="text-xs text-gray-400 mt-1">{sem1Count} {sem1Count === 1 ? 'file' : 'files'}</span>
                      </div>
                    )}
                    {sem2Count > 0 && (
                      <div
                        onClick={() => setPath([...path, { type: "semester", value: "2", label: "Semester 2 (Even)" }])}
                        className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                      >
                        <div className="w-12 h-12 relative mb-2 shrink-0"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                        <span className="font-semibold text-sm">Semester 2 (Even)</span>
                        <span className="text-xs text-gray-400 mt-1">{sem2Count} {sem2Count === 1 ? 'file' : 'files'}</span>
                      </div>
                    )}
                    {noSemCount > 0 && (
                      <div
                        onClick={() => setPath([...path, { type: "semester", value: "__NONE__", label: "Direct Files" }])}
                        className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                      >
                        <div className="w-12 h-12 relative mb-2 shrink-0"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                        <span className="font-semibold text-sm">Direct Files</span>
                        <span className="text-xs text-gray-400 mt-1">{noSemCount} {noSemCount === 1 ? 'file' : 'files'}</span>
                      </div>
                    )}
                  </div>
                );
              }
            }

            // 7. FILES
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentFiles.map((file: any) => (
                  <FileCard key={file.id} file={file} />
                ))}
                {currentFiles.length === 0 && <p className="text-gray-400 col-span-full text-center py-8">No files found.</p>}
              </div>
            );
          })()}
        </div>
      </div>

      {path.length === 0 && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">My Documents</h2>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <span>My Documents</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400">Approved Documents ({facultyDocs.length})</span>
          </div>

          {isDataLoading && documents.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500 bg-white border border-[var(--border)] rounded-2xl flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-[var(--archyv-accent)] border-t-transparent rounded-full animate-spin"></div>
              Loading documents...
            </div>
          ) : facultyDocs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {facultyDocs.map((file: any) => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-gray-500 bg-white border border-[var(--border)] rounded-2xl">
              No approved documents uploaded yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
