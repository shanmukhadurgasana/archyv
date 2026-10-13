"use client";

import PageHeader from "@/components/ui/PageHeader";
import { UploadCloud, Folder, Info, Users, FileText, X } from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import CustomDropdown from "@/components/ui/CustomDropdown";

export default function AdminUpload() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isTitleEdited, setIsTitleEdited] = useState(false);
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [domain, setDomain] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [year, setYear] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [semester, setSemester] = useState("");
  const [accessType, setAccessType] = useState<string>("None of the Faculty");
  const [selectedFacultyNames, setSelectedFacultyNames] = useState<string[]>([]);

  const { users, addDocument, domains, academicYears, departments } = useAppContext();

  const sortedDomains = [...domains].map(d => d.name).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  const sortedAcademicYears = [...academicYears].map(y => y.year).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  const sortedDepartments = [...departments].map(d => d.name).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const selectedDomainObj = domains.find(d => d.name === domain);
  const isFacultyDomain = Boolean(selectedDomainObj?.isFaculty);
  const subdomainOptions = (selectedDomainObj?.subdomains?.map(s => s.name) || []).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  const facultyBranchOptions = Array.from(new Set([...sortedDepartments, "CSD", "CSIT"])).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const selectedBranchObj = departments.find(d => d.name === department);
  const branchSectionOptions = (selectedBranchObj?.sections?.map(s => s.name) || []).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  useEffect(() => {
    if (!subdomainOptions.includes(subdomain)) {
      setSubdomain("");
    }
  }, [domain, subdomainOptions]);

  useEffect(() => {
    if (section && section !== "Overall Section" && !branchSectionOptions.includes(section)) {
      setSection("");
    }
  }, [department, branchSectionOptions]);

  const formatYearOfStudy = (val: string) => {
    if (!val) return "";
    const s = val.trim().toLowerCase();
    if (s.startsWith("1") || s.includes("1st") || s.includes("1 st") || s === "first" || s === "i") return "1st";
    if (s.startsWith("2") || s.includes("2nd") || s.includes("2 nd") || s === "second" || s === "ii") return "2nd";
    if (s.startsWith("3") || s.includes("3rd") || s.includes("3 rd") || s === "third" || s === "iii") return "3rd";
    if (s.startsWith("4") || s.includes("4th") || s.includes("4 th") || s === "fourth" || s === "iv") return "4th";
    return val.replace(/\s*(yr|year)s?/i, '').replace(/[/\\]\d+/g, '').trim();
  };

  // Auto-generate title based on fields: domain.academicyear.yearofstuding.branch.section.sem.subdomain
  useEffect(() => {
    if (!isTitleEdited) {
      const cleanSection = (section && section !== "Overall Section") ? section : "";
      if (isFacultyDomain) {
        const generatedTitle = [domain, subdomain, department, cleanSection]
          .filter(Boolean)
          .join(".");
        setTitle(generatedTitle);
      } else {
        const formattedYear = year ? year.split('-').map(p => p.slice(-2)).join('-') : "";
        const formattedYos = formatYearOfStudy(yearOfStudy);
        const cleanSemester = (semester && semester !== "No Semester" && semester !== "None") ? semester : "";
        
        const generatedTitle = [domain, formattedYear, formattedYos, department, cleanSection, cleanSemester, subdomain]
          .filter(Boolean)
          .join(".");
        setTitle(generatedTitle);
      }
    }
  }, [domain, subdomain, year, yearOfStudy, department, section, semester, isFacultyDomain, isTitleEdited]);

  const facultyUsers = users.filter(u => u.role.toUpperCase() === "FACULTY" && u.status === "Active");
  const facultyNames = facultyUsers.map(u => u.name).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!selectedFile) return alert("Please select a file before uploading.");
    if (!title) return alert("Please enter a title");
    if (!domain) return alert("Please select a domain");
    if (isFacultyDomain) {
      if (!department) return alert("Please select a branch");
    } else {
      if (!year || !yearOfStudy || !department) {
        return alert("Please fill in all required fields (Academic Year, Year of Study, and Branch).");
      }
    }
    if (isUploading) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", title);
      formData.append("domain", domain);
      if (subdomain) formData.append("subdomain", subdomain);
      formData.append("department", department);
      formData.append("branch", department);
      const cleanSection = (section && section !== "Overall Section") ? section : "";
      if (cleanSection) {
        formData.append("section", cleanSection);
      } else {
        formData.append("section", "Overall Section");
      }
      if (!isFacultyDomain) {
        formData.append("academicYear", year);
        formData.append("yearOfStudy", yearOfStudy);
        const cleanSemester = (semester && semester !== "No Semester" && semester !== "None") ? semester : "";
        if (cleanSemester) {
          formData.append("semester", cleanSemester);
        }
      }

      let finalAccessType = "NONE";
      if (accessType === "All Faculty") finalAccessType = "ALL_FACULTY";
      else if (accessType === "Select Faculty") finalAccessType = "SELECT_FACULTY";

      formData.append("accessType", finalAccessType);

      if (finalAccessType === "SELECT_FACULTY" && selectedFacultyNames.length > 0) {
        const ids = selectedFacultyNames.map(name => facultyUsers.find(u => u.name === name)?.id).filter(Boolean);
        formData.append("selectedFacultyIds", JSON.stringify(ids));
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/documents`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (!response.ok) {
        let errMsg = "Failed to upload document";
        try {
          const errData = await response.json();
          if (errData.message) errMsg = errData.message;
        } catch (e) { }
        throw new Error(errMsg);
      }

      const data = await response.json();
      addDocument(data.document);

      setShowSuccess(true);
      setTimeout(() => {
        router.push("/admin/files");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to upload file. Please try again.");
      setIsUploading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Upload Department Document"
        subtitle="Upload files (PDF, JPG, PNG, DOCX, PPTX) to be processed and organized."
      />

      <div className="flex flex-col lg:flex-row gap-6 items-start pb-8">
        <div className="flex-1 w-full bg-white border border-[var(--border)] rounded-2xl p-8 flex flex-col min-h-[500px] lg:sticky lg:top-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.docx,.pptx"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-12 text-center transition-colors cursor-pointer group ${isDragging ? 'bg-[var(--archyv-accent)]/10 border-[var(--archyv-accent)]' : 'border-gray-200 hover:bg-gray-50/50 hover:border-[var(--archyv-accent)]/50'}`}
          >
            {selectedFile ? (
              <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 rounded-full bg-[var(--archyv-accent)]/10 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-[var(--archyv-accent)]" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1">{selectedFile.name}</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {selectedFile.size < 1024 * 1024 ? `${(selectedFile.size / 1024).toFixed(1)} KB` : `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`}
                </p>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                  Remove File
                </button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-[var(--archyv-accent)]/10 transition-colors">
                  <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-[var(--archyv-accent)] transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Drag & Drop your document here</h3>
                <p className="text-sm text-gray-500 mb-6">or click to browse from your computer</p>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors shadow-sm pointer-events-none">
                  <Folder className="w-4 h-4 text-[var(--archyv-accent)]" />
                  Browse Files
                </button>
              </>
            )}
          </div>

          <div className="mt-6 flex items-start gap-3 bg-[var(--archyv-accent)]/5 rounded-xl p-4 border border-[var(--archyv-accent)]/20">
            <Info className="w-5 h-5 text-[var(--archyv-accent-hover)] shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p>Supported formats: PDF, JPG, PNG, DOCX, PPTX</p>
              <p>Maximum file size: 10 MB</p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[360px] shrink-0 bg-white border border-[var(--border)] rounded-2xl p-5">
          <h2 className="text-lg font-bold text-foreground mb-6">Document Metadata</h2>

          <form className="space-y-4 flex flex-col" onSubmit={(e) => { e.preventDefault(); handleUpload(); }}>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Document Title</label>
              <input
                type="text"
                placeholder="Title will be auto-generated..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsTitleEdited(true);
                }}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Domain</label>
              <CustomDropdown
                value={domain}
                onChange={setDomain}
                options={sortedDomains}
                placeholder="Select Domain"
                fullWidth
              />
            </div>

            {subdomainOptions.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Subdomain</label>
                <CustomDropdown
                  value={subdomain}
                  onChange={setSubdomain}
                  options={subdomainOptions.sort()}
                  placeholder="Select Subdomain"
                  fullWidth
                />
              </div>
            )}

            {isFacultyDomain ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Branch</label>
                  <CustomDropdown
                    value={department}
                    onChange={setDepartment}
                    options={facultyBranchOptions}
                    placeholder="Select Branch"
                    fullWidth
                  />
                </div>
                {branchSectionOptions.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">Section (Optional)</label>
                    <CustomDropdown
                      value={section}
                      onChange={setSection}
                      options={["Overall Section", ...branchSectionOptions]}
                      placeholder="Overall Section"
                      fullWidth
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Academic Year</label>
                  <CustomDropdown
                    value={year}
                    onChange={setYear}
                    options={sortedAcademicYears}
                    placeholder="Select Academic Year"
                    fullWidth
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Year of Studying</label>
                  <CustomDropdown
                    value={yearOfStudy}
                    onChange={setYearOfStudy}
                    options={["1st yr", "2nd yr", "3rd yr", "4th yr"]}
                    placeholder="Select Year of Study"
                    fullWidth
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Branch</label>
                  <CustomDropdown
                    value={department}
                    onChange={setDepartment}
                    options={sortedDepartments}
                    placeholder="Select Branch"
                    fullWidth
                  />
                </div>

                {branchSectionOptions.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground">Section (Optional)</label>
                      <CustomDropdown
                        value={section}
                        onChange={setSection}
                        options={["Overall Section", ...branchSectionOptions]}
                        placeholder="Overall Section"
                        fullWidth
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground">Sem (Optional)</label>
                      <CustomDropdown
                        value={semester || "No Semester"}
                        onChange={(val) => setSemester(val === "No Semester" ? "" : val)}
                        options={["No Semester", "1", "2"]}
                        placeholder="Select Sem (Optional)"
                        fullWidth
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">Sem (Optional)</label>
                    <CustomDropdown
                      value={semester || "No Semester"}
                      onChange={(val) => setSemester(val === "No Semester" ? "" : val)}
                      options={["No Semester", "1", "2"]}
                      placeholder="Select Sem (Optional)"
                      fullWidth
                    />
                  </div>
                )}
              </>
            )}

            <div className="space-y-1.5 pb-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                Document Access <Info className="w-3.5 h-3.5 text-gray-400" />
              </label>
              <CustomDropdown
                value={accessType}
                onChange={(val) => setAccessType(val as string)}
                options={["All Faculty", "None of the Faculty", "Select Faculty"]}
                fullWidth
                icon={<Users className="w-4 h-4 text-gray-400" />}
              />
              <p className="text-xs text-gray-500 mt-1.5">Select the faculty members who can access this document.</p>
            </div>

            {accessType === "Select Faculty" && (
              <div className="space-y-1.5 pb-2">
                <label className="text-sm font-semibold text-foreground">
                  Select Faculty
                </label>
                <CustomDropdown
                  value={selectedFacultyNames}
                  onChange={(val) => setSelectedFacultyNames(val as string[])}
                  options={facultyNames}
                  fullWidth
                  multiSelect
                  icon={<Users className="w-4 h-4 text-gray-400" />}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading}
              className="w-full bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground font-semibold py-2.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5" />
                  Upload & Process
                </>
              )}
            </button>
          </form>

          {showSuccess && (
            <div className="mt-6 bg-[#FAF0E6] text-foreground px-4 py-4 rounded-xl flex items-center justify-center gap-3 w-full shadow-sm border border-[#E5C19A]/20">
              <div className="bg-[var(--archyv-accent)] text-white rounded-full p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <p className="font-semibold text-sm">File uploaded successfully!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
