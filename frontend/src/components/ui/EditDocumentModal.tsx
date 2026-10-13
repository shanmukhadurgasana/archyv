"use client";

import { X, Sparkles, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAppContext } from "@/store/AppContext";
import { Document } from "@/lib/mock-data";
import CustomDropdown from "@/components/ui/CustomDropdown";

interface EditDocumentModalProps {
  isOpen: boolean;
  document: Document;
  onClose: () => void;
}

export default function EditDocumentModal({ isOpen, document, onClose }: EditDocumentModalProps) {
  const { domains, departments, academicYears, updateDocument } = useAppContext();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [semester, setSemester] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && document) {
      setTitle(document.name || "");
      setDomain(document.domain || "");
      setSubdomain(document.subdomain || "None");
      setAcademicYear(document.year || (typeof (document as any).academicYear === 'object' ? (document as any).academicYear?.year : (document as any).academicYear) || "None");
      setYearOfStudy(document.yearOfStudy || "None");
      setBranch(document.branch || document.department || "None");
      setSection(document.section || "Overall Section");
      setSemester(document.semester || "No Semester");
      setError(null);
    }
  }, [isOpen, document]);

  const sortedDomains = [...domains].map(d => d.name).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  const sortedAcademicYears = [...academicYears].map(y => y.year).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  const sortedDepartments = [...departments].map(d => d.name).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const selectedDomainObj = domains.find(d => d.name === domain);
  const isFacultyDomain = Boolean(selectedDomainObj?.isFaculty);
  const subdomainOptions = (selectedDomainObj?.subdomains?.map(s => s.name) || []).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const selectedBranchObj = departments.find(d => d.name === branch);
  const branchSectionOptions = (selectedBranchObj?.sections?.map(s => s.name) || []).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  // Helper to auto-generate title if desired
  const handleAutoGenerateTitle = () => {
    const cleanSection = (section && section !== "Overall Section" && section !== "None") ? section : "";
    const cleanSubdomain = (subdomain && subdomain !== "None") ? subdomain : "";
    const originalExt = document.name.includes('.') ? document.name.split('.').pop() : '';

    if (isFacultyDomain) {
      const parts = [domain, cleanSubdomain, branch !== "None" ? branch : "", cleanSection].filter(Boolean);
      const generated = parts.join(".");
      setTitle(originalExt ? `${generated}.${originalExt}` : generated);
    } else {
      const formatYearOfStudy = (val: string) => {
        if (!val || val === "None") return "";
        const s = val.trim().toLowerCase();
        if (s.startsWith("1") || s.includes("1st")) return "1st";
        if (s.startsWith("2") || s.includes("2nd")) return "2nd";
        if (s.startsWith("3") || s.includes("3rd")) return "3rd";
        if (s.startsWith("4") || s.includes("4th")) return "4th";
        return val.replace(/\s*(yr|year)s?/i, '').trim();
      };

      const formattedYear = (academicYear && academicYear !== "None") ? academicYear.split('-').map(p => p.slice(-2)).join('-') : "";
      const formattedYos = formatYearOfStudy(yearOfStudy);
      const cleanSemester = (semester && semester !== "No Semester" && semester !== "None") ? semester : "";
      const effectiveBranch = (branch && branch !== "None") ? branch : "";

      const parts = [domain, formattedYear, formattedYos, effectiveBranch, cleanSection, cleanSemester, cleanSubdomain].filter(Boolean);
      const generated = parts.join(".");
      setTitle(originalExt ? `${generated}.${originalExt}` : generated);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Document title cannot be empty");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await updateDocument(document.id, {
        name: title.trim(),
        domain: domain || undefined,
        subdomain: subdomain === "None" ? null : subdomain,
        academicYear: academicYear === "None" ? null : academicYear,
        yearOfStudy: yearOfStudy === "None" ? null : yearOfStudy,
        branch: branch === "None" ? null : branch,
        department: branch === "None" ? null : branch,
        section: section === "None" ? null : section,
        semester: semester === "No Semester" || semester === "None" ? null : semester
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to update document");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div 
        className="bg-white border border-[var(--border)] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-foreground">Edit File Details</h3>
            <p className="text-xs text-gray-500">Update file metadata, academic details, and naming.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Document Title / Name <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAutoGenerateTitle}
                className="text-[11px] font-semibold text-[var(--archyv-accent)] hover:underline flex items-center gap-1"
                title="Auto-generate title based on fields below"
              >
                <Sparkles className="w-3 h-3" />
                Auto-generate name
              </button>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. syllabus.pdf"
              className="w-full px-3.5 py-2 text-sm bg-white border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/20 focus:border-[var(--archyv-accent)] transition-all font-medium text-foreground"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Domain */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Domain</label>
              <CustomDropdown
                value={domain}
                onChange={(v) => {
                  setDomain(v);
                  setSubdomain("None");
                }}
                options={sortedDomains}
                fullWidth
              />
            </div>

            {/* Subdomain */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Subdomain</label>
              <CustomDropdown
                value={subdomain}
                onChange={setSubdomain}
                options={["None", ...subdomainOptions]}
                fullWidth
              />
            </div>

            {/* Academic Year */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Academic Year</label>
              <CustomDropdown
                value={academicYear}
                onChange={setAcademicYear}
                options={["None", ...sortedAcademicYears]}
                fullWidth
              />
            </div>

            {/* Year of Study */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Year of Study</label>
              <CustomDropdown
                value={yearOfStudy}
                onChange={setYearOfStudy}
                options={["None", "1st yr", "2nd yr", "3rd yr", "4th yr"]}
                fullWidth
              />
            </div>

            {/* Branch / Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Branch</label>
              <CustomDropdown
                value={branch}
                onChange={(v) => {
                  setBranch(v);
                  setSection("Overall Section");
                }}
                options={["None", ...sortedDepartments]}
                fullWidth
              />
            </div>

            {/* Section */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Section</label>
              <CustomDropdown
                value={section}
                onChange={setSection}
                options={["Overall Section", ...branchSectionOptions]}
                fullWidth
              />
            </div>

            {/* Semester */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Semester</label>
              <CustomDropdown
                value={semester}
                onChange={setSemester}
                options={["No Semester", "Semester 1", "Semester 2"]}
                fullWidth
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-foreground bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    globalThis.document.body
  );
}
