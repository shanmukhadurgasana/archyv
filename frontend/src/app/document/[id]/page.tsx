"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAppContext } from "@/store/AppContext";
import { Document } from "@/lib/mock-data";
import { 
  FileText, 
  Download, 
  Upload, 
  Save, 
  Check, 
  Eye, 
  Pencil, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  Lock,
  Type,
  Bold,
  Italic,
  List,
  Heading1,
  Heading2
} from "lucide-react";
import clsx from "clsx";

export default function FullscreenDocumentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const initialModeParam = searchParams.get("mode");

  const { currentUser, documents, updateDocumentContent, fetchDocuments } = useAppContext();

  const [document, setDocument] = useState<Document | null>(null);
  const [textContent, setTextContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Compute permissions
  const isAdmin = currentUser?.role?.toLowerCase() === "admin" || 
                  currentUser?.role?.toLowerCase() === "superadmin" ||
                  currentUser?.role?.toLowerCase() === "super_admin";
  const isUploader = Boolean(
    (currentUser?.id && document?.uploadedById === currentUser.id) ||
    (currentUser?.name && document?.uploadedBy === currentUser.name) ||
    (currentUser?.adminId && document?.uploadedBy === currentUser.adminId)
  );
  const isFacultyGranted = document?.accessType === "ALL_FACULTY" || 
    (document?.accessType === "SELECT_FACULTY" && Array.isArray(document?.facultyAccess) && 
      document.facultyAccess.some((fa: any) => (fa.facultyId || fa) === currentUser?.id));
  const canEdit = isAdmin || isUploader || Boolean(document?.canEdit) || isFacultyGranted;

  const ext = (document?.name || "").split(".").pop()?.toLowerCase() || "";
  const isPdf = ext === "pdf" || document?.type === "PDF";
  const isWord = ext === "docx" || ext === "doc" || document?.type === "DOCX";
  const isPptx = ext === "pptx" || ext === "ppt";

  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfViewMode, setPdfViewMode] = useState<"document" | "text">("document");

  // Set mode based on permissions and URL param: default is ALWAYS "view"
  useEffect(() => {
    if (canEdit && initialModeParam === "edit") {
      setMode("edit");
    } else {
      setMode("view");
    }
  }, [canEdit, initialModeParam]);

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Load document metadata and content
  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        let docObj = documents.find(d => d.id === id);

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

        const isDocPdf = docObj?.type === "PDF" || docObj?.name?.toLowerCase().endsWith(".pdf");

        // Fetch document content & PDF blob concurrently
        const contentPromise = fetch(`${baseUrl}/documents/${id}/content`, {
          credentials: "include"
        });

        const pdfPromise = isDocPdf
          ? fetch(`${baseUrl}/documents/${id}/view?inline=true`, { credentials: "include" })
          : Promise.resolve(null);

        const [contentRes, pdfRes] = await Promise.all([contentPromise, pdfPromise]);

        if (isMounted && pdfRes && pdfRes.ok) {
          const blob = await pdfRes.blob();
          const objUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
          setPdfBlobUrl(objUrl);
        }

        if (contentRes.ok) {
          const data = await contentRes.json();
          if (data.content && isMounted) {
            setTextContent(data.content);
          }
        }
      } catch (err: any) {
        console.error("Error loading document:", err);
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

  const handleSaveDocument = async () => {
    if (!canEdit || mode !== "edit" || !document?.id) {
      setErrorMessage("Read-only access: You do not have permission to edit this document.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const res = await updateDocumentContent(document.id, {
        content: textContent,
        mimeType: "text/plain"
      });

      if (res && res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await fetchDocuments();
      } else {
        setErrorMessage(res?.error || "Failed to save document changes.");
      }
    } catch (err: any) {
      console.error("Save failed:", err);
      setErrorMessage(err?.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !document?.id) return;

    if (!canEdit) {
      setErrorMessage("Read-only access: You cannot replace this file.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await updateDocumentContent(document.id, { file });
      if (res && res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await fetchDocuments();
        if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
          const text = await file.text();
          setTextContent(text);
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

  const handleDownload = async () => {
    if (!document) return;
    setIsDownloading(true);
    setErrorMessage(null);

    try {
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
    } catch (err: any) {
      console.error("Download failed:", err);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      window.open(`${baseUrl}/documents/${document.id}/view`, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const insertFormatting = (prefix: string, suffix: string = "") => {
    if (!textareaRef.current || !canEdit || mode !== "edit") return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textContent.substring(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix}`;
    const nextContent = textContent.substring(0, start) + replacement + textContent.substring(end);
    setTextContent(nextContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4));
    }, 0);
  };

  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const charCount = textContent.length;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col text-foreground font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-[var(--border)] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-foreground hover:bg-gray-100 rounded-xl transition-colors"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-[var(--archyv-accent)]/20 text-foreground">
            <FileText className="w-5 h-5 text-foreground" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-foreground truncate max-w-[200px] sm:max-w-md md:max-w-lg" title={document?.name || "Document"}>
                {document?.name || "Document"}
              </h1>
              {canEdit ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--archyv-accent)]/20 text-foreground border border-[var(--archyv-accent)]/40 shrink-0">
                  <Pencil className="w-3 h-3 text-[var(--archyv-accent-hover)]" /> Edit Access
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 shrink-0">
                  <Image src="/view-eye.png" alt="View Only" width={16} height={9} className="w-3.5 h-auto object-contain inline-block" /> View Only
                </span>
              )}
            </div>
            {document && (
              <p className="text-xs text-gray-500">
                {document.domain} • {document.department || "General"} • {document.size || "Document"}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {canEdit && (
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
                title="Switch to view mode"
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
          )}

          {/* Download File */}
          <button
            onClick={handleDownload}
            disabled={isDownloading || !document}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            title="Download file to open on your computer"
          >
            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-gray-500" />}
            <span>Download</span>
          </button>

          {/* Sync / Replace File in Edit mode */}
          {canEdit && mode === "edit" && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".docx,.doc,.pdf,.txt"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                title="Upload updated file from your computer"
              >
                <Upload className="w-3.5 h-3.5 text-gray-500" />
                <span>Replace File</span>
              </button>
            </>
          )}

          {/* Save to ARCHYV in Edit mode */}
          {canEdit && mode === "edit" && !isPdf && (
            <button
              onClick={handleSaveDocument}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-foreground bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? "Saving..." : "Save to ARCHYV"}</span>
            </button>
          )}
        </div>
      </header>

      {/* Mode Sub-banner */}
      <div className={clsx(
        "px-6 py-2 flex items-center justify-between text-xs font-medium border-b",
        mode === "view"
          ? "bg-white border-gray-200 text-gray-700"
          : "bg-[var(--archyv-accent)]/15 border-[var(--archyv-accent)]/30 text-foreground"
      )}>
        <div className="flex items-center gap-2">
          {mode === "view" ? (
            canEdit ? <Eye className="w-4 h-4 text-gray-500" /> : <Lock className="w-4 h-4 text-gray-500" />
          ) : (
            <Pencil className="w-4 h-4 text-[var(--archyv-accent-hover)]" />
          )}
          <span>
            {mode === "view" ? (
              canEdit
                ? "Viewing document in read mode. Click 'Edit' above to modify content in the browser."
                : "You have view-only access to this document. Content cannot be edited."
            ) : (
              "In-Site Full Screen Document Editor: Live editing enabled. Modify document below and click 'Save to ARCHYV'."
            )}
          </span>
        </div>

        <div className="flex items-center gap-4 text-gray-500 text-xs">
          {!isPdf && (
            <>
              <span>{wordCount} words</span>
              <span>{charCount} characters</span>
            </>
          )}
          {saveSuccess && (
            <span className="flex items-center gap-1 text-foreground font-bold bg-[var(--archyv-accent)]/40 px-2 py-0.5 rounded shadow-sm">
              <Check className="w-3.5 h-3.5" /> Saved to ARCHYV!
            </span>
          )}
        </div>
      </div>

      {/* Formatting Toolbar in Edit mode (for Word / Text) */}
      {canEdit && mode === "edit" && !isPdf && (
        <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-2 flex-wrap shadow-xs">
          <span className="text-xs font-semibold text-gray-400 mr-2 flex items-center gap-1">
            <Type className="w-3.5 h-3.5" /> Formatting:
          </span>
          <button
            type="button"
            onClick={() => insertFormatting("# ", "")}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-1 border border-gray-200"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" /> H1
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("## ", "")}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-1 border border-gray-200"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" /> H2
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("**", "**")}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-1 border border-gray-200"
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" /> Bold
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("*", "*")}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-1 border border-gray-200"
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" /> Italic
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("- ", "")}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-1 border border-gray-200"
            title="Bullet list"
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Canvas Area */}
      <main className="flex-1 p-4 sm:p-8 flex justify-center overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--archyv-accent)] mb-3" />
            <p className="text-sm font-semibold text-gray-600">Loading document...</p>
          </div>
        ) : isPdf ? (
          /* PDF Viewer */
          <div className="w-full max-w-5xl bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[750px]">
            <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 flex-wrap gap-2">
              <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[var(--archyv-accent-hover)]" />
                PDF Document Viewer
              </span>
              <div className="flex bg-gray-200 p-0.5 rounded-lg border border-gray-300">
                <button
                  type="button"
                  onClick={() => setPdfViewMode("document")}
                  className={clsx(
                    "px-3 py-1 rounded-md text-xs font-semibold transition-all",
                    pdfViewMode === "document" ? "bg-white text-foreground shadow-sm" : "text-gray-600 hover:text-foreground"
                  )}
                >
                  Document View
                </button>
                <button
                  type="button"
                  onClick={() => setPdfViewMode("text")}
                  className={clsx(
                    "px-3 py-1 rounded-md text-xs font-semibold transition-all",
                    pdfViewMode === "text" ? "bg-white text-foreground shadow-sm" : "text-gray-600 hover:text-foreground"
                  )}
                >
                  Extracted Text ({wordCount} words)
                </button>
              </div>
            </div>

            {pdfViewMode === "document" ? (
              <div className="w-full flex-1 flex flex-col min-h-[700px]">
                {pdfBlobUrl ? (
                  <iframe
                    src={pdfBlobUrl}
                    className="w-full flex-1 min-h-[700px] border-0"
                    title={document?.name || "PDF Document"}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 py-28 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--archyv-accent)] mb-3" />
                    <p className="text-sm font-semibold text-gray-600">Loading PDF document viewer...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 sm:p-12 flex-1 flex flex-col min-h-[600px]">
                {canEdit && mode === "edit" ? (
                  <textarea
                    ref={textareaRef}
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Type or paste document content here..."
                    rows={28}
                    className="w-full flex-1 p-4 text-sm font-sans rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/30 focus:border-[var(--archyv-accent)] text-foreground leading-relaxed resize-y font-mono"
                  />
                ) : (
                  <div className="w-full flex-1 whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans select-text">
                    {textContent || (
                      <p className="text-gray-400 italic">No text content extracted from this document.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Word / PowerPoint / Text Document Sheet Canvas */
          <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-2xl shadow-lg p-8 sm:p-14 min-h-[800px] flex flex-col">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{document?.name}</h2>
              <p className="text-xs text-gray-500">
                ARCHYV Document • Domain: {document?.domain} • Branch: {document?.department || "General"} • Uploaded By: {document?.uploadedBy || "Faculty"}
              </p>
            </div>

            {canEdit && mode === "edit" ? (
              <textarea
                ref={textareaRef}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Type or paste document content here..."
                rows={28}
                className="w-full flex-1 p-4 text-sm font-sans rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/30 focus:border-[var(--archyv-accent)] text-foreground leading-relaxed resize-y font-mono"
              />
            ) : (
              <div className="w-full flex-1 whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans select-text">
                {textContent || (
                  <p className="text-gray-400 italic">No document content available.</p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
