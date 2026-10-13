"use client";

import PageHeader from "@/components/ui/PageHeader";
import DomainCard from "@/components/ui/DomainCard";
import { ChevronRight, ArrowUpCircle, CheckCircle2, XCircle, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAppContext } from "@/store/AppContext";

import { useState } from "react";
import FileCard from "@/components/ui/FileCard";
import { ArrowLeft } from "lucide-react";
export default function AdminOverview() {
  const { dashboardStats, documents, domains, academicYears, departments, isDataLoading } = useAppContext();
  const allFiles = documents.filter((f: any) => !f.isDeleted);

  const [path, setPath] = useState<string[]>([]);
  // path[0] = domain, path[1] = academicYear, path[2] = yearOfStudy, path[3] = branch, path[4] = section, path[5] = semester, path[6] = subdomain

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
    if (s === "1" || s === "sem 1" || s === "semester 1" || s === "sem-1" || s === "semester-1") return "1";
    if (s === "2" || s === "sem 2" || s === "semester 2" || s === "sem-2" || s === "semester-2") return "2";
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
    return s.replace(/^(section|sec)\s+/i, '').trim();
  };
  const getDocDomain = (f: any) => (typeof f.domain === 'object' ? f.domain?.name : f.domain) || '';
  const getDocYear = (f: any) => (typeof f.academicYear === 'object' ? f.academicYear?.year : (f.year || f.academicYear)) || '';
  const getDocYearOfStudy = (f: any) => f.yearOfStudy || '';
  const getDocDept = (f: any) => f.branch || (typeof f.department === 'object' ? f.department?.name : f.department) || '';
  const getDocBranch = (f: any) => f.branch || (typeof f.department === 'object' ? f.department?.name : f.department) || '';
  const getDocSection = (f: any) => f.section || (typeof f.sectionRel === 'object' ? f.sectionRel?.name : '') || '';
  const getDocSem = (f: any) => f.semester || '';
  const getDocSubdomain = (f: any) => (typeof f.subdomain === 'object' ? f.subdomain?.name : f.subdomain) || '';

  // Calculate true storage usage from active files
  const totalBytes = dashboardStats?.totalBytes || 0;
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const totalStr = parseFloat(totalMB) > 1024 ? `${(parseFloat(totalMB) / 1024).toFixed(2)} GB` : `${totalMB} MB`;
  const percentage = Math.min((totalBytes / (100 * 1024 * 1024 * 1024)) * 100, 100).toFixed(1);
  const domainStats = dashboardStats?.domainStats || [];
  const recentActivity = dashboardStats?.recentActivity || [];


  const getActionIcon = (action: string) => {
    switch (action) {
      case "Uploaded file": return <ArrowUpCircle className="w-4 h-4 text-gray-500" />;
      case "Approved file": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "Rejected file": return <XCircle className="w-4 h-4 text-red-500" />;
      case "Deleted file": return <Trash2 className="w-4 h-4 text-gray-500" />;
      case "Restored file": return <ArrowUpCircle className="w-4 h-4 text-blue-500" />;
      case "Permanently deleted file": return <Trash2 className="w-4 h-4 text-red-600" />;
      case "Accessed file": return <Eye className="w-4 h-4 text-gray-500" />;
      case "Created folder": return <div className="w-4 h-4 relative"><Image src="/logo.png" alt="Folder" fill sizes="16px" className="object-contain" /></div>;
      default: return <ArrowUpCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div>
      <PageHeader
        title="Good morning, Admin 👋"
        subtitle="Here's what's happening with ARCHYV today."
      />

      {path.length === 0 && (
        <div className="mb-8 bg-white border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Storage</h2>
            <Link href="/admin/storage" className="text-xs font-semibold text-[var(--archyv-accent-hover)] flex items-center hover:underline">
              View details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-foreground">{totalStr} <span className="text-gray-400 font-normal">used</span></span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[var(--archyv-accent)] rounded-full" style={{ width: `${percentage}%` }}></div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {path.length > 0 && (
            <button onClick={() => setPath(path.slice(0, -1))} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Back">
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
                  const displayCrumb = (crumb === "No Semester" || crumb === "No Subdomain") ? "Direct Files" : crumb;
                  return (
                    <div key={idx} className="flex items-center gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {isLast ? (
                        <span className="font-semibold text-foreground">{displayCrumb}</span>
                      ) : (
                        <button
                          onClick={() => setPath(path.slice(0, idx + 1))}
                          className="font-medium text-gray-500 hover:text-foreground hover:underline transition-colors"
                        >
                          {displayCrumb}
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
            if (path.length === 0) {
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[...domainStats].sort((a: any, b: any) => a.name.localeCompare(b.name)).map((stat: any) => {
                    const domObj = domains.find((d: any) => normalize(d.name) === normalize(stat.name));
                    return (
                      <div key={stat.id} onClick={() => setPath([stat.name])}>
                        <DomainCard name={stat.name} count={stat.count} isFaculty={domObj?.isFaculty} />
                      </div>
                    );
                  })}
                </div>
              );
            }

            const selectedDomainObj = domains.find((d: any) => normalize(d.name) === normalize(path[0]));
            const isCurrentFacultyDomain = Boolean(selectedDomainObj?.isFaculty);

            if (isCurrentFacultyDomain) {
              const domainSubdomains = (selectedDomainObj?.subdomains || []).map((s: any) => s.name).sort();
              const hasSubdomains = domainSubdomains.length > 0;

              // Build branch list for faculty domain
              const facultyBranchesSet = new Set<string>();
              departments.forEach((d: any) => { if (d.name) facultyBranchesSet.add(d.name); });
              facultyBranchesSet.add("CSD");
              facultyBranchesSet.add("CSIT");
              allFiles.forEach((f: any) => {
                if (normalize(getDocDomain(f)) === normalize(path[0])) {
                  const d = getDocDept(f);
                  if (d) facultyBranchesSet.add(d);
                }
              });
              const branches = Array.from(facultyBranchesSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

              if (!hasSubdomains) {
                // Flow: Domain -> Branch -> (Section if exists) -> Files
                if (path.length === 1) {
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {branches.map((b: string) => {
                        const count = allFiles.filter((f: any) =>
                          normalize(getDocDomain(f)) === normalize(path[0]) &&
                          normalize(getDocDept(f)) === normalize(b)
                        ).length;
                        return (
                          <div key={b} onClick={() => setPath([...path, b])} className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors">
                            <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                            <span className="font-semibold text-sm">{b}</span>
                            <span className="text-xs text-gray-400 mt-1">{count} {count === 1 ? 'file' : 'files'}</span>
                          </div>
                        );
                      })}
                      {branches.length === 0 && <p className="text-gray-400 col-span-full text-center py-8">No branches available.</p>}
                    </div>
                  );
                }

                const selectedBranchObj = departments.find((d: any) => normalize(d.name) === normalize(path[1]));
                const branchSections = (selectedBranchObj?.sections || []).map((s: any) => s.name);
                const facultySectionsSet = new Set<string>(branchSections);
                allFiles.forEach((f: any) => {
                  if (normalize(getDocDomain(f)) === normalize(path[0]) && normalize(getDocDept(f)) === normalize(path[1])) {
                    const s = getDocSection(f);
                    if (s && normalize(s) !== "overall section" && normalize(s) !== "overall" && normalize(s) !== "none") {
                      facultySectionsSet.add(s);
                    }
                  }
                });
                const facSections = Array.from(facultySectionsSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

                if (facSections.length > 0 && path.length === 2) {
                  const overallCount = allFiles.filter((f: any) => {
                    if (normalize(getDocDomain(f)) !== normalize(path[0]) || normalize(getDocDept(f)) !== normalize(path[1])) return false;
                    const sec = normalize(getDocSection(f));
                    return !sec || sec === "overall section" || sec === "overall" || sec === "none";
                  }).length;

                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div onClick={() => setPath([...path, "Overall Section"])} className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors">
                        <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                        <span className="font-semibold text-sm">Overall Section</span>
                        <span className="text-xs text-gray-400 mt-1">{overallCount} {overallCount === 1 ? 'file' : 'files'}</span>
                      </div>
                      {facSections.map((sec: string) => {
                        const count = allFiles.filter((f: any) =>
                          normalize(getDocDomain(f)) === normalize(path[0]) &&
                          normalize(getDocDept(f)) === normalize(path[1]) &&
                          normalize(getDocSection(f)) === normalize(sec)
                        ).length;
                        return (
                          <div key={sec} onClick={() => setPath([...path, sec])} className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors">
                            <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                            <span className="font-semibold text-sm">{sec}</span>
                            <span className="text-xs text-gray-400 mt-1">{count} {count === 1 ? 'file' : 'files'}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // Show files for Domain -> Branch (-> Section)
                const branchFiles = allFiles.filter((f: any) => {
                  if (normalize(getDocDomain(f)) !== normalize(path[0])) return false;
                  if (normalize(getDocDept(f)) !== normalize(path[1])) return false;
                  if (path[2]) {
                    const sec = normalize(getDocSection(f));
                    if (path[2] === "Overall Section") {
                      if (sec && sec !== "overall section" && sec !== "overall" && sec !== "none") return false;
                    } else {
                      if (sec !== normalize(path[2])) return false;
                    }
                  }
                  return true;
                });
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {branchFiles.map((file: any) => (
                      <FileCard key={file.id} file={file} />
                    ))}
                    {branchFiles.length === 0 && <p className="text-gray-400 col-span-full text-center py-8">No files found.</p>}
                  </div>
                );
              } else {
                // Flow if subdomains exist: Domain -> Subdomain -> Branch -> (Section if exists) -> Files
                if (path.length === 1) {
                  const directCount = allFiles.filter((f: any) => {
                    if (normalize(getDocDomain(f)) !== normalize(path[0])) return false;
                    const sub = normalize(getDocSubdomain(f));
                    return !sub || sub === "no subdomain" || sub === "none";
                  }).length;

                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div onClick={() => setPath([...path, "No Subdomain"])} className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors">
                        <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                        <span className="font-semibold text-sm">Direct Files</span>
                        <span className="text-xs text-gray-400 mt-1">{directCount} {directCount === 1 ? 'file' : 'files'}</span>
                      </div>
                      {domainSubdomains.map((s: string) => {
                        const subCount = allFiles.filter((f: any) =>
                          normalize(getDocDomain(f)) === normalize(path[0]) &&
                          normalize(getDocSubdomain(f)) === normalize(s)
                        ).length;
                        return (
                          <div key={s} onClick={() => setPath([...path, s])} className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors">
                            <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                            <span className="font-semibold text-sm">{s}</span>
                            <span className="text-xs text-gray-400 mt-1">{subCount} {subCount === 1 ? 'file' : 'files'}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                if (path.length === 2) {
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {branches.map((b: string) => {
                        const count = allFiles.filter((f: any) => {
                          if (normalize(getDocDomain(f)) !== normalize(path[0])) return false;
                          if (path[1] === "No Subdomain") {
                            const sub = normalize(getDocSubdomain(f));
                            if (sub && sub !== "no subdomain" && sub !== "none") return false;
                          } else {
                            if (normalize(getDocSubdomain(f)) !== normalize(path[1])) return false;
                          }
                          return normalize(getDocDept(f)) === normalize(b);
                        }).length;

                        return (
                          <div key={b} onClick={() => setPath([...path, b])} className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors">
                            <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                            <span className="font-semibold text-sm">{b}</span>
                            <span className="text-xs text-gray-400 mt-1">{count} {count === 1 ? 'file' : 'files'}</span>
                          </div>
                        );
                      })}
                      {branches.length === 0 && <p className="text-gray-400 col-span-full text-center py-8">No branches available.</p>}
                    </div>
                  );
                }

                const selectedBranchObj = departments.find((d: any) => normalize(d.name) === normalize(path[2]));
                const branchSections = (selectedBranchObj?.sections || []).map((s: any) => s.name);
                const facultySectionsSet = new Set<string>(branchSections);
                allFiles.forEach((f: any) => {
                  if (normalize(getDocDomain(f)) === normalize(path[0]) && normalize(getDocDept(f)) === normalize(path[2])) {
                    const s = getDocSection(f);
                    if (s && normalize(s) !== "overall section" && normalize(s) !== "overall" && normalize(s) !== "none") {
                      facultySectionsSet.add(s);
                    }
                  }
                });
                const facSections = Array.from(facultySectionsSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

                if (facSections.length > 0 && path.length === 3) {
                  const overallCount = allFiles.filter((f: any) => {
                    if (normalize(getDocDomain(f)) !== normalize(path[0]) || normalize(getDocDept(f)) !== normalize(path[2])) return false;
                    if (path[1] === "No Subdomain") {
                      const sub = normalize(getDocSubdomain(f));
                      if (sub && sub !== "no subdomain" && sub !== "none") return false;
                    } else {
                      if (normalize(getDocSubdomain(f)) !== normalize(path[1])) return false;
                    }
                    const sec = normalize(getDocSection(f));
                    return !sec || sec === "overall section" || sec === "overall" || sec === "none";
                  }).length;

                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div onClick={() => setPath([...path, "Overall Section"])} className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors">
                        <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                        <span className="font-semibold text-sm">Overall Section</span>
                        <span className="text-xs text-gray-400 mt-1">{overallCount} {overallCount === 1 ? 'file' : 'files'}</span>
                      </div>
                      {facSections.map((sec: string) => {
                        const count = allFiles.filter((f: any) => {
                          if (normalize(getDocDomain(f)) !== normalize(path[0])) return false;
                          if (path[1] === "No Subdomain") {
                            const sub = normalize(getDocSubdomain(f));
                            if (sub && sub !== "no subdomain" && sub !== "none") return false;
                          } else {
                            if (normalize(getDocSubdomain(f)) !== normalize(path[1])) return false;
                          }
                          if (normalize(getDocDept(f)) !== normalize(path[2])) return false;
                          return normalize(getDocSection(f)) === normalize(sec);
                        }).length;

                        return (
                          <div key={sec} onClick={() => setPath([...path, sec])} className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors">
                            <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                            <span className="font-semibold text-sm">{sec}</span>
                            <span className="text-xs text-gray-400 mt-1">{count} {count === 1 ? 'file' : 'files'}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // Show files
                const branchFiles = allFiles.filter((f: any) => {
                  if (normalize(getDocDomain(f)) !== normalize(path[0])) return false;
                  if (path[1] === "No Subdomain") {
                    const sub = normalize(getDocSubdomain(f));
                    if (sub && sub !== "no subdomain" && sub !== "none") return false;
                  } else {
                    if (normalize(getDocSubdomain(f)) !== normalize(path[1])) return false;
                  }
                  if (normalize(getDocDept(f)) !== normalize(path[2])) return false;
                  if (path[3]) {
                    const sec = normalize(getDocSection(f));
                    if (path[3] === "Overall Section") {
                      if (sec && sec !== "overall section" && sec !== "overall" && sec !== "none") return false;
                    } else {
                      if (sec !== normalize(path[3])) return false;
                    }
                  }
                  return true;
                });

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {branchFiles.map((file: any) => (
                      <FileCard key={file.id} file={file} />
                    ))}
                    {branchFiles.length === 0 && <p className="text-gray-400 col-span-full text-center py-8">No files found.</p>}
                  </div>
                );
              }
            }

            const currentStep = path.length;

            if (currentStep === 1) {
              const yearsSet = new Set<string>();
              academicYears.forEach((y: any) => { if (y.year) yearsSet.add(y.year); });
              allFiles.forEach((f: any) => {
                if (normalize(getDocDomain(f)) === normalize(path[0])) {
                  const y = getDocYear(f);
                  if (y) yearsSet.add(y);
                }
              });
              const years = Array.from(yearsSet).sort();
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {years.map((y: any) => {
                    const count = allFiles.filter((f: any) => 
                      normalize(getDocDomain(f)) === normalize(path[0]) && 
                      normalize(getDocYear(f)) === normalize(y)
                    ).length;
                    return (
                      <div key={y} onClick={() => setPath([...path, y])} className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors">
                        <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                        <span className="font-semibold text-sm">{y}</span>
                        <span className="text-xs text-gray-400 mt-1">{count} {count === 1 ? 'file' : 'files'}</span>
                      </div>
                    );
                  })}
                  {years.length === 0 && <p className="text-gray-400 col-span-full text-center py-8">No academic years available.</p>}
                </div>
              );
            }

            if (currentStep === 2) {
              const yos = ["1st yr", "2nd yr", "3rd yr", "4th yr"];
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {yos.map((y: any) => {
                    const count = allFiles.filter((f: any) => 
                      normalize(getDocDomain(f)) === normalize(path[0]) && 
                      normalize(getDocYear(f)) === normalize(path[1]) && 
                      normalizeYos(getDocYearOfStudy(f)) === normalizeYos(y)
                    ).length;
                    return (
                      <div key={y} onClick={() => setPath([...path, y])} className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors">
                        <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                        <span className="font-semibold text-sm">{y}</span>
                        <span className="text-xs text-gray-400 mt-1">{count} {count === 1 ? 'file' : 'files'}</span>
                      </div>
                    );
                  })}
                </div>
              );
            }

            if (currentStep === 3) {
              const deptsSet = new Set<string>();
              departments.forEach((d: any) => { if (d.name) deptsSet.add(d.name); });
              allFiles.forEach((f: any) => {
                if (
                  normalize(getDocDomain(f)) === normalize(path[0]) &&
                  normalize(getDocYear(f)) === normalize(path[1]) &&
                  normalizeYos(getDocYearOfStudy(f)) === normalizeYos(path[2])
                ) {
                  const d = getDocDept(f);
                  if (d) deptsSet.add(d);
                }
              });
              const depts = Array.from(deptsSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {depts.map((d: any) => {
                    const count = allFiles.filter((f: any) => 
                      normalize(getDocDomain(f)) === normalize(path[0]) && 
                      normalize(getDocYear(f)) === normalize(path[1]) && 
                      normalizeYos(getDocYearOfStudy(f)) === normalizeYos(path[2]) &&
                      normalize(getDocDept(f)) === normalize(d)
                    ).length;
                    return (
                      <div key={d} onClick={() => setPath([...path, d])} className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors">
                        <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                        <span className="font-semibold text-sm">{d}</span>
                        <span className="text-xs text-gray-400 mt-1">{count} {count === 1 ? 'file' : 'files'}</span>
                      </div>
                    );
                  })}
                  {depts.length === 0 && <p className="text-gray-400 col-span-full text-center py-8">No branches available.</p>}
                </div>
              );
            }

            // Path length >= 4: Branch selected [domain, academicYear, yearOfStudy, branch, ...extra]
            const branchFiles = allFiles.filter((f: any) =>
              normalize(getDocDomain(f)) === normalize(path[0]) &&
              normalize(getDocYear(f)) === normalize(path[1]) &&
              normalizeYos(getDocYearOfStudy(f)) === normalizeYos(path[2]) &&
              normalize(getDocDept(f)) === normalize(path[3])
            );

            // Determine specific sections configured or existing in files
            const branchObj = departments.find((d: any) => normalize(d.name) === normalize(path[3]));
            const configuredSections = (branchObj?.sections || []).map((s: any) => s.name);
            const sectionsSet = new Set<string>();
            configuredSections.forEach((s: string) => {
              const clean = cleanSectionName(s);
              if (clean) sectionsSet.add(clean);
            });
            branchFiles.forEach((f: any) => {
              const s = getDocSection(f);
              const clean = cleanSectionName(s);
              if (clean) sectionsSet.add(clean);
            });
            const specificSections = Array.from(sectionsSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
            const branchHasSections = specificSections.length > 0;

            // Subdomains for domain
            const domainObj = domains.find((d: any) => normalize(d.name) === normalize(path[0]));
            const domainSubdomains = (domainObj?.subdomains || []).map((s: any) => s.name).sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
            const hasSubdomains = domainSubdomains.length > 0;

            // Parse selections from crumbs beyond branch
            let selectedSection: string | null = null;
            let selectedSemester: string | null = null;
            let selectedSubdomain: string | null = null;

            for (const crumb of path.slice(4)) {
              if (crumb === "Overall Section") {
                selectedSection = "Overall Section";
              } else if (crumb.startsWith("Section ")) {
                selectedSection = crumb.replace(/^Section\s+/i, '').trim();
              } else if (specificSections.some(s => cleanSectionName(s).toLowerCase() === cleanSectionName(crumb).toLowerCase())) {
                selectedSection = cleanSectionName(crumb);
              } else if (crumb === "Semester 1" || crumb === "1") {
                selectedSemester = "1";
              } else if (crumb === "Semester 2" || crumb === "2") {
                selectedSemester = "2";
              } else if (crumb === "No Semester") {
                selectedSemester = "NONE";
              } else if (domainSubdomains.some(s => normalize(s) === normalize(crumb))) {
                selectedSubdomain = crumb;
              } else if (crumb === "Direct Files" || crumb === "No Subdomain") {
                selectedSubdomain = "NONE";
              }
            }

            // Step A: If branch has specific sections and none selected yet, show Sections
            if (branchHasSections && selectedSection === null) {
              const overallCount = branchFiles.filter((f: any) => !normalizeSec(getDocSection(f))).length;
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div
                    onClick={() => setPath([...path, "Overall Section"])}
                    className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                  >
                    <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                    <span className="font-semibold text-sm">Overall Section</span>
                    <span className="text-xs text-gray-400 mt-1">{overallCount} {overallCount === 1 ? 'file' : 'files'}</span>
                  </div>
                  {specificSections.map((sec: string) => {
                    const count = branchFiles.filter((f: any) => cleanSectionName(getDocSection(f)).toLowerCase() === sec.toLowerCase()).length;
                    return (
                      <div
                        key={sec}
                        onClick={() => setPath([...path, `Section ${sec}`])}
                        className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                      >
                        <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                        <span className="font-semibold text-sm">Section {sec}</span>
                        <span className="text-xs text-gray-400 mt-1">{count} {count === 1 ? 'file' : 'files'}</span>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // Files scoped to the current section
            const sectionFiles = branchFiles.filter((f: any) => {
              if (selectedSection) {
                if (selectedSection === "Overall Section") {
                  return !normalizeSec(getDocSection(f));
                }
                return cleanSectionName(getDocSection(f)).toLowerCase() === selectedSection.toLowerCase();
              }
              return true;
            });

            // Step B: Check if files in this section/branch actually have Semesters
            const sem1Count = sectionFiles.filter(f => normalizeSem(getDocSem(f)) === "1").length;
            const sem2Count = sectionFiles.filter(f => normalizeSem(getDocSem(f)) === "2").length;
            const noSemCount = sectionFiles.filter(f => !normalizeSem(getDocSem(f))).length;
            const hasSemesters = sem1Count > 0 || sem2Count > 0;

            if (hasSemesters && selectedSemester === null) {
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sem1Count > 0 && (
                    <div
                      onClick={() => setPath([...path, "Semester 1"])}
                      className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                    >
                      <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                      <span className="font-semibold text-sm">Semester 1</span>
                      <span className="text-xs text-gray-400 mt-1">{sem1Count} {sem1Count === 1 ? 'file' : 'files'}</span>
                    </div>
                  )}
                  {sem2Count > 0 && (
                    <div
                      onClick={() => setPath([...path, "Semester 2"])}
                      className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                    >
                      <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                      <span className="font-semibold text-sm">Semester 2</span>
                      <span className="text-xs text-gray-400 mt-1">{sem2Count} {sem2Count === 1 ? 'file' : 'files'}</span>
                    </div>
                  )}
                  {noSemCount > 0 && (
                    <div
                      onClick={() => setPath([...path, "No Semester"])}
                      className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors"
                    >
                      <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                      <span className="font-semibold text-sm">Direct Files</span>
                      <span className="text-xs text-gray-400 mt-1">{noSemCount} {noSemCount === 1 ? 'file' : 'files'}</span>
                    </div>
                  )}
                </div>
              );
            }

            // Files scoped to the semester
            const semFiles = sectionFiles.filter((f: any) => {
              if (selectedSemester) {
                if (selectedSemester === "NONE") {
                  return !normalizeSem(getDocSem(f));
                }
                return normalizeSem(getDocSem(f)) === selectedSemester;
              }
              return true;
            });

            // Step C: Subdomains step (only if domain actually has subdomains configured)
            if (hasSubdomains && selectedSubdomain === null) {
              const directCount = semFiles.filter((f: any) => {
                const sub = normalize(getDocSubdomain(f));
                return !sub || sub === "no subdomain" || sub === "none";
              }).length;

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div onClick={() => setPath([...path, "Direct Files"])} className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors">
                    <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                    <span className="font-semibold text-sm">Direct Files</span>
                    <span className="text-xs text-gray-400 mt-1">{directCount} {directCount === 1 ? 'file' : 'files'}</span>
                  </div>
                  {domainSubdomains.map((s: string) => {
                    const subCount = semFiles.filter((f: any) => normalize(getDocSubdomain(f)) === normalize(s)).length;
                    return (
                      <div key={s} onClick={() => setPath([...path, s])} className="p-4 border rounded-xl hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center text-center transition-colors">
                        <div className="w-12 h-12 relative mb-2"><Image src="/logo.png" alt="Folder" fill sizes="48px" className="object-contain" /></div>
                        <span className="font-semibold text-sm">{s}</span>
                        <span className="text-xs text-gray-400 mt-1">{subCount} {subCount === 1 ? 'file' : 'files'}</span>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // Step D: Show files!
            const finalFiles = semFiles.filter((f: any) => {
              if (selectedSubdomain) {
                const sub = normalize(getDocSubdomain(f));
                if (selectedSubdomain === "NONE") {
                  return !sub || sub === "no subdomain" || sub === "none";
                }
                return sub === normalize(selectedSubdomain);
              }
              return true;
            });

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {finalFiles.map((file: any) => (
                  <FileCard key={file.id} file={file} />
                ))}
                {finalFiles.length === 0 && <p className="text-gray-400 col-span-full text-center py-8">No files found.</p>}
              </div>
            );
          })()}
        </div>
      </div>

      {path.length === 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
            <div className="flex items-center gap-4">
              <Link href="/admin/audit-logs" className="text-xs font-semibold text-[var(--archyv-accent-hover)] flex items-center hover:underline">
                View all <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </div>

          <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 border-b border-[var(--border)]">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-500 w-1/4">User</th>
                    <th className="px-6 py-3 font-medium text-gray-500 w-1/4">Action</th>
                    <th className="px-6 py-3 font-medium text-gray-500 w-1/4">Target</th>
                    <th className="px-6 py-3 font-medium text-gray-500 w-1/6">Domain</th>
                    <th className="px-6 py-3 font-medium text-gray-500 w-1/6 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {recentActivity.slice(0, 10).map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--archyv-accent)]/20 flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                            {(log.user || "System").substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{log.user}</div>
                            <div className="text-[10px] text-gray-500">CSIT</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className="text-gray-600">{log.action}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 relative shrink-0"><Image src="/logo.png" alt="File" fill sizes="16px" className="object-contain" /></div>
                          <div>
                            <div className="font-medium text-foreground truncate max-w-[200px]">{log.target}</div>
                            <div className="text-[10px] text-gray-400 truncate max-w-[200px]">/Files/{log.domain}/2026</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {log.domain}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-gray-600">{log.time.split(" ")[2]} {log.time.split(" ")[3]}</div>
                        <div className="text-[10px] text-gray-400">{log.time.split(" ").slice(0, 2).join(" ")}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
