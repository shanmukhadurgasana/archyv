"use client";

import { Star, Trash2, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Document } from "@/lib/mock-data";
import clsx from "clsx";
import { useAppContext } from "@/store/AppContext";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface FileRowProps {
  file: Document;
  showActions?: boolean;
  isAdminQueue?: boolean;
  isTrash?: boolean;
}

export default function FileRow({ file, showActions = true, isAdminQueue = false, isTrash = false }: FileRowProps) {
  const { toggleStar, deleteDocument, updateDocumentStatus, restoreDocument, permanentDeleteDocument, currentUser, starredDocs } = useAppContext();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const userStarredIds = currentUser ? starredDocs[currentUser.id] || [] : [];
  const isStarred = userStarredIds.includes(file.id);

  const handleOpenFile = async () => {
    try {
      const { getFile } = await import("@/lib/storage");
      const blob = await getFile(file.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      } else {
        alert("This is a mock file and does not have an actual soft copy attached.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to open file.");
    }
  };

  return (
    <div 
      onClick={handleOpenFile}
      className="group flex items-center gap-4 p-4 border-b border-[var(--border)] hover:bg-gray-50/50 transition-colors cursor-pointer"
    >
      <div className="w-10 h-10 shrink-0 relative opacity-90">
        <Image src="/logo.png" alt="File" fill className="object-contain" />
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
        <div className="col-span-12 sm:col-span-4 lg:col-span-3 min-w-0">
          <div className="font-medium text-sm text-foreground truncate">{file.name}</div>
          <div className="text-xs text-gray-500 truncate">
            {isTrash ? file.department : `/${file.domain}/${file.department || 'General'}`}
          </div>
        </div>

        <div className="hidden sm:block col-span-3 lg:col-span-2">
          {file.uploadedBy ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[var(--archyv-accent)]/20 flex items-center justify-center text-[10px] font-bold text-foreground">
                {file.uploadedBy.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-sm text-foreground truncate">
                {file.uploadedBy}
                <div className="text-[10px] text-gray-500">{file.department || 'Admin'}</div>
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-500">-</span>
          )}
        </div>

        <div className="hidden lg:block col-span-2">
          <span className="text-sm text-gray-600">{file.domain}</span>
        </div>

        <div className="hidden lg:block col-span-2">
          <div className="text-sm text-gray-600">{file.date}</div>
          {file.time && <div className="text-xs text-gray-400">{file.time}</div>}
        </div>

        <div className="hidden sm:block col-span-2 lg:col-span-1">
          {isTrash ? (
            <span className="text-sm text-red-500 font-medium">{file.daysLeft} days left</span>
          ) : (
            <span className="text-sm text-gray-600">{file.size}</span>
          )}
        </div>

        {isAdminQueue && (
          <div className="hidden lg:block col-span-1">
            <span className="text-xs font-medium px-2 py-1 bg-orange-50 text-[var(--archyv-accent-hover)] rounded-md">
              {file.status}
            </span>
          </div>
        )}

        <div className={clsx("flex items-center justify-end gap-3", isAdminQueue ? "col-span-12 sm:col-span-3 lg:col-span-1" : "col-span-12 sm:col-span-2")}>
          {isTrash ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); restoreDocument(file.id); }} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Restore
              </button>
              <button onClick={(e) => { e.stopPropagation(); permanentDeleteDocument(file.id); }} className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors ml-2">
                <Trash2 className="w-3.5 h-3.5" />
                Delete Permanently
              </button>
            </>
          ) : isAdminQueue ? (
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); updateDocumentStatus(file.id, "Approved"); }} className="w-7 h-7 rounded-full flex items-center justify-center border border-green-200 text-green-500 hover:bg-green-50">
                <CheckCircle className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); updateDocumentStatus(file.id, "Rejected"); }} className="w-7 h-7 rounded-full flex items-center justify-center border border-red-200 text-red-500 hover:bg-red-50">
                <XCircle className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }} className="w-7 h-7 rounded-full flex items-center justify-center border border-gray-200 text-red-400 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : showActions && (
            <>
              <button onClick={(e) => { e.stopPropagation(); toggleStar(file.id); }} className="text-gray-300 hover:text-[var(--archyv-accent)] transition-colors">
                <Star className={clsx("w-4 h-4", isStarred && "fill-[var(--archyv-accent)] text-[var(--archyv-accent)]")} />
              </button>
              {currentUser?.role === 'admin' && (
                <button onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }} className="text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete File?"
        message="Are you sure you want to delete this file? This action will move the file to Trash."
        onConfirm={() => {
          deleteDocument(file.id);
          setShowDeleteModal(false);
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
