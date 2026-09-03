"use client";

import PageHeader from "@/components/ui/PageHeader";
import { UploadCloud, Folder, Info, Lock, FileText, X } from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveFile } from "@/lib/storage";
import CustomDropdown from "@/components/ui/CustomDropdown";

export default function FacultyUpload() {
  const { fetchDocuments, currentUser, addDocument } = useAppContext();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("CSD");
  const [domain, setDomain] = useState("Admissions");
  const [year, setYear] = useState("2023-24");
  
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

  const handleUpload = async () => {
    if (!selectedFile) return alert("Please select a file before uploading.");
    if (!title) return alert("Please enter a title");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", title);
      formData.append("domain", domain);
      formData.append("department", department);
      formData.append("academicYear", year);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/documents`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }
      
      const data = await response.json();
      
      // Update global context immediately so it's available without a full refresh
      if (data.document && addDocument) {
         addDocument(data.document);
      }

      setShowSuccess(true);
      setTimeout(() => {
        router.push("/faculty/overview");
      }, 1000);
    } catch (err) {
      console.error(err);
      alert("Failed to upload file. Please try again.");
    }
  };

  return (
    <div>
      <PageHeader 
        title="Upload Department Document" 
        subtitle="Upload files (PDF, JPG, PNG, DOCX, PPTX) to be processed and organized."
      />

      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <div className="flex-1 bg-white border border-[var(--border)] rounded-2xl p-8 flex flex-col h-full">
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
              <p>Maximum file size: 50 MB</p>
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
                placeholder="e.g. Placement Report 2026" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Department</label>
              <CustomDropdown 
                value={department}
                onChange={setDepartment}
                options={["CSD", "CSIT"]}
                fullWidth
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Domain</label>
              <CustomDropdown 
                value={domain}
                onChange={setDomain}
                options={["Admissions", "Administrative", "Examination", "Placements", "Events"]}
                fullWidth
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Academic Year</label>
              <CustomDropdown 
                value={year}
                onChange={setYear}
                options={["2023-24", "2024-25", "2025-26"]}
                fullWidth
              />
            </div>

            <div className="space-y-1.5 pb-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                Document Access <Info className="w-3.5 h-3.5 text-gray-400" />
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                  <Lock className="w-4 h-4" />
                </div>
                <select 
                  disabled
                  className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-foreground appearance-none cursor-not-allowed"
                >
                  <option>Admin Only</option>
                </select>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground font-semibold py-2.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-5 h-5" />
              Upload & Process
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
