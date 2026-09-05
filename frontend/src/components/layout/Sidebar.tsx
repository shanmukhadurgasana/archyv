"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useAppContext } from "@/store/AppContext";
import { 
  Home, 
  Folder, 
  Star, 
  Trash2, 
  Users, 
  FileText, 
  Upload, 
  List,
  HardDrive,
  Shield,
  User, 
  Settings, 
  LogOut,
  CloudUpload
} from "lucide-react";
import clsx from "clsx";
import Image from "next/image";

interface SidebarProps {
  role: "faculty" | "admin";
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { toggleStar, deleteDocument, restoreDocument } = useAppContext();
  
  const [dragOverArea, setDragOverArea] = useState<string | null>(null);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [documentToTrash, setDocumentToTrash] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, href: string) => {
    e.preventDefault();
    setDragOverArea(href);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverArea(null);
  };

  const handleDrop = (e: React.DragEvent, href: string) => {
    e.preventDefault();
    setDragOverArea(null);
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      
      const data = JSON.parse(dataStr);
      if (!data || !data.documentId) return;

      const { documentId, isStarred, isTrash } = data;

      // Trash Drop logic
      if (href === "/admin/trash") {
        if (isTrash) return; // already in trash
        setDocumentToTrash(documentId);
        setShowTrashModal(true);
        return;
      }

      // Starred Drop logic
      if (href === "/faculty/starred" || href === "/admin/starred") {
        if (isTrash) return; // Do not star trashed documents
        if (!isStarred) {
          toggleStar(documentId);
        }
        return;
      }

      // Files/Documents Drop logic (Restore or Unstar)
      if (href === "/faculty/files" || href === "/faculty/documents" || 
          href === "/admin/files" || href === "/admin/documents") {
        if (isTrash) {
          restoreDocument(documentId);
        } else if (isStarred) {
          toggleStar(documentId);
        }
        return;
      }
    } catch (err) {
      console.error("Invalid drop payload", err);
    }
  };
  
  const facultyNav = [
    { label: "Overview", href: "/faculty/overview", icon: Home },
    { label: "Files", href: "/faculty/files", icon: Folder },
    { label: "Starred", href: "/faculty/starred", icon: Star },
  ];

  const facultyDocs = [
    { label: "Documents", href: "/faculty/documents", icon: FileText },
    { label: "Admin Uploads", href: "/faculty/admin-uploads", icon: CloudUpload },
    { label: "Upload", href: "/faculty/upload", icon: Upload },
  ];

  const adminNav = [
    { label: "Overview", href: "/admin/overview", icon: Home },
    { label: "Files", href: "/admin/files", icon: Folder },
    { label: "Starred", href: "/admin/starred", icon: Star },
    { label: "Trash", href: "/admin/trash", icon: Trash2 },
  ];

  const adminManagement = [
    { label: "Faculty", href: "/admin/faculty", icon: Users },
    { label: "Documents", href: "/admin/documents", icon: FileText },
    { label: "Upload", href: "/admin/upload", icon: Upload },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: List },
  ];

  const accountNav = [
    { label: "Profile", href: `/${role}/profile`, icon: User },
    { label: "Settings", href: `/${role}/settings`, icon: Settings },
  ];

  const renderLinks = (links: { label: string; href: string; icon: React.ElementType }[]) => {
    return links.map((link) => {
      const Icon = link.icon;
      const isActive = pathname === link.href;
      const isDragOver = dragOverArea === link.href;
      
      return (
        <Link
          key={link.href}
          href={link.href}
          onDragOver={(e) => handleDragOver(e, link.href)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, link.href)}
          className={clsx(
            "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1",
            isActive
              ? "bg-[var(--archyv-accent)]/20 text-foreground"
              : isDragOver
                ? "bg-gray-100 text-foreground ring-2 ring-[var(--archyv-accent)]/30"
                : "text-gray-500 hover:bg-gray-100 hover:text-foreground"
          )}
        >
          <Icon className={clsx("w-5 h-5", isActive || isDragOver ? "text-foreground" : "text-gray-500")} />
          {link.label}
        </Link>
      );
    });
  };

  return (
    <div className="w-64 border-r border-[var(--border)] h-screen flex flex-col bg-background shrink-0 sticky top-0 overflow-y-auto">
      <div className="p-6 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="ARCHYV Logo" className="h-8 w-auto object-contain" />
          <span className="font-bold text-xl tracking-widest uppercase">ARCHYV</span>
        </div>
        <div className="ml-10 text-[10px] font-bold tracking-[0.2em] text-[var(--archyv-accent)]/80 uppercase">
          {role}
        </div>
      </div>

      <div className="px-4 py-2 flex-1 flex flex-col gap-6">
        <div>
          {renderLinks(role === "faculty" ? facultyNav : adminNav)}
        </div>

        {role === "faculty" && (
          <>
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase mb-3 px-4 tracking-wider">My Documents</div>
              {renderLinks(facultyDocs)}
            </div>
            <div>
              {renderLinks(accountNav)}
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-foreground transition-colors mb-1"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </Link>
            </div>
          </>
        )}

        {role === "admin" && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase mb-3 px-4 tracking-wider">Management</div>
            {renderLinks(adminManagement)}
          </div>
        )}

        {role === "admin" && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase mb-3 px-4 tracking-wider">Storage</div>
            <Link
              href="/admin/storage"
              className={clsx(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1",
                pathname === "/admin/storage"
                  ? "bg-[var(--archyv-accent)]/20 text-foreground"
                  : "text-gray-500 hover:bg-gray-100 hover:text-foreground"
              )}
            >
              <HardDrive className="w-5 h-5 text-gray-500" />
              Storage Details
            </Link>
          </div>
        )}

        {role === "admin" && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase mb-3 px-4 tracking-wider">Security</div>
            <Link
              href="/admin/security"
              className={clsx(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1",
                pathname === "/admin/security"
                  ? "bg-[var(--archyv-accent)]/20 text-foreground"
                  : "text-gray-500 hover:bg-gray-100 hover:text-foreground"
              )}
            >
              <Shield className="w-5 h-5 text-gray-500" />
              Security
            </Link>
          </div>
        )}

        {role === "admin" && (
          <div className="mt-auto pb-4">
            <div className="text-xs font-semibold text-gray-400 uppercase mb-3 px-4 tracking-wider">Account</div>
            {renderLinks(accountNav)}
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-foreground transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Link>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showTrashModal}
        title="Move to Trash?"
        message="Are you sure you want to move this document to Trash? You can restore it later."
        onConfirm={() => {
          if (documentToTrash) deleteDocument(documentToTrash);
          setShowTrashModal(false);
          setDocumentToTrash(null);
        }}
        onCancel={() => {
          setShowTrashModal(false);
          setDocumentToTrash(null);
        }}
      />
    </div>
  );
}
