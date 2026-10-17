"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Document } from "@/lib/mock-data";
import { useAppContext } from "@/store/AppContext";
import { 
  X, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Upload, 
  Save, 
  Check, 
  Lock, 
  Pencil, 
  AlertCircle, 
  Loader2, 
  Plus, 
  Trash2,
  Eye,
  ExternalLink
} from "lucide-react";
import clsx from "clsx";
import { parseCsvToGrid, gridToCsv, createCsvBlob } from "@/lib/csvHelper";

interface DocumentEditorModalProps {
  isOpen: boolean;
  document: Document;
  canEdit?: boolean;
  onClose: () => void;
  onOpenTitleEdit?: () => void;
}

export default function DocumentEditorModal({
  isOpen,
  document,
  canEdit: propCanEdit,
  onClose,
  onOpenTitleEdit
}: DocumentEditorModalProps) {
  const { currentUser, updateDocumentContent, fetchDocuments } = useAppContext();
  const pathname = usePathname() || "";
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Document view/edit mode: default is ALWAYS "view" (read mode)
  const [mode, setMode] = useState<"view" | "edit">("view");

  const isFacultyDashboard = pathname.startsWith('/faculty');
  const isAdminDashboard = pathname.startsWith('/admin') || pathname.startsWith('/superadmin');
  const isAdminRole = currentUser?.role?.toLowerCase() === "admin" ||
                      currentUser?.role?.toLowerCase() === "superadmin" ||
                      currentUser?.role?.toLowerCase() === "super_admin";
  const isAdmin = isFacultyDashboard ? false : (isAdminDashboard || isAdminRole);

  const isUploader = Boolean(
    (currentUser?.id && document?.uploadedById === currentUser.id) ||
    (currentUser?.name && document?.uploadedBy === currentUser.name) ||
    (currentUser?.adminId && document?.uploadedBy === currentUser.adminId)
  );
  const isFacultyGranted = document?.accessType === "ALL_FACULTY" || 
    (document?.accessType === "SELECT_FACULTY" && Array.isArray(document?.facultyAccess) && 
      document.facultyAccess.some((fa: any) => (fa.facultyId || fa) === currentUser?.id));

  // Admin dashboard files always have both view and edit access. Faculty files depend on granted access.
  const canEdit = typeof propCanEdit === "boolean"
    ? propCanEdit
    : (isAdmin ? true : (Boolean(document?.canEdit) || isUploader || isFacultyGranted));

  const ext = (document?.name || "").split(".").pop()?.toLowerCase() || "";
  const isExcel = ext === "xlsx" || ext === "xls" || ext === "csv" || document?.type === "XLSX";
  const isPdf = ext === "pdf" || document?.type === "PDF";
  const isWord = ext === "docx" || ext === "doc" || document?.type === "DOCX";
  const isPptx = ext === "pptx" || ext === "ppt";

  // Spreadsheet state (for Excel/CSV)
  const defaultCols = ["A", "B", "C", "D", "E"];
  const [columns, setColumns] = useState<string[]>(defaultCols);
  const [gridData, setGridData] = useState<string[][]>([
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""]
  ]);

  // Document text state (for Word / text docs / PPTX / PDF)
  const [textContent, setTextContent] = useState<string>("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfViewMode, setPdfViewMode] = useState<"document" | "text">("document");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Whenever modal opens or document changes, reset to View mode (read mode)
  useEffect(() => {
    if (isOpen) {
      setMode("view");
    }
  }, [isOpen, document?.id]);

  // Revoke blob URL on cleanup
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Fetch document content for in-browser viewer/editor when modal opens
  useEffect(() => {
    if (!isOpen || !document?.id) return;

    setErrorMessage(null);
    setSaveSuccess(false);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const contentPromise = fetch(`${baseUrl}/documents/${document.id}/content`, {
          credentials: "include"
        });

        const pdfPromise = isPdf
          ? fetch(`${baseUrl}/documents/${document.id}/view?inline=true`, { credentials: "include" })
          : Promise.resolve(null);

        const [res, pdfRes] = await Promise.all([contentPromise, pdfPromise]);

        if (pdfRes && pdfRes.ok) {
          const blob = await pdfRes.blob();
          const objUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
          setPdfBlobUrl(objUrl);
        }

        if (res.ok) {
          const data = await res.json();
          if (data.content) {
            if (isExcel) {
              const parsed = parseCsvToGrid(data.content);
              setColumns(parsed.columns);
              setGridData(parsed.gridData);
            } else {
              setTextContent(data.content);
            }
          } else {
            // Provide clean initial template for spreadsheet or document
            if (isExcel) {
              setColumns(["Record ID", "Name / Title", "Category / Dept", "Status", "Notes"]);
              setGridData([
                ["REC-001", "Attendance Summary", "CSIT", "Verified", "Academic Record"],
                ["REC-002", "Faculty Course Plan", "CSD", "Approved", "Updated"],
                ["REC-003", "Assessment Report", "ECE", "Complete", "Verified"],
                ["", "", "", "", ""],
                ["", "", "", "", ""]
              ]);
            } else {
              setTextContent("");
            }
          }
        }
      } catch (err: any) {
        console.warn("Could not fetch document content:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [isOpen, document?.id, isExcel, isPdf]);

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    if (!canEdit || mode !== "edit") return;
    setGridData(prev => {
      const next = prev.map(row => [...row]);
      next[rowIndex][colIndex] = value;
      return next;
    });
  };

  const handleAddRow = () => {
    if (!canEdit || mode !== "edit") return;
    setGridData(prev => [...prev, new Array(columns.length).fill("")]);
  };

  const handleRemoveRow = (index: number) => {
    if (!canEdit || mode !== "edit" || gridData.length <= 1) return;
    setGridData(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditClick = () => {
    if (!canEdit) return;
    setMode("edit");
  };

  const handleOpenFullscreen = (targetMode: "view" | "edit" = mode) => {
    const targetPath = isExcel ? `/spreadsheet/${document.id}` : `/document/${document.id}`;
    window.open(`${targetPath}?mode=${targetMode}`, "_blank");
  };

  const handleSaveInBrowser = async () => {
    if (!canEdit || mode !== "edit") {
      setErrorMessage("Read-only access: You do not have permission to edit this document.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      let res;
      if (isExcel) {
        const csv = gridToCsv(columns, gridData);
        res = await updateDocumentContent(document.id, { csvData: csv });
      } else {
        res = await updateDocumentContent(document.id, { content: textContent, mimeType: "text/plain" });
      }

      if (res && res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await fetchDocuments();
      } else {
        setErrorMessage(res?.error || "Failed to save document");
      }
    } catch (e: any) {
      setErrorMessage(e?.message || "Error saving document");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canEdit) {
      setErrorMessage("Read-only access: You cannot replace or edit this document.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const res = await updateDocumentContent(document.id, { file });
      if (res && res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await fetchDocuments();
        if (isExcel) {
          const text = await file.text();
          const parsed = parseCsvToGrid(text);
          setColumns(parsed.columns);
          setGridData(parsed.gridData);
        }
      } else {
        setErrorMessage(res?.error || "Failed to upload updated document");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Upload failed");
    } finally {
      setIsSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Clean download that guarantees opening in Excel / Word without errors
  const handleDownload = async () => {
    setIsDownloading(true);
    setErrorMessage(null);

    try {
      if (isExcel) {
        const blob = createCsvBlob(columns, gridData);
        const url = URL.createObjectURL(blob);
        const a = globalThis.document.createElement("a");
        a.href = url;
        const cleanName = document.name.toLowerCase().endsWith(".csv") ? document.name : `${document.name}.csv`;
        a.download = cleanName;
        globalThis.document.body.appendChild(a);
        a.click();
        globalThis.document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Download document copy
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${baseUrl}/documents/${document.id}/view`, { credentials: "include" });
        if (!res.ok) throw new Error("Could not download file");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = globalThis.document.createElement("a");
        a.href = url;
        a.download = document.name;
        globalThis.document.body.appendChild(a);
        a.click();
        globalThis.document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      console.error("Download failed:", err);
      // Fallback
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      window.open(`${baseUrl}/documents/${document.id}/view`, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div 
        className="bg-white border border-[var(--border)] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Styled with ARCHYV Theme */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-gray-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-[var(--archyv-accent)]/20 text-foreground">
              {isExcel ? <FileSpreadsheet className="w-5 h-5 text-foreground" /> : <FileText className="w-5 h-5 text-foreground" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground truncate max-w-[240px] sm:max-w-md" title={document.name}>
                  {document.name}
                </h3>
                {canEdit ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--archyv-accent)]/20 text-foreground border border-[var(--archyv-accent)]/40 shrink-0">
                    <Pencil className="w-3 h-3 text-[var(--archyv-accent-hover)]" /> Edit Access
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 shrink-0">
                    <Image src="/view-eye.png" alt="View Only" width={16} height={9} className="w-3.5 h-auto object-contain inline-block" /> View Only
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {document.domain} • {document.department || "General"} • {document.size || "Document"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View and Edit buttons placed in place of Rename / Edit Title */}
            {canEdit ? (
              <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 shadow-inner">
                <button
                  type="button"
                  onClick={() => setMode("view")}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                    mode === "view"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                  title="Switch to read mode"
                >
                  <Eye className="w-3.5 h-3.5 text-gray-600" />
                  View
                </button>
                <button
                  type="button"
                  onClick={handleEditClick}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                    mode === "edit"
                      ? "bg-[var(--archyv-accent)] text-foreground font-bold shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                  title="Switch to edit mode"
                >
                  <Pencil className="w-3.5 h-3.5 text-[var(--archyv-accent-hover)]" />
                  Edit
                </button>
              </div>
            ) : null}

            {/* Optional Rename Title button when editing */}
            {canEdit && mode === "edit" && onOpenTitleEdit && (
              <button
                onClick={() => {
                  onClose();
                  onOpenTitleEdit();
                }}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                title="Rename document title"
              >
                <Pencil className="w-3 h-3 text-gray-500" />
                <span>Rename Title</span>
              </button>
            )}

            {/* Direct Open in Full Screen Tab button for both spreadsheets and documents */}
            <button 
              onClick={() => handleOpenFullscreen(mode)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-200/50"
              title="Open in full screen tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-200/50"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Permission / Mode Banner */}
        {mode === "view" ? (
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-2.5 flex items-center justify-between text-xs text-gray-700 font-medium">
            <div className="flex items-center gap-2">
              {canEdit ? (
                <Eye className="w-4 h-4 text-gray-500 shrink-0" />
              ) : (
                <Lock className="w-4 h-4 text-gray-500 shrink-0" />
              )}
              <span>
                <strong>{canEdit ? "Read Mode:" : "View Only Mode:"}</strong>{" "}
                {canEdit 
                  ? "You are viewing this document in read mode. Click 'Edit' above to modify cells or open in full screen tab." 
                  : "You have view-only access to this document. The content cannot be modified on the website."}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--archyv-accent)]/15 border-b border-[var(--archyv-accent)]/30 px-6 py-2.5 flex items-center justify-between text-xs text-foreground font-medium">
            <div className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-[var(--archyv-accent-hover)] shrink-0" />
              <span>
                <strong>In-Site Document Editor:</strong> You can edit cells, rows, or document text directly below and save your changes to ARCHYV.
              </span>
            </div>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-foreground font-bold bg-[var(--archyv-accent)]/40 px-2 py-0.5 rounded shadow-sm">
                <Check className="w-3.5 h-3.5" /> Saved to ARCHYV!
              </span>
            )}
          </div>
        )}

        {/* Action Toolbar - ARCHYV Theme */}
        <div className="px-6 py-3 border-b border-[var(--border)] bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct Download */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-sm disabled:opacity-50"
              title="Download file to open in Excel or Word on your computer"
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-gray-500" />}
              {isExcel ? "Download for Excel" : "Download File"}
            </button>

            {/* Sync / Replace File (only in edit mode) */}
            {canEdit && mode === "edit" && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".xlsx,.xls,.csv,.docx,.doc,.txt"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                  title="Upload updated file from your computer"
                >
                  <Upload className="w-3.5 h-3.5 text-gray-500" />
                  Sync / Replace File
                </button>
              </>
            )}

            {/* In Edit mode, allow opening full screen tab */}
            {canEdit && mode === "edit" && (
              <button
                onClick={() => handleOpenFullscreen("edit")}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-foreground bg-[var(--archyv-accent)]/20 hover:bg-[var(--archyv-accent)]/30 border border-[var(--archyv-accent)]/30 rounded-xl transition-colors shadow-sm"
                title="Expand document in a full screen browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Full Screen Tab</span>
              </button>
            )}
          </div>

          {/* In-Browser Save Button or Read-Only Tag */}
          {canEdit && mode === "edit" ? (
            <button
              onClick={handleSaveInBrowser}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-foreground bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? "Saving to ARCHYV..." : "Save to ARCHYV"}</span>
            </button>
          ) : (
            <span className="text-xs font-semibold text-gray-400 italic flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Read-only mode
            </span>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Editor & Viewer Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--archyv-accent)] mb-2" />
              <p className="text-xs font-medium">Loading document viewer...</p>
            </div>
          ) : isExcel ? (
            /* Spreadsheet Grid */
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs font-semibold text-gray-700">
                <span>Spreadsheet Grid {canEdit && mode === "edit" ? "(Live Editable in Site)" : "(View Only)"}</span>
                {canEdit && mode === "edit" && (
                  <button
                    onClick={handleAddRow}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-foreground bg-[var(--archyv-accent)]/30 hover:bg-[var(--archyv-accent)]/50 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                )}
              </div>

              <div className="overflow-x-auto max-h-[460px]">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="w-10 px-2 py-1.5 border-r border-gray-200 text-center text-gray-400 font-normal">#</th>
                      {columns.map((col, cIdx) => (
                        <th key={cIdx} className="px-3 py-1.5 border-r border-gray-200 text-left font-semibold text-gray-700 min-w-[120px]">
                          {col}
                        </th>
                      ))}
                      {canEdit && mode === "edit" && <th className="w-10 px-2 py-1.5 text-center text-gray-400"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {gridData.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                        <td className="px-2 py-1.5 border-r border-gray-200 text-center text-gray-400 font-mono text-[11px] bg-gray-50/30">
                          {rIdx + 1}
                        </td>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-0 border-r border-gray-200">
                            {canEdit && mode === "edit" ? (
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs border-0 outline-none transition-colors bg-transparent focus:bg-amber-50/20 focus:ring-1 focus:ring-[var(--archyv-accent-hover)] text-foreground"
                              />
                            ) : (
                              <div className="w-full px-2.5 py-1.5 text-xs text-gray-700 truncate select-text min-h-[30px] flex items-center">
                                {cell || <span className="text-gray-300">-</span>}
                              </div>
                            )}
                          </td>
                        ))}
                        {canEdit && mode === "edit" && (
                          <td className="px-1 text-center">
                            <button
                              onClick={() => handleRemoveRow(rIdx)}
                              className="text-gray-300 hover:text-red-500 transition-colors p-1"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : isPdf ? (
            /* PDF Matter / Document Viewer on the page */
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col min-h-[550px]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 text-xs font-semibold text-gray-700 flex-wrap gap-2">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[var(--archyv-accent-hover)]" />
                  PDF Document Viewer
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setPdfViewMode("document")}
                      className={clsx(
                        "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all",
                        pdfViewMode === "document" ? "bg-white text-foreground shadow-sm" : "text-gray-500 hover:text-foreground"
                      )}
                    >
                      Document View
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfViewMode("text")}
                      className={clsx(
                        "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all",
                        pdfViewMode === "text" ? "bg-white text-foreground shadow-sm" : "text-gray-500 hover:text-foreground"
                      )}
                    >
                      Extracted Text ({textContent.trim() ? textContent.trim().split(/\s+/).length : 0} words)
                    </button>
                  </div>
                </div>
              </div>

              {pdfViewMode === "document" ? (
                <div className="w-full flex-1 rounded-lg overflow-hidden border border-gray-200 min-h-[500px] bg-gray-50 flex flex-col">
                  {pdfBlobUrl ? (
                    <iframe
                      src={pdfBlobUrl}
                      className="w-full flex-1 min-h-[520px] border-0"
                      title={document.name}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 py-20 text-gray-400">
                      <Loader2 className="w-7 h-7 animate-spin text-[var(--archyv-accent)] mb-2" />
                      <p className="text-xs">Loading PDF document viewer...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full flex-1 flex flex-col min-h-[480px]">
                  {canEdit && mode === "edit" ? (
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Type or paste document content..."
                      rows={18}
                      className="w-full flex-1 p-4 text-sm font-sans rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/30 focus:border-[var(--archyv-accent)] text-foreground leading-relaxed resize-y font-mono"
                    />
                  ) : (
                    <div className="w-full flex-1 p-6 bg-gray-50/50 rounded-xl border border-gray-100 text-sm text-gray-800 leading-relaxed font-sans whitespace-pre-wrap select-text min-h-[380px]">
                      {textContent || (
                        <p className="text-gray-400 italic">No text content extracted from this PDF.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Word / PowerPoint / Text Document Canvas */
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 flex flex-col min-h-[420px]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 text-xs font-semibold text-gray-700">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[var(--archyv-accent-hover)]" />
                  {isPptx ? "PowerPoint Presentation" : isWord ? "Word Document" : "Document"}{" "}
                  {canEdit && mode === "edit" ? "Editor (Live Editable in Site)" : "Viewer (Read Mode)"}
                </span>
                {(!canEdit || mode === "view") ? (
                  <span className="flex items-center gap-1 text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded text-[11px] font-medium">
                    <Eye className="w-3 h-3" /> Read Only
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400 font-normal">
                    {textContent.trim() ? textContent.trim().split(/\s+/).length : 0} words
                  </span>
                )}
              </div>

              {canEdit && mode === "edit" ? (
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Type or paste document content..."
                  rows={16}
                  className="w-full flex-1 p-4 text-sm font-sans rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/30 focus:border-[var(--archyv-accent)] text-foreground leading-relaxed resize-y font-mono"
                />
              ) : (
                <div className="w-full flex-1 p-6 bg-gray-50/50 rounded-xl border border-gray-100 text-sm text-gray-800 leading-relaxed font-sans whitespace-pre-wrap select-text min-h-[300px]">
                  {textContent ? (
                    textContent
                  ) : (
                    <p className="text-gray-400 italic">No document content available.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border)] bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {canEdit ? (
              mode === "edit" ? (
                <span>In-site content editing enabled for this document. Remember to save to ARCHYV.</span>
              ) : (
                <span>Document is currently in read mode. Click Edit to make changes or open full screen tab.</span>
              )
            ) : (
              <span className="text-gray-400">View only access. Contact administrator to request edit permissions.</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    globalThis.document.body
  );
}
