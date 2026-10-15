/**
 * Helper to automatically download any document to the user's system
 * and determine file category for proper in-page view vs new browser tab view.
 */

export function getFileCategory(fileName?: string, fileType?: string, mimeType?: string) {
  const name = (fileName || "").trim().toLowerCase();
  const ext = name.split('.').pop() || '';

  const fType = (fileType || '').trim().toUpperCase();
  const mime = (mimeType || '').trim().toLowerCase();

  const isCsvOrExcel = ext === 'csv' || ext === 'xlsx' || ext === 'xls' || 
    fType === 'XLSX' || fType === 'CSV' || fType === 'SPREADSHEET' ||
    mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv');

  const isPdf = ext === 'pdf' || fType === 'PDF' || mime === 'application/pdf';

  const isPicture = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(ext) || 
    fType === 'IMAGE' || mime.startsWith('image/');

  const isText = ['txt', 'html', 'htm', 'json', 'xml', 'log'].includes(ext) || 
    fType === 'TEXT' || mime.startsWith('text/');

  // Modern browsers can natively render PDFs, images, and text files directly in a new tab
  const canOpenInNewTab = isPdf || isPicture || isText;
  const isOfficeOrOther = !isCsvOrExcel && !canOpenInNewTab;

  return {
    ext,
    isCsvOrExcel,
    isPdf,
    isPicture,
    isText,
    canOpenInNewTab,
    isOfficeOrOther,
    shouldOpenNewTab: canOpenInNewTab
  };
}

/**
 * Compulsory download helper: Automatically downloads the file to the user's system.
 * Guaranteed to save with clean name and extension so it opens seamlessly.
 */
export async function triggerFileDownload(file: { id: string; name: string }) {
  if (!file?.id) return;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const downloadUrl = `${baseUrl}/documents/${file.id}/view`;

  try {
    const res = await fetch(downloadUrl, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    
    const blob = await res.blob();
    let finalBlob = blob;
    let filename = file.name || "document";

    // For CSV files, ensure UTF-8 BOM so Microsoft Excel on Windows parses accents and columns cleanly
    if (filename.toLowerCase().endsWith(".csv") || blob.type.includes("csv")) {
      const text = await blob.text();
      if (!text.startsWith("\uFEFF")) {
        finalBlob = new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8;" });
      }
      if (!filename.toLowerCase().endsWith(".csv")) {
        filename += ".csv";
      }
    }

    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (err) {
    console.warn("Direct blob download failed, falling back to direct anchor:", err);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = file.name || "document";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
