"use client";

import { Star, Trash2, CheckCircle, XCircle, MoreVertical } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Document } from "@/lib/mock-data";
import clsx from "clsx";
import { useAppContext } from "@/store/AppContext";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import AccessModal from "@/components/ui/AccessModal";
import EditDocumentModal from "@/components/ui/EditDocumentModal";

interface FileRowProps {
  file: Document;
  showActions?: boolean;
  isTrash?: boolean;
}

export default function FileRow({ file, showActions = true, isTrash = false }: FileRowProps) {
  const { toggleStar, deleteDocument, restoreDocument, permanentDeleteDocument, currentUser, starredDocs, approveDocument, declineDocument } = useAppContext();
  const pathname = usePathname();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: false });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  const userStarredIds = currentUser ? starredDocs[currentUser.id] || [] : [];
  const isStarred = userStarredIds.includes(file.id);

  const handleOpenFile = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    window.open(`${baseUrl}/documents/${file.id}/view`, "_blank");
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      alert("Sharing is not supported on this browser.");
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const documentUrl = `${baseUrl}/documents/${file.id}/view`;
      
      let shareFile: File | null = null;

      if (navigator.canShare) {
        try {
          const response = await fetch(documentUrl, { credentials: "include" });
          const blob = await response.blob();
          
          const filename = file.name || "document";
          const fileToShare = new File([blob], filename, { type: blob.type || "application/octet-stream" });
          
          if (navigator.canShare({ files: [fileToShare] })) {
            shareFile = fileToShare;
          }
        } catch (e) {
          console.warn("Could not fetch file for native sharing. Falling back to URL sharing.");
        }
      }

      if (shareFile) {
        await navigator.share({
          files: [shareFile],
          title: "Share Document",
          text: `Sharing document from ARCHYV: ${file.name}`
        });
      } else {
        await navigator.share({
          title: "Share Document",
          text: `Sharing document from ARCHYV: ${file.name}\n\n${documentUrl}`,
          url: documentUrl
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Error sharing:", error);
      }
    }
  };

  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isMenuOpen) {
      const rect = e.currentTarget.getBoundingClientRect();
      const isNearBottom = window.innerHeight - rect.bottom < 150;
      setMenuPosition({ top: isNearBottom });
    }
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div 
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData("application/json", JSON.stringify({
          documentId: file.id,
          isStarred,
          isTrash
        }));
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={(e) => {
        if (e.dataTransfer.dropEffect === "none") {
          if (pathname.includes('/starred') && isStarred) {
            toggleStar(file.id);
          }
        }
      }}
      onClick={handleOpenFile}
      className="group flex items-center gap-4 p-4 border-b border-[var(--border)] hover:bg-gray-50/50 transition-colors cursor-pointer"
    >
      <div className="w-10 h-10 shrink-0 relative opacity-90">
        <Image src="/logo.png" alt="File" fill sizes="40px" className="object-contain" />
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
        <div className="col-span-12 sm:col-span-4 lg:col-span-3 min-w-0">
          <div className="font-medium text-sm text-foreground truncate" title={file.name}>{file.name}</div>
          <div className="text-xs text-gray-500 truncate flex items-center gap-2">
            <span>{isTrash ? file.department : `/${file.domain}/${file.department || 'General'}`}</span>
            {file.status === 'PENDING' && (
              <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Pending</span>
            )}
            {file.status === 'REJECTED' && (
              <span className="bg-red-100 text-red-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Declined</span>
            )}
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
            <span className="text-sm text-red-500 font-medium">
              {file.daysLeft && file.daysLeft > 1 ? `${file.daysLeft} days left` : file.daysLeft === 1 ? `1 day left` : `Expires today`}
            </span>
          ) : (
            <span className="text-sm text-gray-600">{file.size}</span>
          )}
        </div>

        <div className={clsx("flex items-center justify-end gap-2", "col-span-12 sm:col-span-2")}>
          {isTrash ? (
            <>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); restoreDocument(file.id); }} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Restore
              </button>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPermanentDeleteModal(true); }} className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors ml-2">
                <Trash2 className="w-3.5 h-3.5" />
                Delete Permanently
              </button>
            </>
          ) : showActions && (
            <>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleStar(file.id); }} className="text-gray-300 hover:text-[var(--archyv-accent)] transition-colors p-1">
                <Star className={clsx("w-4 h-4", isStarred && "fill-[var(--archyv-accent)] text-[var(--archyv-accent)]")} />
              </button>
              
              <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={toggleMenu}
                  className="text-gray-300 group-hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                  aria-label="More actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <div className={`absolute ${menuPosition.top ? 'bottom-full mb-1' : 'top-full mt-1'} right-0 w-36 bg-white border border-[var(--border)] rounded-lg shadow-lg overflow-hidden z-50 py-1`} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); setShowEditModal(true); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); handleNativeShare(); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Share
                    </button>
                    {currentUser?.role?.toLowerCase() === 'admin' && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); setShowAccessModal(true); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Access
                      </button>
                    )}
                    {currentUser?.role?.toLowerCase() === 'admin' && file.status === 'PENDING' && (
                      <>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); approveDocument(file.id); }}
                          className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); declineDocument(file.id); }}
                          className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {currentUser?.role?.toLowerCase() === 'admin' && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); setShowDeleteModal(true); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
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

      <ConfirmationModal
        isOpen={showPermanentDeleteModal}
        title="Delete Permanently?"
        message="Do you want to delete it permanently? It is an irreversible process."
        onConfirm={() => {
          permanentDeleteDocument(file.id);
          setShowPermanentDeleteModal(false);
        }}
        onCancel={() => setShowPermanentDeleteModal(false)}
      />

      <AccessModal
        isOpen={showAccessModal}
        document={file}
        onClose={() => setShowAccessModal(false)}
      />

      <EditDocumentModal
        isOpen={showEditModal}
        document={file}
        onClose={() => setShowEditModal(false)}
      />
    </div>
  );
}
