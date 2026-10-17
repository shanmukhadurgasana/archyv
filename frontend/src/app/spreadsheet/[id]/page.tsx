"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAppContext } from "@/store/AppContext";
import { Document } from "@/lib/mock-data";
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Save, 
  Check, 
  Eye, 
  Pencil, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  Lock,
  Columns
} from "lucide-react";
import clsx from "clsx";
import { parseCsvToGrid, gridToCsv, createCsvBlob } from "@/lib/csvHelper";

export default function FullscreenSpreadsheetPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const initialModeParam = searchParams.get("mode");

  const { currentUser, documents, updateDocumentContent, fetchDocuments } = useAppContext();

  const [document, setDocument] = useState<Document | null>(null);
  const [columns, setColumns] = useState<string[]>(["A", "B", "C", "D", "E"]);
  const [gridData, setGridData] = useState<string[][]>([
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute permissions
  const isAdmin = currentUser?.role?.toLowerCase() === "admin";
  const isUploader = Boolean(
    (currentUser?.id && document?.uploadedById === currentUser.id) ||
    (currentUser?.name && document?.uploadedBy === currentUser.name) ||
    (currentUser?.adminId && document?.uploadedBy === currentUser.adminId)
  );
  const isFacultyGranted = document?.accessType === "ALL_FACULTY" || 
    (document?.accessType === "SELECT_FACULTY" && Array.isArray(document?.facultyAccess) && 
      document.facultyAccess.some((fa: any) => (fa.facultyId || fa) === currentUser?.id));
  const canEdit = isAdmin || isUploader || Boolean(document?.canEdit) || isFacultyGranted;

  // Set mode based on permissions and URL param
  useEffect(() => {
    if (canEdit && initialModeParam === "edit") {
      setMode("edit");
    } else {
      setMode("view");
    }
  }, [canEdit, initialModeParam]);

  // Load document metadata and content
  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        // Find in AppContext documents if available
        let docObj = documents.find(d => d.id === id);

        // If not in cache, fetch directly
        if (!docObj) {
          const docRes = await fetch(`${baseUrl}/documents/${id}`, {
            credentials: "include"
          });
          if (docRes.ok) {
            const docData = await docRes.json();
            docObj = docData.document || docData;
          }
        }

        if (isMounted && docObj) {
          setDocument(docObj);
        }

        // Fetch CSV / text content
        const contentRes = await fetch(`${baseUrl}/documents/${id}/content`, {
          credentials: "include"
        });

        if (contentRes.ok) {
          const data = await contentRes.json();
          if (data.isTextOrCsv && data.content) {
            const parsed = parseCsvToGrid(data.content);
            if (isMounted) {
              setColumns(parsed.columns);
              setGridData(parsed.gridData);
            }
          } else {
            // Default template if empty or newly created
            if (isMounted) {
              setColumns(["Record ID", "Name / Title", "Department", "Status", "Notes"]);
              setGridData([
                ["REC-001", "Attendance Summary", "CSIT", "Verified", "Academic Record"],
                ["REC-002", "Faculty Course Plan", "CSD", "Approved", "Updated"],
                ["", "", "", "", ""],
                ["", "", "", "", ""]
              ]);
            }
          }
        }
      } catch (err: any) {
        console.error("Error loading spreadsheet document:", err);
        if (isMounted) {
          setErrorMessage("Failed to load document content. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, documents]);

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    if (!canEdit || mode !== "edit") return;
    setGridData(prev => {
      const next = prev.map(row => [...row]);
      next[rowIndex][colIndex] = value;
      return next;
    });
  };

  const handleColumnNameChange = (colIndex: number, newName: string) => {
    if (!canEdit || mode !== "edit") return;
    setColumns(prev => {
      const next = [...prev];
      next[colIndex] = newName;
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

  const handleAddColumn = () => {
    if (!canEdit || mode !== "edit") return;
    const nextColLetter = String.fromCharCode(65 + (columns.length % 26));
    const newColName = columns.includes(nextColLetter) ? `Col ${columns.length + 1}` : nextColLetter;
    setColumns(prev => [...prev, newColName]);
    setGridData(prev => prev.map(row => [...row, ""]));
  };

  const handleSave = async () => {
    if (!canEdit || mode !== "edit" || !id) {
      setErrorMessage("You do not have permission to edit this document.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const csv = gridToCsv(columns, gridData);
      const res = await updateDocumentContent(id, { csvData: csv });

      if (res && res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
        await fetchDocuments();
      } else {
        setErrorMessage(res?.error || "Failed to save spreadsheet changes.");
      }
    } catch (e: any) {
      setErrorMessage(e?.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    if (!canEdit) {
      setErrorMessage("Read-only access: You cannot replace this file.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await updateDocumentContent(id, { file });
      if (res && res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
        await fetchDocuments();
        // Read file contents into grid
        const text = await file.text();
        const parsed = parseCsvToGrid(text);
        setColumns(parsed.columns);
        setGridData(parsed.gridData);
      } else {
        setErrorMessage(res?.error || "Failed to upload updated spreadsheet");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "File upload failed");
    } finally {
      setIsSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      const blob = createCsvBlob(columns, gridData);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      const baseName = document?.name || "spreadsheet.csv";
      const cleanName = baseName.toLowerCase().endsWith(".csv") ? baseName : `${baseName}.csv`;
      a.download = cleanName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCloseOrBack = () => {
    if (window.opener) {
      window.close();
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen h-screen flex flex-col bg-white overflow-hidden text-foreground">
      {/* Top Application Bar */}
      <header className="h-16 px-4 sm:px-6 bg-white border-b border-[var(--border)] flex items-center justify-between gap-4 shrink-0 shadow-xs z-20">
        {/* Left: Back / Close, File icon and title */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={handleCloseOrBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-colors shrink-0"
            title="Close this full screen tab or go back"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
            <span className="hidden sm:inline">Back to ARCHYV</span>
          </button>

          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[var(--archyv-accent)]/20 text-foreground">
            <FileSpreadsheet className="w-5 h-5 text-foreground" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-foreground truncate max-w-[200px] sm:max-w-md md:max-w-lg" title={document?.name || "Spreadsheet"}>
                {document?.name || "Loading Document..."}
              </h1>
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
            {document && (
              <p className="text-[11px] text-gray-500 truncate">
                {document.domain} • {document.department || "General"} • {document.size || "Spreadsheet"}
              </p>
            )}
          </div>
        </div>

        {/* Center: Mode Switcher (View vs Edit) */}
        <div className="flex items-center">
          {canEdit ? (
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner">
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
                onClick={() => setMode("edit")}
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
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              <span>Read-Only</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={isDownloading || isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-xs disabled:opacity-50"
            title="Download clean CSV for Microsoft Excel"
          >
            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-gray-500" />}
            <span className="hidden md:inline">Download for Excel</span>
          </button>

          {/* Sync / Replace File (only in edit mode) */}
          {canEdit && mode === "edit" && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".xlsx,.xls,.csv"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving || isLoading}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-xs disabled:opacity-50"
                title="Upload updated CSV from your computer"
              >
                <Upload className="w-3.5 h-3.5 text-gray-500" />
                <span>Sync / Replace</span>
              </button>
            </>
          )}

          {/* Add Row (only in edit mode) */}
          {canEdit && mode === "edit" && (
            <button
              onClick={handleAddRow}
              disabled={isLoading}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-foreground bg-[var(--archyv-accent)]/30 hover:bg-[var(--archyv-accent)]/50 border border-[var(--archyv-accent)]/40 rounded-xl transition-colors shadow-xs"
              title="Add a new row at the bottom"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Row</span>
            </button>
          )}

          {/* Save to ARCHYV (only in edit mode) */}
          {canEdit && mode === "edit" ? (
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-foreground bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? "Saving..." : "Save to ARCHYV"}</span>
            </button>
          ) : (
            <span className="text-xs font-semibold text-gray-400 italic flex items-center gap-1 px-2 py-1">
              <Eye className="w-3.5 h-3.5" /> Read-only mode
            </span>
          )}
        </div>
      </header>

      {/* Mode Sub-Banner */}
      {mode === "view" ? (
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-2 flex items-center justify-between text-xs text-gray-700 font-medium shrink-0">
          <div className="flex items-center gap-2">
            {canEdit ? (
              <Eye className="w-4 h-4 text-gray-500 shrink-0" />
            ) : (
              <Lock className="w-4 h-4 text-gray-500 shrink-0" />
            )}
            <span>
              <strong>{canEdit ? "Read Mode:" : "View Only Mode:"}</strong>{" "}
              {canEdit 
                ? "You are viewing this document in read mode. Click 'Edit' above to modify cells, add rows, and save changes." 
                : "You have view-only access to this document. The content cannot be modified on the website."}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--archyv-accent)]/15 border-b border-[var(--archyv-accent)]/30 px-6 py-2 flex items-center justify-between text-xs text-foreground font-medium shrink-0">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-[var(--archyv-accent-hover)] shrink-0" />
            <span>
              <strong>In-Site Full Screen Spreadsheet Editor:</strong> Live editing enabled. Double-click column headers to rename, edit cells below, and click <strong>Save to ARCHYV</strong> to persist your changes.
            </span>
          </div>
          {saveSuccess && (
            <span className="flex items-center gap-1 text-foreground font-bold bg-[var(--archyv-accent)]/40 px-2 py-0.5 rounded shadow-xs">
              <Check className="w-3.5 h-3.5" /> Saved to ARCHYV!
            </span>
          )}
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600 text-xs">Dismiss</button>
        </div>
      )}

      {/* Spreadsheet Canvas */}
      <main className="flex-1 min-h-0 overflow-auto bg-slate-100/60 p-4 sm:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Loader2 className="w-9 h-9 animate-spin text-[var(--archyv-accent)] mb-3" />
            <p className="text-sm font-semibold text-gray-600">Loading full-screen spreadsheet...</p>
            <p className="text-xs text-gray-400 mt-1">Parsing document rows and columns</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            {/* Table Action Bar */}
            <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between text-xs font-semibold text-gray-700 shrink-0">
              <div className="flex items-center gap-2">
                <span>Spreadsheet Grid {canEdit && mode === "edit" ? "(Live Editable Full Screen Tab)" : "(Read Only Mode)"}</span>
                <span className="text-[11px] font-normal text-gray-400">
                  {gridData.length} {gridData.length === 1 ? "row" : "rows"} • {columns.length} columns
                </span>
              </div>

              {canEdit && mode === "edit" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddColumn}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors shadow-xs"
                    title="Add a new column to the right"
                  >
                    <Columns className="w-3.5 h-3.5 text-gray-500" />
                    <span>Add Column</span>
                  </button>
                  <button
                    onClick={handleAddRow}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-foreground bg-[var(--archyv-accent)]/30 hover:bg-[var(--archyv-accent)]/50 rounded-lg transition-colors shadow-xs"
                    title="Add a new row at the bottom"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>
              )}
            </div>

            {/* Table Scroll Area */}
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse text-xs select-text">
                <thead className="sticky top-0 z-10 bg-gray-100/95 backdrop-blur-xs shadow-xs">
                  <tr className="border-b border-gray-300">
                    <th className="w-12 px-2 py-2 border-r border-gray-300 text-center text-gray-500 font-semibold bg-gray-100/90">
                      #
                    </th>
                    {columns.map((col, cIdx) => (
                      <th
                        key={cIdx}
                        className="px-3 py-2 border-r border-gray-300 text-left font-bold text-gray-800 min-w-[140px] max-w-[280px]"
                      >
                        {canEdit && mode === "edit" ? (
                          <input
                            type="text"
                            value={col}
                            onChange={(e) => handleColumnNameChange(cIdx, e.target.value)}
                            className="w-full bg-transparent font-bold text-gray-800 border-0 outline-none focus:bg-white focus:ring-1 focus:ring-[var(--archyv-accent-hover)] rounded px-1 -mx-1"
                            title="Click to rename column header"
                          />
                        ) : (
                          <span>{col}</span>
                        )}
                      </th>
                    ))}
                    {canEdit && mode === "edit" && (
                      <th className="w-12 px-2 py-2 text-center text-gray-400 font-normal">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {gridData.map((row, rIdx) => (
                    <tr 
                      key={rIdx} 
                      className="hover:bg-amber-50/15 transition-colors group"
                    >
                      {/* Row index # */}
                      <td className="px-2 py-2 border-r border-gray-200 text-center text-gray-400 font-mono text-[11px] bg-gray-50/60 sticky left-0 z-5">
                        {rIdx + 1}
                      </td>

                      {/* Cells */}
                      {row.map((cell, cIdx) => (
                        <td 
                          key={cIdx} 
                          className="p-0 border-r border-gray-200 align-top"
                        >
                          {canEdit && mode === "edit" ? (
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                              className="w-full h-full px-3 py-2 text-xs border-0 outline-none bg-transparent focus:bg-amber-50/30 focus:ring-1.5 focus:ring-[var(--archyv-accent-hover)] transition-all text-gray-900"
                            />
                          ) : (
                            <div className="px-3 py-2 text-xs text-gray-800 select-text min-h-[34px] flex items-center">
                              {cell || <span className="text-gray-300">-</span>}
                            </div>
                          )}
                        </td>
                      ))}

                      {/* Row Delete Button */}
                      {canEdit && mode === "edit" && (
                        <td className="px-1 text-center border-l border-gray-100">
                          <button
                            onClick={() => handleRemoveRow(rIdx)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded hover:bg-red-50"
                            title="Delete this row"
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

            {/* Bottom Add Row Bar (in edit mode) */}
            {canEdit && mode === "edit" && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
                <button
                  onClick={handleAddRow}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-foreground transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--archyv-accent-hover)]" />
                  <span>Add another row</span>
                </button>
                <span className="text-[11px] text-gray-400">
                  Tip: Changes are live in browser. Remember to click Save to ARCHYV.
                </span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className="h-9 px-6 bg-gray-50 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-gray-500 shrink-0">
        <div className="flex items-center gap-3">
          <span>ARCHYV Spreadsheet Studio</span>
          <span>•</span>
          <span>Mode: <strong className="text-foreground">{mode === "edit" ? "Live Edit" : "Read-Only"}</strong></span>
        </div>
        <div className="flex items-center gap-4">
          {saveSuccess && (
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> All changes saved
            </span>
          )}
          <span>Full Screen Tab</span>
        </div>
      </footer>
    </div>
  );
}
