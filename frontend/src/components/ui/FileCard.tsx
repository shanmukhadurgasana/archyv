import { Star, Clock, Trash2, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Document } from "@/lib/mock-data";
import clsx from "clsx";
import { useAppContext } from "@/store/AppContext";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface FileCardProps {
  file: Document;
  isTrash?: boolean;
}

export default function FileCard({ file, isTrash = false }: FileCardProps) {
  const { toggleStar, currentUser, starredDocs, deleteDocument, restoreDocument } = useAppContext();
  const pathname = usePathname();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const userStarredIds = currentUser ? starredDocs[currentUser.id] || [] : [];
  const isStarred = userStarredIds.includes(file.id);

  const handleOpenFile = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    window.open(`${baseUrl}/documents/${file.id}/view`, "_blank");
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
        {isTrash ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); restoreDocument(file.id); }} 
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white shadow-sm border border-gray-200 text-gray-700 hover:text-[var(--archyv-accent)] hover:border-[var(--archyv-accent)]/30 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Restore
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleStar(file.id); }}
              className="text-gray-300 group-hover:text-gray-400"
            >
              <Star className={clsx("w-5 h-5 transition-colors", isStarred ? "fill-[var(--archyv-accent)] text-[var(--archyv-accent)]" : "hover:text-[var(--archyv-accent)]")} />
            </button>
            
            {currentUser?.role?.toLowerCase() === 'admin' && (
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }} 
                className="text-gray-300 group-hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="w-16 h-16 mb-4 relative opacity-90 group-hover:opacity-100 transition-opacity">
        <Image src="/logo.png" alt="File" fill className="object-contain" />
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
    </>
  );
}

