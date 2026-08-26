"use client";

import PageHeader from "@/components/ui/PageHeader";
import { HardDrive, UploadCloud, Folder, Trash2, Settings, RefreshCcw, Cloud, FileText } from "lucide-react";
import { useAppContext } from "@/store/AppContext";

export default function AdminStorage() {
  const { documents } = useAppContext();

  // Calculate actual storage metrics
  const activeFiles = documents.filter(d => !d.isDeleted);
  const trashFiles = documents.filter(d => d.isDeleted);

  const calculateSize = (docs: any[]) => {
    return docs.reduce((acc, doc) => {
      let sizeStr = doc.size || "0 KB";
      let val = parseFloat(sizeStr);
      if (sizeStr.includes('MB')) return acc + val * 1024 * 1024;
      if (sizeStr.includes('KB')) return acc + val * 1024;
      if (sizeStr.includes('GB')) return acc + val * 1024 * 1024 * 1024;
      return acc;
    }, 0);
  };

  const activeBytes = calculateSize(activeFiles);
  const trashBytes = calculateSize(trashFiles);
  const totalUsedBytes = activeBytes + trashBytes;
  
  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
  };

  const totalUsedStr = formatBytes(totalUsedBytes);
  const activeStr = formatBytes(activeBytes);
  const trashStr = formatBytes(trashBytes);
  
  // Total capacity of 100 GB for the UI demo purposes since we don't have a real server, but no fake numbers for usage
  const CAPACITY_BYTES = 100 * 1024 * 1024 * 1024;
  const availableBytes = Math.max(0, CAPACITY_BYTES - totalUsedBytes);
  const availableStr = formatBytes(availableBytes);
  
  const percentage = Math.min((totalUsedBytes / CAPACITY_BYTES) * 100, 100).toFixed(1);
  const activePercentage = totalUsedBytes > 0 ? ((activeBytes / totalUsedBytes) * 100).toFixed(1) : "0.0";
  const trashPercentage = totalUsedBytes > 0 ? ((trashBytes / totalUsedBytes) * 100).toFixed(1) : "0.0";
  return (
    <div className="max-w-5xl">
      <PageHeader 
        title="Storage Details" 
        subtitle="Monitor and manage storage usage across the system."
      >
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Last updated: May 27, 2026 11:42 AM
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 bg-white transition-colors shadow-sm">
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </PageHeader>

      <div className="bg-white border border-[var(--border)] rounded-2xl p-8 mb-6">
        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start mb-10">
          <div className="w-40 h-40 shrink-0 relative flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-100" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-[var(--archyv-accent)]" strokeDasharray="283" strokeDashoffset={283 - (283 * parseFloat(percentage)) / 100} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-foreground">{percentage}%</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Used</div>
            </div>
          </div>
          
          <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-6 w-full">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 mb-1">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Storage</div>
              <div className="text-xl font-bold text-foreground">100 GB</div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-[var(--archyv-accent)]/10 flex items-center justify-center text-[var(--archyv-accent-hover)] mb-1">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Used Storage</div>
              <div className="text-xl font-bold text-foreground">{totalUsedStr}</div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500 mb-1">
                <Folder className="w-5 h-5" />
              </div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Available Storage</div>
              <div className="text-xl font-bold text-foreground">{availableStr}</div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 mb-1">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Files Stored</div>
              <div className="text-xl font-bold text-foreground">{activeFiles.length}</div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 mb-1">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Trash Size</div>
              <div className="text-xl font-bold text-foreground">{trashStr}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="font-medium text-foreground">{totalUsedStr} <span className="text-gray-400 font-normal">used</span></span>
            <span className="text-gray-500 font-medium">{availableStr} remaining</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[var(--archyv-accent)] rounded-full" style={{ width: `${percentage}%` }}></div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-2xl p-8 mb-6">
        <h2 className="text-lg font-bold text-foreground mb-8">Storage Usage by Category</h2>
        
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-48 shrink-0 flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-foreground">Documents</span>
            </div>
            <div className="flex-1 max-w-xl">
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--archyv-accent-hover)] rounded-full" style={{ width: `${activePercentage}%` }}></div>
              </div>
            </div>
            <div className="w-24 text-right font-medium text-foreground">{activeStr}</div>
            <div className="w-16 text-right text-gray-500">{activePercentage}%</div>
          </div>

          <div className="flex items-center gap-6">
            <div className="w-48 shrink-0 flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-foreground">Trash</span>
            </div>
            <div className="flex-1 max-w-xl">
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--archyv-accent-hover)] rounded-full opacity-70" style={{ width: `${trashPercentage}%` }}></div>
              </div>
            </div>
            <div className="w-24 text-right font-medium text-foreground">{trashStr}</div>
            <div className="w-16 text-right text-gray-500">{trashPercentage}%</div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--border)] flex items-center justify-between">
          <div className="font-bold text-foreground">Total Used</div>
          <div className="font-bold text-foreground mr-[5.5rem]">{totalUsedStr}</div>
        </div>
      </div>

    </div>
  );
}
