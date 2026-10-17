import { Star, Clock, Trash2, CheckCircle, XCircle, MoreVertical, Download, ExternalLink, Pencil, Eye, Share2, Shield, FileSpreadsheet, FileText, CheckCheck, Copy } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Document } from "@/lib/mock-data";
import clsx from "clsx";
import { useAppContext } from "@/store/AppContext";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import AccessModal from "@/components/ui/AccessModal";
import EditDocumentModal from "@/components/ui/EditDocumentModal";
import DocumentEditorModal from "@/components/ui/DocumentEditorModal";

import { triggerFileDownload, getFileCategory } from "@/lib/downloadHelper";

interface FileCardProps {
  file: Document;
  isTrash?: boolean;
}

export default function FileCard({ file, isTrash = false }: FileCardProps) {
  const { toggleStar, currentUser, starredDocs, deleteDocument, restoreDocument, approveDocument, declineDocument, duplicateDocument } = useAppContext();
  const pathname = usePathname();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocEditor, setShowDocEditor] = useState(false);
  const [isRenameAndApprove, setIsRenameAndApprove] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: false, alignRight: true, shiftRight: 0 });
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
  
  const userStarredIds = currentUser ? starredDocs[currentUser.id] : undefined;
  const isStarred = userStarredIds !== undefined ? userStarredIds.includes(file.id) : Boolean(file.isStarred);

  const isAdminRole = currentUser?.role?.toLowerCase() === 'admin' || 
                      currentUser?.role?.toLowerCase() === 'superadmin' || 
                      currentUser?.role?.toLowerCase() === 'super_admin';
  const isFacultyDashboard = pathname.startsWith('/faculty');
  const isAdminDashboard = pathname.startsWith('/admin') || pathname.startsWith('/superadmin');
  const isAdmin = isFacultyDashboard ? false : (isAdminDashboard || isAdminRole);
  const isPendingAdmin = isAdmin && (pathname.includes('/pending') || file.status === 'PENDING');
  const isUploader = Boolean(
    (currentUser?.id && file.uploadedById === currentUser.id) ||
    (currentUser?.name && file.uploadedBy === currentUser.name) ||
    (currentUser?.adminId && file.uploadedBy === currentUser.adminId)
  );
  const isFacultyGranted = file.accessType === 'ALL_FACULTY' || 
    (file.accessType === 'SELECT_FACULTY' && (file.facultyAccess || []).some((fa: any) => (fa.facultyId || fa) === currentUser?.id));
  const canEdit = isAdmin || isUploader || Boolean(file.canEdit) || isFacultyGranted;
  
  const { isPicture } = getFileCategory(file.name, file.type, file.mimeType);

  const handleOpenFile = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsMenuOpen(false);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    if (isPicture) {
      // Images open directly in a new browser tab with inline view
      window.open(`${baseUrl}/documents/${file.id}/view?inline=true`, "_blank");
    } else {
      // Spreadsheets, Word, PDF, and other documents open in website viewer & editor modal
      setShowDocEditor(true);
    }
  };

  const handleOpenInNewTab = handleOpenFile;

  const handleDownloadFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    triggerFileDownload(file);
  };

  const handleDuplicateFile = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsMenuOpen(false);
    const result = await duplicateDocument(file.id);
    if (!result.success) {
      alert(result.error || "Failed to duplicate file");
    }
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
      const buttonRect = e.currentTarget.getBoundingClientRect();
      const isNearBottom = window.innerHeight - buttonRect.bottom < 260;

      // Keep menu from extending past the container's left boundary (with padding)
      const container = e.currentTarget.closest<HTMLElement>(".border.rounded-2xl") || document.querySelector("main");
      const containerRect = container?.getBoundingClientRect();
      const minLeft = (containerRect ? containerRect.left : 0) + 16;

      const menuWidth = 208; // w-52
      const menuLeftIfRightAligned = buttonRect.right - menuWidth;
      const shiftRight = menuLeftIfRightAligned < minLeft ? Math.ceil(minLeft - menuLeftIfRightAligned) : 0;

      setMenuPosition({ top: isNearBottom, alignRight: true, shiftRight });
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
        onClick={handleOpenFile}
        className={clsx(
          "bg-white border border-[var(--border)] rounded-2xl p-5 flex flex-col hover:shadow-sm transition-shadow group cursor-pointer",
          isMenuOpen ? "relative z-40" : "relative z-0"
        )}
      >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {file.status === 'PENDING' && (
          <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shadow-sm">Pending</span>
        )}
        {file.status === 'REJECTED' && (
          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shadow-sm">Declined</span>
        )}
        {!isAdmin && !isTrash && file.status === 'APPROVED' && (
          canEdit ? (
            <span className="bg-[var(--archyv-accent)]/20 text-foreground border border-[var(--archyv-accent)]/40 text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm">Edit</span>
          ) : (
            <span className="inline-flex items-center justify-center p-0.5" title="View Only">
              <Image src="/view-eye.png" alt="View Only" width={18} height={10} className="w-4.5 h-auto object-contain inline-block" />
            </span>
          )
        )}
        {isTrash ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); restoreDocument(file.id, file); }} 
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
                <div 
                  className={clsx(
                    "absolute w-52 bg-white border border-[var(--border)] rounded-lg shadow-lg overflow-hidden z-50 py-1",
                    menuPosition.top ? "bottom-full mb-1" : "top-full mt-1",
                    "right-0"
                  )} 
                  style={menuPosition.shiftRight > 0 ? { right: -menuPosition.shiftRight } : undefined}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isAdmin ? (
                    isPendingAdmin ? (
                      /* 2) files in admin/pending -> approve, decline, rename and approve, delete */
                      <>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            approveDocument(file.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-gray-500" />
                          Approve
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            declineDocument(file.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <XCircle className="w-3.5 h-3.5 text-gray-500" />
                          Decline
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            setIsRenameAndApprove(true);
                            setShowEditModal(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-gray-500" />
                          Rename and Approve
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            setShowDeleteModal(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          Delete
                        </button>
                      </>
                    ) : (
                      /* Admin Dashboard: Open, Download, Rename, Duplicate, Share, Access, Delete */
                      <>
                        <button
                          onClick={handleOpenInNewTab}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                          Open
                        </button>

                        <button
                          onClick={handleDownloadFile}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5 text-gray-500" />
                          Download
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            setIsRenameAndApprove(false);
                            setShowEditModal(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                        >
                          <Pencil className="w-3.5 h-3.5 text-gray-500" />
                          Rename
                        </button>

                        <button
                          onClick={handleDuplicateFile}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                        >
                          <Copy className="w-3.5 h-3.5 text-gray-500" />
                          Duplicate
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            handleNativeShare();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <Share2 className="w-3.5 h-3.5 text-gray-500" />
                          Share
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            setShowAccessModal(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <Shield className="w-3.5 h-3.5 text-gray-500" />
                          Access
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            setShowDeleteModal(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </>
                    )
                  ) : (
                    /* Faculty Dashboard */
                    canEdit ? (
                      /* Faculty Dashboard (Edit Access): Open, Download, Rename, Share */
                      <>
                        <button
                          onClick={handleOpenInNewTab}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                          Open
                        </button>

                        <button
                          onClick={handleDownloadFile}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5 text-gray-500" />
                          Download
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            setIsRenameAndApprove(false);
                            setShowEditModal(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                        >
                          <Pencil className="w-3.5 h-3.5 text-gray-500" />
                          Rename
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            handleNativeShare();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <Share2 className="w-3.5 h-3.5 text-gray-500" />
                          Share
                        </button>
                      </>
                    ) : (
                      /* Faculty Dashboard (View Access): Open, Download, View Details, Share */
                      <>
                        <button
                          onClick={handleOpenInNewTab}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                          Open
                        </button>

                        <button
                          onClick={handleDownloadFile}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5 text-gray-500" />
                          Download
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            setIsRenameAndApprove(false);
                            setShowEditModal(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                          View Details
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            handleNativeShare();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <Share2 className="w-3.5 h-3.5 text-gray-500" />
                          Share
                        </button>
                      </>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="w-16 h-16 shrink-0 mb-4 relative opacity-90 group-hover:opacity-100 transition-opacity">
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
      <EditDocumentModal
        isOpen={showEditModal}
        document={file}
        onClose={() => setShowEditModal(false)}
        isRenameAndApprove={isRenameAndApprove}
      />
      <DocumentEditorModal
        isOpen={showDocEditor}
        document={file}
        canEdit={canEdit}
        onClose={() => setShowDocEditor(false)}
        onOpenTitleEdit={() => setShowEditModal(true)}
      />
    </>
  );
}

