import { Star, Clock } from "lucide-react";
import Image from "next/image";
import { Document } from "@/lib/mock-data";
import clsx from "clsx";
import { useAppContext } from "@/store/AppContext";

interface FileCardProps {
  file: Document;
}

export default function FileCard({ file }: FileCardProps) {
  const { toggleStar, currentUser, starredDocs } = useAppContext();
  
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
      className="bg-white border border-[var(--border)] rounded-2xl p-5 flex flex-col hover:shadow-sm transition-shadow group relative cursor-pointer"
    >
      <button 
        onClick={(e) => { e.stopPropagation(); toggleStar(file.id); }}
        className="absolute top-4 right-4 text-gray-300 group-hover:text-gray-400 z-10"
      >
        <Star className={clsx("w-5 h-5 transition-colors", isStarred ? "fill-[var(--archyv-accent)] text-[var(--archyv-accent)]" : "hover:text-[var(--archyv-accent)]")} />
      </button>
      
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
          {file.status === "Pending" ? (
            <>
              <span>{file.domain} &bull; {file.department}</span>
              <div className="flex items-center gap-1 mt-1">
                <span>Uploaded: {file.date}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 font-medium">
                <UserIcon /> <span>You</span>
              </div>
            </>
          ) : (
            <span>{file.date}</span>
          )}
        </div>
      </div>

      {file.status === "Pending" && (
        <div className="absolute top-4 right-4 flex items-center gap-1 text-[var(--archyv-accent-hover)] text-xs font-medium bg-orange-50 px-2 py-1 rounded-md">
          <Clock className="w-3 h-3" />
          Pending
        </div>
      )}
    </div>
  );
}

function UserIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
