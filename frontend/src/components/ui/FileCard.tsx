import { Star, Clock, Trash2, CheckCircle, XCircle, MoreVertical } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Document } from "@/lib/mock-data";
import clsx from "clsx";
import { useAppContext } from "@/store/AppContext";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import AccessModal from "@/components/ui/AccessModal";

interface FileCardProps {
  file: Document;
  isTrash?: boolean;
}

export default function FileCard({ file, isTrash = false }: FileCardProps) {
  const { toggleStar, currentUser, starredDocs, deleteDocument, restoreDocument, approveDocument, declineDocument } = useAppContext();
  const pathname = usePathname();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
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
    <>
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
            // Unstar if dragged completely out of the drop zones while on the starred page
            if (pathname.includes('/starred') && isStarred) {
              toggleStar(file.id);
            }
          }
        }}
        onClick={handleOpenFile}
        className="bg-white border border-[var(--border)] rounded-2xl p-5 flex flex-col hover:shadow-sm transition-shadow group relative cursor-pointer"
      >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {file.status === 'PENDING' && (
          <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shadow-sm">Pending</span>
        )}
        {file.status === 'REJECTED' && (
          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shadow-sm">Declined</span>
        )}
        {isTrash ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); restoreDocument(file.id); }} 
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white shadow-sm border border-gray-200 text-gray-700 hover:text-[var(--archyv-accent)] hover:border-[var(--archyv-accent)]/30 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Restore
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleStar(file.id); }}
              className="text-gray-300 group-hover:text-gray-400"
            >
              <Star className={clsx("w-5 h-5 transition-colors", isStarred ? "fill-[var(--archyv-accent)] text-[var(--archyv-accent)]" : "hover:text-[var(--archyv-accent)]")} />
            </button>
            
            <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={toggleMenu} 
                className="text-gray-300 group-hover:text-gray-600 transition-colors p-0.5 rounded-md hover:bg-gray-100"
                aria-label="More actions"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {isMenuOpen && (
                <div className={`absolute ${menuPosition.top ? 'bottom-full mb-1' : 'top-full mt-1'} right-0 w-36 bg-white border border-[var(--border)] rounded-lg shadow-lg overflow-hidden z-50 py-1`} onClick={(e) => e.stopPropagation()}>
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
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); declineDocument(file.id); }}
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
          </div>
        )}
      </div>
      
      <div className="w-16 h-16 mb-4 relative opacity-90 group-hover:opacity-100 transition-opacity">
        <Image src="/logo.png" alt="File" fill sizes="64px" className="object-contain" />
      </div>
      
      <div className="flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-foreground line-clamp-1 mb-1" title={file.name}>
          {file.name}
        </h3>
        
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <span>{file.type}</span>
          <span>&bull;</span>
          <span>{file.size}</span>
        </div>
        
        <div className="mt-auto flex flex-col text-xs text-gray-400 gap-0.5">
          <span>{file.date}</span>
          {isTrash && (
            <span className="text-red-500 font-medium mt-1">
              {file.daysLeft && file.daysLeft > 1 ? `${file.daysLeft} days left` : file.daysLeft === 1 ? `1 day left` : `Expires today`}
            </span>
          )}
        </div>
      </div>

    </div>
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete File?"
        message="This file will be moved to Trash."
        onConfirm={() => {
          deleteDocument(file.id);
          setShowDeleteModal(false);
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
      <AccessModal
        isOpen={showAccessModal}
        document={file}
        onClose={() => setShowAccessModal(false)}
      />
    </>
  );
}

